import { NextResponse } from 'next/server';
import { agentStart, validateQuery } from '../service';
import type { AgentStartResponse } from '../types';

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
async function processAgentStart(query: string): Promise<Response> {
  // Validate query content
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
  
  // Start agent task and get task ID
  const result = await agentStart(query);
  
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
    // Support both 'query' and 'q' as aliases
    const query = searchParams.get('query') || searchParams.get('q');
    // Validate query parameter
    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter is required (use "query" or "q")',
          timestamp: new Date().toISOString(),
        } as AgentStartResponse,
        { status: 400 }
      );
    }
    
    return await processAgentStart(query);
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
    
    // Validate request body
    if (!body.query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query field is required in request body',
          timestamp: new Date().toISOString(),
        } as AgentStartResponse,
        { status: 400 }
      );
    }
    
    return await processAgentStart(body.query);
  } catch (error) {
    return errorResponse(error, 'POST');
  }
}

