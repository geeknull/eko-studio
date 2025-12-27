# SSE Stream API Architecture Documentation

## Directory Structure

```
app/api/agent/stream/
├── [taskId]/
│   └── route.ts              # Main route (unified entry point)
├── handlers/
│   ├── runHandler.ts         # Agent execution handler
│   └── replayHandler.ts      # Log replay handler
└── README.md                 # This document
```

## Design Principles

### 1. Single Responsibility
Each module is responsible for only one function:
- **route.ts**: Parameter parsing, validation, route dispatching
- **runHandler.ts**: Real agent execution logic
- **replayHandler.ts**: Log replay logic

### 2. Decoupled Design
Execution and replay logic are completely separated and don't affect each other:
- Can independently modify execution logic
- Can independently modify replay logic
- Both interact through a unified interface

### 3. Easy to Test
Each handler can be tested independently:
```typescript
// Test run handler
await handleRun(mockController, encoder, {
  taskId: 'test-id',
  task: { query: 'test query' },
});

// Test replay handler
await handleReplay(mockController, encoder, {
  taskId: 'test-id',
  logFile: 'test.log',
  speed: 2.0,
});
```

### 4. Easy to Extend
Adding new features (like pause, seek, etc.) doesn't affect existing code

## Module Description

### route.ts (Main Route)

**Responsibilities**:
- Parse URL parameters
- Validate parameter validity
- Select handler based on mode
- Unified error handling
- Manage SSE connection lifecycle

**NOT Responsible For**:
- Specific business logic
- Agent execution details
- Log replay details

**Code Example**:
```typescript
// Clean routing logic
if (mode === 'replay') {
  await handleReplay(controller, encoder, options);
} else {
  await handleRun(controller, encoder, options);
}
```

### runHandler.ts (Execution Handler)

**Responsibilities**:
- Run real Agent
- Create SSE callback
- Send Agent messages to SSE stream
- Handle execution-related errors
- Update task status

**Interface**:
```typescript
interface RunHandlerOptions {
  taskId: string;
  task: {
    query: string;
    params?: Record<string, unknown>;
  };
}

async function handleRun(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  options: RunHandlerOptions
): Promise<void>
```

### replayHandler.ts (Replay Handler)

**Responsibilities**:
- Select log file
- Create LogPlayerSSEAdapter
- Send replay messages to SSE stream
- Handle replay-related errors
- Send replay metadata

**Interface**:
```typescript
interface ReplayHandlerOptions {
  taskId: string;
  logFile?: string | null;
  playbackMode?: string;
  speed?: number;
  fixedInterval?: number;
}

async function handleReplay(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  options: ReplayHandlerOptions
): Promise<void>
```

## Data Flow

### Run Mode (mode=run)

```
Client Request
    ↓
route.ts (parse parameters)
    ↓
runHandler.ts
    ↓
Agent.run()
    ↓
callback.onMessage()
    ↓
SSE Stream → Client
```

### Replay Mode (mode=replay)

```
Client Request
    ↓
route.ts (parse parameters, validate)
    ↓
replayHandler.ts
    ↓
LogPlayerSSEAdapter
    ↓
LogPlayer.replay()
    ↓
SSE Stream → Client
```

## Advantages

### 1. Code Clarity ⬆️
- Main route only ~150 lines
- Each handler ~100 lines
- Clear responsibilities, easy to understand

### 2. Maintainability ⬆️
- Modify execution logic: only change runHandler
- Modify replay logic: only change replayHandler
- Modify parameter validation: only change route

### 3. Testability ⬆️
- Each handler can be independently mocked and tested
- No need to start complete HTTP server
- Higher test coverage

### 4. Extensibility ⬆️
Adding new features is easy:
```
handlers/
├── runHandler.ts
├── replayHandler.ts
├── debugHandler.ts      # New: Debug mode
└── monitorHandler.ts    # New: Monitor mode
```

## Usage Examples

### Real Execution
```typescript
const es = new EventSource(
  `/api/agent/stream/${taskId}` // Default mode=run
);
```

### Replay Log
```typescript
const es = new EventSource(
  `/api/agent/stream/${taskId}?mode=replay&speed=2.0`
);
```

## Best Practices

### 1. Adding New Features
Create a new handler instead of modifying existing ones:
```typescript
// ✅ Good approach
export async function handleDebug(...) { }

// ❌ Not recommended
export async function handleRun(...) {
  if (debugMode) { /* debug logic */ }
  // execution logic
}
```

### 2. Error Handling
Handle business errors inside handlers, handle common errors in route.ts:
```typescript
// Inside handler
if (!logFile) {
  throw new Error('Log file not found');
}

// Unified handling in route.ts
catch (error) {
  controller.enqueue(formatSSEMessage('error', { ... }));
}
```

### 3. Parameter Validation
Validate common parameters in route.ts, validate business parameters in handlers:
```typescript
// route.ts - Common validation
if (speed < 0.1 || speed > 100) {
  return errorResponse(...);
}

// replayHandler.ts - Business validation
if (!fs.existsSync(logFilePath)) {
  throw new Error('Log file does not exist');
}
```

## Related Documentation

- [SSE Replay Feature Documentation](../../../agent/logger/SSE_REPLAY.md)
- [Agent Logger Documentation](../../../agent/logger/README.md)
