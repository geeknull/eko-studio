import 'dotenv/config';
import { run } from './index';

/**
 * Deterministic end-to-end smoke test for the eko agent integration.
 *
 * Drives run() — the same entry point the /api/agent route uses — with a
 * single-page, deterministic query and asserts the agent returns the expected
 * text. This is the one command to run after every eko upgrade to confirm the
 * planner + BrowserAgent + LLM wiring still works end to end.
 *
 * Requires a configured LLM (OPENROUTER_API_KEY in .env), network access, and a
 * Playwright browser (`pnpm init`). When no key is present it SKIPS cleanly
 * (exit 0) so it never fails in environments without credentials.
 *
 * Usage: pnpm test:e2e
 */
const EXPECTED = 'example domain';
const QUERY = 'Navigate to https://example.com and return the exact text of the main H1 heading on the page.';
const TIMEOUT_MS = 180_000;

async function main(): Promise<void> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('[e2e] SKIP: OPENROUTER_API_KEY not set — configure .env to run the agent e2e.');
    return;
  }

  console.log('[e2e] Running deterministic agent query against https://example.com ...');
  const timer = setTimeout(() => {
    console.error(`[e2e] FAIL: timed out after ${TIMEOUT_MS}ms`);
    process.exit(1);
  }, TIMEOUT_MS);
  timer.unref?.();

  const result = await run({
    query: QUERY,
    enableLog: false,
    callback: { onMessage: async () => {} },
  });
  clearTimeout(timer);

  const text = String(result?.result ?? '').toLowerCase();
  console.log('[e2e] Agent result:', JSON.stringify(result?.result ?? null));

  if (!text.includes(EXPECTED)) {
    console.error(`[e2e] FAIL: expected agent result to contain "${EXPECTED}".`);
    process.exit(1);
  }

  console.log('[e2e] PASS: agent returned the expected content.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[e2e] FAIL:', err?.message || err);
    process.exit(1);
  });
