# Spec Quality Gate

Defines when a specification is architecturally implementable, how to review it, and when to split or merge stories.

---

## Quality bar

A specification is architecturally implementable when:

1. It fits one of the [specification types](./specification-guide.md#1-specification-types).
2. Its relations map to allowed [feature relation types](./specification-guide.md#23-feature-relations) and [implementation patterns](./implementation-patterns.md#feature-relations).
3. It passes the [gate checklist](#gate-checklist) below.

If any check fails, rewrite the spec. Otherwise propose a new architectural pattern.

---

## Gate checklist {#gate-checklist}

A user story **passes** when all hold:

1. **One feature owner** — story names one capability; epic affinity identifies module.
2. **Relations identifiable** — every integration point is derivable from the wording as one of the four reference forms (navigation, placement, substrate config). Carried by the acceptance criteria, not necessarily a formal graph or a separate typed list. A connection that fits no form fails the gate.
3. **Owned elements named** — UI this story introduces: label key, position, behavior.
4. **Navigation intents listed** — every action leaving the feature UI names target story.
5. **Substrate configuration explicit** — non-default substrate options listed. (view mode, element visible/hidden)
6. **States identifiable** — empty, populated, error, denied, and any non-default loading behavior in user-observable terms.
7. **Crucial branches declared in acceptance criteria** — required alternate outcomes for the same user action are explicit, especially auth-required, entitlement, validation, no-change, and permission-gated flows.
8. **Unhappy paths separated from crucial branches** — failures and environmental problems can live in Unhappy paths; required product gates cannot be hidden there. Unhappy paths omitted when they only restate app defaults.
9. **Constraints declared** - validation rules, guardrails, preconditions.
10. **Excludes forbidden content:**

- Other stories' internals
- Duplicated default behavior (reference by name)
- Implementation detail unless user-observable

11. **Implementation plan derivable** — behavior, relations, and constraints are enough to produce an unambiguous plan. Mechanisms, algorithms, and performance tradeoffs stay out of the story - those are system-design decisions.

**Verdict:** Pass / Fail. Fail → propose rewrite; do not implement.

---

## Review output

Same shape for human or agent review:

1. **Verdict** — Pass / Fail
2. **Relation graph** — typed edges to stories and substrate, derived by the reviewer from the spec wording
3. **If pass — implementation plan:**
   - Public API - what feature exports: components, hooks, functions
   - SPI - what feature requires: props, callbacks, anchor ids
   - Relation graph - relations with other features or substrate
   - Subtask list - implementation steps as holistic increments of functionality
   - Additional notes allowed
4. **If fail — recommendations:**
   - Which AC violates which rule
   - Suggested rewrites (user language)
   - Sibling story or substrate that should absorb content

---

## Split and merge heuristics

**Split** a story if:

- it owns several complete screens/flows with different purposes
- a part of it is a holistic piece of functionality used or potentially used by other features

**Merge or downgrade** a story if:

- it owns no user-facing logic
- it is just a render/logic branch of another feature
- it describes an element integral to another feature's UX and only opens another screen

**When in doubt:**

- If altering A from B requires changing A's spec, add a seam to A or split substrate out.
- If two stories duplicate behavior, merge or promote shared behavior to substrate.
- If a story starts with "When button is clicked", check whether the button belongs to the caller story.

Agents and developers may propose split/merge. Humans accept ownership changes.
