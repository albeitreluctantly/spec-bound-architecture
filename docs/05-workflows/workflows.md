# Workflows

> [!WARNING]
> Draft outline, not ready for use. Detailed guidance follows version 0.5.

## Spec-driven development

The primary workflow: clarify intent, define or update bounded specifications, design the implementation, build, verify, and refine the specifications through feedback. Specifications may live in the repository or an external knowledge base; a local mirror is not required.

## Routing a request

Identify the affected capabilities and owners. Distinguish changes to intended behavior, supporting infrastructure, and implementation corrections. Explain intent-first and spec-first entry points, with plans and tasks as optional working artifacts.

## Human-only execution

Apply the same architectural rules and specification feedback loop without requiring an agent roster or automated pipeline.

## Without maintained specifications

Optional workflow. The evidence of intended behavior, review expectations, and any durable record remain design questions. Existing code and tests alone do not establish complete product intent.

## Gradual adoption

Introduce boundaries in an existing codebase incrementally. Define how converted features coexist with existing code and how requirements guide subsequent changes.

## Agent-assisted execution

Coordinate authoring, implementation, and review using the [agent roster](./agent-roster.md). Separate architectural rules from tool-specific procedures.
