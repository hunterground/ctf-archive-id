'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Announcement, PaginatedResponse } from '@/lib/types';
import { Pagination } from '@/components/Pagination';

export default function AnnouncementsClient() {
  const searchParams = useSearchParams();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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

    async function fetchAnnouncements() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `/api/announcements?page=${page}&limit=${limit}`,
          { method: 'GET' }
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || 'fetching announcements failed');
        }

        const data: PaginatedResponse<Announcement> = json.data;

        if (!cancelled) {
          setAnnouncements(data.data);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load announcements');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAnnouncements();

    return () => {
      cancelled = true;
    };
  }, [page, limit]);

  

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Announcements</h1>
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 text-lg">Loading announcements…</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {!loading && announcements.length === 0 && !error ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 text-lg">No announcements available.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md divide-y">
            {announcements.map((announcement) => (
              <Link
                key={announcement.id}
                href={`/announcement/${announcement.id}`}
                className="block p-6 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {announcement.title}
                  </h2>
                  <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/announcements"
          />
        </>
      )}
    </div>
  );
}
