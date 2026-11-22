import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const data = await apiClient(
      '/report',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    const response = NextResponse.json(
      { success: true, data },
      { status: 200 }
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 401 }
    );
  }
}