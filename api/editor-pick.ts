import type { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(process.env.SUPABASE_URL || '', serviceKey);

const MAX_PICKS = 3;

/**
 * GET  /api/editor-pick?period=&exp=&sig=   — the pick page for a closing round
 * POST /api/editor-pick {period, exp, sig, articleId, featured}
 *
 * The link arrives by Telegram on the Saturday morning a round closes
 * (comms-blkout: editorial-pick-telegram.yml). It is signed with the service
 * key over period+expiry, so only that message's link works, and only until
 * the round ends. Picks set is_featured; rotate-period and top-stories then
 * prefer them whenever the vote didn't separate the field.
 */
export function signPickLink(periodId: string, exp: number | string): string {
  return createHmac('sha256', serviceKey).update(`editor-pick:${periodId}:${exp}`).digest('hex');
}

function linkProblem(period: unknown, exp: unknown, sig: unknown): string | null {
  if (!serviceKey) return 'FAILED: the news server has no service key, so picks cannot be saved.';
  if (typeof period !== 'string' || typeof sig !== 'string' || !exp) return 'This pick link is incomplete.';
  if (Number(exp) < Date.now() / 1000) return 'This round has closed, so the pick link has expired.';
  const expected = Buffer.from(signPickLink(period, String(exp)));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return 'This pick link is not valid.';
  }
  return null;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const page = (body: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Editor's pick · BLKOUT News</title>
<style>
body{margin:0;background:#000;color:#fff;font:16px/1.45 "Work Sans",system-ui,sans-serif;padding:24px 16px}
main{max-width:640px;margin:0 auto}h1{color:#FFD700;font-size:22px;margin:0 0 4px}
p.sub{color:#aaa;margin:0 0 20px}ol{list-style:none;padding:0;margin:0}
li{border:1px solid #333;border-radius:12px;padding:14px;margin-bottom:10px;display:flex;gap:12px;align-items:center}
li.on{border-color:#FFD700;background:#1a1600}.t{flex:1;min-width:0}.t a{color:#fff;text-decoration:none;font-weight:600}
.m{color:#888;font-size:13px}button{font:inherit;font-weight:700;border-radius:999px;padding:8px 16px;cursor:pointer;
border:1px solid #FFD700;background:transparent;color:#FFD700;white-space:nowrap}li.on button{background:#FFD700;color:#000}
button:disabled{opacity:.4;cursor:default}.msg{color:#FFD700;min-height:1.4em}
</style></head><body><main>${body}</main></body></html>`;

export default async function handler(req: Request, res: Response) {
  const params = req.method === 'POST' ? req.body || {} : req.query;
  const problem = linkProblem(params.period, params.exp, params.sig);

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (problem) return res.status(403).send(page(`<h1>Editor's pick</h1><p class="sub">${esc(problem)}</p>`));

    const { data: period } = await supabase
      .from('voting_periods')
      .select('period_number, end_date')
      .eq('id', params.period)
      .maybeSingle();
    const { data: stories, error } = await supabase
      .from('news_articles')
      .select('id, title, source_name, source_url, upvote_count, is_featured')
      .eq('voting_period_id', params.period)
      .eq('published', true)
      .eq('status', 'published')
      .order('upvote_count', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(12);

    if (!period || error) {
      return res.status(500).send(page(`<h1>Editor's pick</h1><p class="sub">FAILED to load this round's stories.</p>`));
    }

    const picked = (stories || []).filter((s) => s.is_featured).length;
    const rows = (stories || []).map((s) => `
      <li class="${s.is_featured ? 'on' : ''}">
        <div class="t"><a href="${esc(s.source_url)}" target="_blank" rel="noopener">${esc(s.title)}</a>
          <div class="m">${esc(s.source_name)} · ${s.upvote_count || 0} ${s.upvote_count === 1 ? 'vote' : 'votes'}</div></div>
        <button data-id="${esc(s.id)}" data-on="${s.is_featured ? '1' : ''}"
          ${!s.is_featured && picked >= MAX_PICKS ? 'disabled' : ''}>${s.is_featured ? 'Picked' : 'Pick'}</button>
      </li>`).join('');

    return res.status(200).send(page(`
      <h1>Round ${esc(period.period_number)}: editor's pick</h1>
      <p class="sub">Choose up to ${MAX_PICKS}. Voting closes at midnight tonight; if the vote separates the field, it wins.
        Otherwise your picks lead the round's results and Sunday's video. Tap again to unpick.</p>
      <p class="msg" id="msg">${picked} of ${MAX_PICKS} picked</p>
      <ol id="picks" data-period="${esc(params.period)}" data-exp="${esc(params.exp)}" data-sig="${esc(params.sig)}">${rows || '<li>No published stories in this round.</li>'}</ol>
      <script>
        const { period, exp, sig } = document.getElementById('picks').dataset;
        const link = { period, exp, sig };
        document.querySelectorAll('button[data-id]').forEach((b) => b.addEventListener('click', async () => {
          b.disabled = true;
          const r = await fetch('/api/editor-pick', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...link, articleId: b.dataset.id, featured: !b.dataset.on }) });
          const d = await r.json().catch(() => ({}));
          if (r.ok) location.reload();
          else { document.getElementById('msg').textContent = d.error || 'FAILED to save'; b.disabled = false; }
        }));
      </script>`));
  }

  if (req.method === 'POST') {
    if (problem) return res.status(403).json({ success: false, error: problem });
    const { articleId, featured } = params;

    const { data: article } = await supabase
      .from('news_articles')
      .select('id')
      .eq('id', articleId)
      .eq('voting_period_id', params.period)
      .eq('published', true)
      .maybeSingle();
    if (!article) return res.status(404).json({ success: false, error: "That story isn't in this round." });

    if (featured) {
      const { count } = await supabase
        .from('news_articles')
        .select('id', { count: 'exact', head: true })
        .eq('voting_period_id', params.period)
        .eq('is_featured', true);
      if ((count || 0) >= MAX_PICKS) {
        return res.status(409).json({ success: false, error: `Already ${MAX_PICKS} picked. Unpick one first.` });
      }
    }

    const { error } = await supabase
      .from('news_articles')
      .update({ is_featured: !!featured })
      .eq('id', articleId);
    if (error) return res.status(500).json({ success: false, error: `FAILED to save: ${error.message}` });
    return res.status(200).json({ success: true, featured: !!featured });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
