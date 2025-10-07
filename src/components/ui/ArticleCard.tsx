import React, { useState } from 'react';
import { TrendingUp, Clock, ExternalLink, ThumbsUp } from 'lucide-react';
import type { NewsArticle } from '@/types/newsroom';
import { formatRelativeTime } from '@/lib/utils';

interface ArticleCardProps {
  article: NewsArticle;
  onClick: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  const [votes, setVotes] = useState(article.totalVotes || 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent article navigation

    if (hasVoted || isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVotes(data.data.totalVotes);
          setHasVoted(true);
          // Store vote in localStorage to prevent multiple votes
          localStorage.setItem(`voted_${article.id}`, 'true');
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  // Check if user has already voted on mount
  React.useEffect(() => {
    const voted = localStorage.getItem(`voted_${article.id}`);
    if (voted) {
      setHasVoted(true);
    }
  }, [article.id]);

  return (
    <article
      onClick={onClick}
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
          <button
            onClick={handleVote}
            disabled={hasVoted || isVoting}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              hasVoted
                ? 'bg-liberation-sovereignty-gold/20 text-liberation-sovereignty-gold cursor-default'
                : 'bg-white/5 text-gray-400 hover:bg-liberation-sovereignty-gold/10 hover:text-liberation-sovereignty-gold'
            }`}
            title={hasVoted ? 'You voted for this' : 'Upvote this story'}
          >
            <ThumbsUp className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
            <span>{votes}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
