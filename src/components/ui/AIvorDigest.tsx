import React from 'react';
import { Play, Film, Calendar } from 'lucide-react';
import { latestDigest } from '@/config/aivorDigest';

const AIvorDigest: React.FC = () => {
  const { weekLabel, videoUrl, summary, youtubeChannelUrl, thumbnailUrl, format, publishesAt } = latestDigest;
  const portrait = thumbnailUrl || '/images/aivor-news.jpg';
  const youtubeId = videoUrl.trim() ? extractYouTubeId(videoUrl) : null;
  const isLive = !publishesAt || Date.now() >= new Date(publishesAt).getTime();
  const showEmbed = !!youtubeId && isLive;
  const isShort = format === 'short';

  return (
    <section className="relative border border-news/30 bg-black rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-0">
        <div className="relative bg-black/60 flex items-stretch">
          <img
            src={portrait}
            alt="AIvor — your weekly news presenter"
            className="w-full h-full object-cover object-top max-h-[280px] md:max-h-none"
            loading="lazy"
          />
        </div>

        <div className="p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs uppercase tracking-[0.18em] text-news font-bold">
                AIvor Weekly Digest
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={11} />
                {weekLabel}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
              This week, read aloud.
            </h2>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-2xl mb-5">
              {summary}
            </p>
          </div>

          {showEmbed ? (
            <div className={`${isShort ? 'aspect-[9/16] max-w-[360px] mx-auto md:mx-0' : 'aspect-video'} rounded-lg overflow-hidden border border-white/10 bg-black`}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={`AIvor digest — ${weekLabel}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-news/10 border border-news/30 text-sm text-news">
                <Play size={14} />
                <span className="font-medium">{publishesAt && !isLive ? 'Drops 4 May, 12:01am BST' : 'Next digest drops Sunday'}</span>
              </div>
              <a
                href={youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white/5 border border-white/15 text-sm text-white hover:bg-white/10 transition-colors"
              >
                <Film size={14} />
                Past digests on YouTube
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})/,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export default AIvorDigest;
