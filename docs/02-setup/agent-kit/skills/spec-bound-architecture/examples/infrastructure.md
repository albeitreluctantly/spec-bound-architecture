# Infrastructure

Localization, error messages, and logging are domain-independent mechanisms in `library/`. Features import their public entries directly; nothing passes them through props or intents.

## Localization

`src/library/i18n/index.ts`

```ts
import { en } from './en';

export type MessageKey = keyof typeof en;
export type MessageParams = Readonly<Record<string, string | number>>;

export function translate(key: MessageKey, params: MessageParams = {}) {
  return en[key].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}
```

`src/library/i18n/en.ts`

```ts
export const en = {
  'createProduct.title': 'New product',
  'errors.duplicateProductName': 'A product named {name} already exists',
  'errors.unexpected': 'Something went wrong. Try again.',
} as const;
```

Message catalogs hold product wording as data. `library/` code still imports nothing from `core/` or features.

## Errors

An error carries what its message needs, not the message itself. One resolver turns any error into text.

`src/library/errors/index.ts`

```ts
import { translate, type MessageKey, type MessageParams } from '@library/i18n';

export class AppError extends Error {
  constructor(
    readonly messageKey: MessageKey,
    readonly params: MessageParams = {},
  ) {
    super(messageKey);
  }
}

export function describeError(error: unknown) {
  return error instanceof AppError
    ? translate(error.messageKey, error.params)
    : translate('errors.unexpected');
}
```

Domain errors live with the domain code that raises them:

`src/core/products/errors.ts`

```ts
import { AppError } from '@library/errors';

export class DuplicateProductName extends AppError {
  constructor(name: string) {
    super('errors.duplicateProductName', { name });
  }
}
```

## Logging

`src/library/logging/index.ts`

```ts
export function logError(error: unknown, context: Readonly<Record<string, unknown>> = {}) {
  console.error(error, context);
}
```

Log where the context is: infrastructure logs at data and network boundaries; a feature logs only what it alone knows.

## Feature use

`src/features/catalog/create-product/SaveErrorNotice.tsx`

```tsx
import { describeError } from '@library/errors';
import { Notice } from '@library/ui';

export function SaveErrorNotice({ error }: { error: unknown }) {
  return <Notice tone="danger">{describeError(error)}</Notice>;
}
```

`app/` installs application-level infrastructure once: localization providers, the error boundary around the root, and log destinations.
