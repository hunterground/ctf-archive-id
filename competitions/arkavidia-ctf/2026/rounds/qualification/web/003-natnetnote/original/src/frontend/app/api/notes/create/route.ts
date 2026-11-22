import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const data = await apiClient('/note/create', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create note' },
      { status: error instanceof Error ? error.message === 'forbidden' ? 403 : error.message === 'unauthorized' ? 401 : 400 : 400 }
    );
  }
}