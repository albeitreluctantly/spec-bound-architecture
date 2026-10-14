# Public surface

## Entry

Each feature, subfeature, and shared module has one public entry file. Everything it does not export is private: internal hooks, state, stores, services, contexts, child components, and helpers.

| May export | Never export |
| --- | --- |
| A page or screen component | The internal logic hook or store |
| A widget's components, or its provider with the contribution | Private child components |
| Handlers or functions of a headless feature | Contexts and service implementations |
| A curated slice of logic another part of the application needs | Helpers used only inside the feature |
| A view component when a seam requires it | Types no consumer needs by name |
| Types a consumer must name | |

A parent's entry re-exports its subfeatures' entries, commonly as namespaces: `export * as CreateProduct from './create-product'`.

## API and SPI

- **API:** what the feature offers.
- **SPI:** what its surroundings must supply: intents to fulfill, required inputs, services, and host capabilities.

Express the SPI in the signature the consumer already uses: component props, function parameters, or a provider's inputs. An unwired requirement must fail typechecking at the junction.

## Intents

An intent is a semantic request for something outside the feature: open another capability, require sign-in, close the flow.

- The feature owns when it emits an intent, its payload, its prerequisites, and its continuation.
- Name intents after what the feature needs (`browseProducts`, `requireSignIn`), not after the UI event (`buttonPressed`) or the destination route.
- Model the intents as a discriminated union and accept them through one callback, such as `onIntent`, unless the project conventions say otherwise.
- A continuation lets the feature resume its own flow after the request is fulfilled, for example `{ type: 'requireSignIn', onSignedIn: () => save() }`.
- `app/` fulfills intents: it navigates, presents another feature, or invokes a capability. It does not reconstruct the feature's decisions from low-level events.

## Embedding requirements

An embedded feature's specification states where it appears. Its SPI states what it needs from the host: anchor context such as an entity ID, or a render dependency the host supplies. The host owns its anchors and their context; the contributor owns its rendering and state; `app/` connects them. See [Extension](../examples/extension.md).

## Supported slices

When logic must be reused outside the feature, expose only the supported part: a hook or function returning what consumers need, not the feature's whole internal state. Name it per the project conventions. A slice is a contract: keep it stable.
