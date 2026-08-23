#!/usr/bin/env node
/**
 * When the fortnight's vote did not separate the field, ask the moderators for
 * an editorial pick — via the agent bridge, which Bayard2 checks at 08:00 UK.
 *
 * Why this exists: with every upvote_count at zero the API's first sort key is
 * inert and ordering collapses to published_at desc. The digest then ships
 * "most recently published" dressed as a community verdict. That is a silent
 * fallback producing a clean-looking result, which is the failure mode we most
 * want out of this system. So: stop, and ask a human.
 *
 * Runs Sunday morning, after the fortnight closes at 23:59 Saturday.
 *
 * Needs: SUPABASE_ACCESS_TOKEN (management API)
 */
const REF = process.env.SUPABASE_PROJECT_REF || 'bgjengudzfickgomjqmz';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('✗ Set SUPABASE_ACCESS_TOKEN.');
  process.exit(1);
}

const sql = async (query) => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`SQL failed: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r.json();
};

const esc = (s) => String(s).replace(/'/g, "''");

// The period the digest is reporting on is the one that just CLOSED.
const [period] = await sql(`
  select id, period_number, start_date, end_date
  from voting_periods
  where status <> 'active'
  order by period_number desc
  limit 1;
`);
if (!period) {
  console.log('No closed voting period. Nothing to ask about.');
  process.exit(0);
}

const rows = await sql(`
  select id, title, upvote_count, is_featured, published_at
  from news_articles
  where voting_period_id = '${period.id}'
    and published = true and status = 'published'
  order by upvote_count desc nulls last, published_at desc
  limit 12;
`);

if (rows.length === 0) {
  console.log(`Period ${period.period_number} has no published articles — nothing to pick from.`);
  process.exit(0);
}

const alreadyPicked = rows.filter((r) => r.is_featured);
if (alreadyPicked.length > 0) {
  console.log(`Period ${period.period_number} already has ${alreadyPicked.length} editorial pick(s). Nothing to ask.`);
  process.exit(0);
}

const votes = rows.map((r) => r.upvote_count || 0);
const contested = votes[0] > 0 && new Set(votes).size > 1;
if (contested) {
  console.log(`Period ${period.period_number} IS contested (top ${votes[0]} votes). The vote decides — no ask.`);
  process.exit(0);
}

// Idempotent: never ask twice for the same period.
const marker = `editorial-pick:period-${period.period_number}`;
const [existing] = await sql(`
  select id from agent_bridge
  where refs like '%${esc(marker)}%' and status <> 'done'
  limit 1;
`);
if (existing) {
  console.log(`Already asked for period ${period.period_number} (bridge ${existing.id}). Not asking again.`);
  process.exit(0);
}

const candidates = rows.slice(0, 8)
  .map((r, i) => `${i + 1}. [${r.upvote_count || 0} votes] ${r.title}`)
  .join('\n');

const body = [
  `The community vote for period ${period.period_number} (${String(period.start_date).slice(0, 10)} to ${String(period.end_date).slice(0, 10)}) did not separate the field — top story has ${votes[0]} vote${votes[0] === 1 ? '' : 's'}.`,
  ``,
  `Without an editorial pick the weekly digest video will rank by recency and present it as a community verdict. Please ask the moderators to pick up to 3 stories for the digest.`,
  ``,
  `Candidates, most recent first:`,
  candidates,
  ``,
  `To pick: POST to /api/moderate with { action: "feature", articleId } — or unfeature to undo. Once picked, the digest renders with source: "editorial-pick".`,
].join('\n');

const [posted] = await sql(`
  select bridge_post(
    (select v from bayard2_secrets where k='bridge_token'),
    'claude', 'bayard2', 'task',
    '${esc(body)}',
    '${esc(marker)}',
    null
  ) as id;
`);

console.log(`✓ Asked Bayard2 for an editorial pick on period ${period.period_number} (bridge ${posted.id})`);
console.log(`  ${rows.length} published articles, top vote count ${votes[0]}`);
