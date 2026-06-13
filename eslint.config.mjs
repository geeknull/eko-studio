import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import stylistic from '@stylistic/eslint-plugin';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      ...stylistic.configs['recommended'].rules,
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
    },
  },
  {
    // Electron main/preload and Node build scripts are an untyped boundary:
    // dynamic/optional require(), stringly-typed IPC channel payloads, and the
    // dynamically loaded electron-updater have no static types. Relax these two
    // rules here only — the Next app under src/ stays fully typed.
    files: ['electron/**/*.{ts,tsx}', 'scripts/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Vendored components copied in by shadcn/ui & AI Elements CLIs — owned but
    // not authored by us; they follow upstream formatting, and re-running the
    // CLI would overwrite any lint fixes. Treated like node_modules for lint.
    'src/components/ui/**',
    'src/components/ai-elements/**',
  ]),
]);

export default eslintConfig;
