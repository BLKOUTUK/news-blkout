/**
 * BLKOUT Newsroom Type Definitions
 * Aligned with platform liberation values and community curation model
 */

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content?: string; // Full article content for original articles
  category: ArticleCategory;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: string;

  // Phase 1: Story Aggregation fields
  originalUrl?: string;       // External article URL (for curated content)
  sourceName?: string;        // Publication name (e.g., "The Guardian")
  curatorId?: string;         // Community curator who submitted
  submittedAt?: string;       // When submitted to platform

  // Community engagement
  interestScore: number;      // Aggregate user interest (0-100)
  totalVotes: number;         // Number of user votes
  upvotes?: number;
  downvotes?: number;
  userInterestLevel?: InterestLevel; // Current user's vote

  // IVOR learning data
  topics: string[];           // AI-extracted topics
  sentiment?: string;         // Article sentiment
  relevanceScore: number;     // AI-determined relevance (0-100)

  // Featured content
  isStoryOfWeek?: boolean;    // Weekly featured story
  weeklyRank?: number;        // Ranking for the week
  isFeatured?: boolean;       // Featured on homepage

  // Media
  featuredImage?: string;
  imageAlt?: string;

  // Status
  status: ArticleStatus;
  moderationStatus?: ModerationStatus;
}

export type ArticleCategory =
  | 'liberation'
  | 'community'
  | 'politics'
  | 'culture'
  | 'economics'
  | 'health'
  | 'technology'
  | 'environment'
  | 'opinion'
  | 'features';

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
