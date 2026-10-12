# Implementation Guide

**Purpose:** the cookbook — concrete recipes for building a feature and wiring it to its neighbours, one per integration pattern. The structural rules these recipes obey — code homes, import boundaries, anatomy, the relation→pattern mapping, the seams — are in the [Architecture guide](./architecture-guide.md). Samples illustrate the mechanism, not a stack: where one reaches for a library (data, state, DI), the choice is a project convention.

## Feature shapes

A feature exposes one public surface and keeps everything else private. Three shapes cover what a feature can be.

### Screen feature

Smart by default: the feature is one `FeaturePage` the composition root mounts — its data, logic, state, and view live inside it. Keep them there; don't extract a hook until something outside needs it.

```tsx
export function FeaturePage({ entityId }: FeaturePageProps) {
  const { data, isPending } = useEntityQuery(entityId); // data fetch
  const [expanded, setExpanded] = useState(false); // local state + logic
  const toggle = () => setExpanded((v) => !v);

  if (isPending) return <Spinner />;
  return (
    <Section>
      <Header title={data.title} onPress={toggle} />
      {expanded && <Body text={data.summary} />}
    </Section>
  );
}
```

Split the view and logic into layers (`useFeature` + `FeatureView`) **on demand** — only when something outside needs the feature's logic without its whole UI:

- the feature must be **altered** — a consumer reuses its view with changed data ([Modification seams](#modification-seams)), or
- another feature **depends** on a scoped slice of it ([Core coordination](#core-coordination)).

Even then, keep the internal hook private. Expose a **curated public hook** — `use{Feature}Exports` — returning only the slice meant for reuse, plus `FeatureView` when alteration is supported:

```tsx
// public surface — the scoped slice the feature lets others reuse
export function useFeatureExports() {
  const { saveDraft } = useFeature(); // internal, private
  return { saveDraft }; // not the whole internal state
}
```

The feature owns its input, data, and public-hook shapes; they stay stable across alterations.

### Widget feature

A feature injected into another screen — the host works without it. It can be a **single component** or a **namespace of fragments** for several host anchors.

```tsx
// single widget — one component the host renders at an anchor
export function FavoriteToggle({ entityId }: FavoriteToggleProps) {
  /* ... */
}

// compound widget — fragments for several anchors
export const ContributorWidget = {
  ActionButton,
  DetailSection,
} as const;
```

The composition root places it at host anchors ([Extension](#extension)). Prefer no provider — a fragment is self-contained, or fragments share server state by reading the same key ([Core coordination](#core-coordination)).

Add a provider only when fragments share **ephemeral UI state** (a selection, an open menu):

```tsx
const ContributorContext = createContext<ContributorState | null>(null);

function ContributorProvider({ children }: PropsWithChildren) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <ContributorContext value={{ selectedId, setSelectedId }}>
      {children}
    </ContributorContext>
  );
}

export const ContributorWidget = {
  Provider: ContributorProvider,
  ActionButton, // reads state via `use(ContributorContext)`
  DetailSection,
} as const;
```

The composition root wraps the host where the fragments are placed (see the [Extension](#extension) wiring).

### Pure-logic feature

No UI — a hook or functions exported from the barrel, consumed by features or the composition root. Analytics is the common case: the feature owns its event taxonomy and firing; the sink is ambient substrate, imported directly.

```tsx
// no page, no view — the barrel exports tracking functions
export function useSearchAnalytics() {
  const { track } = useAnalytics(); // ambient substrate
  return {
    trackSearchView: (params: SearchParams) => track("search_view", params),
    trackResultPress: (item: Item) => track("result_press", { id: item.id }),
  };
}
```

The event contract behind it is a [contract-table spec](./specification-guide.md), not a user story; the firing point is feature-owned.

### Public surface and SPI

A feature exposes a single barrel. It **may** expose its page or smart surface, its `FeatureView` and a curated public hook (`use{Feature}Exports`) when alteration or dependency is supported, its widget fragments, its extension contracts, and the domain types its SPI references. It **must not** expose its internal headless hook (`useFeature`), state, services, helpers, child components, or contexts.

The **SPI** is what the feature requires of its surroundings — the typed inputs and callbacks the app must wire (navigation intents, auth gates, the anchors a host opens). It is part of the public surface; the framework mandates no single SPI file. An unwired SPI surfaces as a type error at the composition root.

## Integration patterns

Each recipe realizes one of the four reference forms a spec can declare — Handoff · Embedding · Dependency · Modification. The mapping from reference to pattern is in the [Architecture guide](./architecture-guide.md#feature-relations-and-patterns); the code for each is below. Every junction is wired by the app or reached through shared substrate — never a feature→feature import.

### Delegation

_(realizes Handoff)_

A declares an intent; the app wires it to B — navigate to B's screen, present B as an overlay, or invoke a method on it — and B may hand a result back.

```tsx
// A's SPI — the intent it declares
type FeatureAProps = {
  contextId: string;
  onOpenRelated: () => void;
};

// composition root — the app wires the intent to B
<FeatureAPage
  contextId={contextId}
  onOpenRelated={() => navigation.navigate("FeatureB", { contextId })}
/>;
```

When B is presented in place rather than navigated to, the app wires the same intent to an imperative handle B exposes on its SPI — open it as an overlay, invoke a method, take a result back:

```tsx
// B's SPI — an imperative handle the app holds
export type FeatureBHandle = { open: (entityId: string) => void };

// composition root — A's intent invokes B through a ref; no navigation
function HostScreen({ entityId }: HostScreenProps) {
  const featureBRef = useRef<FeatureBHandle>(null);
  return (
    <>
      <FeatureAPage onOpenRelated={() => featureBRef.current?.open(entityId)} />
      <FeatureB ref={featureBRef} />
    </>
  );
}
```

A names _what_ should happen; the app decides _how_ — navigate, present, or invoke — and where B lives. **Auth-gate variant:** the SPI declares `onRequireAuth({ onSuccess })`; the app routes to the auth flow, then resumes.

### Extension

_(realizes Embedding)_

Foreign UI rendered **inside** a host's layout. The host owns the anchor and the context it passes; contributors provide render functions; the app wires them.

```tsx
// host SPI — one context type per anchor
type HostAnchors = {
  headerActions: { entityId: string };
  footer: void;
};
export type HostExtensions = Extensions<HostAnchors>; // extension helper — example
```

**Shallow anchor** — in the host's own layout, call the extension inline:

```tsx
function HostPage({ extensions }: { extensions?: HostExtensions }) {
  return (
    <>
      <ActionBar>
        <PrimaryAction entityId={entityId} />
        {extensions?.headerActions?.({ entityId })}
      </ActionBar>
      {extensions?.footer?.()}
    </>
  );
}
```

**Deep anchor** — buried in a subtree or a reused child, expose a slot through an extension helper:

```tsx
const { Provider: HostExtensionsProvider, Slot: HostSlot } =
  createExtensions<HostAnchors>(); // example helper

// deep in the subtree:
<HostSlot name="headerActions" context={{ entityId }} />;
```

**Composition-root wiring** — the app declares _who_ fills each anchor; a contributor's provider, if any, wraps here:

```tsx
const extensions: HostExtensions = {
  headerActions: (ctx) => <ContributorWidget.ActionButton {...ctx} />,
  footer: () => <OtherWidget.Bar />,
};

return (
  <ContributorWidget.Provider>
    <HostPage extensions={extensions} />
  </ContributorWidget.Provider>
);
```

Recipe rules: render functions only — the host never owns foreign element trees; semantic anchor names, not a generic `content` slot; a contributor's provider goes at the composition root, never inside `extensions`; extensions on one host do not coordinate with each other — shared behavior between them is [Core coordination](#core-coordination).

| Concern                       | Owner                           |
| ----------------------------- | ------------------------------- |
| anchor + extension contracts  | host                            |
| slot + internal provider      | host (via the extension helper) |
| render implementations        | contributing features           |
| wiring + contributor provider | composition root                |

### Substrate consumer

_(realizes Dependency — a reused UI shell)_

A reuses a shell that lives in substrate — a list, a map, a header template — by configuring it, not by importing another feature. The reusable part is extracted to `core/` or a feature's `shared/`; the feature composes it through props and optional extension slots.

```tsx
function DetailPage({ contextId }: { contextId: string }) {
  const { entityIds } = useDetail(contextId);
  return (
    <ItemList
      entityIds={entityIds}
      hideViewModeSwitch
      extensions={{ leadingItem: () => <PromoCard contextId={contextId} /> }}
    />
  );
}
```

A feature never embeds another feature's UI directly: a reusable shell becomes substrate; a peer's live widget goes through [Extension](#extension) at a host anchor.

### Core coordination

_(realizes Dependency — shared state, no UI coupling)_

Two features need the same state or server projection and neither knows the other. They share it through substrate, keyed by a stable identity.

```tsx
// both features read the same shared hook; neither imports the other
function useFeatureA() {
  const { isAuthorized } = useSession(); // a core public hook
  const data = useEntity(); // resolves to the same key as feature B — example
  // ...
}
```

- **Server-backed:** both consumers address the same stable query key through a shared data hook; that hook's invalidation is the event bus for server state. _(Query key — example; the data library is a project convention.)_
- **Client-global:** a shared atom or reducer.

Keep state feature-local while it is screen-ephemeral (a draft, a search input); promote it to substrate when a second feature needs it and the data outlives one screen.

### Shared kernel

_(realizes Dependency — a shared domain concept)_

A domain concept used by two subfeatures lives in a kernel both import — never from each other.

```
features/<feature>/
  shared/                 kernel shared by this feature's subfeatures
    entityState.ts
    useEntity.ts
    entity.ts
    index.ts
  <subfeature-a>/
  <subfeature-b>/
```

Both subfeatures import from the kernel barrel. The kernel graduates to `core/` when a feature outside this one needs it — the promotion ladder ([Architecture guide](./architecture-guide.md#placement)).

### Modification seams

_(realizes Modification)_

External behavior change without editing B's internals. B declares exactly one seam in its spec; modifiers plug in at the composition root.

**Headless split (preferred)** — the consumer reuses B's curated public hook and `FeatureView` independently, altering the data while B's contracts hold:

```tsx
const data = useFeatureBExports(input); // B's public hook, not its internals
return <FeatureBView {...data} items={reorder(data.items)} />;
```

**Strategy on the SPI** — B accepts optional behaviors; the app passes them when the context differs. Each is a typed function that replaces one decision inside B. Name it by the thing it plugs (a noun); a callback ends in `Handler`:

```tsx
type FeatureBStrategy = {
  itemFilter?: (items: Item[]) => Item[];
  itemComparator?: (a: Item, b: Item) => number;
  itemActivationHandler?: (item: Item) => void; // callback — overrides B's default
};
```

A strategy is often a single named function type, reused across features:

```tsx
type UnitConversionStrategy = (value: number, from: Unit, to: Unit) => number;
type PriceStrategy = (basePrice: number, context: PricingContext) => number;
```

When the pluggable decision is a business rule, use the **specification pattern** — the rule as a predicate the app swaps per context:

```tsx
type Specification<T> = (candidate: T) => boolean;
type ItemVisibilitySpec = Specification<Item>;
```

**DI binding** — B declares a service interface in its SPI; the app binds the implementation. _(DI container — example; the library is a project convention.)_

Forbidden: monkey-patching B's hooks, swapping its components at runtime without a seam, or deep-importing its folder. A request to build "B, but with change Z" is implementable only if B already declares the seam Z needs; otherwise the seam is added to B first, or the request is rejected at planning.

### Composition-root distribution

_(cross-form — same-screen orchestration)_

Feature B needs data from feature A on the same screen, and that data is not a shared-foundation concept. The app reads A through its curated public hook and passes the data into B as declared SPI props; B never imports A.

```tsx
function CombinedScreen() {
  const selection = useSelectorExports({ contextId }); // A's public hook
  return (
    <MapFeaturePage
      highlightedIds={selection.selectedIds}
      onItemPress={selection.toggle}
    />
  );
}
```

Prefer [Core coordination](#core-coordination) if the data may be reused elsewhere; this pattern is for tight, screen-specific wiring.

### Mutual reference resolution

_(cross-form — A and B depend on each other)_

A bidirectional A↔B coupling — co-present sync such as map↔list, master-detail, or filter↔results — is not written in a spec; it is found at planning and resolved by the **fusion ladder**, never by cross-feature imports.

## Fusion ladder

Tight coupling is allowed — it resolves by fusing the coupled parts at the **narrowest scope that contains the coupling**, escalated by reuse breadth (the same two axes as [Placement](./architecture-guide.md#placement)).

| Rung                        | When                                | Result                                                                                                            |
| --------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **1 — one feature**         | the parts are really one capability | a flat feature; no split, no `shared/`                                                                            |
| **2 — split with a kernel** | coupled within one feature          | the parts become subfeatures sharing a `shared/` kernel; the parent feature's barrel exports the combined surface |
| **3 — promote to core**     | coupled **and** reused widely       | the fused unit moves to `core/`; features **Depend** on it                                                        |

The rung is set by scope and reuse, not by how coupled the parts feel — a widely reused unit sits at rung 3 because of its reach, not its tightness.

## Choosing a pattern

```
Foreign UI inside a host's layout?       → Extension
Open / present / invoke another feature?  → Delegation
Reuse a list/map/header shell?            → Substrate consumer (± Extension for slots)
Share state or a server projection?
    shared concept  → Core coordination / Shared kernel
    feature-private concept, one file only  → Composition-root distribution
Change another feature's behavior?        → Modification seams
A and B depend on each other?             → Mutual reference resolution (fusion ladder)
```

Worked example (structure only): a `DetailFeature` screen mounts `DetailPage` and declares `onEdit` — **Delegation** to `EditFeature`. A `BookmarkWidget.ActionButton` fills `DetailPage`'s `headerActions` anchor — **Extension**. `DetailPage` renders its items through the `ItemList` shell — **Substrate consumer**. The detail and the bookmark widget both read the session and the same entity key — **Core coordination**. No feature imports another; the app wires every junction.

## Bridging hosts

When a page embeds a substrate shell that has its own anchors, map the names at the page boundary — the page's anchor names need not match the shell's.

```tsx
<SubstrateList
  extensions={{
    rowAction: ({ entityId }) => pageExtensions?.toolbarAction?.({ contextId }),
  }}
/>
```
