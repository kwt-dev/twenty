module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/**/*'],
  rules: {
    'no-unused-vars': 'off',
    'no-undef': 'off',
    // Prevent proliferation of metadata stubs
    'no-restricted-syntax': [
      'error',
      {
        selector: "VariableDeclaration > VariableDeclarator[id.name=/.*METADATA.*STUB$/]",
        message: "Creating new metadata stubs is restricted. Use existing TRIB_MESSAGE_OBJECT_METADATA_STUB or create shared SDK. See ADR-001 for guidance."
      }
    ]
  },
};