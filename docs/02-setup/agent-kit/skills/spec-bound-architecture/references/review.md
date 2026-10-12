# Review for conformance

Review a change against the architecture rules, the project conventions, and the owning specifications. Lint catches import violations; the checklist covers what lint cannot.

## Checklist

1. **Correspondence.** Each changed feature folder maps to a specification. New behavior appears in the owning specification, or in a reported update for an external one. No feature implements another specification's behavior. In code-as-spec, changes stay within the request's intent.
2. **Placement.** New code sits in the narrowest justified home. `shared/` and `core/` code has more than one actual consumer. Domain code is not in `library/`.
3. **Imports.** Lint passes with no disabled or weakened rules. Consumers use public entries only.
4. **Public surface.** Entries export only what consumers need. Internal hooks, stores, and contexts stay private. Exposed slices are deliberate.
5. **Intents and navigation.** Features emit semantic intents with the payload and continuation they own. Route paths, navigation calls, and knowledge of other screens live in `app/`. Intent names describe needs, not UI events.
6. **Junctions.** Every relation in the specification is implemented by one of the integration patterns. Extension contributions use typed anchors. Data passed between features goes through `app/` or shared code.
7. **Changes in other features.** Supporting changes in other features leave their logic and behavior unchanged. Seams are generic, typed, and do not alter default behavior.
8. **Composition.** A parent composes subfeatures only when its specification defines the combined experience. `app/` owns providers, bindings, and handler lifetimes.
9. **Verification.** Tests cover acceptance criteria and alternate outcomes; feature tests assert emitted intents; integration covers their fulfillment.

## Findings

Report each finding with:

- the file and line;
- the rule or criterion it breaks;
- the consequence, such as hidden coupling, a lost boundary, or unspecified behavior;
- a concrete fix within the architecture.

Separate violations from suggestions. Report a boundary question about the specifications separately from code findings.
