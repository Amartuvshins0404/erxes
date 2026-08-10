const nx = require('@nx/eslint-plugin');
const baseConfig = require('../../../eslint.config.js');

module.exports = [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // List queries must gate their fetch on auth hydration. A `useQuery` that
      // sets a non-default `fetchPolicy` (network-only / cache-and-network) with
      // no `skip` fires before `currentUser` hydrates on first navigation, and
      // the resulting empty/errored result sticks with no retry (PR #278). Route
      // list queries through `useAuthedListQuery`, which supplies the skip gate.
      // Narrowly scoped to `fetchPolicy`-without-`skip` so the many legitimate
      // detail/picker queries (which already pair `fetchPolicy` with `skip`, or
      // use the default cache-first policy) are untouched.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.name="useQuery"] > ObjectExpression:has(> Property[key.name="fetchPolicy"]):not(:has(> Property[key.name="skip"]))',
          message:
            'Use useAuthedListQuery — a raw useQuery list with a fetchPolicy and no skip gate breaks on the first-navigation auth race (PR #278).',
        },
      ],
    },
  },
];
