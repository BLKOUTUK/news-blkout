/**
 * Diagnose Empty Newsroom Script
 *
 * This script diagnoses why news.blkoutuk.cloud shows no articles
 * by checking the database state and query filters
 *
 * Usage:
 *   npx tsx scripts/diagnose-empty-newsroom.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('\nPlease set these environment variables and try again.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnose() {
  console.log('🔍 Diagnosing Empty Newsroom Issue\n');
  console.log('='.repeat(60));

  // 1. Check total articles
  console.log('\n1️⃣ Checking total articles in database...');
  const { count: totalCount, error: totalError } = await supabase
    .from('news_articles')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    console.error('   ❌ Error:', totalError.message);
  } else {
    console.log(`   ✅ Total articles: ${totalCount || 0}`);
  }

  // 2. Check articles by status
  console.log('\n2️⃣ Checking articles by status...');
  const statuses = ['draft', 'review', 'published', 'archived'];

  for (const status of statuses) {
    const { count, error } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (error) {
      console.error(`   ❌ status='${status}': Error - ${error.message}`);
    } else {
      console.log(`   ${count === 0 ? '⚠️' : '✅'} status='${status}': ${count || 0} articles`);
    }
  }

  // 3. Check articles by published boolean
  console.log('\n3️⃣ Checking articles by published boolean...');

  const { count: publishedTrue, error: pubTrueError } = await supabase
    .from('news_articles')
    .select('*', { count: 'exact', head: true })
    .eq('published', true);

  const { count: publishedFalse, error: pubFalseError } = await supabase
    .from('news_articles')
    .select('*', { count: 'exact', head: true })
    .eq('published', false);

  if (pubTrueError) {
    console.error('   ❌ published=true: Error -', pubTrueError.message);
  } else {
    console.log(`   ${publishedTrue === 0 ? '⚠️' : '✅'} published=true: ${publishedTrue || 0} articles`);
  }

  if (pubFalseError) {
    console.error('   ❌ published=false: Error -', pubFalseError.message);
  } else {
    console.log(`   ${publishedFalse === 0 ? '✅' : '⚠️'} published=false: ${publishedFalse || 0} articles`);
  }

  // 4. Check articles with BOTH filters (what the API uses)
  console.log('\n4️⃣ Checking articles with API filters (published=true AND status=\'published\')...');

  const { data: apiArticles, count: apiCount, error: apiError } = await supabase
    .from('news_articles')
    .select('id, title, published, status, created_at', { count: 'exact' })
    .eq('published', true)
    .eq('status', 'published')
    .limit(5);

  if (apiError) {
    console.error('   ❌ Error:', apiError.message);
  } else {
    console.log(`   ${apiCount === 0 ? '❌' : '✅'} API query returns: ${apiCount || 0} articles`);

    if (apiArticles && apiArticles.length > 0) {
      console.log('\n   Sample articles that WILL appear on site:');
      apiArticles.forEach((a) => {
        console.log(`      - ${a.title}`);
        console.log(`        published=${a.published}, status='${a.status}'`);
      });
    }
  }

  // 5. Root cause analysis
  console.log('\n' + '='.repeat(60));
  console.log('📊 ROOT CAUSE ANALYSIS:\n');

  if (totalCount === 0) {
    console.log('❌ PROBLEM: No articles in database at all');
    console.log('   SOLUTION: Run seed script or fetch news from RSS feeds');
    console.log('   Command:  npx tsx scripts/seed-published-articles.ts');
  } else if (apiCount === 0) {
    console.log('❌ PROBLEM: Articles exist but none match API filters');
    console.log('   Current state:');
    console.log(`      - Total articles: ${totalCount}`);
    console.log(`      - With published=true: ${publishedTrue || 0}`);
    console.log(`      - With status='published': (check above)`);
    console.log(`      - With BOTH: ${apiCount || 0}`);
    console.log('\n   SOLUTION: Update existing articles to set BOTH fields:');
    console.log('   SQL: UPDATE news_articles SET published=true, status=\'published\' WHERE status=\'review\';');
    console.log('   OR run: npx tsx scripts/seed-published-articles.ts');
  } else {
    console.log('✅ SUCCESS: Database has published articles');
    console.log(`   ${apiCount} articles should appear on news.blkoutuk.cloud`);
    console.log('\n   If site still shows no articles, check:');
    console.log('      1. Frontend environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
    console.log('      2. CORS configuration on Supabase');
    console.log('      3. RLS policies on news_articles table');
    console.log('      4. Browser console for API errors');
  }

  console.log('='.repeat(60));

  // 6. Check RLS policies
  console.log('\n5️⃣ Checking Row Level Security policies...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('get_policies', { table_name: 'news_articles' })
    .catch(() => ({ data: null, error: { message: 'RPC not available (expected)' }}));

  if (policiesError && !policiesError.message.includes('not available')) {
    console.error('   ⚠️  Could not check RLS policies:', policiesError.message);
    console.log('   Manual check: Go to Supabase → Authentication → Policies');
  } else {
    console.log('   ℹ️  RLS check skipped (requires manual verification in Supabase dashboard)');
    console.log('   Ensure policy exists: SELECT policies allow anonymous reads for published articles');
  }

  console.log('\n✨ Diagnosis complete!\n');
}

diagnose().catch((error) => {
  console.error('❌ Diagnosis failed:', error);
  process.exit(1);
});
