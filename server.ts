import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import newsById from './api/news/[id].ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// ---------------------------------------------------------------------------
// Crawlable HTML for / and /article/:id (14 Sep 2026).
// The SPA still mounts and takes over; these routes give a crawler — and a person
// before JavaScript runs — the real title, description, canonical, schema and text
// instead of the empty shell. Registered BEFORE express.static so / is ours.
// On any failure they fall through (next()) to the plain shell and log why.
// ---------------------------------------------------------------------------
const SITE = 'https://news.blkoutuk.com';
const publicDb = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (v: unknown) => String(v ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&#8217;|&rsquo;/g, '’').replace(/&#8216;|&lsquo;/g, '‘').replace(/&#8220;|&ldquo;/g, '“').replace(/&#8221;|&rdquo;/g, '”')
  .replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
// Article bodies arrive from feeds as HTML fragments. Drop the feed boilerplate tail and anything executable.
const cleanContent = (v: unknown) => String(v ?? '')
  .replace(/The post [\s\S]*? appeared first on [\s\S]*$/, '')
  .replace(/<(script|iframe|style|object|embed)[\s\S]*?<\/\1>/gi, '')
  .replace(/\son\w+="[^"]*"/gi, '')
  .replace(/javascript:/gi, '')
  .trim();
const jsonLd = (obj: unknown) => JSON.stringify(obj).replace(/</g, '\\u003c');
let shellCache = '';
const shell = () => shellCache || (shellCache = fs.readFileSync(path.join(__dirname, 'dist', 'index.html'), 'utf8'));
function withHead(html: string, h: { title: string; description: string; canonical: string; jsonld?: string; image?: string }) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(h.title)}</title>\n    <link rel="canonical" href="${esc(h.canonical)}" />${h.jsonld ? `\n    <script type="application/ld+json">${h.jsonld}</script>` : ''}`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(h.description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(h.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(h.description)}" />`)
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(h.image || SITE + '/pwa-512x512.png')}" />\n    <meta property="og:url" content="${esc(h.canonical)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(h.title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(h.description)}" />`);
}
const withRoot = (html: string, inner: string) => html.replace('<div id="root"></div>', `<div id="root">${inner}</div>`);
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

app.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await publicDb.from('news_articles')
      .select('id, title, excerpt, source_name, published_at')
      .eq('published', true).eq('status', 'published')
      .order('published_at', { ascending: false }).limit(60);
    if (error) throw error;
    const items = (data || []).map((a) =>
      `<li><a href="/article/${a.id}">${esc(a.title)}</a>${a.source_name ? ` <span>— ${esc(a.source_name)}</span>` : ''}${a.published_at ? ` <time datetime="${esc(a.published_at)}">${fmtDate(a.published_at)}</time>` : ''}${a.excerpt ? `<p>${esc(stripTags(a.excerpt).slice(0, 220))}</p>` : ''}</li>`).join('\n');
    const inner = `<main><h1>BLKOUT News — the liberation newsroom</h1><p>Community-curated news for Black queer liberation: stories that matter, selected by us, for us, and voted on by the BLKOUT community.</p><ul>${items}</ul></main>`;
    res.setHeader('Cache-Control', 'no-store');
    res.send(withHead(withRoot(shell(), inner), {
      title: 'BLKOUT News — the liberation newsroom',
      description: 'Community-curated news for Black queer liberation. Stories that matter, selected by us, for us, and voted on by the BLKOUT community each week.',
      canonical: `${SITE}/`,
      jsonld: jsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'BLKOUT News', url: SITE, publisher: { '@type': 'Organization', name: 'BLKOUT UK', url: 'https://blkoutuk.com' } }),
    }));
  } catch (e) { console.error('HOME RENDER FAILED — serving bare shell:', e); next(); }
});

app.get('/article/:id', async (req, res, next) => {
  const id = req.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return next();
  try {
    const { data: a, error } = await publicDb.from('news_articles')
      .select('id, title, excerpt, content, author, source_name, source_url, featured_image, hero_image, published_at, updated_at, topics')
      .eq('id', id).eq('published', true).eq('status', 'published').single();
    if (error || !a) { res.status(404); return res.send(shell()); }
    const description = stripTags(a.excerpt || a.content).slice(0, 300);
    const image = a.hero_image || a.featured_image || `${SITE}/pwa-512x512.png`;
    const jsonld = jsonLd({
      '@context': 'https://schema.org', '@type': 'NewsArticle',
      headline: a.title, description, image,
      datePublished: a.published_at, dateModified: a.updated_at || a.published_at,
      author: a.author ? { '@type': 'Person', name: a.author } : { '@type': 'Organization', name: a.source_name || 'BLKOUT UK' },
      publisher: { '@type': 'Organization', name: 'BLKOUT UK', url: 'https://blkoutuk.com' },
      mainEntityOfPage: `${SITE}/article/${a.id}`,
      ...(a.source_url ? { isBasedOn: a.source_url } : {}),
      ...(Array.isArray(a.topics) && a.topics.length ? { keywords: a.topics.join(', ') } : {}),
    });
    const meta = [a.source_name ? `From ${esc(a.source_name)}` : '', a.author ? esc(a.author) : '', a.published_at ? fmtDate(a.published_at) : ''].filter(Boolean).join(' · ');
    const inner = `<article><h1>${esc(a.title)}</h1>${meta ? `<p>${meta}</p>` : ''}${a.excerpt ? `<p>${esc(stripTags(a.excerpt))}</p>` : ''}<div>${cleanContent(a.content)}</div>${a.source_url ? `<p><a href="${esc(a.source_url)}" rel="noopener">Read the full story at ${esc(a.source_name || 'the source')}</a></p>` : ''}<p><a href="/">More from BLKOUT News</a></p></article>`;
    res.setHeader('Cache-Control', 'no-store');
    res.send(withHead(withRoot(shell(), inner), { title: `${a.title} | BLKOUT News`, description, canonical: `${SITE}/article/${a.id}`, jsonld, image }));
  } catch (e) { console.error('ARTICLE RENDER FAILED — serving bare shell:', e); next(); }
});

// api/news/[id].ts is a nested (Vercel-style) route the api/ loader never reaches, so
// /api/news/:id was answering with the SPA shell and the article page could not load.
// req.query is a getter-only accessor in Express 5, so the handler gets a child object
// carrying its own query.id rather than a mutated request.
app.get('/api/news/:id', async (req, res) => {
  try {
    const withId = Object.create(req);
    Object.defineProperty(withId, 'query', { value: { ...req.query, id: req.params.id }, enumerable: true });
    await newsById(withId as any, res as any);
  } catch (error) {
    console.error('/api/news/:id failed:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/sitemap.xml', async (_req, res) => {
  try {
    const { data, error } = await publicDb.from('news_articles').select('id, published_at, updated_at')
      .eq('published', true).eq('status', 'published').order('published_at', { ascending: false }).limit(2000);
    if (error) throw error;
    const urls = [`  <url><loc>${SITE}/</loc><changefreq>daily</changefreq></url>`].concat((data || []).map((a) => {
      const lm = (a.updated_at || a.published_at || '').slice(0, 10);
      return `  <url><loc>${SITE}/article/${a.id}</loc>${lm ? `<lastmod>${lm}</lastmod>` : ''}</url>`;
    }));
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`);
  } catch (e) { console.error('SITEMAP FAILED:', e); res.status(500).send('Error generating sitemap'); }
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

import fs from 'fs';
import cron from 'node-cron';
// Note: Using native fetch (Node.js 18+), no need for node-fetch package

// Dynamically import and register API routes, then start server
const apiDir = path.join(__dirname, 'api');

async function startServer() {
  // Load all API routes first
  const apiFiles = fs.readdirSync(apiDir);
  for (const file of apiFiles) {
    // Support both .js and .ts files (tsx runs .ts directly)
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const routeName = file.slice(0, -3);
      try {
        const module = await import(path.join(apiDir, file));
        if (module.default) {
          app.all(`/api/${routeName}`, module.default);
          console.log(`✅ Registered route: /api/${routeName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load route /api/${routeName}:`, error);
      }
    }
  }
  console.log(`🚀 All API routes registered`);

  // Schedule the cron job to fetch news every day at 6am and 6pm
  cron.schedule('0 6,18 * * *', async () => {
    console.log('Running cron job: fetching news...');
    try {
      const response = await fetch(`http://localhost:${port}/api/fetch-news`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        }
      });
      if (response.ok) {
        console.log('Cron job completed successfully.');
      } else {
        console.error('Cron job failed:', response.statusText);
      }
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });

  // Schedule fortnightly voting period rotation: every other Sunday at midnight UK time
  // Cron: "0 0 * * 0" = every Sunday at midnight. The endpoint itself is idempotent —
  // it only rotates if the active period's end_date has passed, so running weekly is safe.
  cron.schedule('0 0 * * 0', async () => {
    console.log('Running cron job: checking voting period rotation...');
    try {
      // First check if the active period has ended
      const checkRes = await fetch(`http://localhost:${port}/api/voting-period`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.success && checkData.data && checkData.data.daysRemaining <= 0) {
          console.log('Active period has ended — rotating...');
          const rotateRes = await fetch(`http://localhost:${port}/api/rotate-period`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.CRON_SECRET}`
            }
          });
          if (rotateRes.ok) {
            const result = await rotateRes.json();
            console.log('Voting period rotation completed:', JSON.stringify(result.data?.archivedPeriod?.winners || []));
          } else {
            console.error('Period rotation failed:', rotateRes.statusText);
          }
        } else {
          console.log('Active period still has days remaining — skipping rotation.');
        }
      }
    } catch (error) {
      console.error('Period rotation cron error:', error);
    }
  });

  // Retired 10 Sep 2026: the in-app moderation page had no sign-in and its writes
  // now 401 against ivor-core. Moderation lives on comms.blkoutuk.com behind login.
  app.get(['/admin', '/admin/*splat'], (_req, res) => res.redirect(301, 'https://comms.blkoutuk.com/admin/news'));

  // SPA fallback: serve index.html for any request that doesn't match an API route or a static file
  // Note: Using app.use() instead of app.get('*') for Express 5.x compatibility
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  // Start server AFTER all routes are registered
  app.listen(port, () => {
    console.log(`🏴‍☠️ News BLKOUT server running on port ${port}`);
    console.log(`📰 API endpoints ready at /api/*`);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
