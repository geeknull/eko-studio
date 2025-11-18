import { NextResponse } from 'next/server';
import { agentStart, validateQuery } from '@/app/api/agent/service';
import type { AgentStartResponse } from '@/app/api/agent/types';

/**
 * Agent Start API endpoint
 * GET /api/agent/start?query=your_question
 * GET /api/agent/start?q=your_question
 * POST /api/agent/start with JSON body
 * 
 * Starts an agent task and returns a task ID for SSE streaming
 */

/**
 * Common logic to process agent start request
 */
async function processAgentStart(
  query: string,
  params?: Record<string, unknown>
): Promise<Response> {
  // Validate query content (allow empty string)
  if (query && query.trim().length > 0) {
    const validation = validateQuery(query);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          timestamp: new Date().toISOString(),
        } as AgentStartResponse,
        { status: 400 }
      );
    }
  }
  
  // Start agent task and get task ID (use empty string if query is not provided)
  const result = await agentStart(query || '', params);
  
  return NextResponse.json(
    {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    } as AgentStartResponse,
    { status: 200 }
  );
}

/**
 * Common error response handler
 */
function errorResponse(error: unknown, method: string): Response {
  console.error(`Agent Start API Error (${method}):`, error);
  
  return NextResponse.json(
    {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    } as AgentStartResponse,
    { status: 500 }
  );
}

/**
 * Handle GET requests to start an agent task
 * Usage: GET /api/agent/start?query=your_question
 * Or: GET /api/agent/start?q=your_question
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Support both 'query' and 'q' as aliases, default to empty string if not provided
    const query = searchParams.get('query') || searchParams.get('q') || '';
    
    // Extract other parameters from query string
    const params: Record<string, unknown> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'query' && key !== 'q') {
        params[key] = value;
      }
    });
    
    return await processAgentStart(query, Object.keys(params).length > 0 ? params : undefined);
  } catch (error) {
    return errorResponse(error, 'GET');
  }
}

/**
 * Handle POST requests to start an agent task
 * Usage: POST /api/agent/start with JSON body { "query": "your question" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Use empty string as default if query is not provided
    const query = body.query || '';
    
    // Extract external parameters (everything except query)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { query: _, ...params } = body;
    
    return await processAgentStart(query, params);
  } catch (error) {
    return errorResponse(error, 'POST');
  }
}

