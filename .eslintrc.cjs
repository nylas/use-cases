module.exports = {
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  extends: ['eslint:recommended', 'prettier', 'plugin:react/recommended'],
  rules: {
    'no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-empty-function': 0,
    'no-undef': 'error',
    camelcase: ['error', { properties: 'never', ignoreDestructuring: true }],
    'max-len': ['error', { code: 160 }],
  },
};
