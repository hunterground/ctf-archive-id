'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Announcement, PaginatedResponse } from '@/lib/types';
import { Pagination } from '@/components/Pagination';

export default function DraftsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [drafts, setDrafts] = useState<Announcement[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setPage(parseInt(searchParams.get('page') || '1', 10));
    setLimit(parseInt(searchParams.get('limit') || '10', 10));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function fetchDrafts() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(
          `/api/drafts?page=${page}&limit=${limit}`
        );

        const json = await res.json();

        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        if (res.status === 403) {
          router.replace('/');
          return;
        }

        if (!res.ok) {
          throw new Error(json.error || 'fetching drafts failed');
        }

        const data: PaginatedResponse<Announcement> = json.data;

        if (!cancelled) {
          setDrafts(data.data);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load drafts');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDrafts();
    return () => {
      cancelled = true;
    };
  }, [page, limit, router]);

  if (loading) {
    return <div className="text-center p-12">Loading drafts…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Draft Announcements
        </h1>
        <Link
          href="/announcement/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
        >
          Create Announcement
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {drafts.length === 0 && !error ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">
            No draft announcements.
          </p>
          <Link
            href="/announcement/create"
            className="text-blue-600 hover:text-blue-800"
          >
            Create your first announcement
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md divide-y">
            {drafts.map((draft) => (
              <Link
                key={draft.id}
                href={`/draft/${draft.id}`}
                className="block p-6 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{draft.title}</h2>
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                      DRAFT
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(draft.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/drafts"
          />
        </>
      )}
    </div>
  );
}
