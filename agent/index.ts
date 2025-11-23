import { BrowserAgent, FileAgent } from "@eko-ai/eko-nodejs";
import { Eko, Agent, Log, LLMs, StreamCallbackMessage } from "@eko-ai/eko";
import { AgentLogger } from "./logger";
export const runtime = 'nodejs';

const openrouterApiKey = process.env.OPENROUTER_API_KEY;
const openrouterBaseURL = process.env.OPENROUTER_BASE_URL;
console.log('openrouterApiKey', openrouterApiKey);
console.log('openrouterBaseURL', openrouterBaseURL);

const llms: LLMs = {
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
  [key: string]: unknown; // Allow additional external parameters
}) {
  const { 
    callback = _callback, 
    query = _query, 
    enableLog = true,
    ...externalParams 
  } = options || {};
  
  console.log('agent:llms', llms);
  
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
    const agents: Agent[] = [new BrowserAgent(), new FileAgent()];
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
