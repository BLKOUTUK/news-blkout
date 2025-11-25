/**
 * Test RSS Parser endpoint
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Test 1: Basic response
    const step1 = 'Basic handler works';

    // Test 2: Dynamic import of rss-parser
    const Parser = (await import('rss-parser')).default;
    const step2 = 'rss-parser imported';

    // Test 3: Create parser instance
    const parser = new Parser({ timeout: 5000 });
    const step3 = 'Parser instance created';

    // Test 4: Try to fetch a simple feed
    const feed = await parser.parseURL('https://www.pinknews.co.uk/feed/');
    const step4 = `Fetched ${feed.items?.length || 0} items from PinkNews`;

    return res.status(200).json({
      success: true,
      steps: [step1, step2, step3, step4],
      sampleTitle: feed.items?.[0]?.title || 'No items'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
