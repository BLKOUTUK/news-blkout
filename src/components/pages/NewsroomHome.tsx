import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Crown,
  Zap,
  Clock,
  ThumbsUp,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import type { NewsArticle, ArticleCategory } from '@/types/newsroom';
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

interface VotingPeriodInfo {
  periodNumber: number;
  endDate: string;
  daysRemaining: number;
  totalArticles: number;
  totalVotes: number;
}

const NewsroomHome: React.FC<NewsroomHomeProps> = ({ onArticleClick }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('interest');
  const [votingPeriod, setVotingPeriod] = useState<VotingPeriodInfo | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    loadArticles();
    loadVotingPeriod();
  }, [selectedCategory, sortBy]);

  const loadVotingPeriod = async () => {
    try {
      const res = await fetch('/api/voting-period');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setVotingPeriod(data.data);
        }
      }
    } catch (err) {
      // Non-blocking
    }
  };

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

  const regularArticles = articles;

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
      {/* First-time visitor onboarding modal (handles all education) */}
      <VotingOnboardingModal />

      {/* Compact Hero — period countdown integrated, gets users to content fast */}
      <section className="relative min-h-[40vh] overflow-hidden border-b border-white/10">
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        >
          <source src="/videos/hero/Hero4blkout(1).mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/80"></div>

        <div className="relative flex items-center justify-center px-4 md:px-8 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">
              THE NEWS THAT <span className="text-liberation-gold-divine">MATTERS</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-5 max-w-2xl mx-auto drop-shadow-md">
              <span className="text-liberation-sovereignty-gold font-semibold">Community-owned journalism</span> — upvote the stories that matter to you
            </p>

            {/* Period countdown — integrated into hero */}
            {votingPeriod && (
              <div className="inline-flex items-center gap-3 bg-black/60 backdrop-blur-sm border border-liberation-sovereignty-gold/30 rounded-full px-5 py-2.5">
                <Clock className="h-4 w-4 text-liberation-sovereignty-gold" />
                <span className="text-sm text-white">
                  <span className="text-liberation-sovereignty-gold font-bold text-base">
                    {votingPeriod.daysRemaining}
                  </span>
                  {' '}{votingPeriod.daysRemaining === 1 ? 'day' : 'days'} left to vote
                </span>
                <span className="w-px h-4 bg-white/20"></span>
                <span className="text-xs text-gray-400">
                  {votingPeriod.totalVotes} votes cast
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filters — immediately accessible */}
      <section className="py-4 px-4 md:px-8 border-b border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <CategoryFilter
              selected={selectedCategory}
              onChange={setSelectedCategory}
            />
            <SortFilter selected={sortBy} onChange={setSortBy} />
          </div>
        </div>
      </section>

      {/* Main Content — articles immediately visible */}
      <main className="py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {articles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-liberation-sovereignty-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-liberation-sovereignty-gold" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Building Our Shared News Agenda
              </h2>
              <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
                Community curators are discovering stories that matter to us.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Current leaderboard */}
              <StoryOfTheWeek period="week" limit={10} />

              {/* Votable article grid */}
              {regularArticles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                      All Stories — Vote Now
                    </h2>
                    <div className="flex items-center gap-1 text-xs text-liberation-sovereignty-gold">
                      <Zap className="h-3.5 w-3.5" />
                      <span className="font-medium">No login needed</span>
                    </div>
                  </div>
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

      {/* How It Works — collapsed below articles, not blocking content */}
      <section className="px-4 md:px-8 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full py-5 flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">How does community voting work?</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showHowItWorks ? 'rotate-180' : ''}`} />
          </button>

          {showHowItWorks && (
            <div className="pb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-liberation-sovereignty-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <ThumbsUp className="h-5 w-5 text-liberation-sovereignty-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">1. Upvote</h3>
                    <p className="text-xs text-gray-400">Click the vote button on stories that matter to you. No login required.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-liberation-sovereignty-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-5 w-5 text-liberation-sovereignty-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">2. Two-Week Cycle</h3>
                    <p className="text-xs text-gray-400">Votes are tallied over a fortnightly period. Rankings update live.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-liberation-sovereignty-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Crown className="h-5 w-5 text-liberation-sovereignty-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">3. Top 3 Win</h3>
                    <p className="text-xs text-gray-400">The three most-voted stories become Your Top Stories for that period.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 px-4 md:px-8 border-t border-white/10 bg-black/30">
        <NewsletterSignup />
      </section>
    </div>
  );
};

export default NewsroomHome;
