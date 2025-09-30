/**
 * BLKOUT Newsroom Type Definitions
 * Aligned with platform liberation values and community curation model
 */

export interface NewsArticle {
  id: string;
  title: string;
  slug?: string | null;
  excerpt: string;
  content: string;

  // Categorization
  category: ArticleCategory;
  tags?: string[];

  // Author
  author: string;
  authorId?: string | null;

  // Media
  featuredImage?: string | null;
  imageAlt?: string | null;
  heroImage?: string | null;
  heroImageAlt?: string | null;

  // Curation
  sourceUrl?: string | null;
  sourceName?: string | null;
  curatorId?: string | null;

  // Engagement
  interestScore: number;
  totalVotes: number;
  viewCount?: number;

  // Featured
  isFeatured: boolean;
  isStoryOfWeek?: boolean;
  weeklyRank?: number | null;

  // Publishing
  status: ArticleStatus;
  published: boolean;
  publishedAt?: string | null;

  // Timestamps
  createdAt: string;
  updatedAt?: string;

  // Metadata
  readTime?: string | null;
  liberationScore?: number | null;
}

export type ArticleCategory =
  | 'liberation'
  | 'community'
  | 'politics'
  | 'culture'
  | 'economics'
  | 'health'
  | 'technology'
  | 'opinion'
  | 'analysis';

export type InterestLevel = 'low' | 'medium' | 'high';

export type ArticleStatus =
  | 'draft'
  | 'review'
  | 'published'
  | 'archived';

export type ModerationStatus =
  | 'pending'
  | 'approved'
  | 'flagged'
  | 'rejected';

export interface ArticleSubmission {
  title: string;
  excerpt?: string;
  content?: string;
  originalUrl?: string;
  sourceName?: string;
  category: ArticleCategory;
  topics: string[];
  submittedBy: string;
}

export interface WriterProfile {
  id: string;
  name: string;
  bio: string;
  avatar?: string;
  articlesPublished: number;
  joinedAt: string;
  specialties: ArticleCategory[];
  socialLinks?: {
    twitter?: string;
    website?: string;
  };
}

export interface NewsletterSubscription {
  email: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  categories: ArticleCategory[];
  subscribedAt: string;
}
