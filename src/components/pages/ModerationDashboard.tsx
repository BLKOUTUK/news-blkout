import React, { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Download, Edit2, Save, X as XIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { API_ENDPOINTS } from '@/config/api';

const PAGE_SIZE = 15;

interface QueueItem {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  content: string;
  category: string;
  ingested_at: string;
  author: string;
  votes: number;
}

type Mark = 'approve' | 'reject';

const ModerationDashboard: React.FC = () => {
  const [articles, setArticles] = useState<QueueItem[]>([]);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<QueueItem>>({});

  useEffect(() => {
    fetchReviewQueue();
  }, []);

  const fetchReviewQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('id, title, source_url, excerpt, content, category, created_at, author, total_votes')
        .eq('status', 'review')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setArticles(
        (data || []).map((a) => ({
          id: a.id,
          title: a.title,
          url: a.source_url || '',
          excerpt: a.excerpt || '',
          content: a.content || '',
          category: a.category,
          ingested_at: a.created_at,
          author: a.author,
          votes: a.total_votes || 0,
        }))
      );
    } catch (error) {
      console.error('Error fetching review queue:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tick a checkbox. Approve and Reject are mutually exclusive; ticking the
  // active mark again clears it (story stays in review, untouched).
  const toggleMark = (id: string, kind: Mark) => {
    setMarks((prev) => {
      const next = { ...prev };
      if (next[id] === kind) delete next[id];
      else next[id] = kind;
      return next;
    });
  };

  // Send one moderation action through IVOR Core. Returns a result, never throws.
  const moderateOne = async (
    action: 'approve' | 'reject' | 'edit',
    id: string,
    edits?: Partial<QueueItem>
  ): Promise<{ id: string; ok: boolean; error: string | null }> => {
    try {
      const res = await fetch(API_ENDPOINTS.NEWS_MODERATE(id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, edits }),
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        return { id, ok: false, error: `${res.status} — non-JSON response: ${text.slice(0, 60)}` };
      }
      if (!res.ok || json?.success === false) {
        return { id, ok: false, error: json?.error || json?.message || `API ${res.status}` };
      }
      return { id, ok: true, error: null };
    } catch (error: any) {
      return { id, ok: false, error: error.message || 'Request failed' };
    }
  };

  // Apply every ticked row in one batch — the moderator waits once, not per story.
  const applyMarked = async () => {
    const entries = Object.entries(marks) as [string, Mark][];
    if (entries.length === 0) return;

    setApplying(true);
    setSummary(null);

    const results = await Promise.all(entries.map(([id, action]) => moderateOne(action, id)));

    const okIds = new Set(results.filter((r) => r.ok).map((r) => r.id));
    const approved = entries.filter(([id, a]) => okIds.has(id) && a === 'approve').length;
    const rejected = entries.filter(([id, a]) => okIds.has(id) && a === 'reject').length;
    const failed = results.filter((r) => !r.ok);

    // Drop applied rows; leave failures and unmarked rows in place.
    setArticles((prev) => prev.filter((a) => !okIds.has(a.id)));
    setMarks((prev) => {
      const next = { ...prev };
      okIds.forEach((id) => delete next[id]);
      return next;
    });

    let msg = `${approved} published · ${rejected} rejected`;
    if (failed.length) {
      msg += ` · ${failed.length} failed (${failed[0].error})`;
      console.error('Moderation failures:', failed);
    }
    setSummary(msg);
    setApplying(false);
  };

  const startEdit = (item: QueueItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      category: item.category,
      url: item.url,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (item: QueueItem) => {
    const result = await moderateOne('edit', item.id, editForm);
    if (result.ok) {
      setArticles((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, ...editForm } : a))
      );
      setEditingId(null);
      setEditForm({});
    } else {
      alert(`Edit failed: ${result.error}`);
    }
  };

  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages - 1);
  const pageItems = articles.slice(pageClamped * PAGE_SIZE, pageClamped * PAGE_SIZE + PAGE_SIZE);
  const markedCount = Object.keys(marks).length;

  return (
    <div className="min-h-screen bg-liberation-black-power p-6 pb-28">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-liberation-gold-divine mb-1">
              Moderation Queue
            </h1>
            <p className="text-gray-400">
              {loading ? 'Loading…' : `${articles.length} stories awaiting review`}
            </p>
          </div>
          <a
            href="/blkout-moderator-tools-v2.2.2-fixed.zip"
            download="blkout-moderator-tools-v2.2.2-fixed.zip"
            className="flex items-center gap-2 px-4 py-2 bg-liberation-gold-divine text-black font-semibold rounded-md hover:bg-liberation-sovereignty-gold transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Extension v2.2.2
          </a>
        </div>

        {summary && (
          <div className="mb-4 p-3 bg-liberation-gold-divine/10 border border-liberation-gold-divine/30 rounded-md text-sm text-liberation-gold-divine">
            {summary}
          </div>
        )}

        {/* Queue */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-liberation-gold-divine animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Queue clear — nothing awaiting review.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {pageItems.map((item) => {
                const mark = marks[item.id];
                return (
                  <div
                    key={item.id}
                    className={`bg-gray-900 border rounded-lg p-4 transition-colors ${
                      mark === 'approve'
                        ? 'border-green-500/60'
                        : mark === 'reject'
                        ? 'border-red-500/50'
                        : 'border-gray-800'
                    }`}
                  >
                    {editingId === item.id ? (
                      // Edit mode
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="Title"
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-liberation-gold-divine focus:outline-none"
                        />
                        <textarea
                          value={editForm.excerpt || ''}
                          onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                          placeholder="Excerpt"
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-liberation-gold-divine focus:outline-none"
                        />
                        <textarea
                          value={editForm.content || ''}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                          placeholder="Content"
                          rows={5}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-liberation-gold-divine focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={editForm.category || ''}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-liberation-gold-divine focus:outline-none"
                          >
                            {['liberation', 'community', 'politics', 'culture', 'economics', 'health', 'technology', 'opinion', 'analysis'].map((c) => (
                              <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
                            ))}
                          </select>
                          <input
                            type="url"
                            value={editForm.url || ''}
                            onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                            placeholder="Source URL"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-liberation-gold-divine focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors inline-flex items-center gap-1.5 text-sm"
                          >
                            <XIcon className="w-4 h-4" /> Cancel
                          </button>
                          <button
                            onClick={() => saveEdit(item)}
                            className="px-3 py-1.5 bg-liberation-gold-divine text-black rounded-md hover:bg-liberation-sovereignty-gold transition-colors inline-flex items-center gap-1.5 text-sm font-semibold"
                          >
                            <Save className="w-4 h-4" /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Triage mode
                      <div className="flex items-start gap-4">
                        {/* Approve / Reject checkboxes */}
                        <div className="flex flex-col gap-2 pt-0.5 shrink-0">
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-green-400 select-none">
                            <input
                              type="checkbox"
                              checked={mark === 'approve'}
                              onChange={() => toggleMark(item.id, 'approve')}
                              className="w-4 h-4 accent-green-500"
                            />
                            Approve
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-red-400 select-none">
                            <input
                              type="checkbox"
                              checked={mark === 'reject'}
                              onChange={() => toggleMark(item.id, 'reject')}
                              className="w-4 h-4 accent-red-500"
                            />
                            Reject
                          </label>
                        </div>

                        {/* Article */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-800 text-gray-300 capitalize">
                              {item.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.ingested_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white leading-snug">{item.title}</h3>
                          {item.excerpt && (
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.excerpt}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-liberation-gold-divine hover:underline"
                              >
                                View source <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <button
                              onClick={() => startEdit(item)}
                              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pager */}
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-400">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={pageClamped === 0}
                className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {pageClamped + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageClamped >= totalPages - 1}
                className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sticky Apply bar */}
      {!loading && articles.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-sm text-gray-400">
              {markedCount} marked ({Object.values(marks).filter((m) => m === 'approve').length} approve ·{' '}
              {Object.values(marks).filter((m) => m === 'reject').length} reject)
            </span>
            <button
              onClick={applyMarked}
              disabled={markedCount === 0 || applying}
              className="px-6 py-2.5 bg-liberation-gold-divine text-black font-semibold rounded-md hover:bg-liberation-sovereignty-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              {applying && <Loader2 className="w-4 h-4 animate-spin" />}
              {applying ? 'Applying…' : `Apply ${markedCount > 0 ? `(${markedCount})` : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationDashboard;
