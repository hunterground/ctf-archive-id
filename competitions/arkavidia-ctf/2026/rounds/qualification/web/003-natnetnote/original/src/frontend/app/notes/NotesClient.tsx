'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Note, PaginatedResponse } from '@/lib/types';
import { Pagination } from '@/components/Pagination';

export default function NotesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [notes, setNotes] = useState<Note[]>([]);
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

    async function fetchNotes() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/notes?page=${page}&limit=${limit}`);
        const json = await res.json();

        if (res.status === 401) {
          router.replace('/login');
          return;
        }

        if (!res.ok) {
          throw new Error(json.error || 'fetching notes failed');
        }

        const data: PaginatedResponse<Note> = json.data;

        if (!cancelled) {
          setNotes(data.data);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load notes');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchNotes();
    return () => {
      cancelled = true;
    };
  }, [page, limit, router]);

  if (loading) {
    return <div className="text-center p-12">Loading notes…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">My Notes</h1>
        <Link
          href="/note/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
        >
          Create Note
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {notes.length === 0 && !error ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">
            You don&apos;t have any notes yet.
          </p>
          <Link href="/note/create" className="text-blue-600 hover:text-blue-800">
            Create your first note
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/note/${note.id}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <h2 className="text-xl font-semibold mb-2 line-clamp-1">
                  {note.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/notes"
          />
        </>
      )}
    </div>
  );
}
