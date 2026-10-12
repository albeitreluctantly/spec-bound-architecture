# Archived documentation — knowledge map

These six source drafts contain structural rules, implementation patterns, specification guidance, and development procedures. Their statements are source material, not a substitute for the accepted direction in the [framework outline](../tracking/framework-outline.md). The [manifesto](../docs/01-overview/manifesto.md) and [overview](../docs/01-overview/overview.md) are approved.

The [agentic workflow skeleton](./agentic-workflow.md) is an additional source for future role and handoff design. It does not define the broader Workflows guide or settle the agent roster.

## Source inventory and destinations

| Source | What it contains | Target home |
| --- | --- | --- |
| [Architecture guide](./architecture-guide.md) | Code homes, feature hierarchy, sharing, placement, import matrix, public boundaries, composition, cross-cutting participation, relations, and variation seams | Architecture reference; integration details in Implementation |
| [Implementation guide](./implementation-guide.md) | Screen/widget/headless forms; interfaces; delegation, embedding, shared code/state, variation, composition, coupling resolution, and pattern selection, with code sketches | Implementation; complete analytics scenarios in Recipes |
| [Method](./method.md) | Artifact vocabulary, request routing, the spec-to-code pipeline, subject classification, desired-state specs, and recursive structure | Workflows; selected structural concepts in Architecture |
| [Planning guide](./planning-guide.md) | Specification review, a five-step feature-design sequence, public-surface-first execution, dependency ordering, and assessment outputs | Design sequence in Implementation; procedural artifacts and gates in Workflows |
| [Spec quality gate](./spec-quality-gate.md) | Detailed implementability checks, alternate outcomes, review outputs, and split/merge heuristics | Authoring checks in Specifications; review procedure in Workflows |
| [Specification guide](./specification-guide.md) | Ownership, feature relations, story and table formats, EARS-style criteria, split/merge, and completeness checks | Specifications |

The target [Architecture](../docs/03-engineering/architecture-guide.md), [Implementation](../docs/03-engineering/implementation-guide.md), and [Specification](../docs/04-specifications/specification-guide.md) guides are outlines. [Recipes](../docs/03-engineering/recipes.md) contains the two analytics outlines; [Workflows](../docs/05-workflows/workflows.md) contains the process and adoption outline. [Setup](../docs/02-setup/setup-guide.md) and the [agent kit](../docs/02-setup/agent-kit/architecture-rules.md) draw from the accepted rules and project conventions, not from a separate setup source among these six drafts.

## Architecture guide

**Main contribution:** a structural reference with an explicit import matrix.

- **Code homes and scopes:** domain-independent `library/`, domain-aware `core/`, feature-local `shared/`, feature internals, and application composition. Core and a parent's shared kernel represent shared domain code at different scopes.
- **Feature hierarchy:** optional subfeatures; a top-level feature may be a leaf. Separate Create product and List products specifications imply corresponding subfeatures. Unclear boundaries require specification review.
- **Actual sharing:** a split alone does not justify `shared/`. Parent documentation can identify reusable capabilities as well as models: search, filtering, and pagination shared by separate product flows.
- **Placement and promotion:** domain knowledge and actual reuse determine the narrowest home. A second top-level feature needing a concept can justify moving it to `core/`; application wiring alone is not another domain consumer.
- **Dependency matrix:** siblings never import one another; parents consume child public surfaces; children may consume parent shared code but not parent composition; shared code cannot import its children; `core/` cannot import features or application code; `library/` cannot import domain-aware code.
- **Public boundaries:** one curated public entry, private hooks/state/helpers, and an SPI expressing required inputs and callbacks. Shared data is accessed through its owner's public contract.
- **Application responsibilities:** runtime services, providers, navigation, mounting feature entries, and passing data between their public interfaces. Feature flags are described as composition-time decisions.
- **Cross-cutting participation:** bootstrap, analytics, session/auth, permissions, and logging are presented as a common mechanism plus participation owned by each feature.
- **Relations and variation:** Handoff, Embedding, Dependency, and Modification map to implementation patterns. Supported variation uses a headless split, strategy, or service binding rather than deep imports or monkey-patching.

**Needs reconciliation:** the feature definition is limited to user-facing functionality; “substrate” groups all shared code; analytics is described mainly as infrastructure plus emission. Current direction includes downstream-system capabilities and analytics features. The collective substrate definition remains open. Runtime ownership and feature-flag wording need review before becoming universal rules. Parent composition requires the separate accepted criterion recorded in the outline; its reader-facing explanation is deferred.

## Implementation guide

**Main contribution:** the richest source of focused integration sketches.

| Pattern or topic | Detail to preserve | Target |
| --- | --- | --- |
| Screen feature | Keep owned view, state, data access, and logic together; expose a supported slice only when a consumer needs it | Implementation |
| Widget feature | One component or several fragments; shared ephemeral state can use a contributor provider, wired around the host | Implementation |
| Pure-logic feature | A feature can expose behavior without a page or view | Implementation; analytics treatment in Recipes |
| Public surface and SPI | Keep internal hooks private; expose supported capabilities and required outside inputs. No mandatory SPI file | Implementation |
| Delegation | Declare semantic requests; application wiring chooses navigation, presentation, or invocation. A result may resume the caller | Implementation |
| Auth-gate variant | A required-auth intent can carry a success continuation so the feature retains its flow | Implementation |
| Extension | Typed, semantic host anchors; render functions receive anchor-specific context; distinguish shallow slots from deep slots supplied through a helper | Implementation |
| Extension ownership | Host owns anchors and context; contributor owns renderers and its provider; composition connects them | Implementation; reconcile contributor-declared host requirements with the accepted SPI approach |
| Reusable UI shell | Extract genuinely reusable list/map/header behavior into permitted shared code instead of importing a sibling feature | Implementation |
| Shared state coordination | Shared server identity/query keys and invalidation, or a shared client store; neither consumer needs knowledge of the other | Implementation |
| Shared kernel | Subfeatures consume shared domain concepts through the parent's shared public surface; promote only when wider reuse justifies it | Architecture and Implementation |
| Modification | Headless view/logic separation, supplied strategies or predicates, and service-interface bindings provide supported variation | Implementation |
| Composition-root distribution | Screen-specific data can pass from one public feature surface into another feature's declared inputs | Implementation |
| Mutual references and fusion ladder | Resolve coupling by treating parts as one capability, extracting shared concepts, or wiring public surfaces; sibling imports remain forbidden | Implementation, subject to specification boundaries |
| Pattern selection | A compact decision aid and a detail/bookmark example connect relations to patterns | Implementation |
| Bridging hosts | Translate extension names/context when a feature wraps a reusable shell with its own slots | Implementation |

**Needs reconciliation:** the analytics sketch permits consumption by other features, which cannot imply sibling imports. Replace it with area-shared or application-shared events and composition-registered analytics handlers. `useFeatureExports` is an illustrative naming convention, not a required API. Separate named type exports require an actual consumer need. Seams follow the accepted outline rule: any number, no preferred kind, added for integration needs without changing the modified feature's specification or logic; the "exactly one seam" and rejection wording are superseded. Provider/state-lifetime rules remain unsettled. The fusion ladder cannot override specification-defined boundaries or imply automatic parent composition. Co-present synchronization requirements must remain expressible in specifications even when the mechanism is designed during implementation.

## Method

**Main contribution:** vocabulary for development artifacts and routing changes to their owners.

- **Artifact roles:** request is input; specification is desired behavior; plan is derived implementation structure; tasks are working increments; conventions contain shared invariants and project choices. The durable correspondence is specification plus code.
- **Pipeline:** request → specification → plan → tasks → code, with conventions available throughout. Infrastructure work may skip a business specification; trivial implementation work may skip both specification and plan.
- **Desired-state specifications:** describe the intended result rather than storing change deltas or implementation history.
- **Subjects:** feature capability, shared code, and application wiring. The classifier associates work with a code home.
- **Routing:** decompose a request into intent fragments, identify each owner, then choose specification update, planning, or direct implementation. A disagreement can update an existing specification; it does not require defending its current text.
- **Ownership across a request:** split cross-owner changes and surface a blocking question when routing is unclear. A supporting infrastructure request cannot silently redefine feature behavior.
- **Recursive structure:** optional nesting and shared kernels at multiple scopes, with specification/code correspondence.

**Target:** Workflows owns routing, artifact choices, and process. Architecture retains useful ownership/scope concepts; it does not require the routing classifier to explain code placement.

**Needs reconciliation:** local `.specs/` storage, mandatory durable plans, a fixed task filename, one agent per transition, and the UI-only classifier are not general requirements. Analytics is not automatically an application concern. The trivial-work threshold needs clarification for corrections and no-maintained-spec workflows. The closed-pattern rule must not justify rewriting away intended behavior merely to fit the current implementation catalog.

## Planning guide

**Main contribution:** practical feature design, currently mixed with procedural gates.

1. **Review the specification:** check boundedness, completeness, explicit relations, and implementability. Ownership changes are proposals rather than silent restructuring.
2. **Orient:** understand requirements and the existing capabilities/shared code involved.
3. **Identify relations:** determine outward requirements and any host or variation contracts they imply.
4. **Decompose:** give implementation parts clear responsibilities and choose integration patterns.
5. **Define the public surface:** decide supported exports and outside requirements before consumers build against them.
6. **Place parts:** apply scope and actual reuse; keep implementation local unless broader ownership is justified.
7. **Organize execution:** establish contracts early, then implement dependency-ordered increments.
8. **Assess:** state whether work can proceed, identify missing requirements, describe the design, and propose boundary changes where needed.

**Target:** steps 2–6 belong in Implementation as engineering practices. Specification review, saved plans/tasks, execution procedures, and assessment formats belong in Workflows. Authoring quality criteria belong in Specifications.

**Needs reconciliation:** a mandatory saved plan/task pipeline, a presumed validator agent, and unconditional rewrite/reject gates are workflow assumptions. Keep public-interface-first reasoning without requiring every change to begin with an executable empty API. Review unclear requirements without discarding the desired capability.

## Spec quality gate

**Main contribution:** detailed checks that the shorter specification checklist does not fully enumerate.

- **Scope and ownership:** one bounded capability, identifiable outward relations, and named owned UI elements where applicable.
- **Outward behavior:** navigation destinations and required non-default shared-capability configuration are explicit; relations can be derived from acceptance criteria without a maintained graph.
- **States:** empty, populated, failed, denied, and non-default loading behavior are identifiable.
- **Crucial branches:** authentication, entitlement, validation, no-change, and permission-gated outcomes belong in acceptance criteria. They must not disappear into a generic unhappy-path list.
- **Failures versus product gates:** environmental errors may be unhappy paths; required alternate product outcomes are part of the capability. Do not duplicate application defaults.
- **Constraints and references:** validation, guardrails, and preconditions are explicit; avoid reproducing another feature's internals or shared defaults. Technical mechanisms and algorithms generally belong in implementation design.
- **Enough to design:** behavior, relations, and constraints allow a concrete implementation design without guessing.
- **Review output:** verdict, relations derived by the reviewer, supported API/SPI, implementation increments, and actionable recommendations tied to particular criteria.
- **Boundary review:** identify multiple purposes, behavior duplicated across stories, branches mistaken for independent capabilities, and shared behavior that may warrant extraction.

**Target:** substantive checks go to Specifications; review procedure and outputs go to Workflows. Avoid another standalone gate with a competing checklist.

**Needs reconciliation:** “no user-facing logic” cannot disqualify analytics or other downstream-system features. Potential reuse alone is not a reason to extract shared code. Relationship forms are useful vocabulary, not permission to ignore a real requirement. The draft includes obsolete link targets; see the link notes below.

## Specification guide

**Main contribution:** authoring guidance and two concrete specification formats.

- **Ownership versus contact:** describe what the feature owns; name capabilities it opens, embeds, depends on, or modifies without restating their internals.
- **Boundedness:** requirements should describe holistic functionality whose declared dependencies can be supplied for implementation and verification.
- **Relation vocabulary:** Handoff delegates to another capability; Embedding places a live contribution at a host location; Dependency reuses a capability; Modification uses an explicitly supported variation. These may be expressed in acceptance criteria rather than a separate graph.
- **User-story template:** goal, optional preconditions, design references, acceptance criteria, feature-specific non-functional criteria, unhappy paths, scope exclusions, and notes.
- **EARS-style criteria:** `WHEN`, `WHILE`, `IF/THEN`, and bare assertions; each criterion expresses checkable behavior. Feature qualities can use the same forms; project-wide invariants belong in conventions.
- **Contract-table template:** event/field, trigger, payload schema, and notes/API. Distinguish the measurement/data contract from participation at a product action.
- **Split/merge discussion:** multiple complete flows, reusable capabilities, integral behavior, and the strength of relations prompt boundary review.
- **Quality checklist:** contained, explicit relations, observable to the relevant consumer, complete, consistent, and sufficient to design. Reference design material rather than duplicating it and creating conflicting authorities.

**Target:** Specifications. Local/external storage choices and development variants belong in Workflows, with enough setup guidance to start using the architecture.

**Needs reconciliation:** local `.specs/` is optional; consumer-observable behavior is broader than visible UI; EARS is suggested, not mandatory. Tables are a useful format rather than proof that measurement is outside the feature model. Consumer contract tables and reports aggregating other owners' decisions need different authority. Split/merge must refine bounded specifications, not become an independent folder-design heuristic.

## Coverage to preserve beyond these sources

The [framework outline](../tracking/framework-outline.md) also owns accepted material that these drafts cover only partially:

- One-to-one specification/folder correspondence as the primary goal and the product/development feedback loop.
- Feature-owned semantic intents, including prerequisites and continuation; application-owned navigation.
- An embedded feature's specified host requirements, expressed through its SPI without sibling imports.
- Analytics as a feature; local and application-wide ownership; shared event contracts; optional on-demand enrichment and snapshot timing; provider-independent events and delivery.
- Parent composition only for a specified combined experience, with separate entries otherwise. The reader-facing rule remains deferred.
- Human-only execution, external specification homes, optional no-maintained-spec workflows, and gradual adoption.
- A standalone agent kit (architecture rules and modular skill) and ESLint setup without copying the manual.

## Archive and link notes

All six full drafts are retained beside this map. Their bodies are preserved; only links leaving the archive are adjusted for location. Source statements needing reconciliation are deliberately left visible.

The quality gate contains three pre-existing unresolved references: `specification-guide.md#1-specification-types`, `specification-guide.md#23-feature-relations`, and `implementation-patterns.md#feature-relations`. Relevant source material is available under [formats](./specification-guide.md#formats-and-templates), [feature relations](./specification-guide.md#referencing-other-features), and [integration patterns](./implementation-guide.md#integration-patterns). Preserve the requirements behind those references; the missing labels are not additional recovered documents.
