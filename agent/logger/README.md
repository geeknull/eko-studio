# Agent Logger - Agent Log Recording and Replay Module

Independent log recording and replay functionality module, not coupled with business logic.

## Features

- ✅ Automatically record all messages during Agent execution
- ✅ Support replay according to original time differences
- ✅ Support fixed time interval replay
- ✅ Support speed control for replay (0.5x, 1x, 2x, etc.)
- ✅ Independent module design, easy to integrate
- ✅ Complete TypeScript type support

## Directory Structure

```
agent/logger/
├── AgentLogger.ts      # Log recorder
├── LogPlayer.ts        # Log player
├── types.ts            # Type definitions
├── index.ts            # Module entry point
├── README.md           # Documentation
└── examples/           # Usage examples
    ├── basic-usage.ts  # Basic usage
    └── replay.ts       # Replay example
```

## Log Format

### File Naming

```
eko-log-{timestamp}-YYYY_MM_DD_HH:MM:SS-{model-name}.log
```

Example: `eko-log-1700000000000-2025_11_23_10:30:45-openai_gpt-5-nano.log`

### File Content

Each message consists of two parts:
1. First line: `{count}-{timestamp}-{timeDiff in milliseconds from previous message}`
2. Lines 2~n: Message content in JSON format

Messages are separated by blank lines.

Example:

```
1-1700000000000-0
{
  "type": "agent_start",
  "data": {
    "query": "Hello"
  }
}

2-1700000001500-1500
{
  "type": "thinking",
  "data": {
    "content": "Let me help you..."
  }
}
```

## Usage

### 1. Basic Usage (Already integrated into agent/index.ts)

Logging functionality is already integrated into the `run` function in `agent/index.ts`, enabled by default:

```typescript
import { run } from './agent';

// Logging enabled by default
await run({
  query: 'Your question here',
});

// Disable logging
await run({
  query: 'Your question here',
  enableLog: false,
});
```

### 2. Standalone AgentLogger Usage

If you need to use logging functionality elsewhere:

```typescript
import { AgentLogger } from './agent/logger';

// Create logger
const logger = new AgentLogger({
  modelName: 'gpt-4',
  enabled: true,
});

// Log messages
await logger.log({ type: 'test', data: 'message' });
await logger.log({ type: 'result', data: 'done' });

// Get information
console.log('Log file:', logger.getLogFilePath());
console.log('Message count:', logger.getMessageCount());

// Close logger
await logger.close();
```

### 3. Log Replay

#### 3.1 Replay with Original Time Differences (realtime mode)

```typescript
import { LogPlayer } from './agent/logger';

const player = new LogPlayer({
  logFilePath: './agent-log/eko-log-1700000000000-2025_11_23_10:30:45-openai_gpt-5-nano.log',
  mode: 'realtime', // Use original time differences
  speed: 1.0,       // Normal speed
});

// Replay log
await player.replay(async (entry, index, total) => {
  console.log(`[${index + 1}/${total}] Count: ${entry.count}, TimeDiff: ${entry.timeDiff}ms`);
  console.log('Message:', entry.message);
});
```

#### 3.2 Replay with Fixed Intervals (fixed mode)

```typescript
const player = new LogPlayer({
  logFilePath: './agent-log/eko-log-xxx.log',
  mode: 'fixed',        // Use fixed time intervals
  fixedInterval: 1000,  // 1 second interval between messages
  speed: 1.0,
});

await player.replay(async (entry, index, total) => {
  console.log(`Playing message ${index + 1}/${total}`);
  console.log(entry.message);
});
```

#### 3.3 Speed Control Replay

```typescript
// 2x speed replay
const player = new LogPlayer({
  logFilePath: './agent-log/eko-log-xxx.log',
  mode: 'realtime',
  speed: 2.0, // 2x speed
});

// 0.5x speed replay (slow motion)
const slowPlayer = new LogPlayer({
  logFilePath: './agent-log/eko-log-xxx.log',
  mode: 'realtime',
  speed: 0.5, // 0.5x speed
});
```

### 4. View Log Summary

```typescript
const player = new LogPlayer({
  logFilePath: './agent-log/eko-log-xxx.log',
});

const summary = player.getLogSummary();
console.log('Log summary:', summary);
// Output:
// {
//   filePath: '...',
//   totalMessages: 25,
//   firstTimestamp: 1700000000000,
//   lastTimestamp: 1700000025000,
//   duration: 25000
// }
```

### 5. List All Log Files

```typescript
import { LogPlayer } from './agent/logger';

const logFiles = LogPlayer.listLogFiles('./agent-log');
console.log('All log files:', logFiles);
```

## API Documentation

### AgentLogger

#### Constructor

```typescript
new AgentLogger(options: LoggerOptions)
```

Parameters:
- `modelName`: Model name (required)
- `logDir`: Log directory, defaults to `{project root}/agent-log`
- `enabled`: Whether to enable logging, defaults to `true`

#### Methods

- `log(message: unknown): Promise<void>` - Log a message
- `close(): Promise<void>` - Close the logger
- `getLogFilePath(): string | null` - Get log file path
- `getMessageCount(): number` - Get count of logged messages
- `isEnabled(): boolean` - Check if logger is enabled

### LogPlayer

#### Constructor

```typescript
new LogPlayer(options: LogPlayerOptions)
```

Parameters:
- `logFilePath`: Log file path (required)
- `mode`: Replay mode, `'realtime'` or `'fixed'`, defaults to `'realtime'`
- `fixedInterval`: Fixed time interval (milliseconds), only effective when `mode='fixed'`, defaults to 1000ms
- `speed`: Playback speed multiplier, defaults to `1.0`

#### Methods

- `replay(callback: LogPlaybackCallback): Promise<void>` - Replay log
- `parseLogFile(): LogEntry[]` - Parse log file, return all entries
- `getLogSummary()` - Get log summary information
- `static listLogFiles(logDir: string): string[]` - List all log files (static method)

## Type Definitions

### LogEntry

```typescript
interface LogEntry {
  count: number;        // Message sequence number
  timestamp: number;    // Timestamp (milliseconds)
  timeDiff: number;     // Time difference from previous message (milliseconds)
  message: unknown;     // Original message content
}
```

### LogPlaybackCallback

```typescript
type LogPlaybackCallback = (
  entry: LogEntry,
  index: number,
  total: number
) => void | Promise<void>;
```

## Notes

1. Log files are automatically saved to the `agent-log` directory
2. The `agent-log` directory is added to `.gitignore` and won't be committed to git repository
3. Parsing and replaying large log files may take some time
4. Remember to call `logger.close()` to close the logger when finished

## Example Scenarios

### Scenario 1: Debug Agent Execution Process

Enable logging, run Agent, then replay to view detailed process:

```typescript
// 1. Run Agent (automatically logs)
const result = await run({ query: 'Your question' });

// 2. Replay to view process
const player = new LogPlayer({
  logFilePath: './agent-log/eko-log-xxx.log',
  mode: 'realtime',
});

await player.replay(async (entry) => {
  console.log('Message type:', entry.message.type);
  console.log('Time diff:', entry.timeDiff, 'ms');
});
```

### Scenario 2: Automated Testing

Use fixed interval for fast replay:

```typescript
const player = new LogPlayer({
  logFilePath: './agent-log/test-case-1.log',
  mode: 'fixed',
  fixedInterval: 100, // 100ms interval
});

await player.replay(async (entry) => {
  // Verify each message
  expect(entry.message).toBeDefined();
});
```

## SSE Replay Feature

Supports replaying logs via SSE streaming, useful for frontend debugging and demonstrations. See: [SSE_REPLAY.md](./SSE_REPLAY.md)

Quick usage:

```bash
# 1. First run agent to generate logs
# 2. Replay via SSE
GET /api/agent/stream/{taskId}?mode=replay&speed=2.0
```

## More Documentation

- [Quick Start Guide](./QUICKSTART.md)
- [SSE Replay Feature](./SSE_REPLAY.md)
- [Implementation Details](./IMPLEMENTATION.md)

## License

MIT
