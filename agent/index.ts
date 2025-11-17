import dotenv from "dotenv";
import { BrowserAgent, FileAgent } from "@eko-ai/eko-nodejs";
import { Eko, Agent, Log, LLMs, StreamCallbackMessage } from "@eko-ai/eko";

dotenv.config();

const openrouterApiKey = process.env.OPENROUTER_API_KEY;
const openrouterBaseURL = process.env.OPENROUTER_BASE_URL;

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

export async function run(options?: { query?: string; callback?: Callback }) {
  const { callback = _callback, query = _query } = options || {};
  Log.setLevel(1);
  const agents: Agent[] = [new BrowserAgent(), new FileAgent()];
  const eko = new Eko({ llms, agents, callback });
  const result = await eko.run(query);
  
  console.log("result: ", result.result);
}

// Only run if executed directly via command line (e.g., npx tsx agent/index.ts)
// Not run when imported as a module
// Extract filename from import.meta.url and check if it matches process.argv[1]
const currentFileName = import.meta.url.split('/').pop() || '';
const isMainModule = process.argv[1]?.endsWith(currentFileName);
if (isMainModule) {
  run().catch((e) => {
    console.log(e);
  });
}