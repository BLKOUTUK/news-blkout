/**
 * API Configuration for News BLKOUT
 * Routes all API calls through IVOR Core (Liberation Layer 3)
 *
 * BLKOUT Community Liberation Platform
 */

// IVOR Core API base URL
// In production: https://ivor.blkoutuk.cloud
// In development: http://localhost:3000
export const IVOR_API_URL = (import.meta as any).env?.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

// API endpoints
export const API_ENDPOINTS = {
  // News endpoints (routed through IVOR Core)
  NEWS_SUBMIT: `${IVOR_API_URL}/api/news/submit`,
  NEWS_ARTICLES: `${IVOR_API_URL}/api/news/articles`,
  NEWS_PENDING: `${IVOR_API_URL}/api/news/pending`,
  NEWS_ARTICLE: (id: string) => `${IVOR_API_URL}/api/news/${id}`,
  NEWS_MODERATE: (id: string) => `${IVOR_API_URL}/api/news/${id}/moderate`,

  // Liberation health check
  LIBERATION_HEALTH: `${IVOR_API_URL}/api/liberation/health`,
} as const;

/**
 * Submit article through IVOR Core with liberation validation
 */
export async function submitArticleToIvor(articleData: {
  title: string;
  url: string;
  excerpt?: string;
  category?: string;
  content?: string;
  submittedBy?: string;
}): Promise<{
  success: boolean;
  message: string;
  data?: any;
  liberation?: {
    score: number;
    recommendation: string;
    narrativeControl: string;
    autoPublished: boolean;
  };
}> {
  try {
    const response = await fetch(API_ENDPOINTS.NEWS_SUBMIT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articleData),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('[API] Article submission failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit article',
    };
  }
}

/**
 * Moderate article through IVOR Core
 */
export async function moderateArticleViaIvor(
  articleId: string,
  action: 'approve' | 'reject' | 'edit',
  edits?: {
    title?: string;
    excerpt?: string;
    content?: string;
    category?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(API_ENDPOINTS.NEWS_MODERATE(articleId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, edits }),
    });

    return await response.json();
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Get articles from IVOR Core
 */
export async function getArticlesFromIvor(options?: {
  limit?: number;
  category?: string;
}): Promise<{
  success: boolean;
  articles: any[];
  count?: number;
}> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.category) params.set('category', options.category);

    const url = `${API_ENDPOINTS.NEWS_ARTICLES}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    return await response.json();
  } catch (error: any) {
    return { success: false, articles: [] };
  }
}

export default {
  IVOR_API_URL,
  API_ENDPOINTS,
  submitArticleToIvor,
  moderateArticleViaIvor,
  getArticlesFromIvor,
};
