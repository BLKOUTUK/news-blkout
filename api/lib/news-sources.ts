/**
 * News Sources Configuration for BLKOUT Newsroom
 *
 * Curated RSS feeds and news sources focused on:
 * - Black QTIPOC+ news and perspectives
 * - UK LGBTQ+ community news
 * - Liberation, social justice, and activism
 */

export interface NewsSource {
  name: string;
  url: string;
  feedUrl?: string;
  category: 'liberation' | 'community' | 'politics' | 'culture' | 'health' | 'technology' | 'features';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  region: 'uk' | 'us' | 'global';
  active: boolean;
}

/**
 * RSS Feed Sources
 * These are directly parseable RSS/Atom feeds
 */
export const RSS_SOURCES: NewsSource[] = [
  // UK LGBTQ+ News
  {
    name: 'PinkNews',
    url: 'https://www.pinknews.co.uk',
    feedUrl: 'https://www.pinknews.co.uk/feed/',
    category: 'community',
    priority: 'high',
    tags: ['lgbtq', 'uk', 'news'],
    region: 'uk',
    active: true,
  },
  {
    name: 'Attitude',
    url: 'https://www.attitude.co.uk',
    feedUrl: 'https://www.attitude.co.uk/feed/',
    category: 'culture',
    priority: 'high',
    tags: ['lgbtq', 'uk', 'culture'],
    region: 'uk',
    active: true,
  },
  {
    name: 'Gay Times',
    url: 'https://www.gaytimes.co.uk',
    feedUrl: 'https://www.gaytimes.co.uk/feed/',
    category: 'community',
    priority: 'high',
    tags: ['lgbtq', 'uk', 'news'],
    region: 'uk',
    active: true,
  },
  {
    name: 'DIVA Magazine',
    url: 'https://divamag.co.uk',
    feedUrl: 'https://divamag.co.uk/feed/',
    category: 'culture',
    priority: 'medium',
    tags: ['lgbtq', 'uk', 'women', 'lesbian'],
    region: 'uk',
    active: true,
  },

  // Black UK Media
  {
    name: 'The Voice',
    url: 'https://www.voice-online.co.uk',
    feedUrl: 'https://www.voice-online.co.uk/feed/',
    category: 'community',
    priority: 'high',
    tags: ['black', 'uk', 'news', 'community'],
    region: 'uk',
    active: true,
  },
  {
    name: 'Black Ballad',
    url: 'https://blackballad.co.uk',
    feedUrl: 'https://blackballad.co.uk/feed/',
    category: 'culture',
    priority: 'high',
    tags: ['black', 'women', 'uk', 'culture'],
    region: 'uk',
    active: true,
  },
  {
    name: 'gal-dem',
    url: 'https://gal-dem.com',
    feedUrl: 'https://gal-dem.com/feed/',
    category: 'culture',
    priority: 'high',
    tags: ['black', 'women', 'uk', 'culture', 'lgbtq'],
    region: 'uk',
    active: true,
  },

  // LGBTQ+ News - Global
  {
    name: 'Them',
    url: 'https://www.them.us',
    feedUrl: 'https://www.them.us/feed/rss',
    category: 'culture',
    priority: 'medium',
    tags: ['lgbtq', 'trans', 'nonbinary', 'culture'],
    region: 'us',
    active: true,
  },
  {
    name: 'Out Magazine',
    url: 'https://www.out.com',
    feedUrl: 'https://www.out.com/rss.xml',
    category: 'culture',
    priority: 'medium',
    tags: ['lgbtq', 'culture', 'entertainment'],
    region: 'us',
    active: true,
  },
  {
    name: 'The Advocate',
    url: 'https://www.advocate.com',
    feedUrl: 'https://www.advocate.com/rss.xml',
    category: 'politics',
    priority: 'medium',
    tags: ['lgbtq', 'politics', 'news'],
    region: 'us',
    active: true,
  },

  // Health & Wellbeing
  {
    name: 'Terrence Higgins Trust',
    url: 'https://www.tht.org.uk',
    feedUrl: 'https://www.tht.org.uk/feed',
    category: 'health',
    priority: 'high',
    tags: ['health', 'hiv', 'uk', 'lgbtq'],
    region: 'uk',
    active: true,
  },
  {
    name: 'Stonewall UK',
    url: 'https://www.stonewall.org.uk',
    feedUrl: 'https://www.stonewall.org.uk/feed',
    category: 'politics',
    priority: 'high',
    tags: ['lgbtq', 'uk', 'rights', 'policy'],
    region: 'uk',
    active: true,
  },

  // Liberation & Activism
  {
    name: 'Black Lives Matter UK',
    url: 'https://ukblm.org',
    feedUrl: 'https://ukblm.org/feed/',
    category: 'liberation',
    priority: 'high',
    tags: ['black', 'liberation', 'uk', 'activism'],
    region: 'uk',
    active: true,
  },

  // Arts & Culture
  {
    name: 'Autostraddle',
    url: 'https://www.autostraddle.com',
    feedUrl: 'https://www.autostraddle.com/feed/',
    category: 'culture',
    priority: 'medium',
    tags: ['lgbtq', 'lesbian', 'queer', 'culture'],
    region: 'global',
    active: true,
  },
];

/**
 * NewsAPI Search Queries
 * These are keyword combinations for NewsAPI searches
 */
export const NEWSAPI_QUERIES = [
  // Primary queries - most relevant
  { query: 'Black LGBTQ UK', category: 'community', priority: 'high' },
  { query: 'Black queer Britain', category: 'culture', priority: 'high' },
  { query: 'LGBTQ rights UK', category: 'politics', priority: 'high' },

  // Culture & community
  { query: 'Black Pride UK', category: 'culture', priority: 'high' },
  { query: 'queer Black artists UK', category: 'culture', priority: 'medium' },
  { query: 'transgender rights Britain', category: 'politics', priority: 'high' },

  // Health
  { query: 'HIV prevention UK LGBTQ', category: 'health', priority: 'medium' },
  { query: 'mental health LGBTQ UK', category: 'health', priority: 'medium' },

  // Specific searches
  { query: 'UK Black gay', category: 'community', priority: 'medium' },
  { query: 'intersectionality race sexuality UK', category: 'features', priority: 'low' },
];

/**
 * Category mapping for auto-categorization
 */
export const KEYWORD_CATEGORIES: Record<string, string[]> = {
  liberation: ['liberation', 'freedom', 'justice', 'activism', 'protest', 'rights', 'equality'],
  community: ['community', 'celebration', 'pride', 'gathering', 'event', 'meetup'],
  politics: ['law', 'policy', 'government', 'parliament', 'legislation', 'vote', 'election'],
  culture: ['art', 'music', 'film', 'theatre', 'book', 'fashion', 'entertainment'],
  health: ['health', 'mental', 'wellbeing', 'hiv', 'prep', 'clinic', 'therapy'],
  technology: ['tech', 'digital', 'app', 'online', 'social media', 'platform'],
  features: ['interview', 'profile', 'story', 'feature', 'spotlight'],
};

/**
 * Get active RSS sources
 */
export function getActiveRssSources(): NewsSource[] {
  return RSS_SOURCES.filter(source => source.active);
}

/**
 * Get sources by priority
 */
export function getSourcesByPriority(priority: 'high' | 'medium' | 'low'): NewsSource[] {
  return RSS_SOURCES.filter(source => source.active && source.priority === priority);
}

/**
 * Auto-categorize article based on content
 */
export function autoCategorize(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();

  for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
    const matchCount = keywords.filter(keyword => text.includes(keyword)).length;
    if (matchCount >= 2) {
      return category;
    }
  }

  return 'community'; // Default category
}

/**
 * Generate relevance score (0-100) based on keywords
 */
export function calculateRelevanceScore(title: string, content: string): number {
  const text = `${title} ${content}`.toLowerCase();

  // High relevance keywords (Black QTIPOC+ specific)
  const highRelevance = ['black queer', 'black gay', 'black lgbtq', 'black trans', 'qtipoc', 'blkout'];
  // Medium relevance keywords
  const mediumRelevance = ['lgbtq', 'queer', 'gay', 'lesbian', 'trans', 'bisexual', 'pride'];
  // Low relevance but still relevant
  const lowRelevance = ['diversity', 'inclusion', 'equality', 'rights'];

  let score = 30; // Base score

  for (const keyword of highRelevance) {
    if (text.includes(keyword)) score += 15;
  }

  for (const keyword of mediumRelevance) {
    if (text.includes(keyword)) score += 8;
  }

  for (const keyword of lowRelevance) {
    if (text.includes(keyword)) score += 3;
  }

  // UK-specific bonus
  if (text.includes('uk') || text.includes('britain') || text.includes('london')) {
    score += 10;
  }

  return Math.min(100, score);
}
