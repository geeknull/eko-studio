# Agent Logger Quick Start Guide

## Install Dependencies

First, make sure tsx is installed (for running TypeScript examples):

```bash
pnpm install
```

## 1. Simplest Usage

Agent Logger is already integrated into `agent/index.ts` and enabled by default. You just need to use the agent normally:

```typescript
import { run } from './agent';

// Run agent, logs will be automatically recorded
const result = await run({
  query: 'Your question',
});

// Log files will be saved in the agent-log directory
```

## 2. Run Examples

### 2.1 Basic Usage Example

Demonstrates how to use AgentLogger independently:

```bash
pnpm run logger:basic
```

Or

```bash
npx tsx agent/logger/examples/basic-usage.ts
```

### 2.2 Replay Example

Demonstrates how to replay recorded logs:

```bash
pnpm run logger:replay
```

Or

```bash
npx tsx agent/logger/examples/replay.ts
```

### 2.3 Complete Test

Run complete test flow (recording + replay):

```bash
pnpm run logger:test
```

Or

```bash
npx tsx agent/logger/examples/full-test.ts
```

## 3. Log Files

### Location

Log files are saved in the `agent-log` folder in the project root directory.

### Naming Format

```
eko-log-{timestamp}-YYYY_MM_DD_HH:MM:SS-{model-name}.log
```

Example:
```
eko-log-1732348245000-2025_11_23_10:30:45-openai_gpt-5-nano.log
```

### Content Format

```
1-1732348245000-0
{
  "type": "agent_start",
  "data": {
    "query": "Hello"
  }
}

2-1732348245500-500
{
  "type": "thinking",
  "data": {
    "content": "Processing..."
  }
}
```

Each message includes:
- Line 1: `{sequence}-{timestamp}-{milliseconds diff from previous message}`
- Lines 2~n: Message content in JSON format
- Messages separated by blank lines

## 4. Common Usage

### 4.1 Disable Logging

```typescript
const result = await run({
  query: 'Your question',
  enableLog: false, // Disable logging
});
```

### 4.2 Real-time Replay

```typescript
import { LogPlayer } from './agent/logger';

const player = new LogPlayer({
  logFilePath: './agent-log/eko-log-xxx.log',
  mode: 'realtime',  // Replay according to original time differences
  speed: 1.0,        // Normal speed
});

await player.replay(async (entry) => {
  console.log(entry.message);
});
```

### 4.3 Fast Replay (2x speed)

```typescript
const player = new LogPlayer({
  logFilePath: './agent-log/eko-log-xxx.log',
  mode: 'realtime',
  speed: 2.0,  // 2x speed
});

await player.replay(async (entry) => {
  console.log(entry.message);
});
```

### 4.4 Fixed Interval Replay

```typescript
const player = new LogPlayer({
  logFilePath: './agent-log/eko-log-xxx.log',
  mode: 'fixed',       // Fixed interval mode
  fixedInterval: 500,  // 500ms interval between messages
});

await player.replay(async (entry) => {
  console.log(entry.message);
});
```

### 4.5 View Log Summary

```typescript
import { LogPlayer } from './agent/logger';

const player = new LogPlayer({
  logFilePath: './agent-log/eko-log-xxx.log',
});

const summary = player.getLogSummary();
console.log('Total messages:', summary.totalMessages);
console.log('Total duration:', summary.duration / 1000, 'seconds');
```

### 4.6 List All Log Files

```typescript
import { LogPlayer } from './agent/logger';

const logFiles = LogPlayer.listLogFiles('./agent-log');
console.log('Log files:', logFiles);
```

## 5. Practical Application Scenarios

### Scenario 1: Debug Agent Behavior

```typescript
// 1. Run agent and record logs
const result = await run({ query: 'Test question' });

// 2. Replay to view detailed process
const player = new LogPlayer({
  logFilePath: './agent-log/latest-log-file.log',
  mode: 'realtime',
  speed: 1.0,
});

await player.replay(async (entry) => {
  console.log(`[${entry.count}] ${entry.message.type}`, entry.message.data);
});
```

### Scenario 2: Performance Analysis

```typescript
const player = new LogPlayer({
  logFilePath: './agent-log/xxx.log',
});

const entries = player.parseLogFile();

// Analyze time taken for each step
entries.forEach((entry, index) => {
  if (index > 0) {
    console.log(`Step ${entry.count} took: ${entry.timeDiff}ms`);
  }
});
```

### Scenario 3: Automated Testing

```typescript
// Fast replay to verify results
const player = new LogPlayer({
  logFilePath: './agent-log/test-case.log',
  mode: 'fixed',
  fixedInterval: 10, // 10ms fast replay
});

await player.replay(async (entry) => {
  // Verify each message
  expect(entry.message).toBeDefined();
  if (entry.message.type === 'tool_result') {
    expect(entry.message.data.result).toBeDefined();
  }
});
```

## 6. Notes

1. **Log files won't be committed to Git**: The `agent-log` directory is added to `.gitignore`
2. **Remember to close Logger**: Automatically handled in `agent/index.ts` using `finally` to ensure closure
3. **Large files**: Parsing large log files may take some time
4. **Concurrency safety**: Each run creates a new log file, no conflicts

## 7. More Information

For detailed documentation, see: [README.md](./README.md)

## 8. Troubleshooting

### Issue 1: Log file not found

**Solution**: Check if the `agent-log` directory exists, ensure the agent has run at least once.

### Issue 2: Error during replay

**Solution**: Confirm log file format is correct and hasn't been manually modified.

### Issue 3: tsx command not found

**Solution**: Run `pnpm install` to install dependencies.

### Issue 4: Log file too large

**Solution**: You can periodically clean up old log files, or use `mode: 'fixed'` with a small `fixedInterval` to quickly browse.
