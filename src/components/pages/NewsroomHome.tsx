import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Crown,
  Zap,
  ExternalLink,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { NewsArticle, ArticleCategory } from '@/types/newsroom';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import ArticleCard from '../ui/ArticleCard';
import CategoryFilter from '../ui/CategoryFilter';
import SortFilter from '../ui/SortFilter';
import NewsletterSignup from '../ui/NewsletterSignup';

interface NewsroomHomeProps {
  onArticleClick: (articleId: string) => void;
}

type SortOption = 'interest' | 'recent' | 'weekly';

const NewsroomHome: React.FC<NewsroomHomeProps> = ({ onArticleClick }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('interest');

  useEffect(() => {
    loadArticles();
  }, [selectedCategory, sortBy]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: selectedCategory !== 'all' ? selectedCategory : '',
        sortBy,
        status: 'published',
        limit: '20',
      });

      const response = await fetch(`/api/news?${params}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setArticles(data.data.articles || []);
        } else {
          setArticles([]);
        }
      } else {
        console.error('Failed to fetch articles');
        setArticles([]);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
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
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden border-b border-white/10 bg-gradient-to-br from-gray-900 via-black to-gray-900">
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black"></div>

        {/* Hero content */}
        <div className="relative h-full flex items-center justify-center px-4 md:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
              THE NEWS THAT <span className="text-liberation-gold-divine">MATTERS</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 mb-4 max-w-3xl mx-auto drop-shadow-md">
              Curated by us, for us. Community-selected stories that shape our understanding
              and inspire action.
            </p>
            <p className="text-gray-200 max-w-2xl mx-auto drop-shadow-md">
              Phase 1: Building our shared news agenda through community curation and votes.
              Your engagement trains IVOR to discover stories that matter to Black queer liberation.
            </p>
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
                onClick={() => window.open('https://blkout.vercel.app', '_blank')}
                className="bg-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/90 text-black py-3 px-8 rounded-lg font-bold transition-all hover:scale-105"
              >
                Return to Platform
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Featured Story of the Week */}
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
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs bg-liberation-sovereignty-gold text-black px-3 py-1 rounded-full font-semibold">
                          {featuredArticle.category.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{featuredArticle.readTime}</span>
                        </div>
                      </div>

                      <h3 className="text-3xl font-bold text-white mb-4 leading-tight group-hover:text-liberation-sovereignty-gold transition-colors">
                        {featuredArticle.title}
                      </h3>

                      <p className="text-gray-300 text-lg leading-relaxed mb-6">
                        {featuredArticle.excerpt}
                      </p>

                      <div className="flex items-center justify-between">
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
          <h2 className="text-3xl font-bold text-white mb-6">
            Shape Our <span className="text-liberation-sovereignty-gold">Shared News Agenda</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Phase 1: Community curation builds the foundation for IVOR's autonomous story discovery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/90 text-black py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105">
              Get Curator Extension
            </button>
            <button className="bg-transparent border-2 border-liberation-sovereignty-gold text-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold hover:text-black py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300">
              Curation Guidelines
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewsroomHome;
