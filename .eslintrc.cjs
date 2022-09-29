const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  root: true,
  env: {
    node: true,
    es2021: true,
    browser: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module',
    // ESLint: Parsing error: resolve...(找不到 babel 的配置文件)
    requireConfigFile: false,
    babelOptions: {
      // ESLint: Parsing error: This experimental syntax requires enabling one of the following parser plugin(s): 'jsx, flow, typescript'
      presets: ['@babel/preset-react'],
    },
  },
  rules: {},
  overrides: [
    {
      files: ['playground/**'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
      },
    },
  ],
});
