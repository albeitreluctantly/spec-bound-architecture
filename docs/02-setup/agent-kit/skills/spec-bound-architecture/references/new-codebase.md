# Set up a new codebase

## 1. Conventions

Create the project conventions file from the template shipped with the architecture rules, or confirm the existing one covers:

- the workflow and, unless it is code-as-spec, the specification home and its mapping to feature folders;
- the stack, coding practices, and verification commands.

Ask the team for any value you cannot determine. Do not choose a specification home on the team's behalf.

## 2. Code homes

```text
src/
  app/          # composition root: startup, providers, navigation, wiring
  core/         # application-domain modules shared by top-level features
  library/      # domain-independent modules: UI primitives, utilities, technical services
  features/     # one folder per feature specification
```

- Create a module folder with a public entry only when there is code for it.
- Configure path aliases for the homes in the TypeScript configuration and the bundler: `@app/*`, `@core/*`, `@library/*`, `@features/*`.

## 3. Import enforcement

Add the kit's ESLint configuration. Set its source root to the project's root folder, and confirm the resolver reads the alias configuration. If the config's dependencies are missing - ask to before installing them, don't to it eagerly. Run lint on an empty or trivial tree before adding features; fix configuration errors rather than disabling rules.

## 4. Application root

`app/` owns:

- the entry component and startup sequence;
- runtime providers: data clients, dependency bindings, theme, localization;
- the navigation tree and route files;
- wiring between feature entries: intent fulfillment, extension maps, handler registration, and data passed between features.

If asked, draft the app entry point according to the chosen technical stack. Keep the entry point and route structure in `app/` unless the stack demands otherwise or you're explicitly asked.

**The base setup is done.** If asked, proceed with implementing or drafting first features.

## 5. First features

1. List the feature specifications and their grouping in the specification home.
2. Create a folder for each specification you implement, mirroring the grouping: a parent specification with separate subfeature specifications becomes a parent folder with matching subfeature folders.
3. Give each feature and parent a public entry. A parent's entry re-exports its subfeatures' entries for application wiring unless the parent's specification defines a combined experience it implements itself.
4. Create `shared/` in a parent only when two of its subfeatures need the same code.

Implement each feature with [new-feature](new-feature.md).
