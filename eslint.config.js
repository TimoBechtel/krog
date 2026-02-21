import coreConfig from '@timobechtel/style/eslint/core.js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...coreConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
);
