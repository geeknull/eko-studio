import { NextResponse } from 'next/server';

/**
 * Health check API endpoint
 * GET /api/health
 * 
 * Returns the application health status including:
 * - Status code
 * - Timestamp
 * - Application status
 * - Environment information
 */
export async function GET() {
  try {
    // Get current timestamp
    const timestamp = new Date().toISOString();
    
    // Check process uptime (in seconds)
    const uptime = process.uptime();
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryInfo = {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
    };
    
    // Build health check response
    const healthCheck = {
      status: 'ok',
      timestamp,
      uptime: `${Math.floor(uptime / 60)} minutes`,
      environment: process.env.NODE_ENV || 'development',
      memory: memoryInfo,
      nodeVersion: process.version,
    };
    
    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    // Return error status if an error occurs
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

