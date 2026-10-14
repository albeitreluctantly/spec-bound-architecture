# Overview

## Prelude

Spec-bound Architecture combines vertical-slice organization with isolated feature modules, using feature specifications to define their boundaries. It primarily targets frontend codebases, where rapid growth, frequent changes, and intertwined capabilities can make domain affinity an ambiguous basis for organizing code.

Modularity leaves a deceptively simple question: what should a module represent? A useful answer must give teams a consistent organizing principle, reduce planning and debate over domain affinity, and help newcomers navigate the code through its specifications. That principle must also preserve clear boundaries as the codebase evolves. Such principle becomes especially valuable in the era of AI-powered development where agents implement new capabilities autonomously.

Organizing code only by technical type—screens, state, components, and so on—leaves a feature's implementation scattered across the application. A modular monolith can face a similar problem when its boundaries depend on individual judgments about what seems logical and are not consistently enforced.

Spec-bound Architecture proposes holistic, bounded features, each described by its own specification. Code follows the same structure, with the aim of keeping the behavior defined by a feature's acceptance criteria within its implementation boundary. Features become easier to find, review, and test. New capabilities connect through explicit integration points, limiting changes to other features' business logic and reducing opportunities for regressions.

This approach relies on product and development teams sharing responsibility for clear, implementable specifications. Which is particularly suited to automated software factories, where specification-authoring agents translate product owners' intent into requirements and implementation agents turn those requirements into code. The positive “anti-fragile” feedback loop refines both: implementation experience informs specification boundaries, and those boundaries guide implementation. The aim is to produce isolated features while limiting unintended changes elsewhere in the codebase.

The application becomes a collection of features assembled at the application composition root, supported by shared backbone code called **substrate**.

## High-level structure

The architecture separates foure responsibilities: features, shared foundation, infrastructure, and application composition. Four top-level folders give them distinct code homes, each organized to suit its role.

### `app/` — application composition

The composition root establishes the application runtime and connects features. In a frontend application it usually contains navigation, context providers, and startup code. Feature interfaces meet at these wiring points, where incompatible changes surface: this is where "Protected Variations in action" principle takes place.

Organize application code around navigation structure and startup, with helpers grouped by technical role. `app/` consumes the public interfaces of features and shared code. Nothing outside `app/` imports it.

### `core/` — shared application-domain code

`core/` holds domain concepts, behavior, and state used by multiple features. **Core domain** capabilities and modules naturally surface here. In an ecommerce application, this might include the shared Product model and rules, or Cart state used throughout the purchase flow.

Start with a flat structure and group by domain area as needed. Features and application composition consume its public interface. Core code can use other core modules, `library/`, and third-party dependencies; it never imports features or `app/`.

### `library/` — domain-independent infrastructure

The library supplies UI primitives and generic infrastructure: logging, dependency-injection utilities, base error types, internationalization machinery, assets, and other utilities. This code supports the application without depending on its product domain.

Organize it by technical role or reusable module. Other code homes may consume its public interfaces. Library code may use its own modules and third-party dependencies, but never imports `core/`, features, or `app/`.

### `features/` — specified capabilities

Each feature lives in a folder corresponding to its place in the project's knowledge base. Keep it flat unless its specifications define subfeatures. For example, a parent catalog document may group separate product-list, product-details, and product-creation specifications; their implementations become matching subfeature folders.

Introduce a parent's `shared/` when those subfeatures need common code. Shared requirements in the parent documentation can help identify it. This folder is the parent's **shared kernel**; code needed by only one subfeature stays inside that subfeature.

**Feature isolation is one of the architecture's main pillars.** Its import rules apply to subfeatures as well: **siblings never import each other.** A feature may use its own files and third-party dependencies, as well as the public interfaces of `core/`, `library/`, and its parent's `shared/`. A parent may consume its children's public entries to compose them or expose supported entries for the application code. Children do not import the parent's composition or barrel.

A page or screen is a common feature shape, but features can also be widgets, blocks, or capabilities serving downstream systems, such as analytics.
This sample structure shows a codebase with all four folders, both a flat feature and a feature containing subfeatures:

```text
src/
  app/             # Startup, navigation, and feature wiring
    router/
      RouteA.tsx
      RouteB.tsx
    utils/
    hooks/
  core/            # Application-domain code shared across features
    a-model.ts
    useA.ts
    b-service.ts
    c-state.ts
    index.ts
  library/         # Domain-independent UI primitives and infrastructure
    assets/
    components/
    utils/
    index.ts
  features/        # App capabilities
    feature-a/
      featureState.ts
      useFeaturePage.ts
      FeaturePage.tsx
      index.ts
    feature-b/
      shared/
        featureBService.ts
        actionA.ts
        actionB.ts
        index.ts
      subfeature-a/
        SubfeatureAPage.tsx
        index.ts
      subfeature-b/
        SubfeatureBWidget.tsx
        index.ts
      index.ts
```

Each feature and shared module exposes a public interface through its entry file; internal implementation files remain private. Feature A and Feature B never import each other, and the same restriction applies to Subfeature A and Subfeature B. Application composition consumes the top-level interfaces, including any subfeature entries they expose.

Now let’s take a look at a simplified example of feature creation and wiring into the app.

## Feature walkthrough

Consider a catalog whose specifications include **Browse products** and **Create product**. Private form rendering, validation, and request-state implementations are omitted; the repository and components are illustrative application code.

### Specify the feature

**Create product** lets catalog staff add a product that becomes available in **Browse products**.

**Acceptance criteria**

1. **WHEN** staff open Create product, the form displays an empty draft with Name, Price, and Description fields.
2. **IF** a submitted draft violates the validation rules, **THEN** show inline field errors, retain the draft, and save no product.
3. **WHEN** staff submit a valid draft, save the product.
4. **WHILE** saving is in progress, disable repeat submission.
5. **IF** saving fails, **THEN** show a save error, retain the draft, and allow retry.
6. **WHEN** the product is saved, open **Browse products**, where the new product is available.
7. **WHEN** staff cancel while editing, discard the draft and open **Browse products** without submitting it.

**Validation rules**

| Input       | Rule                                                                       |
| ----------- | -------------------------------------------------------------------------- |
| Name        | Required; 1–100 characters after trimming                                  |
| Price       | Positive amount with at most two decimal places, in the catalog's currency |
| Description | Optional; up to 500 characters                                             |

The form, validation, and submission flow belong to **Create product**. Opening it from **Browse products** and returning afterward are relations wired by application composition.

### Give it a code home

The specification boundaries determine the folders:

| Specification   | Implementation home                     |
| --------------- | --------------------------------------- |
| Browse products | `src/features/catalog/browse-products/` |
| Create product  | `src/features/catalog/create-product/`  |

```text
src/
  app/
    _layout.tsx
    catalog/
      index.tsx
      create.tsx
  features/
    catalog/
      index.ts
      browse-products/
        index.ts
        BrowseProducts.tsx
      create-product/
        index.ts
        CreateProduct.tsx
        ProductForm.tsx
        validateDraft.ts
      shared/
        products/
          index.ts
```

The behavior owned by **Create product** is implemented inside `create-product/`. Catalog's common product-data contract and repository live in `shared/products/`, used by both features. The route files consume the catalog's public interface.

### Implement the owned behavior

The feature implements both its local behavior and its specified outward requests. An `onIntent` callback, part of its SPI, lets it request another capability without importing that feature or the router.

`src/features/catalog/create-product/CreateProduct.tsx`

```tsx
import { products } from '../shared/products';
import { ProductForm } from './ProductForm';
import { validateDraft } from './validateDraft';

type CreateProductIntent = { type: 'browseProducts' };

type CreateProductProps = {
  onIntent: (intent: CreateProductIntent) => void;
};

export function CreateProduct({ onIntent }: CreateProductProps) {
  const requestBrowsing = () => onIntent({ type: 'browseProducts' });

  return (
    <ProductForm
      onSubmit={async (draft) => {
        await products.create(validateDraft(draft));
        requestBrowsing();
      }}
      onCancel={requestBrowsing}
    />
  );
}
```

The requirement to return to **Browse products** is expressed inside creation as a semantic intent. The feature decides when to request it; application code supplies the navigation mechanism. Form state, validation, saving, and the decision to leave remain inside the feature boundary.

| Specified behavior                       | Implementation owner                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| Fields, draft editing, cancel action     | Private `ProductForm.tsx`                                                        |
| Name, price, description rules           | Private `validateDraft.ts`, returning a normalized draft or raising field errors |
| Pending state, field/save errors, retry  | Private `ProductForm.tsx`, handling its asynchronous submission                  |
| Save orchestration and request to browse | `CreateProduct.tsx`, using the repository and emitting an intent                 |
| Navigation fulfilling that request       | Application route wiring                                                         |

The shared repository owns persistence and product state. Its writes update the data or invalidate the shared query cache so browsing reflects creation.

Browsing expresses its own specified relation in the same way:

`src/features/catalog/browse-products/BrowseProducts.tsx`

```tsx
import { useProducts } from './useProducts';
import { ProductList } from './ProductList';

type BrowseProductsIntent = { type: 'createProduct' };

type BrowseProductsProps = {
  onIntent: (intent: BrowseProductsIntent) => void;
};

export function BrowseProducts({ onIntent }: BrowseProductsProps) {
  const products = useProducts();

  return (
    <ProductList
      products={products}
      onCreatePress={() => onIntent({ type: 'createProduct' })}
    />
  );
}
```

`ProductList` is private UI. Its button callback becomes a named feature intent before crossing the boundary.

### Expose the catalog's public interface

Each subfeature exposes its page as a public API entry. The form, state, and implementation helpers remain private.

`src/features/catalog/create-product/index.ts`

```ts
export { CreateProduct as Page } from './CreateProduct';
```

`src/features/catalog/browse-products/index.ts`

```ts
export { BrowseProducts as Page } from './BrowseProducts';
```

`src/features/catalog/index.ts`

```ts
export * as BrowseProducts from './browse-products';
export * as CreateProduct from './create-product';
```

### Wire the entries into navigation

Application route files fulfill the named intents. They supply bindings rather than implement the feature's decision-making.

Navigation hooks and route paths belong to application code, so features remain independent of the application's navigation structure and other screens.

`src/app/catalog/index.tsx`

```tsx
import { BrowseProducts } from '@features/catalog';

export default function CatalogRoute() {
  const router = useRouter();
  const fulfillIntent = {
    createProduct: () => router.push('/catalog/create'),
  };

  return (
    <BrowseProducts.Page onIntent={(intent) => fulfillIntent[intent.type]()} />
  );
}
```

`src/app/catalog/create.tsx`

```tsx
import { CreateProduct } from '@features/catalog';

export default function CreateProductRoute() {
  const router = useRouter();
  const fulfillIntent = {
    browseProducts: () => router.dismissTo('/catalog'),
  };

  return (
    <CreateProduct.Page onIntent={(intent) => fulfillIntent[intent.type]()} />
  );
}
```

The root layout supplies the navigator and screen options:

`src/app/_layout.tsx`

```tsx
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="catalog/index" options={{ title: 'Catalog' }} />
      <Stack.Screen
        name="catalog/create"
        options={{ title: 'Create product' }}
      />
    </Stack>
  );
}
```

Feature tests can verify validation, saving, and which intent is emitted for each specified outcome. Application integration verifies that those requests reach the intended capability. Providers and shared service setup also belong at application composition.

## Continue with the guides

The [Setup guide](../02-setup/setup-guide.md) prepares a codebase for the architecture: code homes, project conventions, import enforcement, and the agent kit. The engineering guides go deeper: the [Architecture guide](../03-engineering/architecture-guide.md) defines the structural rules and import boundaries, and the [Implementation guide](../03-engineering/implementation-guide.md) explores feature interfaces and [integration patterns](../03-engineering/implementation-guide.md#integration-patterns). The [Specification guide](../04-specifications/specification-guide.md) explains how to describe bounded capabilities and their relations in requirements.
