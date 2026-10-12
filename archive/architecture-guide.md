# Architecture Guide

**Purpose:** the high-level structural rules — where code lives, what may depend on what, how a feature and the substrate around it are shaped, and the seams through which a feature is altered. These rules constrain structure and boundaries, not the tech stack: every concrete choice (libraries, folder names, lint config) lives in the project conventions. Concrete recipes and samples are in the [Implementation guide](./implementation-guide.md).

## Code homes

Four top-level directories, one per subject. The directory name equals the subject it holds; the [Method](./method.md) classifier picks the subject, and the subject picks the home.

| Subject         | Home                                     | Structured by                                         |
| --------------- | ---------------------------------------- | ----------------------------------------------------- |
| **feature**     | `features/`                              | flat by default; optional subfeatures on demand       |
| **substrate**   | `library/` · `core/` · feature `shared/` | `library/` by type · `core/` by area · `shared/` flat |
| **app-concern** | `app/`                                   | wiring, screens, navigation, bootstrap                |

- `library/` — **business-agnostic**; it knows no domain. Its internal layout is the project's choice — commonly by type (UI primitives, utilities, services, assets, wiring), or any scheme the project adopts (`ui-kit/`, `plugins/`, …).
- `core/` — the app's **domain core**: **business-aware** code shared across features, structured by area (`auth`, `product`, `user`, …). It reads as the app's domain map.
- feature `shared/` — a feature's **shared kernel**: code shared by that feature's subfeatures, scoped to that feature alone.
- `app/` — composes features and shared code into the product.

`core/` and a feature's `shared/` are the same thing — a shared kernel — at different scope; the promotion ladder widens one into the other as reuse grows.

## Features and subfeatures

A feature is a bounded unit of user-facing functionality. It owns the behavior that delivers a coherent capability and connects to its surroundings through explicit contracts.

**Features** live directly inside `features/` and represent the application's capabilities or areas. A feature can contain **subfeatures**: leaf features inside their parent feature. Each subfeature owns a distinct capability within that area. A feature without subfeatures is itself a leaf.

For example, a catalog feature might contain separate subfeatures for browsing products and creating a product. The parent exposes their supported entries through its public surface. The application consumes those entries through that surface.

A leaf owns the UI, logic, data access, and local state needed for its capability. Its declared dependencies can be supplied when building or verifying it as a unit. It need not run without shared infrastructure, but understanding its behavior must not require knowledge of a sibling's internals.

### When to split

Split according to the specifications. If the catalog has separate **Create product** and **List products** stories, it contains corresponding `create-product/` and `list-products/` subfeatures.

If a specification does not define a bounded piece of functionality, review and split or merge the specifications first. Code follows the resulting boundaries.

### When to introduce `shared/`

Create the parent's `shared/` when its subfeatures actually need common code. A split does not require an empty shared folder, and anticipated reuse does not justify moving code there.

The folder contains the parent's shared kernel: common capabilities, domain types, data access, state, or components used by its subfeatures. Code used by one subfeature stays inside that subfeature.

Shared requirements and contract tables in parent documentation can help identify this code. For example, a catalog page may define product search, filtering, and pagination used by both **List products** and **Choose related products**. Their common search logic and reusable UI belong in the parent's `shared/`; each subfeature owns its listing or selection flow.

If another top-level feature needs the shared capability or domain concept, apply the [promotion rule](#placement).

## Placement

Every placement question — `library` vs `core` vs a feature's `shared/` vs inside a feature — reduces to **domain scope × reuse breadth**.

| Code knows…          | used by…                   | → home                   |
| -------------------- | -------------------------- | ------------------------ |
| no domain (generic)  | anyone                     | `library/`               |
| app domain           | many features              | `core/`                  |
| one feature's domain | that feature's subfeatures | that feature's `shared/` |
| one feature          | that feature               | inside the feature       |

A smart component falls out of the same rule: a domain-free primitive lives in `library/`; a cross-feature domain component lives in `core/`; a component only one feature uses lives inside it.

**Promotion ladder.** A concept in a feature's `shared/` graduates to `core/` when a **second top-level feature** needs it — subfeatures of the same feature share its `shared/`, and `app/` composing a part is wiring, not need. Code earns a wider home by being needed in a wider scope — not in anticipation of it.

## Import boundaries

| Importer          | May import                                                                                              | Never imports                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| top-level feature | public `library/` and `core/`, own files and `shared/`, public surfaces of its subfeatures, third-party | sibling top-level features, their internals, `app/`                                   |
| subfeature        | public `library/` and `core/`, parent's `shared/`, own files, third-party                               | sibling subfeatures, parent's composition or barrel, other top-level features, `app/` |
| feature `shared/` | public `library/` and `core/`, own files, third-party                                                   | subfeatures, parent's composition, other features, `app/`                             |
| `core/`           | `library/`, third-party                                                                                 | features, `app/`                                                                      |
| `library/`        | other `library/`, third-party                                                                           | `core/`, features, `app/`                                                             |
| `app/`            | public surfaces of features and shared code, own files, third-party                                     | private implementation files                                                          |

Two invariants carry the weight:

- **Siblings never import each other.** Shared concepts are consumed through permitted public interfaces. A parent may import its children's public surfaces to compose them or expose their entries for application wiring. Children never import siblings or the parent composition.
- **The design-system boundary.** `library/` imports nothing domain-aware. This single boundary keeps the domain out of the design system; the rest of the split is cosmetic without it.

## Feature anatomy

A feature owns its UI, its data access, its logic, and its local state. It is library-agnostic in shape — the framework constrains its surface, not how it is built inside.

- **One public surface.** A feature exposes a single barrel; external code imports only that. A parent consumes its subfeatures through their public surfaces and defines its own exports for the application. Internal files — hooks, state, child components, helpers — are private and unreachable from outside.
- **Default consumption is whole.** Mounting the feature's entry gives you the working feature. Altering it happens only through declared seams (below).
- **An SPI (service provider interface) is what the feature requires of its surroundings** — the typed inputs and callbacks it needs wired (navigation intents, auth gates, the anchors a host exposes for extension). When connection between features drifts, it shows up as a **type error at the composition root** when it is left unwired.

## Substrate anatomy

Substrate — `library/`, `core/`, and a feature's `shared/` — has no customer; its consumers are features.

- **Internally it is shaped like a feature** — there is no separate mandated foundation anatomy.
- **It is ambient — consumed by direct import**, not through arguments or wired callbacks. The sibling-import restriction does not prevent features from consuming shared code within its allowed scope. A logger, an event sink, a theme, or an i18n helper can be imported through its public surface.
- **Features never own the source of truth for shared data.** They read and write it only through the owning tier's public surface — never a private store, a foreign cache, or service internals.

## App composition

`app/` is the application composition root. It connects public feature surfaces, including any subfeature entries exposed by a parent, without reaching into private implementations.

- **Runtime.** App-wide singletons, the provider stack, and the navigation tree are created once in `app/`.
- **Screens compose.** A screen mounts feature entries, wires extensions into host anchors, reads a feature's data at the screen level and passes it to sibling features **through the composition root** — never by cross-feature import.
- **Feature flags are composition-time.** The app decides what to mount and wire; features are unaware of flags.

## Cross-cutting concerns

A cross-cutting concern is **a shared mechanism in substrate plus per-feature participation owned by the feature**. There is no central registry stored as a spec. Examples:

| Concern            | Mechanism (substrate)                | Participation (feature)                                             |
| ------------------ | ------------------------------------ | ------------------------------------------------------------------- |
| **Bootstrap**      | step registry, run during startup    | the feature exposes one bootstrap step                              |
| **Analytics**      | event sink + the event contract      | the feature fires its events at the action                          |
| **Session / auth** | session state + write contract       | the feature reads state, declares an auth-gate intent the app wires |
| **Permissions**    | the permission gate + its UX         | the feature requests access through the public surface              |
| **Logging**        | logging at data / network boundaries | the feature logs only when it alone holds the context               |

The mechanism's contract (a bootstrap step shape, an event name + payload, a session write method) is substrate-owned; the participation point is feature-owned.

## Feature relations and patterns

A spec declares how one feature relates to another with one of four reference forms — **Handoff · Embedding · Dependency · Modification** ([Specification guide](./specification-guide.md)). Each maps to one or many integration patterns:

| Relation (spec)  | Integration pattern                                        | Realization                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Handoff**      | **Delegation**                                             | A declares an intent the app wires to B — navigate to B's screen, present B as an overlay, or invoke a method on it — and B may return a result for A to continue                       |
| **Embedding**    | **Extension**                                              | the host exposes a named anchor; A provides a plug-in; the app wires it into the anchor                                                                                                 |
| **Dependency**   | **Substrate consumer** · Core coordination · Shared kernel | the reused part is extracted to substrate, then consumed by what it is: a UI shell → **Substrate consumer**; shared state → **Core coordination**; a domain concept → **Shared kernel** |
| **Modification** | **Modification seams**                                     | B exposes a seam — headless split, strategy on the SPI, or DI binding — and modifiers plug in without B's logic changing                                                                |

Two more patterns carry couplings that are not one of the four forms: **Composition-root distribution** for same-screen orchestration that is not a shared-foundation concept, and the resolution of a mutual A↔B reference — merge the two, else lift the shared concept to a kernel, else wire them at the composition root. Application wiring and any composition inside a feature use public interfaces. Shared concepts are consumed through substrate; siblings never import each other.

The code recipe and samples for each pattern are in the [Implementation guide](./implementation-guide.md).

## Alteration seams

External code alters a feature only through a **declared seam**. Three seams cover it:

| Seam                    | Use                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Headless split**      | consume the feature's logic and its view independently to change data or presentation while keeping its contracts |
| **Strategy on the SPI** | replace a behavior — a filter, a sort, a handler                                                                  |
| **DI binding**          | swap a substrate implementation the feature depends on                                                            |

Monkey-patching, runtime swapping, and deep imports are forbidden. A request to build "feature A, but with change Z" is implementable only if A already declares the seam Z needs; otherwise A's adds the seam first, or the request is rejected at planning.
