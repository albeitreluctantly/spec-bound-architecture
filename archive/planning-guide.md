# Planning Guide

**Purpose:** the field procedure that turns a spec — or a request fragment that carries no business intent — into placed, decomposed work. The [Method](./method.md) names the stages and the pipeline; this is the step-by-step that builds the plan and its tasks. Each step references the guide that owns its rules rather than restating them.

The procedure runs in three steps: **gate** any spec, **build the plan**, **break it into tasks**. Deciding whether a request becomes a spec, a plan, or direct work is a separate concern — [Method's _Routing a request_](./method.md#routing-a-request).

## 1. Gate the spec

A fragment that produced or updated a spec passes the gate before any plan derives from it. The bar is two-part: the spec is **well-formed** and **architecturally implementable**.

- **Well-formed** — it meets the well-formed checklist in the [Specification guide](./specification-guide.md): one bounded feature, observable criteria, relations named rather than re-described. The [Spec validator](./agentic-workflow.md) runs this check and returns a verdict.
- **Architecturally implementable** — every connection the spec implies fits one of the four reference forms (Handoff · Embedding · Dependency · Modification). A connection that fits none is the signal to **rewrite the story** until it does, or to recognize a coupling that resolves at the plan altitude: mutual sync, shared state, multi-feature orchestration. The story is rewritten, never forced into the code as an exception — this is what holds the spec and the code together.

A failing gate blocks the plan: the spec is rewritten first. An ownership change the gate surfaces — a split or a merge — is a proposal a human accepts, not an automatic edit.

## 2. Build the plan

The plan is the **implementation structure** — the parts a feature is built from and how they fit, decided at this altitude. When a spec exists it is the source of truth for behavior: the plan derives the structure from the spec, not from the ephemeral request, and is never hand-fed by the author. A fragment with no business intent — substrate, infrastructure, a restyle — has no spec; the plan designs its structure from the fragment itself. Building it:

1. **Orient.** Read the spec, or grasp the request fragment, and build a mental model of what is being built. Survey the existing code it touches — the features and substrate it connects to, the domain area it belongs to, the parts it overlaps or could reuse — so the moves below rest on what already exists.
2. **Identify the relations.** Read each outward connection — from the spec's acceptance criteria, or the fragment — and type it as one of the four forms (Handoff · Embedding · Dependency · Modification). A unit with no outward connection has none. Identifying a relation may surface a part the feature must add — a headless split for a Modification, a slot for an Embedding host.
3. **Decompose into parts.** Break the work into the units it is built from — screens, components, hooks, services, state — each with a clear responsibility, and choose the integration pattern for each relation (see [Choosing a pattern](./implementation-guide.md#choosing-a-pattern)). The pattern fixes what each junction exposes and how it is realized; every junction is wired by the app or reached through substrate, no feature reaches into another.
4. **Define the public surface.** Fix what the feature exports and in what shape — the parts it makes public plus the SPI each relation's pattern requires — the contract every task and consumer builds against. Logic is exposed for reuse only through a curated public surface, never a feature's internal hook.
5. **Place each part.** Send each to its home by domain scope × reuse breadth — the Placement table in the [Architecture guide](./architecture-guide.md#placement) — defaulting to the narrowest home that fits. A part lives inside the feature unless it is already needed more widely.

## 3. Break the plan into tasks

Tasks are increments derived from the plan, durable while the work is in flight.

1. **The public surface first.** The plan declares what the feature exports and in what shape; the first increment implements that surface, so everything downstream builds against a stable contract.
2. **Then dependency-ordered increments.** The rest breaks into pieces completable on their own, ordered trunk → leaves: a unit ships before the units that depend on it.

## Assessment output

A run of the procedure returns, in one shape a human or an agent can act on:

- **Verdict** — proceed · rewrite the spec · reject, each with its reason.
- **Derived plan** — the feature's parts and responsibilities, its public surface, the home of each part, and the pattern of each relation.
- **Recommendations** — ownership changes (split · merge · promote) for a human to accept.
