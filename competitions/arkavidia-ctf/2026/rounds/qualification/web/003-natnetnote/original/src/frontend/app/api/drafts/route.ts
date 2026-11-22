import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';
import { Announcement, PaginatedResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = Number(pageParam);
    const limit = Number(limitParam);

    if ( !Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "page and limit must be positive integers" },
        { status: 400 }
      );
    }

    const data = await apiClient<PaginatedResponse<Announcement>>(`/announcement/drafts?page=${page}&limit=${limit}`, {
      method: 'GET',
    });

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch announcements' },
      { status: error instanceof Error ? error.message === 'forbidden' ? 403 : error.message === 'unauthorized' ? 401 : 400 : 400 }
    );
  }
}