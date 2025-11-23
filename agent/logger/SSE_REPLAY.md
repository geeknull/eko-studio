# SSE Replay Feature Documentation

## Feature Overview

The SSE replay feature allows you to replay recorded Agent logs via SSE streaming without running the real Agent each time. This is very useful for debugging, demonstrations, and testing.

## Use Cases

1. **Frontend Development Debugging**: Quickly test frontend UI without waiting for real Agent execution
2. **Feature Demonstration**: Quickly showcase complete Agent execution flow
3. **Stress Testing**: Test SSE connection stability under high message volume
4. **Debug Retrospection**: Reproduce previous Agent execution processes

## Architecture Design

### Code Organization

The replay feature uses **decoupled design** with separation of concerns:

```
app/api/agent/stream/
├── [taskId]/
│   └── route.ts              # Main route (unified entry point)
└── handlers/
    ├── runHandler.ts         # Agent execution handler
    └── replayHandler.ts      # Log replay handler
```

**Advantages**:
- ✅ Single responsibility: Execution and replay logic completely separated
- ✅ Easy to maintain: Each handler focuses only on its own functionality
- ✅ Easy to test: Can independently test each handler
- ✅ Easy to extend: Adding new features doesn't affect existing code

## API Interface

### Endpoint

```
GET /api/agent/stream/{taskId}
```

**Description**: Unified SSE streaming endpoint, mode distinguished by `mode` parameter

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | string | `'run'` | Execution mode: `'run'` (real execution) or `'replay'` (replay) |
| `logFile` | string | latest log | Specify log file name to replay (filename only, no full path needed) |
| `playbackMode` | string | `'realtime'` | Replay mode: `'realtime'` (real time differences) or `'fixed'` (fixed intervals) |
| `speed` | number | `1.0` | Playback speed multiplier (realtime mode only) |
| `fixedInterval` | number | `1000` | Fixed interval in milliseconds (fixed mode only) |

## Usage Examples

### 1. Real Execution (Default Behavior)

```typescript
// Create task
const response = await fetch('/api/agent/start?query=Your question');
const { data } = await response.json();
const taskId = data.taskId;

// Connect SSE stream (real execution)
const eventSource = new EventSource(`/api/agent/stream/${taskId}`);
```

### 2. Replay Latest Log (Real Time, Normal Speed)

```typescript
// Connect SSE stream, use replay mode
const eventSource = new EventSource(
  `/api/agent/stream/${taskId}?mode=replay`
);

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Message:', data.content);
  
  // Replay mode has additional replay metadata
  if (data.replay) {
    console.log('Replay progress:', data.replay.progress);
    console.log('Original time diff:', data.replay.timeDiff, 'ms');
  }
});
```

### 3. Replay Specified Log (2x Speed)

```typescript
const logFileName = 'eko-log-1763903523666-2025_11_23_21_12_03-openai_gpt-5-nano.log';

const eventSource = new EventSource(
  `/api/agent/stream/${taskId}?mode=replay&logFile=${logFileName}&speed=2.0`
);
```

### 4. Fixed Interval Replay (500ms interval)

```typescript
const eventSource = new EventSource(
  `/api/agent/stream/${taskId}?mode=replay&playbackMode=fixed&fixedInterval=500`
);
```

### 5. Fast Replay (10x Speed)

```typescript
const eventSource = new EventSource(
  `/api/agent/stream/${taskId}?mode=replay&speed=10.0`
);
```

### 6. Slow Replay (0.5x Speed, for demos)

```typescript
const eventSource = new EventSource(
  `/api/agent/stream/${taskId}?mode=replay&speed=0.5`
);
```

## SSE Message Format

### Connection Message

```json
{
  "taskId": "xxx",
  "status": "connected",
  "mode": "replay"
}
```

### Replay Info Message (Replay mode only)

```json
{
  "time": "2025-11-23T21:30:45.123Z",
  "timestamp": 1763903445123,
  "content": {
    "type": "replay_info",
    "data": {
      "totalMessages": 150,
      "duration": 45000,
      "mode": "realtime",
      "speed": 2.0
    }
  }
}
```

### Regular Message

```json
{
  "time": "2025-11-23T21:30:45.123Z",
  "timestamp": 1763903445123,
  "content": {
    "type": "agent_start",
    "data": { ... }
  },
  "replay": {
    "count": 1,
    "originalTimestamp": 1763903445000,
    "timeDiff": 0,
    "progress": "1/150"
  }
}
```

**Description**:
- `content`: Original Agent message content
- `replay` (replay mode only): Replay-related metadata
  - `count`: Message sequence number
  - `originalTimestamp`: Original timestamp when recorded
  - `timeDiff`: Time difference from previous message
  - `progress`: Replay progress

### Completion Message

```json
{
  "taskId": "xxx",
  "status": "completed",
  "message": "Log replay completed",
  "mode": "replay"
}
```

### Error Message

```json
{
  "taskId": "xxx",
  "status": "error",
  "error": "No available log file found",
  "mode": "replay"
}
```

## Complete Example

### React Component Example

```typescript
import { useEffect, useState } from 'react';

function AgentReplay() {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [replayInfo, setReplayInfo] = useState(null);

  useEffect(() => {
    // Create task (can be any query, as replay mode won't actually execute)
    fetch('/api/agent/start?query=mock')
      .then(res => res.json())
      .then(({ data }) => {
        const taskId = data.taskId;
        
        // Connect SSE, use replay mode
        const eventSource = new EventSource(
          `/api/agent/stream/${taskId}?mode=replay&speed=2.0`
        );

        eventSource.addEventListener('connected', (event) => {
          const data = JSON.parse(event.data);
          console.log('Connected:', data);
          setIsConnected(true);
        });

        eventSource.addEventListener('message', (event) => {
          const data = JSON.parse(event.data);
          
          // Check if it's replay info
          if (data.content?.type === 'replay_info') {
            setReplayInfo(data.content.data);
          } else {
            // Add to message list
            setMessages(prev => [...prev, data]);
          }
        });

        eventSource.addEventListener('completed', (event) => {
          const data = JSON.parse(event.data);
          console.log('Replay completed:', data);
          eventSource.close();
        });

        eventSource.addEventListener('error', (event) => {
          console.error('Error:', event);
          eventSource.close();
        });

        return () => eventSource.close();
      });
  }, []);

  return (
    <div>
      <h1>Agent Replay</h1>
      
      {isConnected && <div>✅ Connected</div>}
      
      {replayInfo && (
        <div>
          <h2>Replay Info</h2>
          <p>Total messages: {replayInfo.totalMessages}</p>
          <p>Total duration: {(replayInfo.duration / 1000).toFixed(2)} seconds</p>
          <p>Playback speed: {replayInfo.speed}x</p>
        </div>
      )}
      
      <div>
        <h2>Message List ({messages.length})</h2>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.replay?.progress || index + 1}</strong>
            <pre>{JSON.stringify(msg.content, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Testing Methods

### Method 1: Using Browser

1. First run real Agent once to generate log file
2. Open developer tools in browser
3. Execute the following code:

```javascript
// 1. Create task
fetch('/api/agent/start?query=mock')
  .then(res => res.json())
  .then(({ data }) => {
    const taskId = data.taskId;
    
    // 2. Connect SSE replay
    const eventSource = new EventSource(
      `/api/agent/stream/${taskId}?mode=replay&speed=5.0`
    );
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
    };
    
    eventSource.addEventListener('completed', () => {
      console.log('✅ Replay completed');
      eventSource.close();
    });
  });
```

### Method 2: Using curl

```bash
# 1. Create task
TASK_ID=$(curl -s 'http://localhost:3000/api/agent/start?query=mock' | jq -r '.data.taskId')

# 2. Replay latest log
curl -N "http://localhost:3000/api/agent/stream/${TASK_ID}?mode=replay&speed=10"
```

## Notes

1. **Log file must exist**: Replay mode requires available log files in the `agent-log` directory
2. **taskId still required**: Although in replay mode, still need to create task to get taskId
3. **query parameter can be anything**: In replay mode, query parameter is not used, can pass any value
4. **Speed control**:
   - `speed=0.5`: Slow motion (suitable for demos)
   - `speed=1.0`: Normal speed (default)
   - `speed=2.0`: 2x speed
   - `speed=10.0`: 10x speed (quick debugging)
5. **Fixed interval mode**: If log file is very large, use `fixed` mode + small interval for quick browsing

## Error Handling

### Common Errors

1. **Log file not found**
   ```json
   {
     "error": "No available log file found",
     "mode": "replay"
   }
   ```
   **Solution**: Ensure there are log files in the `agent-log` directory, or run real Agent once first

2. **Specified log file does not exist**
   ```json
   {
     "error": "ENOENT: no such file or directory",
     "mode": "replay"
   }
   ```
   **Solution**: Check if `logFile` parameter is correct and if the filename exists

3. **Log file format error**
   ```json
   {
     "error": "Unable to parse log file",
     "mode": "replay"
   }
   ```
   **Solution**: Ensure log file hasn't been manually modified and format is correct

## Best Practices

1. **Development Debugging**: Use `speed=5.0` or `speed=10.0` for quick testing
2. **Feature Demonstration**: Use `speed=0.5` or `speed=1.0` to showcase complete flow
3. **Stress Testing**: Use `fixedInterval=10` to rapidly send large amounts of messages
4. **UI Testing**: Use replay mode to test rendering of various message types

## Related Documentation

- [Agent Logger Complete Documentation](./README.md)
- [Quick Start Guide](./QUICKSTART.md)
- [Implementation Details](./IMPLEMENTATION.md)
