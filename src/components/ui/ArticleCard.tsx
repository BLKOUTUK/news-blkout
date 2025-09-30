import React from 'react';
import { TrendingUp, Clock, ExternalLink } from 'lucide-react';
import type { NewsArticle } from '@/types/newsroom';
import { formatRelativeTime } from '@/lib/utils';

interface ArticleCardProps {
  article: NewsArticle;
  onClick: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
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
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
