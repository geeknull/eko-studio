/**
 * Tiny gated logger for app code.
 *
 * Verbose levels (log/info/debug) only emit in development or when an explicit
 * debug flag is set, so production builds stay quiet; warn/error always emit.
 * Works on both server and client — Next.js inlines NODE_ENV and NEXT_PUBLIC_*
 * into client bundles, while the server sees the full process.env.
 *
 * Enable verbose logging in production with `DEBUG=1` (server) or
 * `NEXT_PUBLIC_DEBUG=1` (client).
 *
 * Note: standalone CLI scripts (agent-test.ts, agent-e2e.ts) intentionally use
 * console directly — their output is the program's result, not app logging.
 */
const verbose
  = process.env.NODE_ENV !== 'production'
    || process.env.DEBUG === '1'
    || process.env.NEXT_PUBLIC_DEBUG === '1';

type LogArgs = unknown[];

export const logger = {
  log: (...args: LogArgs): void => {
    if (verbose) console.log(...args);
  },
  info: (...args: LogArgs): void => {
    if (verbose) console.info(...args);
  },
  debug: (...args: LogArgs): void => {
    if (verbose) console.debug(...args);
  },
  warn: (...args: LogArgs): void => {
    console.warn(...args);
  },
  error: (...args: LogArgs): void => {
    console.error(...args);
  },
};
