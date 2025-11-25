import React, { useState, useEffect } from 'react';
import { Crown, TrendingUp, Users, Share2, ThumbsUp, ExternalLink, Calendar } from 'lucide-react';
import { formatRelativeTime, getWeekDateRange, formatPublishedDate } from '@/lib/utils';

interface StoryData {
  id: string;
  title: string;
  excerpt: string;
  featured_image?: string;
  image_alt?: string;
  category: string;
  author: string;
  source_name?: string;
  source_url?: string;
  read_time?: string;
  published_at: string;
  upvote_count: number;
  share_count: number;
  comment_count: number;
  engagement_score: number;
}

interface StoryOfTheWeekProps {
  period?: 'day' | 'week' | 'month';
  limit?: number;
}

const StoryOfTheWeek: React.FC<StoryOfTheWeekProps> = ({
  period = 'week',
  limit = 10,
}) => {
  const [topStory, setTopStory] = useState<StoryData | null>(null);
  const [topStories, setTopStories] = useState<StoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTopStories();
  }, [period, limit]);

  const loadTopStories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/top-stories?period=${period}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch top stories');
      }

      const data = await response.json();

      if (data.success) {
        setTopStory(data.data.storyOfThePeriod);
        setTopStories(data.data.topStories);
      } else {
        throw new Error(data.error || 'Failed to load top stories');
      }
    } catch (err) {
      console.error('Error loading top stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load top stories');
    } finally {
      setLoading(false);
    }
  };

  const openArticle = (sourceUrl?: string) => {
    if (sourceUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-liberation-sovereignty-gold border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-400">Loading top stories...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!topStory) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <Crown className="h-12 w-12 mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400">No stories for this period yet.</p>
      </div>
    );
  }

  const periodLabel = {
    day: 'Story of the Day',
    week: 'Story of the Week',
    month: 'Story of the Month',
  }[period];

  // Get week date range for context
  const weekRange = getWeekDateRange();

  return (
    <div className="space-y-6">
      {/* Featured Story */}
      <div className="mb-8">
        {/* Header with date context */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-liberation-sovereignty-gold animate-pulse" />
            <h2 className="text-2xl font-bold text-liberation-sovereignty-gold uppercase tracking-wide">
              {periodLabel}
            </h2>
          </div>
          {/* Date range badge */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300 font-medium">{weekRange.label}</span>
          </div>
        </div>

        <div
          onClick={() => openArticle(topStory.source_url)}
          className="bg-gradient-to-br from-liberation-sovereignty-gold/5 to-liberation-pride-purple/5 border-2 border-liberation-sovereignty-gold/30 rounded-xl overflow-hidden hover:border-liberation-sovereignty-gold transition-all duration-300 cursor-pointer group"
        >
          {topStory.featured_image && (
            <div className="aspect-video overflow-hidden">
              <img
                src={topStory.featured_image}
                alt={topStory.image_alt || topStory.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Category and Engagement Score */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-block bg-liberation-sovereignty-gold text-black px-3 py-1 rounded-full text-xs font-bold uppercase">
                {topStory.category}
              </span>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-liberation-sovereignty-gold">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-bold">{Math.round(topStory.engagement_score)}</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight group-hover:text-liberation-sovereignty-gold transition-colors">
              {topStory.title}
            </h3>

            {/* Excerpt */}
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
              {topStory.excerpt}
            </p>

            {/* Engagement Stats */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                <span>{topStory.upvote_count} upvotes</span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span>{topStory.share_count} shares</span>
              </div>
              {topStory.comment_count > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{topStory.comment_count} comments</span>
                </div>
              )}
            </div>

            {/* Meta - with prominent date display */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                {/* Published date - prominent */}
                <span className="inline-flex items-center gap-1.5 text-liberation-sovereignty-gold font-medium">
                  <Calendar className="h-4 w-4" />
                  {formatPublishedDate(topStory.published_at)}
                </span>
                <span className="hidden sm:inline text-gray-600">•</span>
                <span className="text-gray-400">By {topStory.author}</span>
                {topStory.source_name && (
                  <>
                    <span className="hidden sm:inline text-gray-600">•</span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <ExternalLink className="h-3 w-3" />
                      {topStory.source_name}
                    </span>
                  </>
                )}
              </div>
              {topStory.source_url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openArticle(topStory.source_url);
                  }}
                  className="flex items-center gap-2 text-liberation-sovereignty-gold hover:translate-x-1 transition-transform text-sm font-bold"
                >
                  Read Full Article
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 Leaderboard */}
      {topStories.length > 1 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">
            Top {topStories.length} Stories This {period === 'day' ? 'Day' : period === 'week' ? 'Week' : 'Month'}
          </h3>
          <div className="space-y-2">
            {topStories.slice(1).map((story, index) => (
              <div
                key={story.id}
                onClick={() => openArticle(story.source_url)}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-liberation-sovereignty-gold/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 h-8 bg-liberation-pride-purple/20 rounded-full flex items-center justify-center text-liberation-pride-purple font-bold text-sm">
                    #{index + 2}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold mb-1 line-clamp-1 group-hover:text-liberation-sovereignty-gold transition-colors">
                      {story.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {/* Published date - now visible */}
                      <span className="text-gray-400">{formatPublishedDate(story.published_at)}</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {story.upvote_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {Math.round(story.engagement_score)}
                      </span>
                      <span>{story.source_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryOfTheWeek;
