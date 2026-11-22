import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';
import { cookies } from 'next/headers';

interface LoginResponse {
  token: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const data = await apiClient<LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    const cookieStore = await cookies();
    cookieStore.set('token', data.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 401 }
    );
  }
}