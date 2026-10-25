# Implement a feature

1. **Identify.** Identify the feature the request describes, its specification, and the folder it maps to, then follow the project's workflow: under intent-first, create or update the specification before the code; under spec-first, ask when it is missing; under code-as-spec, implement directly. See [specifications](specifications.md#workflow-and-home). If the feature is not one bounded capability, raise a boundary question.
2. **Separate owned from referenced.** List what the feature owns: its screens or fragments, rules, state, data access, and outcomes. List every other capability its specification or request refers to; each is a relation implemented through a junction, never by importing that feature.
3. **Choose the shape.** Screen, widget, or headless; see [feature-shapes](feature-shapes.md).
4. **Define the public surface first.** Decide the entry exports (API) and what the surroundings supply (SPI): intents, required inputs, services, host capabilities. See [public-surface](public-surface.md).
5. **Connect each relation.** Pick the pattern for each referenced capability from [integration-patterns](integration-patterns.md). Reuse existing shared code through its public entry; add a seam to another feature only while its logic stays unchanged.
6. **Implement privately.** Keep view, state, data access, and logic inside the feature folder. Place code elsewhere only under [placement](placement.md).
7. **Wire.** Export the entry from the parent, then mount it and fulfill its intents in `app/`, or compose it inside the parent when the parent's specification defines a combined experience.
8. **Verify.**
   - Feature tests cover the acceptance criteria, including alternate outcomes, and assert which intent is emitted for each outward outcome.
   - Integration checks confirm that the application fulfills those intents.
   - Lint and typecheck pass without disabled rules.

The feature is done when every acceptance criterion maps to code inside the feature or to a junction it declares.
