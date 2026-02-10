import React, { useState, useEffect } from 'react';
import { Crown, Medal, Award, ThumbsUp, Calendar, ArrowRight, Newspaper } from 'lucide-react';

interface Winner {
  id: string;
  title: string;
  excerpt: string;
  featuredImage?: string;
  imageAlt?: string;
  category: string;
  author: string;
  sourceName?: string;
  sourceUrl?: string;
  publishedAt: string;
  totalVotes: number;
  weeklyRank: number;
}

interface CompletedPeriod {
  id: string;
  periodNumber: number;
  startDate: string;
  endDate: string;
  totalArticles: number;
  totalVotes: number;
  winners: Winner[];
}

const rankStyles = [
  { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/40', glow: 'shadow-yellow-400/10' },
  { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-300/10', border: 'border-gray-300/30', glow: 'shadow-gray-300/5' },
  { icon: Award, color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/30', glow: 'shadow-amber-600/5' },
];

const WinnersPage: React.FC = () => {
  const [periods, setPeriods] = useState<CompletedPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWinners();
  }, []);

  const loadWinners = async () => {
    try {
      const res = await fetch('/api/winners');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPeriods(data.data.periods || []);
        }
      }
    } catch (err) {
      console.error('Failed to load winners:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `${fmt(s)} - ${fmt(e)} ${e.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-liberation-sovereignty-gold/30 border-t-liberation-sovereignty-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Compact header — visual, minimal text */}
      <section className="py-8 px-4 md:px-8 border-b border-liberation-sovereignty-gold/20 bg-gradient-to-r from-liberation-sovereignty-gold/5 via-transparent to-liberation-sovereignty-gold/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-liberation-sovereignty-gold" />
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                Your <span className="text-liberation-gold-divine">Top Stories</span>
              </h1>
              <p className="text-sm text-gray-400">What the community voted most important, every two weeks</p>
            </div>
          </div>
          <a
            href="/"
            className="flex items-center gap-2 bg-liberation-sovereignty-gold text-black px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-liberation-gold-divine transition-colors"
          >
            <ThumbsUp className="h-4 w-4" />
            Vote Now
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <main className="py-8 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          {periods.length === 0 ? (
            /* Empty state — encouraging, with CTA */
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-liberation-sovereignty-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Crown className="h-10 w-10 text-liberation-sovereignty-gold/50" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">
                No completed voting periods yet
              </h2>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                Voting is live now. The top 3 community-chosen stories will appear here when the period ends.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 bg-liberation-sovereignty-gold text-black px-6 py-3 rounded-lg font-bold hover:bg-liberation-gold-divine transition-colors"
              >
                <ThumbsUp className="h-5 w-5" />
                Cast your vote
              </a>
            </div>
          ) : (
            <div className="space-y-12">
              {periods.map((period) => (
                <section key={period.id}>
                  {/* Period divider — compact */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm text-gray-300 font-medium">
                        {formatRange(period.startDate, period.endDate)}
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-xs text-gray-500">
                      {period.totalVotes} votes from {period.totalArticles} stories
                    </span>
                  </div>

                  {/* Winners — 1st place hero, 2nd & 3rd compact row */}
                  {period.winners.length > 0 && (
                    <div className="space-y-3">
                      {/* 1st place — large card with image */}
                      {period.winners[0] && (() => {
                        const w = period.winners[0];
                        const style = rankStyles[0];
                        return (
                          <article
                            key={w.id}
                            onClick={() => w.sourceUrl && window.open(w.sourceUrl, '_blank', 'noopener,noreferrer')}
                            className={`${style.bg} border-2 ${style.border} rounded-xl overflow-hidden hover:scale-[1.01] transition-all duration-300 cursor-pointer group shadow-lg ${style.glow}`}
                          >
                            <div className="flex flex-col md:flex-row">
                              {w.featuredImage && (
                                <div className="md:w-2/5 aspect-video md:aspect-auto overflow-hidden">
                                  <img
                                    src={w.featuredImage}
                                    alt={w.imageAlt || w.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              )}
                              <div className={`flex-1 p-5 md:p-6 flex flex-col justify-center ${!w.featuredImage ? 'p-6' : ''}`}>
                                <div className="flex items-center gap-2 mb-3">
                                  <Crown className="h-5 w-5 text-yellow-400" />
                                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Top Story</span>
                                  <span className="text-xs text-gray-500 ml-auto">{w.category}</span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2 group-hover:text-liberation-sovereignty-gold transition-colors">
                                  {w.title}
                                </h3>
                                <p className="text-gray-400 text-sm line-clamp-2 mb-3">{w.excerpt}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                    {w.totalVotes}
                                  </span>
                                  <span>{w.sourceName}</span>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })()}

                      {/* 2nd & 3rd — compact side-by-side */}
                      {period.winners.length > 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {period.winners.slice(1, 3).map((w, idx) => {
                            const style = rankStyles[idx + 1] || rankStyles[2];
                            const RankIcon = style.icon;
                            return (
                              <article
                                key={w.id}
                                onClick={() => w.sourceUrl && window.open(w.sourceUrl, '_blank', 'noopener,noreferrer')}
                                className={`${style.bg} border ${style.border} rounded-xl p-4 hover:scale-[1.01] transition-all duration-300 cursor-pointer group flex items-start gap-4`}
                              >
                                {w.featuredImage && (
                                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                    <img
                                      src={w.featuredImage}
                                      alt={w.imageAlt || w.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <RankIcon className={`h-4 w-4 ${style.color}`} />
                                    <span className={`text-xs font-bold ${style.color}`}>
                                      {idx === 0 ? '2nd' : '3rd'}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-liberation-sovereignty-gold transition-colors">
                                    {w.title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                                    <span className="flex items-center gap-1 font-bold text-gray-400">
                                      <ThumbsUp className="h-3 w-3" />
                                      {w.totalVotes}
                                    </span>
                                    <span>{w.sourceName}</span>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WinnersPage;
