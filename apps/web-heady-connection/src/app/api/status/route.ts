import { NextResponse } from 'next/server';
import { mcpClient } from '../../../lib/mcp';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = mcpClient.getState();
    const services = state?.services || [];
    
    return NextResponse.json({
      status: 'online',
      services,
      version: mcpClient.getVersion(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
        status: 'error', 
        message: String(error) 
    }, { status: 500 });
  }
}
