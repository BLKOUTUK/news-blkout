/**
 * For You News Feed Component
 * Personalized news recommendations with liberation weighting
 *
 * Liberation Feature: Centers Black queer voices and stories
 */

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Loader2, Newspaper, ChevronRight, BookOpen } from 'lucide-react';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  category?: string;
  author?: string;
  published_at?: string;
  created_at?: string;
  liberation_score?: number;
  cover_image?: string;
}

interface ForYouNewsFeedProps {
  userId?: string;
  onArticleClick?: (articleId: string) => void;
  limit?: number;
  showDigest?: boolean;
}

export function ForYouNewsFeed({
  userId,
  onArticleClick,
  limit = 10,
  showDigest = false
}: ForYouNewsFeedProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [digest, setDigest] = useState<any>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = showDigest
        ? `${IVOR_API}/api/discover/news/digest`
        : `${IVOR_API}/api/discover/news/for-you?limit=${limit}${userId ? `&userId=${userId}` : ''}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        if (showDigest) {
          setDigest(data.digest);
          setArticles(data.digest?.articles || []);
        } else {
          setArticles(data.articles || []);
        }
      } else {
        setError(data.error || 'Failed to load recommendations');
      }
    } catch (err: any) {
      console.error('[ForYouNewsFeed] Fetch error:', err);
      setError('Unable to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [userId, limit, showDigest]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Track view interactions
  const trackView = async (articleId: string) => {
    try {
      await fetch(`${IVOR_API}/api/discover/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contentType: 'news',
          contentId: articleId,
          interactionType: 'view',
          source: showDigest ? 'digest' : 'for-you-feed'
        })
      });
    } catch (err) {
      // Silent fail
    }
  };

  const handleArticleClick = (article: Article) => {
    trackView(article.id);
    if (onArticleClick) {
      onArticleClick(article.id);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showDigest ? (
              <BookOpen className="w-5 h-5 text-liberation-gold-divine" />
            ) : (
              <Sparkles className="w-5 h-5 text-liberation-gold-divine" />
            )}
            <h3 className="text-white font-bold">
              {showDigest ? 'Liberation Digest' : 'For You'}
            </h3>
          </div>
          <button
            onClick={fetchFeed}
            disabled={loading}
            className="p-2 text-white/60 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {showDigest && digest && (
          <p className="text-white/60 text-sm mt-2">
            {digest.message}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-liberation-gold-divine" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-white/60 mb-4">{error}</p>
            <button
              onClick={fetchFeed}
              className="px-4 py-2 bg-liberation-gold-divine/20 text-liberation-gold-divine rounded-lg hover:bg-liberation-gold-divine/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="w-12 h-12 mx-auto text-white/30 mb-4" />
            <p className="text-white/60">No articles found</p>
            <p className="text-white/40 text-sm mt-1">
              Check back soon for community stories
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={() => handleArticleClick(article)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Liberation Badge */}
      <div className="px-4 pb-4">
        <div className="text-center text-xs text-white/40 py-2 border-t border-white/10">
          🏴‍☠️ Stories centered on Black queer liberation and joy
        </div>
      </div>
    </div>
  );
}

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
  formatDate: (date?: string) => string;
}

function ArticleCard({ article, onClick, formatDate }: ArticleCardProps) {
  const liberationScore = article.liberation_score || 50;
  const isHighLiberation = liberationScore >= 70;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group"
    >
      {/* Thumbnail */}
      {article.cover_image ? (
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white/10">
          <img
            src={article.cover_image}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-liberation-gold-divine/10 flex items-center justify-center">
          <Newspaper className="w-6 h-6 text-liberation-gold-divine/50" />
        </div>
      )}

      {/* Article Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-white font-medium line-clamp-2">
            {article.title}
          </h4>
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          {article.category && (
            <span className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded">
              {article.category}
            </span>
          )}
          {isHighLiberation && (
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
              ✊
            </span>
          )}
          <span className="text-white/40 text-xs">
            {formatDate(article.published_at || article.created_at)}
          </span>
        </div>

        {article.author && (
          <p className="text-white/40 text-xs mt-1">
            by {article.author}
          </p>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="flex-shrink-0 w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors mt-1" />
    </button>
  );
}

export default ForYouNewsFeed;
