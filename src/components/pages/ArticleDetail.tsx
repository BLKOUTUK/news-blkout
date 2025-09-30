import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, User, Share2, Bookmark, ThumbsUp, ExternalLink } from 'lucide-react';
import type { NewsArticle } from '@/types/newsroom';
import { formatDate } from '@/lib/utils';

interface ArticleDetailProps {
  articleId: string;
  onBack: () => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ articleId, onBack }) => {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/news/${articleId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setArticle(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (voted) return;
    setVoted(true);
    // TODO: Implement vote API call
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    // TODO: Implement bookmark API call
  };

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share canceled');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-liberation-sovereignty-gold/30 border-t-liberation-sovereignty-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Article Not Found</h2>
          <button
            onClick={onBack}
            className="bg-liberation-sovereignty-gold text-black px-6 py-3 rounded-lg font-bold hover:bg-liberation-sovereignty-gold/90 transition"
          >
            Return to Newsroom
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Article Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-liberation-sovereignty-gold transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Newsroom
          </button>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        {/* Category Badge */}
        <div className="mb-6">
          <span className="inline-block bg-liberation-sovereignty-gold/20 text-liberation-sovereignty-gold px-4 py-2 rounded-full text-sm font-semibold">
            {article.category.toUpperCase()}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
          {article.title}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            {article.excerpt}
          </p>
        )}

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center gap-2 text-gray-400">
            <User className="h-4 w-4" />
            <span className="font-medium text-white">{article.author}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(article.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{article.readTime}</span>
          </div>
          {article.sourceName && (
            <div className="flex items-center gap-2 text-gray-400">
              <ExternalLink className="h-4 w-4" />
              <span>{article.sourceName}</span>
            </div>
          )}
        </div>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img
              src={article.featuredImage}
              alt={article.imageAlt || article.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-invert prose-lg max-w-none mb-12">
          {article.content ? (
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8">
              <p className="text-gray-300 mb-6">
                This is a community-curated external article. Read the full story at the source:
              </p>
              <a
                href={article.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/90 text-black px-6 py-3 rounded-lg font-bold transition-all"
              >
                Read Full Article <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          )}
        </div>

        {/* Topics */}
        {article.topics && article.topics.length > 0 && (
          <div className="mb-8 pb-8 border-b border-white/10">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {article.topics.map((topic) => (
                <span
                  key={topic}
                  className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Actions */}
        <div className="flex items-center justify-between py-6 border-t border-b border-white/10 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleVote}
              disabled={voted}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                voted
                  ? 'bg-liberation-sovereignty-gold text-black'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              <ThumbsUp className="h-5 w-5" />
              <span>{voted ? 'Voted' : 'Vote'}</span>
            </button>
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                bookmarked
                  ? 'bg-liberation-sovereignty-gold text-black'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              <Bookmark className="h-5 w-5" fill={bookmarked ? 'currentColor' : 'none'} />
              <span>{bookmarked ? 'Saved' : 'Save'}</span>
            </button>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-all"
          >
            <Share2 className="h-5 w-5" />
            <span>Share</span>
          </button>
        </div>

        {/* Back to Newsroom */}
        <div className="text-center py-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 bg-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/90 text-black px-8 py-4 rounded-xl font-bold text-lg transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Newsroom
          </button>
        </div>
      </article>
    </div>
  );
};

export default ArticleDetail;
