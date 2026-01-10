/**
 * Seed Published Articles Script
 *
 * This script populates the news_articles table with published articles
 * to fix the empty newsroom issue on news.blkoutuk.cloud
 *
 * Usage:
 *   npx tsx scripts/seed-published-articles.ts
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Environment variables (from Vercel production)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('\nPlease set these environment variables and try again.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface SeedArticle {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  source_url: string;
  source_name: string;
  featured_image?: string;
  tags: string[];
  interest_score: number;
}

// Sample published articles (UK Black LGBTQ+ focused)
const SEED_ARTICLES: SeedArticle[] = [
  {
    title: "Black Pride UK Announces 2026 Festival Lineup",
    excerpt: "The UK's largest celebration of Black LGBTQ+ culture returns with an incredible lineup celebrating resilience, joy, and community power.",
    content: `Black Pride UK has announced the lineup for its 2026 festival, promising the biggest celebration yet of Black LGBTQ+ culture and community in Britain.

The festival, which takes place in London this summer, will feature performances, workshops, and community spaces dedicated to Black queer joy, healing, and liberation.

"This year's theme is 'Our Stories, Our Power,'" said festival director Marcus Johnson. "We're creating spaces where Black LGBTQ+ people can see themselves reflected, celebrated, and uplifted."

The lineup includes performances from emerging and established Black queer artists, panel discussions on intersectional liberation, and workshops on community care and mutual aid.

Black Pride UK has grown significantly since its founding, becoming a cornerstone event for the UK's Black LGBTQ+ community and allies.`,
    category: 'community',
    author: 'Sarah Thompson',
    source_url: 'https://example.com/black-pride-uk-2026',
    source_name: 'Community News',
    featured_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200',
    tags: ['black pride', 'lgbtq', 'uk', 'festival', 'community'],
    interest_score: 85,
  },
  {
    title: "New Study Shows Mental Health Support Gaps for Black Trans Youth",
    excerpt: "Research reveals significant barriers to mental health care for Black transgender young people in Britain, calling for urgent policy changes.",
    content: `A groundbreaking study published today highlights the urgent need for improved mental health support for Black transgender youth in the UK.

The research, conducted by the UK Trans Health Research Institute, surveyed 500 Black trans young people aged 16-25 and found that 78% had difficulty accessing appropriate mental health care.

Key findings include:
- 65% reported experiencing discrimination in healthcare settings
- 72% said providers lacked understanding of intersectional identities
- Only 23% felt their cultural background was considered in treatment

"These findings are alarming but not surprising," said Dr. Amara Williams, lead researcher. "Black trans youth face compounded barriers - racism, transphobia, and systemic healthcare inequities."

The study recommends increased funding for culturally competent mental health services, mandatory intersectional training for providers, and community-led support programs.

Several Black-led LGBTQ+ organizations are already developing peer support networks and working with the NHS to improve care pathways.`,
    category: 'health',
    author: 'Dr. Kwame Osei',
    source_url: 'https://example.com/black-trans-mental-health-study',
    source_name: 'Health Research UK',
    tags: ['mental health', 'transgender', 'black', 'youth', 'uk', 'healthcare'],
    interest_score: 92,
  },
  {
    title: "Black Queer Artists Collective Wins Arts Council Funding",
    excerpt: "London-based collective securing major funding to support emerging Black LGBTQ+ creatives across music, visual arts, and performance.",
    content: `The Black Queer Artists Collective (BQAC) has been awarded £250,000 in Arts Council England funding to support emerging Black LGBTQ+ artists across the UK.

The three-year grant will fund mentorship programs, studio spaces, and exhibition opportunities for Black queer creatives working in music, visual arts, theatre, and performance.

"This funding is transformative," said BQAC founder Jasmine Rivers. "For too long, Black queer artists have been underrepresented in mainstream arts institutions. We're creating our own spaces."

The collective plans to:
- Launch 12 artist residencies annually
- Create a touring exhibition showcasing Black LGBTQ+ art
- Develop mentorship programs connecting established and emerging artists
- Host quarterly community art events

BQAC was founded in 2023 by a group of Black queer artists frustrated with the lack of representation and support in traditional arts spaces. Since then, it has supported over 100 artists and held exhibitions in London, Manchester, and Birmingham.

"Art is liberation," Rivers added. "Through our work, we're not just creating beautiful things - we're changing narratives and building community power."`,
    category: 'culture',
    author: 'Tariq Ahmed',
    source_url: 'https://example.com/bqac-arts-council-funding',
    source_name: 'Arts & Culture UK',
    tags: ['arts', 'black', 'queer', 'lgbtq', 'funding', 'culture', 'uk'],
    interest_score: 78,
  },
  {
    title: "Government Announces Review of Conversion Therapy Ban to Include Race",
    excerpt: "Campaigners welcome expanded review that will examine intersection of race and sexuality in harmful conversion practices.",
    content: `The UK government has announced an expanded review of conversion therapy laws to specifically address the intersection of race and LGBTQ+ identity.

The review, prompted by years of campaigning from Black LGBTQ+ activists, will examine how conversion practices disproportionately affect Black and minority ethnic queer people.

"This is a significant victory," said Marcus Thompson of Black Pride UK. "For years, we've been saying that conversion therapy in Black communities has unique characteristics that must be addressed."

The review will investigate:
- Faith-based conversion practices in African and Caribbean diaspora communities
- Cultural and family pressures specific to Black LGBTQ+ individuals
- Access to support services for survivors
- Gaps in current proposed legislation

Research shows that Black LGBTQ+ people are more likely to be subjected to conversion practices, often in religious settings, but less likely to report or seek help due to community ties and cultural factors.

The expanded review is expected to take 6 months, with recommendations for legislation to follow. Advocates are calling for survivor-led approaches and culturally competent support services.`,
    category: 'politics',
    author: 'Aisha Patel',
    source_url: 'https://example.com/conversion-therapy-race-review',
    source_name: 'Political News UK',
    tags: ['politics', 'conversion therapy', 'black', 'lgbtq', 'uk', 'policy'],
    interest_score: 88,
  },
  {
    title: "Manchester's First Black LGBTQ+ Community Center Opens",
    excerpt: "New hub provides safe space, resources, and support for Black queer communities in Greater Manchester.",
    content: `Manchester has welcomed its first dedicated Black LGBTQ+ community center, marking a milestone for representation and support in the North West.

The Unity Hub, located in Moss Side, officially opened this weekend with a celebration attended by over 200 community members, local officials, and supporters.

"This space is long overdue," said center director Kofi Mensah. "Black LGBTQ+ people in Manchester have been organizing and supporting each other for decades. Now we have a permanent home."

The center offers:
- Weekly peer support groups
- Mental health counseling with culturally competent therapists
- Youth programs and mentorship
- Community events and celebrations
- Resources for navigating healthcare, housing, and employment
- Meeting spaces for Black-led LGBTQ+ organizations

The £500,000 project was funded through community fundraising, grants from Manchester City Council, and support from national LGBTQ+ charities.

"We've designed this space by and for the community," Mensah explained. "Every program, every service, every decision has been community-led."

The Unity Hub joins a growing network of Black LGBTQ+ spaces across the UK, including centers in London, Birmingham, and Bristol. Organizers hope it will serve as a model for other cities.

Plans are already underway to expand services, including a transgender support program and partnerships with local universities for research on Black LGBTQ+ health and wellbeing.`,
    category: 'community',
    author: 'Leyla Hassan',
    source_url: 'https://example.com/manchester-black-lgbtq-center',
    source_name: 'Manchester Community News',
    tags: ['community center', 'black', 'lgbtq', 'manchester', 'uk', 'safe space'],
    interest_score: 82,
  },
];

async function generateUrlHash(url: string): Promise<string> {
  return crypto.createHash('md5').update(url.toLowerCase().trim()).digest('hex');
}

async function seedArticles() {
  console.log('🌱 Starting article seeding...\n');

  let inserted = 0;
  let skipped = 0;

  for (const article of SEED_ARTICLES) {
    try {
      const urlHash = await generateUrlHash(article.source_url);

      // Check if article already exists
      const { data: existing } = await supabase
        .from('news_articles')
        .select('id')
        .eq('url_hash', urlHash)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️  Skipped (already exists): ${article.title}`);
        skipped++;
        continue;
      }

      // Insert article with BOTH published=true AND status='published'
      const { error } = await supabase
        .from('news_articles')
        .insert({
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          category: article.category,
          author: article.author,
          source_url: article.source_url,
          source_name: article.source_name,
          featured_image: article.featured_image,
          image_alt: article.title,
          topics: article.tags,
          interest_score: article.interest_score,
          url_hash: urlHash,
          read_time: `${Math.ceil(article.content.split(/\s+/).length / 200)} min read`,

          // CRITICAL: Set BOTH fields to ensure articles appear
          published: true,
          status: 'published',

          // Additional fields
          moderation_status: 'auto-approved',
          total_votes: 0,
          upvote_count: 0,
          view_count: 0,
          is_featured: false,
          is_story_of_week: false,
          published_at: new Date().toISOString(),
        });

      if (error) {
        console.error(`❌ Failed to insert: ${article.title}`);
        console.error(`   Error:`, error.message);
        continue;
      }

      console.log(`✅ Inserted: ${article.title}`);
      inserted++;

    } catch (error) {
      console.error(`❌ Error processing: ${article.title}`);
      console.error(`   Error:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✨ Seeding complete!`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log(`   Total:    ${SEED_ARTICLES.length}`);
  console.log('='.repeat(60));

  // Verify articles are queryable
  console.log('\n🔍 Verifying articles can be queried...');

  const { data: publishedArticles, error: queryError } = await supabase
    .from('news_articles')
    .select('id, title, published, status')
    .eq('published', true)
    .eq('status', 'published')
    .limit(10);

  if (queryError) {
    console.error('❌ Query verification failed:', queryError.message);
  } else {
    console.log(`✅ Successfully queried ${publishedArticles?.length || 0} published articles`);
    if (publishedArticles && publishedArticles.length > 0) {
      console.log('\nSample articles:');
      publishedArticles.slice(0, 3).forEach((a) => {
        console.log(`   - ${a.title} (published=${a.published}, status=${a.status})`);
      });
    }
  }
}

// Run seeding
seedArticles().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
