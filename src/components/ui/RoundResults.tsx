import React, { useState, useEffect } from 'react';
import { Trophy, PenLine, ExternalLink } from 'lucide-react';
import { formatDateRange } from '@/lib/utils';

interface RoundWinner {
  id: string;
  title: string;
  sourceName?: string;
  sourceUrl?: string;
  upvoteCount: number;
}

interface ClosedRound {
  periodNumber: number;
  startDate: string;
  endDate: string;
  pickedBy: 'votes' | 'editor' | 'ranking';
  winners: RoundWinner[];
}

// How long after a round closes its results stay at the top of the page.
const SHOW_FOR_DAYS = 7;

/**
 * The last round's outcome, labelled by who actually chose it: the vote,
 * an editor, or — when nobody voted — the round's top-ranked stories,
 * said plainly.
 */
const RoundResults: React.FC = () => {
  const [round, setRound] = useState<ClosedRound | null>(null);

  useEffect(() => {
    fetch('/api/winners?limit=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const latest = data?.success ? data.data.periods?.[0] : null;
        if (!latest || latest.winners.length === 0) return;
        const daysSinceClose = (Date.now() - new Date(latest.endDate).getTime()) / 86_400_000;
        if (daysSinceClose <= SHOW_FOR_DAYS) setRound(latest);
      })
      .catch(() => {
        // Non-blocking
      });
  }, []);

  if (!round) return null;

  const dates = formatDateRange(round.startDate, round.endDate);
  const heading = {
    votes: `Results: ${dates}`,
    editor: `Editor's picks: ${dates}`,
    ranking: `${dates}: closed without a vote`,
  }[round.pickedBy];

  const subhead = {
    votes: 'You called it. The stories the community put on top:',
    editor: 'No clear winner from the vote, so an editor chose these:',
    ranking: 'Nobody called it this time. These led the fortnight. This one is yours to decide.',
  }[round.pickedBy];

  const Icon = round.pickedBy === 'editor' ? PenLine : Trophy;

  return (
    <section className="bg-liberation-sovereignty-gold/5 border border-liberation-sovereignty-gold/30 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-5 w-5 text-liberation-sovereignty-gold" />
        <h2 className="text-lg font-bold text-white uppercase tracking-wide">{heading}</h2>
      </div>
      <p className="text-sm text-gray-400 mb-4">{subhead}</p>
      <ol className="space-y-3">
        {round.winners.map((w, i) => (
          <li key={w.id} className="flex items-start gap-3">
            <span className="text-liberation-sovereignty-gold font-black text-lg leading-tight w-5">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <a
                href={w.sourceUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-semibold hover:text-liberation-sovereignty-gold transition-colors inline-flex items-start gap-1"
              >
                <span>{w.title}</span>
                <ExternalLink className="h-3 w-3 mt-1 flex-shrink-0" />
              </a>
              <div className="text-xs text-gray-500">
                {w.sourceName}
                {round.pickedBy === 'votes' && ` · ${w.upvoteCount} ${w.upvoteCount === 1 ? 'vote' : 'votes'}`}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default RoundResults;
