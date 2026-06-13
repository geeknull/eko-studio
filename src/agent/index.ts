import { createRequire } from 'module';
import { Eko, Agent, Log, LLMs, StreamCallbackMessage } from '@eko-ai/eko';
import { AgentLogger } from './logger';
import { logger } from '@/utils/logger';
import type { NormalConfig } from '@/types';

export const runtime = 'nodejs';

// Polyfill: Inject global require in ESM environment
// Fix: @eko-ai/eko-nodejs -> puppeteer-extra-plugin -> require('merge-deep') issue
if (typeof globalThis.require === 'undefined') {
  globalThis.require = createRequire(import.meta.url);
}

/**
 * Get Playwright Chromium executable path for Electron environment
 * In production Electron, Chromium is bundled in resources/playwright-browsers
 */
function getPlaywrightExecutablePath(): string | undefined {
  // Check if running in Electron production environment
  const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (chromiumPath) {
    logger.log('[Agent] Using custom Chromium path:', chromiumPath);
    return chromiumPath;
  }

  // Development or non-Electron: let Playwright find browser automatically
  return undefined;
}

const openrouterApiKey = process.env.OPENROUTER_API_KEY;
const openrouterBaseURL = process.env.OPENROUTER_BASE_URL;
// Model is configurable via env; defaults to a cheap vision+tools model for testing
const openrouterModel = process.env.OPENROUTER_MODEL || 'openai/gpt-5-nano';
// Do NOT log the API key itself — only whether it is present
logger.log('[Agent] OpenRouter configured:', {
  hasApiKey: Boolean(openrouterApiKey),
  baseURL: openrouterBaseURL,
  model: openrouterModel,
});

// Default LLM configuration (fallback)
const defaultLLMs: LLMs = {
  default: {
    provider: 'openrouter',
    model: openrouterModel,
    apiKey: openrouterApiKey || '',
    config: {
      baseURL: openrouterBaseURL,
    },
  },
};

/**
 * Callback type for handling stream messages
 */
type Callback = {
  onMessage: (message: StreamCallbackMessage) => Promise<void>
};

const _callback: Callback = {
  onMessage: async (message: StreamCallbackMessage) => {
    logger.log('eko-message: ', JSON.stringify(message, null, 2));
  },
};
const _query = 'Summarize the single most important news story of today.';

/**
 * Raw mode: Run agent directly in the current process
 */
export async function run(options?: {
  query?: string
  callback?: Callback
  enableLog?: boolean
  normalConfig?: NormalConfig
  [key: string]: unknown
}) {
  const {
    callback = _callback,
    query = _query,
    enableLog = true,
    normalConfig,
  } = options || {};

  // Build LLMs configuration
  let llms: LLMs = defaultLLMs;
  if (normalConfig?.llm) {
    llms = {
      default: {
        provider: normalConfig.llm.provider as LLMs['default']['provider'],
        model: normalConfig.llm.model,
        apiKey: normalConfig.llm.apiKey,
        config: normalConfig.llm.config || {},
      },
    };
  }
  // Log the resolved LLM config WITHOUT leaking the API key
  logger.log('[Agent] LLM:', {
    source: normalConfig?.llm ? 'normalConfig' : 'default',
    provider: llms.default.provider,
    model: llms.default.model,
    hasApiKey: Boolean(llms.default.apiKey),
  });

  // Dynamically import BrowserAgent (executed after polyfill)
  const { BrowserAgent } = await import('@eko-ai/eko-nodejs');

  // Get Chromium executable path for Electron environment
  const executablePath = getPlaywrightExecutablePath();

  // BrowserAgent's constructor takes no args; executablePath (Electron prod) is
  // applied via setOptions(), which flows into chromium.launch({ ...options }).
  // Since both @eko-ai/eko and @eko-ai/eko-nodejs are pinned to 4.1.3, BrowserAgent
  // is assignable to the core Agent type directly — no cast needed.
  const createBrowserAgent = (): Agent => {
    const browserAgent = new BrowserAgent();
    if (executablePath) {
      browserAgent.setOptions({ executablePath });
    }
    return browserAgent;
  };

  // Build agents configuration
  let agents: Agent[] = [createBrowserAgent()];
  if (normalConfig?.agents && normalConfig.agents.length > 0) {
    agents = [];
    if (normalConfig.agents.includes('BrowserAgent')) {
      agents.push(createBrowserAgent());
    }
    logger.log('Using normalConfig agents:', normalConfig.agents);
  }
  else {
    logger.log('Using default agents: BrowserAgent');
  }

  // Initialize the file logger (records the agent's stream messages to disk).
  // Named `agentLogger` to avoid clashing with the imported console `logger`.
  const agentLogger = new AgentLogger({
    modelName: llms.default.model,
    enabled: enableLog,
  });

  // Wrap callback
  const wrappedCallback: Callback = {
    onMessage: async (message: StreamCallbackMessage) => {
      // Log first
      await agentLogger.log(message);

      // Then call original callback
      await callback.onMessage(message);
    },
  };

  try {
    Log.setLevel(1);
    const eko = new Eko({ llms, agents, callback: wrappedCallback });
    const result = await eko.run(query);

    logger.log('result: ', result.result);

    if (agentLogger.isEnabled()) {
      logger.log(`Log saved to: ${agentLogger.getLogFilePath()}`);
      logger.log(`Total messages: ${agentLogger.getMessageCount()}`);
    }

    return result;
  }
  finally {
    await agentLogger.close();
  }
}
