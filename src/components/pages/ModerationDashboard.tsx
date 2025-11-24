import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Loader2, ExternalLink, Download, Edit2, Save, X as XIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface QueueItem {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  content: string;
  category: string;
  status: string;
  type: string;
  submitted_at: string;
  submitted_by: string;
  votes: number;
}

const ModerationDashboard: React.FC = () => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<QueueItem>>({});

  useEffect(() => {
    fetchQueueItems();
  }, [filter]);

  const fetchQueueItems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('news_articles')
        .select('id, title, source_url, excerpt, content, category, status, published_at, author, total_votes')
        .order('created_at', { ascending: false });

      // Map filter to status field
      if (filter !== 'all') {
        const statusMap: Record<string, string> = {
          'pending': 'review',      // review status = pending moderation
          'approved': 'published',  // published status = approved
          'rejected': 'archived'    // archived status = rejected
        };
        query = query.eq('status', statusMap[filter]);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map news_articles to QueueItem format
      const mappedItems: QueueItem[] = (data || []).map(article => {
        // Map database status back to UI status
        let uiStatus = 'pending';
        if (article.status === 'published') uiStatus = 'approved';
        else if (article.status === 'archived') uiStatus = 'rejected';
        else if (article.status === 'review') uiStatus = 'pending';

        return {
          id: article.id,
          title: article.title,
          url: article.source_url || '',
          excerpt: article.excerpt || '',
          content: article.content || '',
          category: article.category,
          status: uiStatus,
          type: 'news',
          submitted_at: article.published_at || article.created_at,
          submitted_by: article.author,
          votes: article.total_votes || 0
        };
      });

      setQueueItems(mappedItems);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: QueueItem) => {
    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          itemId: item.id,
          item: item,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve item');
      }

      alert('Article approved and published!');
      fetchQueueItems();
    } catch (error: any) {
      console.error('Error approving item:', error);
      alert(`Failed to approve item: ${error.message}`);
    }
  };

  const handleReject = async (item: QueueItem) => {
    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          itemId: item.id,
          item: item,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject item');
      }

      alert('Article rejected and removed from queue');
      fetchQueueItems();
    } catch (error: any) {
      console.error('Error rejecting item:', error);
      alert(`Failed to reject item: ${error.message}`);
    }
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
    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'edit',
          itemId: item.id,
          item: item,
          edits: editForm,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save edits');
      }

      alert('Article updated successfully');
      setEditingId(null);
      setEditForm({});
      fetchQueueItems();
    } catch (error: any) {
      console.error('Error saving edits:', error);
      alert(`Failed to save edits: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-liberation-black-power p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-liberation-gold-divine mb-2">
                Moderation Dashboard
              </h1>
              <p className="text-gray-400">Review and approve community submissions</p>
            </div>

            {/* Chrome Extension Download - v2.2.1 (No Floating Button) */}
            <a
              href="/blkout-moderator-tools-v2.2.1-no-button.zip"
              download="blkout-moderator-tools-v2.2.1-no-button.zip"
              className="flex items-center gap-2 px-4 py-2 bg-liberation-gold-divine text-black font-semibold rounded-md hover:bg-liberation-sovereignty-gold transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Extension v2.2.1
            </a>
          </div>

          {/* Extension Info Banner - v2.2.1 */}
          <div className="mt-4 p-4 bg-gray-800/50 border border-liberation-gold-divine/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-liberation-gold-divine/20 rounded-md">
                <Download className="w-5 h-5 text-liberation-gold-divine" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">BLKOUT Moderator Tools Extension v2.2.1</h3>
                <p className="text-sm text-gray-400 mb-2">
                  <strong className="text-liberation-gold-divine">✨ UPDATED:</strong> Floating button removed. Use <kbd className="px-1 py-0.5 bg-black/30 rounded text-xs">Ctrl+Shift+M</kbd> instead!
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center text-xs text-gray-300">
                    <svg className="w-4 h-4 text-liberation-gold-divine mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Event-specific fields (date, location, capacity)
                  </div>
                  <div className="flex items-center text-xs text-gray-300">
                    <svg className="w-4 h-4 text-liberation-gold-divine mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Smart content type detection
                  </div>
                  <div className="flex items-center text-xs text-gray-300">
                    <svg className="w-4 h-4 text-liberation-gold-divine mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Intelligent API routing (news/events)
                  </div>
                  <div className="flex items-center text-xs text-gray-300">
                    <svg className="w-4 h-4 text-liberation-gold-divine mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Auto-extraction with content warnings
                  </div>
                </div>
                <a
                  href="/blkout-moderator-tools-v2.2.1-no-button.zip"
                  download="blkout-moderator-tools-v2.2.1-no-button.zip"
                  className="text-sm text-liberation-gold-divine hover:underline inline-flex items-center gap-1 font-medium"
                >
                  Download Extension v2.2.1 <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-xs text-gray-500 mt-2">
                  Installation: Extract ZIP → chrome://extensions → Enable Developer mode → Load unpacked
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md font-medium capitalize transition-colors ${
                filter === status
                  ? 'bg-liberation-gold-divine text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Queue Items */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-liberation-gold-divine animate-spin" />
          </div>
        ) : queueItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No items in {filter} queue</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queueItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-liberation-gold-divine/30 transition-colors"
              >
                {editingId === item.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-liberation-gold-divine focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Excerpt</label>
                      <textarea
                        value={editForm.excerpt || ''}
                        onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-liberation-gold-divine focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                      <textarea
                        value={editForm.content || ''}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-liberation-gold-divine focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                        <select
                          value={editForm.category || ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-liberation-gold-divine focus:outline-none"
                        >
                          <option value="liberation">Liberation</option>
                          <option value="community">Community</option>
                          <option value="politics">Politics</option>
                          <option value="culture">Culture</option>
                          <option value="economics">Economics</option>
                          <option value="health">Health</option>
                          <option value="technology">Technology</option>
                          <option value="opinion">Opinion</option>
                          <option value="analysis">Analysis</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Source URL</label>
                        <input
                          type="url"
                          value={editForm.url || ''}
                          onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:border-liberation-gold-divine focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
                      >
                        <XIcon className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(item)}
                        className="px-4 py-2 bg-liberation-gold-divine text-black rounded-md hover:bg-liberation-sovereignty-gold transition-colors inline-flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-md bg-liberation-gold-divine/20 text-liberation-gold-divine capitalize">
                          {item.type}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-800 text-gray-300 capitalize">
                          {item.category}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                          item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          item.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>

                      {item.excerpt && (
                        <p className="text-gray-400 mb-3 line-clamp-2">{item.excerpt}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Submitted: {new Date(item.submitted_at).toLocaleDateString()}</span>
                        <span>By: {item.submitted_by}</span>
                        {item.votes > 0 && <span>Votes: {item.votes}</span>}
                      </div>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-3 text-sm text-liberation-gold-divine hover:underline"
                        >
                          View Source <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {item.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-2 bg-blue-500/20 text-blue-500 rounded-md hover:bg-blue-500/30 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleApprove(item)}
                          className="p-2 bg-green-500/20 text-green-500 rounded-md hover:bg-green-500/30 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReject(item)}
                          className="p-2 bg-red-500/20 text-red-500 rounded-md hover:bg-red-500/30 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModerationDashboard;
