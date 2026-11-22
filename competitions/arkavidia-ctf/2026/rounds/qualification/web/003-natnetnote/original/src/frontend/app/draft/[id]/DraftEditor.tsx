'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Announcement } from '@/lib/types';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface DraftEditorProps {
  id: string;
}

export default function DraftEditor({ id }: DraftEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchDraft() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/drafts/${id}`);

        if (res.status === 401) {
          router.replace('/login');
          return;
        } else if (res.status === 403) {
          router.replace('/announcements');
          return;
        }

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Failed to load draft');
        }

        if (!cancelled) {
          setDraft(json.data);
          setTitle(json.data.title);
          setContent(json.data.content);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load draft');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDraft();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const handleSave = async () => {
    setError('');
    try {
      const res = await fetch(`/api/drafts/edit/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, isDraft: true }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save draft');

      setIsEditing(false);
      setDraft({ ...draft!, title, content });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this announcement?')) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/drafts/edit/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, isDraft: false }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to publish draft');

      router.push('/announcements');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish draft');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/announcements/delete/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete draft');
      }

      router.push('/drafts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (draft) {
      setTitle(draft.title);
      setContent(draft.content);
    }
    setIsEditing(false);
    setError('');
  };

  const renderMarkdown = (md: string) => {
    const purified = DOMPurify.sanitize(md);
    return marked.parse(purified, { async: false });
  };

  if (loading) return <div className="text-center p-12">Loading draft…</div>;

  if (error || !draft)
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Draft not found'}
        </div>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            {isEditing ? 'Edit Draft' : 'Draft Announcement'}
          </h1>
          <span className="inline-block px-3 py-1 text-sm font-semibold text-yellow-800 bg-yellow-100 rounded mt-2">
            DRAFT
          </span>
        </div>
        <div className="flex space-x-3">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Edit
              </button>
              <button
                onClick={handlePublish}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                Publish
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {isEditing ? (
          <div className="space-y-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border p-2 rounded"
              rows={10}
            />
          </div>
        ) : (
          <div>
            <h2 className="text-3xl font-bold mb-4">{draft.title}</h2>
            <div
              className="text-gray-600 mb-6"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.content) }}
            />
            <div className="text-sm text-gray-500 border-t pt-4">
              <p>Created: {new Date(draft.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
