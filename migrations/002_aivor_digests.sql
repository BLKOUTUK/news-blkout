-- AIvor weekly digest — replaces the hand-edited src/config/aivorDigest.ts.
-- The weekly-news-video workflow writes a row here after a successful YouTube
-- upload; AIvorDigest.tsx reads the newest row at runtime. No commit, no
-- redeploy, no human step between the render and the site panel updating.

CREATE TABLE IF NOT EXISTS public.aivor_digests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_tag     text NOT NULL UNIQUE,          -- e.g. 2026-W32
  week_label   text NOT NULL,                 -- e.g. Week ending 4 Aug 2026
  video_url    text NOT NULL,
  video_id     text,
  format       text NOT NULL DEFAULT 'short',
  summary      text NOT NULL,
  privacy      text NOT NULL DEFAULT 'public',
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- The panel only ever asks for the newest public row.
CREATE INDEX IF NOT EXISTS aivor_digests_published_idx
  ON public.aivor_digests (published_at DESC);

-- Management-API migrations skip Supabase's dashboard auto-grants, and a
-- missing GRANT surfaces as a misleading 42501 RLS error. Grant explicitly.
--
-- This project also carries a default privilege that hands anon full DML plus
-- TRUNCATE on new public tables (every existing newsroom table has it). RLS
-- governs what PostgREST can reach, but TRUNCATE is not an RLS-governed
-- operation, so strip everything back to SELECT rather than rely on RLS alone.
REVOKE ALL ON public.aivor_digests FROM anon, authenticated;
GRANT SELECT ON public.aivor_digests TO anon;
GRANT SELECT ON public.aivor_digests TO authenticated;
GRANT ALL ON public.aivor_digests TO service_role;

ALTER TABLE public.aivor_digests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public digests are readable by anyone" ON public.aivor_digests;
CREATE POLICY "public digests are readable by anyone"
  ON public.aivor_digests FOR SELECT
  USING (privacy = 'public');

-- Writes are service-role only (the workflow); service_role bypasses RLS, so
-- no INSERT policy is granted to anon/authenticated by design.
