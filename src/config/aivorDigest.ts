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
  weekLabel: 'Week ending 24 May 2026',
  videoUrl: 'https://youtube.com/shorts/oc-tB_vWUn8',
  format: 'short',
  summary:
    'Three stories the community voted up — Reflections from the Global South on the Trump administration\'s impact on trans and intersex people, ICE crackdowns threatening HIV care access, further legal breakthrough in Saint Lucia for Caribbean LGBT rights.',
  youtubeChannelUrl: 'https://www.youtube.com/channel/UC7g_Es50958bYJauxym0n1A',
};
