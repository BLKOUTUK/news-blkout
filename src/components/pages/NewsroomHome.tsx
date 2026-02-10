import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Crown,
  Zap,
  Clock,
  ArrowRight,
  ThumbsUp,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import type { NewsArticle, ArticleCategory } from '@/types/newsroom';
import { formatRelativeTime } from '@/lib/utils';
import ArticleCard from '../ui/ArticleCard';
import CategoryFilter from '../ui/CategoryFilter';
import SortFilter from '../ui/SortFilter';
import NewsletterSignup from '../ui/NewsletterSignup';
import StoryOfTheWeek from '../ui/StoryOfTheWeek';
import VotingOnboardingModal from '../ui/VotingOnboardingModal';

interface NewsroomHomeProps {
  onArticleClick: (articleId: string) => void;
}

type SortOption = 'interest' | 'recent' | 'weekly';

const PAGE_SIZE = 20;

const NewsroomHome: React.FC<NewsroomHomeProps> = ({ onArticleClick }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('interest');

  useEffect(() => {
    loadArticles(true);
  }, [selectedCategory, sortBy]);

  const loadArticles = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const offset = reset ? 0 : articles.length;
      const params = new URLSearchParams({
        category: selectedCategory !== 'all' ? selectedCategory : '',
        sortBy,
        status: 'published',
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });

      const response = await fetch(`/api/news?${params}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const newArticles = data.data.articles || [];
          if (reset) {
            setArticles(newArticles);
          } else {
            setArticles(prev => [...prev, ...newArticles]);
          }
          setHasMore(newArticles.length >= PAGE_SIZE);
        } else {
          if (reset) setArticles([]);
          setHasMore(false);
        }
      } else {
        console.error('Failed to fetch articles');
        if (reset) setArticles([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
      if (reset) setArticles([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const featuredArticle = articles.find((a) => a.isStoryOfWeek);
  const regularArticles = articles.filter((a) => !a.isStoryOfWeek);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-liberation-sovereignty-gold/30 border-t-liberation-sovereignty-gold rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-liberation-sovereignty-gold font-bold">
            Loading Liberation News...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* First-time visitor onboarding modal */}
      <VotingOnboardingModal />

      {/* Hero Section with Voting CTA */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] overflow-hidden border-b border-white/10 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Background video - optional, gracefully degrades */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          onError={(e) => {
            console.warn('Hero video failed to load');
            e.currentTarget.style.display = 'none';
          }}
        >
          <source src="/videos/hero/Hero4blkout(1).mp4" type="video/mp4" />
        </video>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70"></div>

        {/* Hero content */}
        <div className="relative h-full flex items-center justify-center px-4 md:px-8 py-16">
          <div className="max-w-7xl mx-auto text-center">
            {/* Voting badge */}
            <div className="inline-flex items-center gap-2 bg-liberation-sovereignty-gold/20 border border-liberation-sovereignty-gold/40 rounded-full px-4 py-2 mb-6">
              <ThumbsUp className="h-4 w-4 text-liberation-sovereignty-gold" />
              <span className="text-liberation-sovereignty-gold font-medium text-sm">YOUR VOTE SHAPES OUR NEWS</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
              THE NEWS THAT <span className="text-liberation-gold-divine">MATTERS</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-100 mb-6 max-w-3xl mx-auto drop-shadow-md">
              This is <span className="text-liberation-sovereignty-gold font-semibold">community-owned journalism</span>.
              Every week, the story YOU upvote most becomes our Story of the Week.
            </p>

            {/* Scroll CTA */}
            <div className="flex flex-col items-center gap-3 mt-8">
              <p className="text-gray-300 text-lg">
                Scroll down and click <ThumbsUp className="inline h-5 w-5 text-liberation-sovereignty-gold mx-1" /> on stories that matter to you
              </p>
              <ChevronDown className="h-8 w-8 text-liberation-sovereignty-gold animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 px-4 md:px-8 border-b border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
            <CategoryFilter
              selected={selectedCategory}
              onChange={setSelectedCategory}
            />
            <SortFilter selected={sortBy} onChange={setSortBy} />
          </div>
        </div>
      </section>

      {/* How It Works - Visual Steps */}
      <section className="py-10 px-4 md:px-8 bg-gradient-to-b from-black/50 to-transparent">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-white mb-2">
            HOW IT WORKS
          </h2>
          <p className="text-center text-gray-400 mb-8">
            3 simple steps to shape our news
          </p>

          {/* Visual steps - horizontal on desktop, vertical on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-xl border border-white/10 hover:border-liberation-sovereignty-gold/30 transition-all">
              <div className="w-16 h-16 bg-liberation-sovereignty-gold/20 rounded-full flex items-center justify-center mb-4">
                <ThumbsUp className="h-8 w-8 text-liberation-sovereignty-gold" />
              </div>
              <div className="text-3xl font-black text-liberation-sovereignty-gold mb-2">1</div>
              <h3 className="text-lg font-bold text-white mb-2">Click Upvote</h3>
              <p className="text-gray-400 text-sm">
                Find a story you think is important and click the 👍 button
              </p>
            </div>

            {/* Arrow (desktop only) */}
            <div className="hidden md:flex items-center justify-center -mx-8">
              <ArrowRight className="h-8 w-8 text-liberation-sovereignty-gold/50" />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-xl border border-white/10 hover:border-liberation-pride-purple/30 transition-all md:col-start-2">
              <div className="w-16 h-16 bg-liberation-pride-purple/20 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-liberation-pride-purple" />
              </div>
              <div className="text-3xl font-black text-liberation-pride-purple mb-2">2</div>
              <h3 className="text-lg font-bold text-white mb-2">Votes Counted</h3>
              <p className="text-gray-400 text-sm">
                Community votes are tallied throughout the week
              </p>
            </div>

            {/* Arrow (desktop only) */}
            <div className="hidden md:flex items-center justify-center -mx-8">
              <ArrowRight className="h-8 w-8 text-liberation-sovereignty-gold/50" />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-xl border border-white/10 hover:border-liberation-sovereignty-gold/30 transition-all md:col-start-3">
              <div className="w-16 h-16 bg-liberation-sovereignty-gold/20 rounded-full flex items-center justify-center mb-4">
                <Crown className="h-8 w-8 text-liberation-sovereignty-gold" />
              </div>
              <div className="text-3xl font-black text-liberation-sovereignty-gold mb-2">3</div>
              <h3 className="text-lg font-bold text-white mb-2">Top Story Wins</h3>
              <p className="text-gray-400 text-sm">
                Most-voted story becomes Story of the Week
              </p>
            </div>
          </div>

          {/* No login callout */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-liberation-sovereignty-gold/10 border border-liberation-sovereignty-gold/20 rounded-full px-5 py-2">
              <Zap className="h-4 w-4 text-liberation-sovereignty-gold" />
              <span className="text-liberation-sovereignty-gold font-medium text-sm">
                No login required - just click and vote!
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {articles.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-liberation-sovereignty-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-liberation-sovereignty-gold" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Building Our Shared News Agenda
              </h2>
              <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
                Community curators are discovering stories that matter to us. Your votes
                will shape our collective news agenda and train IVOR.
              </p>
              <button
                onClick={() => window.open('https://blkoutuk.com', '_blank')}
                className="bg-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/90 text-black py-3 px-8 rounded-lg font-bold transition-all hover:scale-105"
              >
                Return to Platform
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Story of the Week - API-driven engagement scoring */}
              <StoryOfTheWeek period="week" limit={10} />

              {/* Featured Story of the Week - Legacy */}
              {featuredArticle && (
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <Crown className="h-6 w-6 text-liberation-sovereignty-gold" />
                    <h2 className="text-xl font-bold text-liberation-sovereignty-gold uppercase tracking-wide">
                      Story of the Week
                    </h2>
                  </div>
                  <div
                    onClick={() => onArticleClick(featuredArticle.id)}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-liberation-sovereignty-gold/30 transition-all duration-300 group cursor-pointer"
                  >
                    {featuredArticle.featuredImage && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={featuredArticle.featuredImage}
                          alt={featuredArticle.imageAlt || featuredArticle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4 sm:p-6 md:p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs bg-liberation-sovereignty-gold text-black px-3 py-1 rounded-full font-semibold">
                          {featuredArticle.category.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{featuredArticle.readTime}</span>
                        </div>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight group-hover:text-liberation-sovereignty-gold transition-colors">
                        {featuredArticle.title}
                      </h3>

                      <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
                        {featuredArticle.excerpt}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>By {featuredArticle.author}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(featuredArticle.publishedAt)}</span>
                        </div>
                        <button className="flex items-center gap-2 text-liberation-sovereignty-gold hover:translate-x-1 transition-transform text-sm font-medium">
                          Read More <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Regular Articles Grid */}
              {regularArticles.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wide">
                    Community Curated Stories
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onClick={() => onArticleClick(article.id)}
                      />
                    ))}
                  </div>

                  {/* Load More */}
                  {hasMore && (
                    <div className="text-center mt-10">
                      <button
                        onClick={() => loadArticles(false)}
                        disabled={loadingMore}
                        className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                      >
                        {loadingMore ? 'Loading...' : 'Load More Stories'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Newsletter Signup */}
      <section className="py-16 px-4 md:px-8 border-t border-white/10 bg-black/30">
        <NewsletterSignup />
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 md:px-8 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
            Shape Our <span className="text-liberation-sovereignty-gold">Shared News Agenda</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 mb-8">
            Phase 1: Community curation builds the foundation for IVOR's autonomous story discovery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/90 text-black py-3 sm:py-4 px-6 sm:px-8 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 hover:scale-105">
              Get Curator Extension
            </button>
            <button className="bg-transparent border-2 border-liberation-sovereignty-gold text-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold hover:text-black py-3 sm:py-4 px-6 sm:px-8 rounded-xl font-bold text-base sm:text-lg transition-all duration-300">
              Curation Guidelines
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewsroomHome;
