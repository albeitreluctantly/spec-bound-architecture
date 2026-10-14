# Feature shapes

A feature's shape follows what its specification describes. The shapes share one rule: one public entry, everything else private.

## Screen

A page the application mounts at a route or presents as a dialog. Its view, state, data access, and logic live inside the feature. Keep them together; do not extract a hook or a view until a consumer outside the feature needs one of them separately.

The entry exports the page, commonly as `Page`. Outward requests are intents in its props. See [Screen feature](../examples/screen-feature.md).

## Widget

UI rendered inside a host the feature does not own. The host works without it. The widget's specification decides its form:

- **Standalone widget:** the specification names no placement. The entry exports the widget's components, and the host's specification or `app/` places them. See [Widget feature](../examples/widget-feature.md).
- **Contribution:** the specification places the widget in a host. The widget maps its fragments to the host's anchors, and its provider or contribution hook hands that mapping to `app/`. See [Extension](../examples/extension.md).

## Headless

A capability without UI: functions, handlers, or a hook. Its consumer may be the application (link resolution, background work) or a downstream system (measurement). It still owns its behavior and contracts, and it still connects through intents, shared contracts, and composition. See [Headless feature](../examples/headless-feature.md) and [analytics](analytics.md).

## Separating logic from view

Split a screen into a logic hook and a view only when something outside needs one without the other: a seam that lets a consumer render the view with changed data, or a supported slice of logic another part of the application uses. Even then, the internal hook stays private; the entry exposes a curated slice. See [Modification seams](../examples/modification-seams.md).
