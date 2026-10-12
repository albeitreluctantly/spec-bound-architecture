# Project conventions

<!-- Replace every placeholder in angle brackets and delete sections that do not apply. Agents read these bindings instead of assuming defaults. -->

## Product

<One paragraph: what the application does and for whom.>

| Term          | Meaning                                      |
| ------------- | -------------------------------------------- |
| <Domain term> | <Definition used in specifications and code> |

## Specifications

- **Workflow:** <`intent-first` (default): agents update the owning specification from the request before the code; `spec-first`: agents implement only what the specifications describe; or `code-as-spec`: the project keeps no specifications and the code serves as the specification>
- **Location:** <omit in code-as-spec; a repository path, for example `specs/`, or an external source, how to reach it, and whether agents may edit it>
- **Correspondence:** <omit in code-as-spec; how a specification's place maps to a feature folder, with one example: `specs/catalog/create-product.md` → `src/features/catalog/create-product/`>
- **Formats:** <omit in code-as-spec; user stories, contract tables, or other formats in use>

## Stack

| Concern              | Choice                        |
| -------------------- | ----------------------------- |
| UI                   | <framework>                   |
| Navigation           | <router or navigator>         |
| State                | <state library or approach>   |
| Data access          | <data library or approach>    |
| Dependency injection | <container, context, or none> |
| Testing              | <unit and integration tools>  |

## Verification

- **Lint:** <command>
- **Typecheck:** <command>
- **Tests:** <command, and what feature tests and integration checks cover>

## Coding practices

- <A practice every change follows, for example the intent callback name, entry export names, when to use an alias rather than a relative path, how errors are represented, how text is localized, or where data is stored>

## Architecture overrides

- <A project-specific change to a default in the architecture rules, for example: ask before adding any seam to another feature>
