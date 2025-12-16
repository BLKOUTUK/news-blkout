import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// IVOR Liberation API configuration
const IVOR_API_BASE = process.env.IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

/**
 * Liberation validation for article submissions
 * Enforces creator sovereignty, cultural authenticity, and anti-oppression checks
 */
async function validateArticleLiberation(article: {
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
}): Promise<{
  passed: boolean;
  recommendation: 'publish' | 'review' | 'reject';
  liberationScore: number;
  concerns: string[];
  narrativeControl: 'creator-owned' | 'community-shared';
}> {
  const contentText = `${article.title} ${article.content || ''} ${article.excerpt || ''}`.toLowerCase();

  // Liberation alignment indicators
  const liberationIndicators = [
    'black queer', 'black trans', 'qtipoc', 'lgbtq', 'uk',
    'community', 'liberation', 'solidarity', 'healing', 'joy',
    'britain', 'london', 'manchester', 'birmingham'
  ];

  const alignmentCount = liberationIndicators.filter(ind => contentText.includes(ind)).length;
  const liberationScore = Math.min(1, alignmentCount / 5);

  // Anti-oppression checks
  const concerns: string[] = [];
  const problematicPatterns = [
    { pattern: /respectability politics|tone policing/i, concern: 'Respectability politics' },
    { pattern: /all lives matter/i, concern: 'All lives matter rhetoric' },
    { pattern: /reverse racism/i, concern: 'Reverse racism claims' }
  ];

  for (const { pattern, concern } of problematicPatterns) {
    if (pattern.test(contentText)) concerns.push(concern);
  }

  // Determine recommendation
  let recommendation: 'publish' | 'review' | 'reject' = 'review';
  if (liberationScore >= 0.4 && concerns.length === 0) {
    recommendation = 'publish';
  } else if (concerns.length > 1) {
    recommendation = 'reject';
  }

  return {
    passed: concerns.length === 0,
    recommendation,
    liberationScore,
    concerns,
    narrativeControl: 'creator-owned' // Always creator-owned per liberation values
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const {
        title,
        url,
        excerpt,
        category,
        content,
        submittedBy = 'anonymous',
        type = 'story'
      } = req.body;

      // Validation
      if (!title || !url) {
        return res.status(400).json({
          success: false,
          error: 'Title and URL are required',
        });
      }

      // Liberation validation - enforce community values
      const liberationCheck = await validateArticleLiberation({
        title,
        content: content || excerpt || '',
        excerpt,
        author: submittedBy
      });

      console.log('🏴‍☠️ Liberation validation:', liberationCheck);

      // Submit to news_articles with liberation-aware status
      // Auto-publish liberation-compliant content, otherwise send to review
      const articleStatus = liberationCheck.recommendation === 'publish' ? 'published' : 'review';
      const isAutoPublished = liberationCheck.recommendation === 'publish';

      const { data, error } = await supabase
        .from('news_articles')
        .insert([
          {
            title,
            source_url: url, // Maps to source_url in schema
            excerpt: excerpt || 'No excerpt provided',
            category: category || 'community',
            content: content || 'Content pending moderation',
            author: submittedBy,
            read_time: '5 min read', // Default read time, can be calculated later
            status: articleStatus,
            published: isAutoPublished,
            published_at: isAutoPublished ? new Date().toISOString() : null,
            // Liberation metadata (if columns exist)
            // liberation_score: liberationCheck.liberationScore,
            // narrative_control: liberationCheck.narrativeControl
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Supabase URL configured:', !!supabaseUrl);
        console.error('Supabase Key configured:', !!supabaseKey);
        return res.status(500).json({
          success: false,
          error: `Failed to submit article: ${error.message || 'Unknown error'}`,
          details: error.hint || error.details || 'No additional details'
        });
      }

      return res.status(201).json({
        success: true,
        message: isAutoPublished
          ? 'Article auto-published (liberation-compliant content)'
          : 'Article submitted for moderation',
        data,
        liberation: {
          score: liberationCheck.liberationScore,
          recommendation: liberationCheck.recommendation,
          narrativeControl: liberationCheck.narrativeControl,
          autoPublished: isAutoPublished
        }
      });
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
