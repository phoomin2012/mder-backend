module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'standard',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'never',
      exports: 'never',
      functions: 'never',
    }],
  },
}
