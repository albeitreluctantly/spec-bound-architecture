// Spec-bound Architecture import boundaries
//
// Requires: eslint 9, eslint-plugin-boundaries 7, @typescript-eslint/parser,
// and eslint-import-resolver-typescript, which reads the aliases from
// tsconfig.json paths. Set SOURCE_ROOT to the project's source folder; merge
// the exported entries into an existing flat config if there is one.

const boundaries = require('eslint-plugin-boundaries');
const tsParser = require('@typescript-eslint/parser');
const { defineConfig } = require('eslint/config');

const SOURCE_ROOT = 'src';

// The module, not the home, is the element: each `core/` and `library/`
// module and each feature has its own public entry. The first matching pattern
// classifies a file, so `shared` precedes `subfeature`. One subfeature level is
// supported, and any folder directly inside a top-level feature counts as a
// subfeature: leaf features keep their files flat.
const elements = [
  { type: 'app', pattern: `${SOURCE_ROOT}/app` },
  { type: 'library', pattern: `${SOURCE_ROOT}/library/*`, capture: ['module'] },
  { type: 'core', pattern: `${SOURCE_ROOT}/core/*`, capture: ['module'] },
  {
    type: 'feature-shared',
    pattern: `${SOURCE_ROOT}/features/*/shared`,
    capture: ['feature'],
  },
  {
    type: 'subfeature',
    pattern: `${SOURCE_ROOT}/features/*/*`,
    capture: ['feature', 'subfeature'],
  },
  { type: 'feature', pattern: `${SOURCE_ROOT}/features/*`, capture: ['feature'] },
];

const DOMAIN_AWARE_TYPES = ['core', 'feature', 'feature-shared', 'subfeature', 'app'];
const FEATURE_TYPES = ['feature', 'feature-shared', 'subfeature'];
const ENTRY_FILE_GLOB = 'index.{ts,tsx}';

// Later policies override earlier ones for the same dependency.
const policies = [
  {
    from: { element: { type: 'library' } },
    disallow: { to: { element: { type: DOMAIN_AWARE_TYPES } } },
    message: 'library/ is domain-independent and must not import {{ to.type }}',
  },
  {
    from: { element: { type: 'core' } },
    disallow: { to: { element: { type: [...FEATURE_TYPES, 'app'] } } },
    message: 'core/ must not import {{ to.type }}',
  },
  {
    disallow: { to: { element: { type: 'app' } } },
    message: 'Nothing imports app/; it is the composition root',
  },
  {
    from: { element: { type: 'app' } },
    disallow: { to: { element: { type: ['subfeature', 'feature-shared'] } } },
    message: "app/ reaches subfeatures through their parent's public entry",
  },
  {
    from: { element: { type: 'feature' } },
    disallow: {
      to: {
        element: {
          type: ['feature', 'subfeature'],
          captured: { feature: '!{{ from.captured.feature }}' },
        },
      },
    },
    message: 'Sibling features never import each other',
  },
  {
    from: { element: { type: 'subfeature' } },
    disallow: { to: { element: { type: ['feature', 'subfeature'] } } },
    message:
      "A subfeature imports neither siblings nor its parent's entry or composition",
  },
  {
    from: { element: { type: 'feature-shared' } },
    disallow: { to: { element: { type: ['feature', 'subfeature'] } } },
    message: 'shared/ must not import features or subfeatures',
  },
  {
    disallow: { to: { element: { type: 'feature-shared' } } },
    message: "shared/ is private to its feature; use the parent's public entry",
  },
  // Re-allows the previous policy's target within the feature that owns it.
  {
    from: { element: { captured: { feature: '{{ to.captured.feature }}' } } },
    allow: { to: { element: { type: 'feature-shared' } } },
  },
  {
    disallow: {
      to: {
        element: {
          type: ['feature', 'subfeature', 'core', 'library'],
          internalPath: `!${ENTRY_FILE_GLOB}`,
        },
      },
    },
    message: 'Module internals are private; import its public entry',
  },
  {
    disallow: {
      to: {
        element: { type: 'feature-shared', internalPath: `!**/${ENTRY_FILE_GLOB}` },
      },
    },
    message: 'shared/ internals are private; import a shared module entry',
  },
];

const aliasPatterns = {
  relativeAcrossHomes: {
    regex: '^(\\.\\./)+(app|core|library|features)(/|$)',
    message: 'Reach other code homes through their aliases',
  },
  deepAlias: {
    regex: '^@(app|core|library|features)/[^/]+/.+',
    message: 'Import a public entry, not a path inside it',
  },
  featureAlias: {
    regex: '^@features/',
    message:
      'Features reach their own files by relative path and never import other features',
  },
};

module.exports = defineConfig([
  {
    files: [`${SOURCE_ROOT}/**/*.{ts,tsx}`],
    languageOptions: { parser: tsParser },
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/elements': elements,
    },
    rules: {
      'boundaries/dependencies': ['error', { default: 'allow', policies }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [aliasPatterns.relativeAcrossHomes, aliasPatterns.deepAlias],
        },
      ],
    },
  },
  {
    // A later `no-restricted-imports` entry replaces earlier options, so it
    // repeats every pattern that still applies.
    files: [`${SOURCE_ROOT}/features/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            aliasPatterns.relativeAcrossHomes,
            aliasPatterns.deepAlias,
            aliasPatterns.featureAlias,
          ],
        },
      ],
    },
  },
]);
