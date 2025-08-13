import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import unusedImports from 'eslint-plugin-unused-imports';
import destructuring from 'eslint-plugin-destructuring';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // Unicorn recommended rules
  unicorn.configs['recommended'],

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        // Enable type-aware linting without listing tsconfig files explicitly (TS-ESLint v8)
        projectService: true,
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
      'destructuring': destructuring
    },
    rules: {
      // TypeScript rules
      ...tseslint.configs.recommended.rules,
      "max-params": ["error", 5],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': ['error', { ignoreIIFE: true }],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
       // Disallow object destructuring so we don't lose property refs
      'prefer-destructuring': ['error', {
        'object': false
      }],    
      'destructuring/in-params': ['error', { 'max-params': 0 }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/typedef': [
        'off',
        {
          'variableDeclaration': true,
          'parameter': true,
          'arrowParameter': true,
          'propertyDeclaration': true,
          'memberVariableDeclaration': true
        }
      ],
      '@typescript-eslint/no-explicit-any': ['error'],
      '@typescript-eslint/no-require-imports': ['error'],
      '@typescript-eslint/consistent-type-imports': ['error'],

      // React hooks rules
      ...reactHooks.configs.recommended.rules,

      // React refresh rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Unicorn rules customization
      'unicorn/prevent-abbreviations': 'off', // Allow common abbreviations like 'props', 'ref', etc.
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            camelCase: true,
            pascalCase: true,
          },
          ignore: [/vite-env\.d\.ts$/], // Allow vite-env.d.ts
        },
      ],
      // General rules continue...
      'unicorn/no-nested-ternary': 'off', // Allow nested ternary (conflicts with Prettier)
      'no-redeclare': 'off', // TypeScript handles this better
    },
  },

  // Test files configuration
  {
    files: ['**/*.test.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.browser,
      },
    },
  },

  // Config files configuration (Playwright, Vite, etc.)
  {
    files: ['*.config.{ts,js}', '**/*.config.{ts,js}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      parserOptions: {
        // Remove allowDefaultProject customization to avoid parser issues
        projectService: true,
      },
    },
  },

  {
    ignores: [
      'dist/**',
      'dist-mocked/**',
      'node_modules/**',
      '.eslintrc.cjs',
      'test/reports/**',
      'steering/**',
      'scripts/**',
    ],
  },
];
