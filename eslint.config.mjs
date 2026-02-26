import nextConfig from 'eslint-config-next'
import prettierConfig from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  prettierConfig,
]

export default eslintConfig
