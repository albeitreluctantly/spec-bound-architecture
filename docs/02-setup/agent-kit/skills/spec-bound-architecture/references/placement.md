# Placement and imports

## Placement

| Code knows | Used by | Home |
| --- | --- | --- |
| No product domain | Anyone | `library/` |
| The application domain | Several top-level features | `core/` |
| One feature's domain | That feature's subfeatures | That feature's `shared/` |
| One feature | That feature | Inside the feature |

- Start at the narrowest home. Move code outward only when a wider consumer actually exists.
- A domain-free primitive goes to `library/`, a domain component shared across top-level features to `core/`, a component used by one feature stays inside it.
- `app/` mounting or wiring a part is not a second consumer.

## Shared code inside a feature

Create a parent's `shared/` when two of its subfeatures need the same code: domain types, rules, data access, state, or a reusable capability such as search, filtering, and pagination. Each subfeature keeps its own flow. Shared requirements in the parent specification are a strong clue. A split alone does not create `shared/`.

## Promotion

Move code from a parent's `shared/` to `core/` when another top-level feature needs it:

1. Create the `core/` module with a public entry exposing the same contract.
2. Update every import in the original feature, then add the new consumer.
3. Delete the old location in the same change.

Move code from `core/` to `library/` only when it stops knowing the product domain.

## Parent composition

A parent composes its subfeatures inside its own implementation only when the parent's specification defines their combined experience, for example "map and list stay in sync on selection". Grouping specifications under a parent is not enough. Otherwise the parent's entry re-exports subfeature entries and `app/` composes them.

## Import matrix

| Importer | May import | Never imports |
| --- | --- | --- |
| Top-level feature | `core/` and `library/` entries; own files; own `shared/`; own subfeatures' entries | Sibling features in any form; `app/` |
| Subfeature | `core/` and `library/` entries; own files; parent's `shared/` | Sibling subfeatures; the parent's entry or composition files; other features; `app/` |
| Feature `shared/` | `core/` and `library/` entries; own files | Its own feature and subfeatures; other features; `app/` |
| `core/` module | `library/` entries; other `core/` entries | Features; `app/` |
| `library/` module | Other `library/` entries | `core/`; features; `app/` |
| `app/` | Feature entries; `core/` and `library/` entries; own files | Subfeature entries directly; any `shared/`; private files |

Outside a module, import only its public entry. Inside a feature, reach own files and the parent's `shared/` by relative path unless the conventions say otherwise.

## Moving code safely

- Keep public entries stable, or update all consumers in the same change.
- Run lint after every move; a boundaries error means the new placement breaks a rule.
- Never add an exception to the lint configuration for a single import.
