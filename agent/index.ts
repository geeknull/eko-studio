import { createRequire } from 'module';
import { Eko, Agent, Log, LLMs, StreamCallbackMessage } from '@eko-ai/eko';
import { AgentLogger } from './logger';
import type { NormalConfig } from '@/types';

export const runtime = 'nodejs';

// Polyfill: Inject global require in ESM environment
// Fix: @eko-ai/eko-nodejs -> puppeteer-extra-plugin -> require('merge-deep') issue
if (typeof globalThis.require === 'undefined') {
  globalThis.require = createRequire(import.meta.url);
}

const openrouterApiKey = process.env.OPENROUTER_API_KEY;
const openrouterBaseURL = process.env.OPENROUTER_BASE_URL;
console.log('openrouterApiKey', openrouterApiKey);
console.log('openrouterBaseURL', openrouterBaseURL);

// Default LLM configuration (fallback)
const defaultLLMs: LLMs = {
  default: {
    provider: 'openrouter',
    model: 'openai/gpt-5-nano',
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
    console.log('eko-message: ', JSON.stringify(message, null, 2));
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
    console.log('Using normalConfig LLMs:', llms);
  }
  else {
    console.log('Using default LLMs:', llms);
  }

  // Dynamically import BrowserAgent (executed after polyfill)
  const { BrowserAgent } = await import('@eko-ai/eko-nodejs');

  // Build agents configuration
  // Note: Use type assertion due to version mismatch between @eko-ai/eko and @eko-ai/eko-nodejs
  let agents: Agent[] = [new BrowserAgent() as unknown as Agent];
  if (normalConfig?.agents && normalConfig.agents.length > 0) {
    agents = [];
    if (normalConfig.agents.includes('BrowserAgent')) {
      agents.push(new BrowserAgent() as unknown as Agent);
    }
    console.log('Using normalConfig agents:', normalConfig.agents);
  }
  else {
    console.log('Using default agents: BrowserAgent');
  }

  // Initialize logger
  const logger = new AgentLogger({
    modelName: llms.default.model,
    enabled: enableLog,
  });

  // Wrap callback
  const wrappedCallback: Callback = {
    onMessage: async (message: StreamCallbackMessage) => {
      // Log first
      await logger.log(message);

      // Then call original callback
      await callback.onMessage(message);
    },
  };

  try {
    Log.setLevel(1);
    const eko = new Eko({ llms, agents, callback: wrappedCallback });
    const result = await eko.run(query);

    console.log('result: ', result.result);

    if (logger.isEnabled()) {
      console.log(`Log saved to: ${logger.getLogFilePath()}`);
      console.log(`Total messages: ${logger.getMessageCount()}`);
    }

    return result;
  }
  finally {
    await logger.close();
  }
}
