'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Note } from '@/lib/types';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface NoteEditorProps {
  id: string;
}

export default function NoteEditor({ id }: NoteEditorProps) {
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  useEffect(() => {
    let cancelled = false;

    async function fetchNote() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/notes/${id}`);
        
        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Failed to load note');
        }

        if (!cancelled) {
          setNote(json.data);
          setTitle(json.data.title);
          setContent(json.data.content);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load note');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchNote();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    setError('');
    try {
      const res = await fetch(`/api/notes/edit/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save note');

      setIsEditing(false);
      setNote({ ...note!, title, content }); // update local state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const res = await fetch(`/api/notes/delete/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete note');
      }
      router.push('/notes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const renderMarkdown = (md: string) => {
    const purifiedmd = DOMPurify.sanitize(md);
    return marked.parse(purifiedmd, {async: false});
  };

  if (loading) return <div className="text-center p-12">Loading note…</div>;

  if (error || !note)
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Note not found'}
        </div>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          {isEditing ? 'Edit Note' : 'View Note'}
        </h1>
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
                onClick={() => {
                  setTitle(note.title);
                  setContent(note.content);
                  setIsEditing(false);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

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
            <h2 className="text-3xl font-bold mb-4">{note.title}</h2>
            <div
              className="text-gray-600 mb-6"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
            />
            <div className="text-sm text-gray-500 border-t pt-4">
              <p>Created: {new Date(note.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
