import 'dotenv/config';
import { run } from './index';

console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY);
console.log('OPENROUTER_BASE_URL:', process.env.OPENROUTER_BASE_URL);

const start = async () => {
  await run({
    query: 'Summarize the single most important news story of today.',
  });
  console.log('Agent test completed');
};

start();
