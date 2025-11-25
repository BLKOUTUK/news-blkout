import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, ExternalLink, ThumbsUp } from 'lucide-react';
import type { NewsArticle } from '@/types/newsroom';
import { formatRelativeTime } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import ShareButtons from './ShareButtons';

interface ArticleCardProps {
  article: NewsArticle;
  onClick?: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  const [upvoteCount, setUpvoteCount] = useState(article.totalVotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  // Check vote status on mount using localStorage
  useEffect(() => {
    const votedArticles = JSON.parse(localStorage.getItem('blkout_voted_articles') || '[]');
    setHasUpvoted(votedArticles.includes(article.id));
  }, [article.id]);

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isVoting) return;
    setIsVoting(true);

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId: article.id }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // Update UI
          setHasUpvoted(data.data.hasUpvoted);
          setUpvoteCount(data.data.upvoteCount);

          // Update localStorage to remember vote
          const votedArticles = JSON.parse(localStorage.getItem('blkout_voted_articles') || '[]');
          if (data.data.hasUpvoted) {
            if (!votedArticles.includes(article.id)) {
              votedArticles.push(article.id);
            }
          } else {
            const index = votedArticles.indexOf(article.id);
            if (index > -1) {
              votedArticles.splice(index, 1);
            }
          }
          localStorage.setItem('blkout_voted_articles', JSON.stringify(votedArticles));
        }
      } else {
        console.error('Vote error:', await response.json());
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleCardClick = async (e: React.MouseEvent) => {
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
      onClick?.();
    }
  };

  const trackArticleClick = async (articleId: string, sourceName: string) => {
    try {
      await supabase.from('newsroom_analytics').insert({
        article_id: articleId,
        event_type: 'click',
        metadata: {
          source_name: sourceName,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Non-blocking
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

            {/* Upvote button - always enabled for anonymous voting */}
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
