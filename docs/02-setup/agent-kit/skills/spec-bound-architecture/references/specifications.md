# Specifications

## Where they are

The project conventions name the specification home: repository files or an external knowledge base. A specification's place in that home maps to a feature folder.

## Without specifications

When the conventions state that the project works without specifications, the code is the record of intended behavior.

- The request's intent defines the change and its boundaries: which feature it belongs to, what behavior changes, and what a new feature owns.
- Do not change another feature's observable behavior without clear justification. Supporting changes that leave its behavior unchanged remain permitted.
- Feature boundaries follow capabilities as the code and requests describe them; all other architecture rules apply unchanged.
- Ask when the intent leaves the owner or the expected behavior unclear.

## Reading a specification

A specification describes the desired behavior of one bounded capability.

- **Owned behavior** is everything the feature itself does: its screens or fragments, rules, states, validations, alternate outcomes, and data. It is implemented inside the feature.
- **Named capabilities** are other features the specification refers to without describing their internals. Each is a relation, implemented through a junction.

| Relation | Typical wording | Junction |
| --- | --- | --- |
| Handoff | "WHEN staff save, open Browse products" | Intent fulfilled by `app/` |
| Embedding | "The compare toggle appears on each product card" | Extension anchor |
| Dependency | "Uses the shared product search" | Shared code or composition |
| Modification | "On the gift guide, the product list shows only gift-eligible items" | Seam in the modified feature |

Relations live in the acceptance criteria.

Formats vary. User stories with acceptance criteria describe behavior; `WHEN`, `WHILE`, and `IF … THEN` phrasing is common but optional. A contract table describes a consumer's data or event requirements, such as a measurement specification. A table that aggregates decisions owned by other specifications is a report, not the authority.

## Desired state

A specification states what should be true, not a history of changes. When code and specification disagree, the specification wins unless the team updates it. Never edit a specification to match code without the team's agreement.

## Boundary questions

Raise a question instead of guessing when:

- a specification is missing, ambiguous, or contradicts the request;
- it describes several complete flows with different purposes;
- part of it is a capability other features use or need;
- two specifications duplicate behavior or describe one capability between them;
- a feature needs heavy or growing modification by another;
- implementing it would require one feature to import another.

A good question names the specification, quotes the criterion, states the conflict, and proposes options, such as a split, a merge, extracting shared behavior, or an added seam. Ownership changes need the team's agreement; implement within the current boundaries until then, or stop if they cannot hold.
