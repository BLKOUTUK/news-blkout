#!/usr/bin/env node
/**
 * BLKOUT News — Monthly Analytics Report
 *
 * Read-only aggregate over news_articles. This is the function IVOR was
 * wrongly carrying ("what members prefer to hear about"), decoupled —
 * a standalone monthly read-only report. Not a service, not a path.
 *
 * Usage:  node scripts/monthly-news-report.mjs [out.html]
 *         No arg → stdout.
 * Needs:  SUPABASE_ACCESS_TOKEN  (management API)
 *         SUPABASE_PROJECT_REF   (optional; defaults to BLKOUT prod)
 */
import { writeFileSync } from 'fs';

const REF = process.env.SUPABASE_PROJECT_REF || 'bgjengudzfickgomjqmz';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('Set SUPABASE_ACCESS_TOKEN. Get one at https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

const out = process.argv[2];

// 30-day window ending now (UTC). Run on the 1st of the month for the previous month-ish.
const end = new Date();
const start = new Date(end.getTime() - 30 * 24 * 3600 * 1000);
const iso = (d) => d.toISOString();
const ymd = (d) => d.toISOString().slice(0, 10);

const q = async (sql) => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
};

const win = `'${iso(start)}' AND '${iso(end)}'`;

const [headline] = await q(`
  SELECT
    (SELECT count(*) FROM news_articles WHERE created_at BETWEEN ${win}) AS ingested,
    (SELECT count(*) FROM news_articles WHERE status='published' AND published_at BETWEEN ${win}) AS published,
    (SELECT count(*) FROM news_articles WHERE status='review') AS in_review,
    (SELECT count(*) FROM news_articles WHERE status='archived' AND updated_at BETWEEN ${win}) AS archived_in_window
`);

const byCat = await q(`
  SELECT category,
    count(*) AS n,
    COALESCE(sum(view_count), 0) AS views,
    COALESCE(sum(total_votes), 0) AS votes
  FROM news_articles
  WHERE status='published' AND published_at BETWEEN ${win}
  GROUP BY category
  ORDER BY votes DESC, views DESC, n DESC
`);

const topVotes = await q(`
  SELECT id, title, category, total_votes, view_count
  FROM news_articles
  WHERE status='published' AND published_at BETWEEN ${win}
  ORDER BY total_votes DESC NULLS LAST, upvote_count DESC NULLS LAST, view_count DESC NULLS LAST
  LIMIT 10
`);

const topViews = await q(`
  SELECT id, title, category, view_count, total_votes
  FROM news_articles
  WHERE status='published' AND view_count > 0
  ORDER BY view_count DESC
  LIMIT 10
`);

const periodResult = await q(`
  SELECT period_number, start_date, end_date,
    (SELECT count(*) FROM news_articles WHERE voting_period_id = vp.id AND status='published') AS published_in_period,
    (SELECT COALESCE(sum(total_votes),0) FROM news_articles WHERE voting_period_id = vp.id) AS votes_in_period
  FROM voting_periods vp
  WHERE status='active'
  ORDER BY period_number DESC
  LIMIT 1
`);
const period = periodResult[0];

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (n) => Number(n || 0).toLocaleString('en-GB');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BLKOUT News — Monthly Report (${ymd(start)} → ${ymd(end)})</title>
<meta name="robots" content="noindex,nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;1,400&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  :root{--ink:#1a1614;--muted:#6e635a;--paper:#faf7f2;--rule:rgba(26,22,20,.16);--accent:#7d5a3a;--votes:#7d8b5c;--views:#b86a3e}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--paper);color:var(--ink);font-family:'Public Sans',system-ui,sans-serif;font-size:15px;line-height:1.6;padding:5vh 6vw 12vh;max-width:1080px;margin:0 auto;-webkit-font-smoothing:antialiased}
  .kicker{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);font-weight:600;margin-bottom:.6rem}
  h1{font-family:'Newsreader',serif;font-weight:600;font-size:clamp(2rem,4.2vw,3.1rem);line-height:1.1;letter-spacing:-.01em;margin-bottom:.6rem}
  h2{font-family:'Newsreader',serif;font-weight:600;font-size:1.55rem;margin:2.6rem 0 .9rem;border-top:1px solid var(--rule);padding-top:1.6rem}
  p.lead{font-size:1.02rem;color:var(--muted);max-width:62ch;margin-bottom:1.5rem}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1.4rem;margin:1.6rem 0 2rem}
  .stat{border-top:2px solid var(--ink);padding-top:.7rem}
  .stat .n{font-family:'Newsreader',serif;font-weight:700;font-size:2.4rem;line-height:1;letter-spacing:-.01em}
  .stat .lab{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-top:.4rem}
  table{width:100%;border-collapse:collapse;font-size:14px;margin:.6rem 0 1.3rem}
  th,td{padding:.6rem .8rem;text-align:left;border-bottom:1px solid var(--rule);vertical-align:top}
  th{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:600;border-bottom:2px solid var(--ink)}
  td.num,th.num{text-align:right;font-family:'IBM Plex Mono',monospace;font-size:13px}
  .bar{display:inline-block;height:7px;background:var(--votes);border-radius:1px;vertical-align:middle;margin-right:.5rem}
  .title{max-width:60ch;line-height:1.35}
  .note{font-size:13px;color:var(--muted);font-style:italic;margin:.4rem 0 1rem;max-width:62ch}
  .colophon{margin-top:3rem;padding-top:1.3rem;border-top:1px solid var(--rule);font-size:12px;color:var(--muted);letter-spacing:.02em;line-height:1.7}
  .colophon code{font-family:'IBM Plex Mono',monospace;font-size:11.5px}
  @media(max-width:680px){.stats{grid-template-columns:repeat(2,1fr)}}
</style>
</head>
<body>

<div class="kicker">BLKOUT News · Monthly Analytics</div>
<h1>Members' attention, last 30 days.</h1>
<p class="lead">A read-only aggregate over the news pipeline — what was ingested, what got published, what the room voted up, what got read. Window: <strong>${ymd(start)} → ${ymd(end)}</strong>.</p>

<div class="stats">
  <div class="stat"><div class="n">${num(headline.ingested)}</div><div class="lab">Ingested</div></div>
  <div class="stat"><div class="n">${num(headline.published)}</div><div class="lab">Published</div></div>
  <div class="stat"><div class="n">${num(headline.in_review)}</div><div class="lab">In review now</div></div>
  <div class="stat"><div class="n">${num(headline.archived_in_window)}</div><div class="lab">Archived in window</div></div>
</div>

<h2>What members preferred — by category</h2>
<p class="note">Votes and views on stories published in the window. The signal the function IVOR was wrongly carrying — now a read-only report, decoupled from the publish path.</p>
${byCat.length === 0 ? '<p class="note">No published stories in this window yet.</p>' : (() => {
  const maxV = Math.max(...byCat.map(x => Number(x.votes || 0)), 1);
  return `<table>
<thead><tr><th>Category</th><th class="num">Stories</th><th class="num">Votes</th><th class="num">Views</th></tr></thead>
<tbody>
${byCat.map(r => {
  const w = Math.round((Number(r.votes || 0) / maxV) * 120);
  return `<tr><td>${esc(r.category || '(none)')}</td><td class="num">${num(r.n)}</td><td class="num"><span class="bar" style="width:${w}px"></span>${num(r.votes)}</td><td class="num">${num(r.views)}</td></tr>`;
}).join('')}
</tbody>
</table>`;
})()}

<h2>Top stories — by votes</h2>
${topVotes.length === 0 ? '<p class="note">No published stories in this window.</p>' : `<table>
<thead><tr><th class="num">#</th><th>Story</th><th>Category</th><th class="num">Votes</th><th class="num">Views</th></tr></thead>
<tbody>
${topVotes.map((r, i) => `<tr><td class="num">${i + 1}</td><td class="title">${esc(r.title)}</td><td>${esc(r.category || '')}</td><td class="num">${num(r.total_votes)}</td><td class="num">${num(r.view_count)}</td></tr>`).join('')}
</tbody>
</table>`}

<h2>Top stories — by views</h2>
${topViews.length === 0 ? '<p class="note">Views have only just started being counted (wired 19 May 2026). The view leaderboard will populate from here forward.</p>' : `<table>
<thead><tr><th class="num">#</th><th>Story</th><th>Category</th><th class="num">Views</th><th class="num">Votes</th></tr></thead>
<tbody>
${topViews.map((r, i) => `<tr><td class="num">${i + 1}</td><td class="title">${esc(r.title)}</td><td>${esc(r.category || '')}</td><td class="num">${num(r.view_count)}</td><td class="num">${num(r.total_votes)}</td></tr>`).join('')}
</tbody>
</table>`}

<h2>Active voting period</h2>
${period ? `<table>
<tbody>
<tr><td>Period number</td><td class="num">${num(period.period_number)}</td></tr>
<tr><td>Window</td><td>${ymd(new Date(period.start_date))} → ${ymd(new Date(period.end_date))}</td></tr>
<tr><td>Published in period</td><td class="num">${num(period.published_in_period)}</td></tr>
<tr><td>Votes in period</td><td class="num">${num(period.votes_in_period)}</td></tr>
</tbody>
</table>` : '<p class="note">No active voting period.</p>'}

<div class="colophon">
Source: <code>news_articles</code>, <code>voting_periods</code> via Supabase management API. Generated ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC.<br>
BLKOUT UK · news.blkoutuk.com · Decoupled from the publish path, by design.
</div>

</body>
</html>`;

if (out) {
  writeFileSync(out, html);
  console.error(`Wrote ${out} (${html.length} bytes)`);
} else {
  process.stdout.write(html);
}
