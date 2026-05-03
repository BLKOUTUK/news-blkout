// Latest AIvor Weekly News Digest. Updated when a new digest ships.
// videoUrl: leave empty string until manual YouTube upload completes (YT brand-account
// identity issue blocks the cron's automatic upload — see project_yt_brand_account.md).
// When videoUrl is empty, the panel shows the "next digest Sunday" pre-state.

export interface AIvorDigest {
  weekLabel: string;          // e.g. "Week of 27 April 2026"
  videoUrl: string;           // YouTube watch URL, or "" if not yet published
  thumbnailUrl?: string;      // optional hero, defaults to /images/aivor-news.jpg
  summary: string;            // 1-2 sentences for the panel
  youtubeChannelUrl: string;  // fallback CTA when videoUrl is empty
}

export const latestDigest: AIvorDigest = {
  weekLabel: 'Week ending 3 May 2026',
  videoUrl: '',
  summary:
    'AIvor reads the week — three stories the community voted up, framed for the journey from interest to action.',
  youtubeChannelUrl: 'https://www.youtube.com/channel/UC7g_Es50958bYJauxym0n1A',
};
