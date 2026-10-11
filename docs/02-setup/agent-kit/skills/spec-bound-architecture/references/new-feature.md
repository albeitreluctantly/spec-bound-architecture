# Implement a feature

1. **Locate.** Find the feature's specification and the folder it maps to. If the specification is missing or does not describe one bounded capability, stop and ask; see [specifications](specifications.md). Without specifications, the request's intent defines the feature and the capabilities it names.
2. **Separate owned from named.** List what the feature owns: its screens or fragments, rules, state, data access, and outcomes. List every other capability its acceptance criteria name; each is a relation implemented through a junction, never by importing that feature.
3. **Choose the shape.** Screen, widget, or headless; see [feature-shapes](feature-shapes.md).
4. **Define the public surface first.** Decide the entry exports (API) and what the surroundings supply (SPI): intents, required inputs, services, host capabilities. See [public-surface](public-surface.md).
5. **Connect each relation.** Pick the pattern for each named capability from [integration-patterns](integration-patterns.md). Reuse existing shared code through its public entry; add a seam to another feature only while its logic stays unchanged.
6. **Implement privately.** Keep view, state, data access, and logic inside the feature folder. Place code elsewhere only under [placement](placement.md).
7. **Wire.** Export the entry from the parent, then mount it and fulfill its intents in `app/`, or compose it inside the parent when the parent's specification defines a combined experience.
8. **Verify.**
   - Feature tests cover the acceptance criteria, including alternate outcomes, and assert which intent is emitted for each outward outcome.
   - Integration checks confirm that the application fulfills those intents.
   - Lint and typecheck pass without disabled rules.

The feature is done when every acceptance criterion maps to code inside the feature or to a junction it declares.
