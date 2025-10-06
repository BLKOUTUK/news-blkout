import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Loader2, ExternalLink, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface QueueItem {
  id: string;
  title: string;
  url: string;
  excerpt: string;
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

  useEffect(() => {
    fetchQueueItems();
  }, [filter]);

  const fetchQueueItems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('moderation_queue')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQueueItems(data || []);
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
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject item');
      }

      alert('Article rejected');
      fetchQueueItems();
    } catch (error: any) {
      console.error('Error rejecting item:', error);
      alert(`Failed to reject item: ${error.message}`);
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

            {/* Chrome Extension Download */}
            <a
              href="https://blkout.vercel.app/extensions/blkout-news-curator-v1.0.1.zip"
              download="blkout-news-curator-v1.0.1.zip"
              className="flex items-center gap-2 px-4 py-2 bg-liberation-gold-divine text-black font-semibold rounded-md hover:bg-liberation-sovereignty-gold transition-colors"
            >
              <Download className="w-4 h-4" />
              Download News Curator
            </a>
          </div>

          {/* Extension Info Banner */}
          <div className="mt-4 p-4 bg-gray-800/50 border border-liberation-gold-divine/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-liberation-gold-divine/20 rounded-md">
                <Download className="w-5 h-5 text-liberation-gold-divine" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">News Curator Chrome Extension</h3>
                <p className="text-sm text-gray-400 mb-2">
                  Submit news articles directly from any webpage. Auto-extracts article data from news sites with intelligent content detection and content warning systems.
                </p>
                <a
                  href="https://blkout.vercel.app/extensions/blkout-news-curator-v1.0.1.zip"
                  download="blkout-news-curator-v1.0.1.zip"
                  className="text-sm text-liberation-gold-divine hover:underline inline-flex items-center gap-1"
                >
                  Download Extension v1.0.1 <ExternalLink className="w-3 h-3" />
                </a>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModerationDashboard;
