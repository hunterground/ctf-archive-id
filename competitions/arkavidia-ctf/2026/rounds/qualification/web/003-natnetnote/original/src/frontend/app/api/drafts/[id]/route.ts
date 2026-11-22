import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const data = await apiClient('/announcement/draft', {
      method: 'POST',
      body: JSON.stringify({id: parseInt(id, 10)}),
    });

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch draft' },
      { status: error instanceof Error ? error.message === 'forbidden' ? 403 : error.message === 'unauthorized' ? 401 : 400 : 400 }
    );
  }
}