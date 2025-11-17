# Agent API

Agent API provides endpoints for starting agent tasks and streaming results via SSE.

## Endpoints

### GET/POST /api/agent/start

Start an agent task and get a task ID for SSE streaming.

**GET Parameters:**
- `query` or `q` (required): The question to ask (both are aliases)

**POST Request Body:**
```json
{
  "query": "your question"
}
```

**Examples:**
```bash
# Using GET with 'query' parameter
curl "http://localhost:3000/api/agent/start?query=what%20is%20AI"

# Using GET with 'q' parameter (alias)
curl "http://localhost:3000/api/agent/start?q=what%20is%20AI"

# Using POST
curl -X POST http://localhost:3000/api/agent/start \
  -H "Content-Type: application/json" \
  -d '{"query": "what is AI"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taskId": "550e8400-e29b-41d4-a716-446655440000",
    "query": "what is AI",
    "sseUrl": "/api/agent/stream/550e8400-e29b-41d4-a716-446655440000"
  },
  "timestamp": "2025-11-15T10:30:00.000Z"
}
```

## Error Handling

When a request fails, the API returns an error response:

```json
{
  "success": false,
  "error": "Query parameter is required",
  "timestamp": "2025-11-15T10:30:00.000Z"
}
```

**Common Errors:**
- `400 Bad Request`: Missing required parameters or invalid parameters
- `500 Internal Server Error`: Internal server error

## File Structure

```
app/api/agent/
├── start/
│   └── route.ts  # Agent start endpoint
├── service.ts    # Business logic
├── types.ts      # TypeScript type definitions
└── README.md     # API documentation
```

## TODO

- [ ] Implement actual Agent logic
- [ ] Integrate LLM API (OpenAI/Claude/etc)
- [ ] Add streaming response support
- [ ] Add session management
- [ ] Add rate limiting
- [ ] Add authentication

