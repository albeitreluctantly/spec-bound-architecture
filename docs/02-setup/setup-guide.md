# Setup guide

A project adopts Spec-bound Architecture by creating its code homes, recording its conventions, enforcing imports with ESLint, and giving its agents the agent kit. The documentation stays outside the codebase: people read the guides, agents read the kit.

## The agent kit

| File                                                                                     | Copied to                                   | Purpose                                                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| [`architecture-rules.md`](./agent-kit/architecture-rules.md)                             | The repository, referenced from `AGENTS.md` | The rules every agent keeps loaded                                               |
| [`conventions-template.md`](./agent-kit/conventions-template.md)                         | A new project conventions file              | Project bindings the rules refer to: specification home, stack, coding practices |
| [`eslint.config.js`](./agent-kit/eslint.config.js)                                       | The ESLint configuration                    | Enforcement of the import rules                                                  |
| [`skills/spec-bound-architecture/`](./agent-kit/skills/spec-bound-architecture/SKILL.md) | The skills directory the team's tools read  | Procedures and sample implementations, loaded when a task needs them             |

## 1. Create the code homes

```text
src/
  app/          # composition root: startup, providers, navigation, wiring
  core/         # application-domain modules shared by top-level features
  library/      # domain-independent modules: UI primitives, utilities, technical services
  features/     # one folder per feature specification
```

Each module in `core/` and `library/`, each feature, and each subfeature has a public entry file, such as `index.ts`. See the [Overview](../01-overview/overview.md) for what each home holds.

Configure aliases for the homes in `tsconfig.json` and in the bundler:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["./src/app/*"],
      "@core/*": ["./src/core/*"],
      "@library/*": ["./src/library/*"],
      "@features/*": ["./src/features/*"]
    }
  }
}
```

## 2. Record the project conventions

The architecture rules state what holds in every codebase. The project conventions supply what differs between codebases, and agents read them instead of assuming defaults:

| Convention                            | Example                                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Workflow and specification home       | Intent-first, spec-first, or code-as-spec; `specs/catalog/create-product.md` → `src/features/catalog/create-product/`        |
| Stack                                 | UI, navigation, state, data access, dependency injection, testing                                                             |
| Coding practices                      | An `onIntent` callback for intents; `Page` as a page entry's export; aliases for other code homes; how errors are represented |
| Verification commands                 | Lint, typecheck, and test commands                                                                                            |
| Architecture overrides                | Ask before adding a seam to another feature                                                                                   |

Record them in either of two ways:

- **Template:** copy the [conventions template](./agent-kit/conventions-template.md) into a new file, such as `docs/conventions.md`, and fill in the placeholders.
- **Existing instructions:** add the same items to the project's existing conventions or agent instructions file.

## 3. Choose a workflow and specification home

The workflow decides how a request reaches the code:

- **Intent-first**, the default: agents identify the owning feature from a request, update its specification, and then change the code.
- **Spec-first:** agents implement only what the specifications already describe.
- **Code-as-spec:** the project keeps no specifications, and the code serves as the specification. Agents go straight from the request to the code.

Intent-first and spec-first projects keep specifications in the repository or in an external knowledge base. Either way, record in the conventions how a specification's place maps to a feature folder, for example `specs/catalog/create-product.md` → `src/features/catalog/create-product/`. [Workflows](../05-workflows/workflows.md#spec-driven-development) describes these options in detail.

## 4. Enforce imports with ESLint

Install the dependencies:

```bash
npm install --save-dev eslint@9 eslint-plugin-boundaries@7 @typescript-eslint/parser eslint-import-resolver-typescript
```

Copy the kit's `eslint.config.js`, or merge its exported entries into an existing flat configuration. Set `SOURCE_ROOT` to the project's source root and keep the aliases in sync with `tsconfig.json`; the resolver reads them from there.

The configuration classifies every file into an element and applies dependency policies between elements:

| Element          | Pattern                 |
| ---------------- | ----------------------- |
| `app`            | `src/app`               |
| `core` module    | `src/core/*`            |
| `library` module | `src/library/*`         |
| `feature`        | `src/features/*`        |
| `feature-shared` | `src/features/*/shared` |
| `subfeature`     | `src/features/*/*`      |

It allows and forbids these imports:

| Allowed                                                          | Forbidden                                                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `app/` → feature, `core/`, and `library/` entries                | `app/` → subfeature entries, any `shared/`, or private files                           |
| Feature → `core/` and `library/` entries; own files              | Feature → sibling feature, through its entry or a deep path                            |
| Parent → its subfeatures' entries and its own `shared/`          | Feature, `core/`, or `library/` → `app/`                                               |
| Subfeature → parent's `shared/`, `core/`, and `library/` entries | Subfeature → sibling subfeature, another feature, or the parent's entry or composition |
| `shared/` → `core/` and `library/` entries                       | `shared/` → its own feature or subfeatures; any code → another feature's `shared/`     |
| `core/` → `library/` and other `core/` entries                   | `core/` → features; `library/` → `core/` or features                                   |
| `library/` → other `library/` entries                            | Any import of a module's internals from outside it                                     |

Three limits apply:

- One subfeature level is supported. Deeper nesting needs additional elements.
- Any folder directly inside a top-level feature is classified as a subfeature, including a leaf feature's internal folders such as `components/`. Their files then follow subfeature rules: they cannot import each other or the feature's root files, and the root reaches them only through an entry file. Keep leaf features flat; folders inside a subfeature are unaffected.
- The boundaries plugin locates each imported file through `eslint-import-resolver-typescript`, which reads the aliases from `tsconfig.json`. An import it cannot locate is skipped rather than reported, so a missing or mismatched alias lets violations pass silently.

Run lint, then confirm enforcement with a deliberate violation: add an import from one feature to a sibling feature's entry and check that lint reports it. Remove the import afterward.

## 5. Give agents the architecture

1. Copy `architecture-rules.md` into the repository, for example into `docs/`.
2. In `AGENTS.md`, or whichever instructions file the team's tools load on every task, reference the architecture rules and the project conventions recorded in step 2, so agents read both before any change:

   ```md
   ## Architecture

   Before any task, read:

   - `docs/architecture-rules.md` — Spec-bound Architecture rules
   - `docs/conventions.md` — this project's conventions
   ```

3. Copy the `spec-bound-architecture` skill folder into the skills directory the team's agent tools read.

To upgrade, replace `architecture-rules.md` and the skill folder with the newer version; the version is on the file's first line. Local overrides should belong in the conventions file's architecture overrides, not in the copied files.

## 6. Check the setup

- The four homes exist with aliases that resolve in TypeScript, the bundler, and ESLint.
- The conventions file names the specification home and its folder mapping.
- Lint passes, and the deliberate violation fails.
- Agents receive the architecture rules on every task and can load the skill.

With the setup in place, the codebase is ready for its first feature. The [Overview](../01-overview/overview.md#feature-walkthrough) walked through one from specification to wiring; the engineering guides go into the details: the [Architecture guide](../03-engineering/architecture-guide.md) for boundaries and placement, and the [Implementation guide](../03-engineering/implementation-guide.md) for feature design and integration patterns. The [Specification guide](../04-specifications/specification-guide.md) covers writing the specifications themselves.
