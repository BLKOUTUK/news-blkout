// Latest AIvor Weekly News Digest. Updated when a new digest ships.
// videoUrl: leave empty string until manual YouTube upload completes.
// publishesAt: optional ISO timestamp — embed stays in pre-state until this passes.

export interface AIvorDigest {
  weekLabel: string;
  videoUrl: string;
  thumbnailUrl?: string;
  summary: string;
  youtubeChannelUrl: string;
  format?: 'standard' | 'short';
  publishesAt?: string;
}

export const latestDigest: AIvorDigest = {
  weekLabel: 'Week ending 3 May 2026',
  videoUrl: 'https://youtube.com/shorts/v31vQb10bYI',
  format: 'short',
  publishesAt: '2026-05-03T23:01:00Z', // 4 May 00:01 BST = 3 May 23:01 UTC
  summary:
    'Three stories the community voted up — European Parliament backs an EU-wide ban on conversion therapy, Afrobeats and queerness in Nigeria, NYC Pride picks Bernie Wagenblast as Grand Marshal.',
  youtubeChannelUrl: 'https://www.youtube.com/channel/UC7g_Es50958bYJauxym0n1A',
};
