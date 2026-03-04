// Module declarations for pure JavaScript plug-ins
import eslintContainerbase from '@containerbase/eslint-plugin';
import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import * as importX from 'eslint-plugin-import-x';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPromise from 'eslint-plugin-promise';
import tsdoc from 'eslint-plugin-tsdoc';
import globals from 'globals';
import tseslint, { configs as tseslintConfigs } from 'typescript-eslint';

/*
 * Several plug-ins are not compatible with defineConfig yet:
 * https://github.com/typescript-eslint/typescript-eslint/issues/11543
 * https://github.com/un-ts/eslint-plugin-import-x/issues/421
 */
/* eslint-disable-next-line @typescript-eslint/no-deprecated */
export default tseslint.config(
  {
    files: ['**/*.{js,cjs,mjs,mts,ts}'],
  },
  {
    ignores: [
      '.cache',
      'coverage',
      'dist',
      'node_modules',
      '**/__fixtures__/*',
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  eslint.configs.recommended,
  tseslintConfigs.strictTypeChecked,
  tseslintConfigs.stylisticTypeChecked,
  eslintConfigPrettier,
  eslintPluginPromise.configs['flat/recommended'],
  eslintContainerbase.configs.all,
  {
    extends: [importX.flatConfigs.recommended, importX.flatConfigs.typescript],
    rules: {
      'import-x/default': 'error',
      'import-x/named': 'error',
      'import-x/namespace': 'error',
      'import-x/no-cycle': 'error',
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: ['*.config.mjs', '*.config.mts', '**/*.test.ts'],
        },
      ],
      'import-x/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
          },
        },
      ],
      'import-x/prefer-default-export': 'off',
    },

    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({ project: 'tsconfig.json' }),
      ],
    },
  },
  {
    plugins: { perfectionist },
    rules: {
      'perfectionist/sort-objects': ['error', { type: 'alphabetical' }],
    },
  },
  {
    files: ['**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
    plugins: { vitest },

    rules: {
      ...vitest.configs.recommended.rules,
    },

    settings: {
      vitest: {
        typecheck: true,
      },
    },
  },
  {
    plugins: {
      tsdoc,
    },
    rules: {
      'tsdoc/syntax': 'error',
    },
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'allow',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          disallowTypeAnnotations: false,
        },
      ],

      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          format: ['PascalCase'],
          selector: 'enumMember',
        },
      ],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        {
          allowInterfaces: 'with-single-extends',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_$',
          caughtErrorsIgnorePattern: '^_$',
          ignoreRestSiblings: true,
          vars: 'all',
          varsIgnorePattern: '^_$',
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowBoolean: true,
          allowNumber: true,
        },
      ],
      '@typescript-eslint/unbound-method': [
        'error',
        {
          ignoreStatic: true,
        },
      ],
      curly: ['error', 'all'],
      eqeqeq: 'error',
      'no-console': 'error',
      'no-negated-condition': 'error',
      'no-param-reassign': 'error',
      'no-template-curly-in-string': 'error',
      'object-shorthand': [
        'error',
        'always',
        {
          avoidQuotes: true,
        },
      ],
      'require-await': 'error',
      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],
    },
  },
);
