# Agent Logger Implementation Documentation

## Implementation Overview

This document details the implementation of the Agent log recording and replay functionality.

## Functional Requirements

Based on user requirements, implement the following features:

1. ✅ Record callback logs when the agent's run method is called
2. ✅ Store logs in the `agent-log` directory at the root, added to `.gitignore`
3. ✅ File naming format: `eko-log-{timestamp}-YYYY_MM_DD_HH:MM:SS-{model-name}.log` (`-` used only to separate content)
4. ✅ File content format: `{count}-{timestamp}-{milliseconds diff from previous message}\n{JSON message}\n\n`
5. ✅ Implement log reading and replay functionality
6. ✅ Support both time-diff and fixed-interval replay modes
7. ✅ Independent functionality, not coupled with business logic

## Architecture Design

### Module Structure

```
agent/logger/
├── types.ts              # Type definitions
├── AgentLogger.ts        # Logger (core class)
├── LogPlayer.ts          # Log player (core class)
├── index.ts              # Module export entry
├── README.md             # Detailed documentation
├── QUICKSTART.md         # Quick start guide
├── IMPLEMENTATION.md     # This document
└── examples/             # Usage examples
    ├── basic-usage.ts    # Basic usage
    ├── replay.ts         # Replay example
    └── full-test.ts      # Complete test
```

### Core Class Design

#### 1. AgentLogger (Log Recorder)

**Responsibilities**: Record all messages during agent execution

**Main Methods**:
- `constructor(options)` - Initialize logger
- `log(message)` - Log a message
- `close()` - Close the logger
- `getLogFilePath()` - Get log file path
- `getMessageCount()` - Get message count
- `isEnabled()` - Check if enabled

**Implementation Details**:
- Uses `fs.WriteStream` for file writing, better performance
- Automatically creates log directory if it doesn't exist
- File name includes timestamp and model name
- Supports enable/disable functionality
- Uses `finally` to ensure proper resource cleanup

#### 2. LogPlayer (Log Player)

**Responsibilities**: Parse and replay recorded logs

**Main Methods**:
- `constructor(options)` - Initialize player
- `parseLogFile()` - Parse log file
- `replay(callback)` - Replay log
- `getLogSummary()` - Get log summary
- `static listLogFiles(dir)` - List all log files

**Implementation Details**:
- Supports two replay modes: `realtime` (real time differences) and `fixed` (fixed intervals)
- Supports speed control (speed parameter)
- Uses regular expressions to parse log format
- Error tolerance: skip invalid log entries

### Data Flow

```
Agent.run()
    ↓
wrappedCallback
    ↓
AgentLogger.log() → Write to file
    ↓
agent-log/eko-log-xxx.log
    ↓
LogPlayer.parseLogFile() → Read file
    ↓
LogPlayer.replay() → Replay by time
```

## Integration Method

### Integration in agent/index.ts

Uses **decorator pattern** to wrap the original callback:

```typescript
// 1. Create logger
const logger = new AgentLogger({
  modelName: llms.default.model,
  enabled: enableLog,
});

// 2. Wrap callback
const wrappedCallback: Callback = {
  onMessage: async (message: StreamCallbackMessage) => {
    await logger.log(message);        // Log first
    await callback.onMessage(message); // Then call original callback
  },
};

// 3. Use wrapped callback
const eko = new Eko({ llms, agents, callback: wrappedCallback });

// 4. Ensure closure
try {
  // ... run agent
} finally {
  await logger.close();
}
```

**Advantages**:
- Doesn't modify existing business logic
- Can easily enable/disable
- Minimal impact on existing code

## File Format Design

### Log File Name

```
eko-log-{timestamp}-{YYYY_MM_DD_HH:MM:SS}-{model}.log
```

Components:
- `eko-log-`: Fixed prefix
- `{timestamp}`: Unix timestamp (milliseconds), used for sorting
- `{YYYY_MM_DD_HH:MM:SS}`: Human-readable time
- `{model}`: Model name (special characters replaced with underscores)
- `.log`: File extension
- `-`: Only used to separate different content parts

Example:
```
eko-log-1732348245000-2025_11_23_10:30:45-openai_gpt-5-nano.log
```

### Log Content Format

```
{count}-{timestamp}-{timeDiff}
{JSON message}

{count}-{timestamp}-{timeDiff}
{JSON message}

...
```

Features:
- First line: Metadata (sequence-timestamp-time difference)
- Lines 2~n: Message in JSON format (using JSON.stringify(msg, null, 2) for formatting)
- Messages separated by blank lines
- Simple to parse
- Human-readable

Example:
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

## Replay Algorithm

### Realtime Mode

```typescript
for (let i = 0; i < entries.length; i++) {
  const entry = entries[i];
  
  // Execute callback
  await callback(entry, i, total);
  
  // Wait (using next message's timeDiff)
  if (i < entries.length - 1) {
    const delay = entries[i + 1].timeDiff / speed;
    await sleep(delay);
  }
}
```

Features:
- Restores real time intervals
- Supports speed control
- Suitable for debugging and demonstrations

### Fixed Mode

```typescript
for (let i = 0; i < entries.length; i++) {
  const entry = entries[i];
  
  // Execute callback
  await callback(entry, i, total);
  
  // Fixed interval wait
  if (i < entries.length - 1) {
    const delay = fixedInterval / speed;
    await sleep(delay);
  }
}
```

Features:
- Fixed time intervals
- Quickly browse logs
- Suitable for testing

## Performance Considerations

### Write Performance

- Uses `fs.WriteStream` instead of synchronous writes
- Avoids frequent file open/close operations
- Only formats JSON when needed

### Read Performance

- Reads entire file at once (suitable for most scenarios)
- Could consider adding streaming reads (for very large files)
- Uses simple string splitting, avoids complex regex

### Memory Usage

- Current implementation loads all log entries into memory
- For very large log files, consider:
  - Stream parsing
  - Batch reading
  - Index files

## Extensibility

### Possible Future Extensions

1. **Compression Support**
   - Automatically compress old log files
   - Support reading compressed files

2. **Log Indexing**
   - Create index files for faster searching
   - Support filtering by message type

3. **Visualization Tools**
   - Web interface for viewing logs
   - Timeline display
   - Message type statistics

4. **Export Functionality**
   - Export to JSON
   - Export to CSV
   - Generate Markdown reports

5. **Streaming Replay**
   - Support SSE streaming
   - Real-time replay to web interface

6. **Log Analysis**
   - Statistics on message type counts
   - Analyze performance bottlenecks
   - Generate visual reports

## Testing Recommendations

### Unit Tests

```typescript
describe('AgentLogger', () => {
  it('should create log file', () => { /* ... */ });
  it('should log messages', () => { /* ... */ });
  it('should calculate time diff correctly', () => { /* ... */ });
  it('should close properly', () => { /* ... */ });
});

describe('LogPlayer', () => {
  it('should parse log file', () => { /* ... */ });
  it('should replay with correct timing', () => { /* ... */ });
  it('should support speed control', () => { /* ... */ });
  it('should list log files', () => { /* ... */ });
});
```

### Integration Tests

```typescript
describe('Agent with Logger', () => {
  it('should log messages during run', () => { /* ... */ });
  it('should replay logged messages', () => { /* ... */ });
  it('should handle errors gracefully', () => { /* ... */ });
});
```

## Security Considerations

1. **File Path Security**
   - Use `path.join()` to avoid path injection
   - Validate log directory location

2. **File Permissions**
   - Log files should have appropriate permissions
   - Avoid sensitive information leakage

3. **Disk Space**
   - Monitor log directory size
   - Implement log rotation strategy

4. **Sensitive Data**
   - Consider adding masking functionality
   - Configurable whether to record sensitive fields

## Dependencies

### Runtime Dependencies
- Node.js native `fs` module
- Node.js native `path` module

### Development Dependencies
- TypeScript
- tsx (for running examples)

### Zero External Dependencies
- No third-party npm packages
- Keeps it lightweight
- Easy to maintain

## Summary

This implementation follows these principles:

1. ✅ **Independence**: Completely independent module, not coupled with business
2. ✅ **Simplicity**: Core code is clean and understandable
3. ✅ **Extensibility**: Easy to add new features
4. ✅ **High Performance**: Uses stream writing, excellent performance
5. ✅ **Usability**: Provides friendly API and rich examples
6. ✅ **Complete Documentation**: Includes README, QUICKSTART, and this document
7. ✅ **Type Safety**: Complete TypeScript type support

## Changelog

- **2025-11-23**: Initial implementation
  - Completed AgentLogger and LogPlayer
  - Integrated into agent/index.ts
  - Added complete documentation and examples
  - Added to .gitignore
