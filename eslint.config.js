// @ts-check
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', '.astro/', '.vercel/', 'node_modules/', 'prototypes/', 'public/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    languageOptions: {
      // __NOINDEX__ is replaced at build time (see astro.config.mjs).
      globals: { ...globals.browser, ...globals.node, __NOINDEX__: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  {
    // Type-aware checks for unsafe values and unhandled promises in TypeScript sources.
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    // The skill notes overlap; focusing a note (tabindex="0") brings it to the front so keyboard
    // users can read it. Allow that on <article> in this component only.
    files: ['src/components/home/SkillNotes.astro'],
    rules: { 'astro/jsx-a11y/no-noninteractive-tabindex': ['error', { tags: ['article'] }] },
  },
  prettier,
);
