# Project conventions

<!-- Replace every placeholder in angle brackets and delete sections that do not apply. Agents read these bindings instead of assuming defaults. -->

## Product

<One paragraph: what the application does and for whom.>

| Term          | Meaning                                      |
| ------------- | -------------------------------------------- |
| <Domain term> | <Definition used in specifications and code> |

## Specification home

- **Location:** <repository path, for example `specs/`, the external knowledge base and how to reach it, or `none` when the project works without specifications; omit the remaining items in that case>
- **Correspondence:** <how a specification's place maps to a feature folder, with one example: `specs/catalog/create-product.md` → `src/features/catalog/create-product/`>
- **Formats:** <user stories, contract tables, or other formats in use>

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
