import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, ExternalLink, ThumbsUp, LogIn } from 'lucide-react';
import type { NewsArticle } from '@/types/newsroom';
import { formatRelativeTime } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import ShareButtons from './ShareButtons';

interface ArticleCardProps {
  article: NewsArticle;
  onClick?: () => void; // Made optional since we'll handle clicks internally
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  const [upvoteCount, setUpvoteCount] = useState(article.totalVotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication status and vote status
  useEffect(() => {
    checkAuthAndVoteStatus();
  }, [article.id]);

  const checkAuthAndVoteStatus = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setIsAuthenticated(false);
        setHasUpvoted(false);
        setIsCheckingAuth(false);
        return;
      }

      setIsAuthenticated(true);

      // Check if user has upvoted this article
      const token = session.access_token;
      const response = await fetch(`/api/user-vote?articleId=${article.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasUpvoted(data.data?.hasUpvoted || false);
      }
    } catch (error) {
      console.error('Error checking auth/vote status:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent article navigation

    if (isVoting) return;

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // User not authenticated - prompt to log in
      alert('Please log in to upvote articles. You can sign in with your BLKOUT account.');
      return;
    }

    setIsVoting(true);

    try {
      const token = session.access_token;
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ articleId: article.id }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // Update UI based on action
          setHasUpvoted(data.data.hasUpvoted);
          setUpvoteCount(data.data.upvoteCount);
        }
      } else if (response.status === 401) {
        // Auth failed
        alert('Your session has expired. Please log in again to upvote articles.');
      } else {
        // Other error
        const errorData = await response.json();
        console.error('Vote error:', errorData);
        alert('Failed to record upvote. Please try again.');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to record upvote. Please check your connection and try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleCardClick = async (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [data-no-propagate]')) {
      return;
    }

    // Track click for analytics
    trackArticleClick(article.id, article.sourceName || 'Unknown Source');

    // Open source URL in new tab
    if (article.sourceUrl) {
      window.open(article.sourceUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.warn('No source URL for article:', article.id);
      // Fallback to onClick prop if provided
      onClick?.();
    }
  };

  // Analytics tracking function
  const trackArticleClick = async (articleId: string, sourceName: string) => {
    try {
      // Track in analytics table
      await supabase.from('newsroom_analytics').insert({
        article_id: articleId,
        event_type: 'click',
        metadata: {
          source_name: sourceName,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to track click:', error);
      // Non-blocking - don't prevent navigation
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-liberation-sovereignty-gold/30 transition-all duration-300 group cursor-pointer"
    >
      {article.featuredImage && (
        <div className="aspect-video overflow-hidden">
          <img
            src={article.featuredImage}
            alt={article.imageAlt || article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-liberation-sovereignty-gold/20 text-liberation-sovereignty-gold px-2 py-1 rounded font-medium">
              {article.category.toUpperCase()}
            </span>
            {article.weeklyRank && article.weeklyRank <= 10 && (
              <span className="text-xs bg-liberation-pride-purple/20 text-liberation-pride-purple px-2 py-1 rounded font-medium">
                #{article.weeklyRank}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <TrendingUp className="h-3 w-3" />
            <span>{article.interestScore}%</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 leading-tight group-hover:text-liberation-sovereignty-gold transition-colors">
          {article.title}
        </h3>

        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
          {article.excerpt}
        </p>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Clock className="h-3 w-3" />
          <span>{article.readTime}</span>
          {article.sourceName && (
            <>
              <span>•</span>
              <ExternalLink className="h-3 w-3" />
              <span>{article.sourceName}</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-xs text-gray-500">
            <span>By {article.author}</span>
            <span className="mx-2">•</span>
            <span>{formatRelativeTime(article.publishedAt)}</span>
          </div>

          <div className="flex items-center gap-2" data-no-propagate>
            {/* Share buttons */}
            {article.sourceUrl && (
              <ShareButtons
                articleId={article.id}
                articleTitle={article.title}
                sourceUrl={article.sourceUrl}
              />
            )}

            {/* Upvote button */}
            {isCheckingAuth ? (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-500">
                <ThumbsUp className="h-4 w-4 animate-pulse" />
                <span>{upvoteCount}</span>
              </div>
            ) : !isAuthenticated ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  alert('Please log in to upvote articles');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 text-gray-400 hover:bg-liberation-sovereignty-gold/10 hover:text-liberation-sovereignty-gold transition-all"
                title="Log in to upvote"
              >
                <LogIn className="h-3 w-3" />
                <ThumbsUp className="h-4 w-4" />
                <span>{upvoteCount}</span>
              </button>
            ) : (
              <button
                onClick={handleVote}
                disabled={isVoting}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  hasUpvoted
                    ? 'bg-liberation-sovereignty-gold/20 text-liberation-sovereignty-gold'
                    : 'bg-white/5 text-gray-400 hover:bg-liberation-sovereignty-gold/10 hover:text-liberation-sovereignty-gold'
                } ${isVoting ? 'opacity-50 cursor-wait' : ''}`}
                title={hasUpvoted ? 'Remove upvote' : 'Upvote this story'}
              >
                <ThumbsUp className={`h-4 w-4 ${hasUpvoted ? 'fill-current' : ''} ${isVoting ? 'animate-pulse' : ''}`} />
                <span>{upvoteCount}</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual indicator that card is clickable */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-center text-xs text-gray-500 group-hover:text-liberation-sovereignty-gold transition-colors">
          <ExternalLink className="h-3 w-3 mr-1" />
          <span>Click to read on {article.sourceName || 'source'}</span>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
