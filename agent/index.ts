import { BrowserAgent, FileAgent } from "@eko-ai/eko-nodejs";
import { Eko, Agent, Log, LLMs, StreamCallbackMessage } from "@eko-ai/eko";

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
  [key: string]: unknown; // Allow additional external parameters
}) {
  const { callback = _callback, query = _query, ...externalParams } = options || {};
  console.log('agent:llms', llms);
  
  // Log external parameters if provided
  if (Object.keys(externalParams).length > 0) {
    console.log('External parameters:', externalParams);
  }
  
  Log.setLevel(1);
  const agents: Agent[] = [new BrowserAgent(), new FileAgent()];
  const eko = new Eko({ llms, agents, callback });
  const result = await eko.run(query);
  
  console.log("result: ", result.result);
  
  return result;
}
