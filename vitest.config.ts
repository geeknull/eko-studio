import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Unit test config. Picks up `src/**\/*.test.ts` only — the agent e2e
 * (src/agent/agent-e2e.ts) is intentionally NOT a *.test.ts file and is run
 * separately via `pnpm test:e2e` (tsx), since it needs an LLM key + network.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist-electron', '.next', 'release'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
