import { BrowserAgent, FileAgent } from "@eko-ai/eko-nodejs";
import { Eko, Agent, Log, LLMs, StreamCallbackMessage } from "@eko-ai/eko";
import { AgentLogger } from "./logger";
export const runtime = 'nodejs';

const openrouterApiKey = process.env.OPENROUTER_API_KEY;
const openrouterBaseURL = process.env.OPENROUTER_BASE_URL;
console.log('openrouterApiKey', openrouterApiKey);
console.log('openrouterBaseURL', openrouterBaseURL);

// Default LLM configuration (fallback)
const defaultLLMs: LLMs = {
  default: {
    provider: "openrouter",
    model: "openai/gpt-5-nano",
    // model: "anthropic/claude-sonnet-4.5",
    // model: "openai/gpt-5.1",
    apiKey: openrouterApiKey || "",
    config: {
      baseURL: openrouterBaseURL,
    },
  },
};

/**
 * Normal mode configuration from frontend
 */
export interface NormalConfig {
  llm: {
    provider: string;
    model: string;
    apiKey: string;
    config?: {
      baseURL?: string;
      temperature?: number;
      topP?: number;
      topK?: number;
      maxTokens?: number;
    };
  };
  agents: string[];
}
/**
 * Callback type for handling stream messages
 */
type Callback = {
  onMessage: (message: StreamCallbackMessage) => Promise<void>;
};

const _callback: Callback = {
  onMessage: async (message: StreamCallbackMessage) => {
    console.log("eko-message: ", JSON.stringify(message, null, 2));
  },
};
const _query = "Search for the latest news about Musk, summarize and save to the desktop as Musk.md";

export async function run(options?: { 
  query?: string; 
  callback?: Callback;
  enableLog?: boolean; // Whether to enable logging, default is true
  normalConfig?: NormalConfig; // Normal mode configuration
  [key: string]: unknown; // Allow additional external parameters
}) {
  const { 
    callback = _callback, 
    query = _query, 
    enableLog = true,
    normalConfig,
    ...externalParams 
  } = options || {};
  
  // Build LLMs configuration: use normalConfig if provided, otherwise use default
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
  } else {
    console.log('Using default LLMs:', llms);
  }
  
  // Build agents configuration
  let agents: Agent[] = [new BrowserAgent(), new FileAgent()]; // Default agents
  if (normalConfig?.agents && normalConfig.agents.length > 0) {
    agents = [];
    if (normalConfig.agents.includes('BrowserAgent')) {
      agents.push(new BrowserAgent());
    }
    if (normalConfig.agents.includes('FileAgent')) {
      agents.push(new FileAgent());
    }
    console.log('Using normalConfig agents:', normalConfig.agents);
  } else {
    console.log('Using default agents: BrowserAgent, FileAgent');
  }
  
  // Log external parameters if provided
  if (Object.keys(externalParams).length > 0) {
    console.log('External parameters:', externalParams);
  }
  
  // Initialize logger
  const logger = new AgentLogger({
    modelName: llms.default.model,
    enabled: enableLog,
  });
  
  // Wrap callback to add logging functionality
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
    
    console.log("result: ", result.result);
    
    // Output log file path
    if (logger.isEnabled()) {
      console.log(`Log saved to: ${logger.getLogFilePath()}`);
      console.log(`Total messages: ${logger.getMessageCount()}`);
    }
    
    return result;
  } finally {
    // Ensure logger is properly closed
    await logger.close();
  }
}
