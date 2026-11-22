'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Announcement } from '@/lib/types';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface AnnouncementClientProps {
  id: string;
}

export default function AnnouncementClient({ id }: AnnouncementClientProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnnouncement() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/announcements/${id}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Failed to load announcement');
        }

        if (!cancelled) {
          setAnnouncement(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load announcement');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAnnouncement();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const renderMarkdown = (md: string) => {
    const purified = DOMPurify.sanitize(md);
    return marked.parse(purified, { async: false });
  };

  if (loading) {
    return <div className="text-center p-12">Loading announcement…</div>;
  }

  if (error || !announcement) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error || 'Announcement not found'}
        </div>
        <Link href="/announcements" className="text-blue-600 hover:text-blue-800">
          ← Back to announcements
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/announcements"
        className="text-blue-600 hover:text-blue-800 mb-6 inline-block"
      >
        ← Back to announcements
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{announcement.title}</h1>
        <div className="text-sm text-gray-500 mb-6 pb-6 border-b">
          <p>Published: {new Date(announcement.createdAt).toLocaleString()}</p>
        </div>
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed" 
          dangerouslySetInnerHTML={{ __html: renderMarkdown(announcement.content) }}
        />
      </div>
    </div>
  );
}
