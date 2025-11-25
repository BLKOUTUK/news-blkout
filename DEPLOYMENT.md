# SocialSync Deployment Guide

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `BLKOUTUK/comms-blkout`
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `socialsync-content-generation` (or leave blank if deploying from this folder)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables (see below)
6. Click "Deploy"

## Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

### Required Variables

```env
# Google GenAI API Key
GEMINI_API_KEY=your_google_genai_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Optional Variables (for social media publishing)

```env
# Instagram
VITE_INSTAGRAM_CLIENT_ID=your_instagram_client_id
VITE_INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# TikTok
VITE_TIKTOK_CLIENT_KEY=your_tiktok_client_key
VITE_TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: socialsync-production
   - **Database Password**: (generate strong password)
   - **Region**: Choose closest to your users
4. Wait for project to be created

### 2. Run Database Migrations

**Option A: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

**Option B: Manual SQL Execution**

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/003_create_socialsync_tables.sql`
3. Run `supabase/migrations/004_seed_socialsync_data.sql`

### 3. Create Storage Bucket

In Supabase Dashboard → Storage:

1. Click "New Bucket"
2. Name: `generated-assets`
3. Public: ✅ Yes
4. Click "Create Bucket"

Then set storage policies in SQL Editor:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-assets' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'generated-assets' AND auth.role() = 'authenticated');
```

### 4. Get Supabase Credentials

In Supabase Dashboard → Settings → API:

- **Project URL**: Copy this to `VITE_SUPABASE_URL`
- **anon/public key**: Copy this to `VITE_SUPABASE_ANON_KEY`

## Google GenAI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key to `GEMINI_API_KEY`

**Note**: You need a paid tier for Veo video generation and Gemini Pro models.

## Social Media Platform Setup (Optional)

### Instagram

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app
3. Add "Instagram Basic Display" and "Instagram Graph API" products
4. Configure OAuth redirect URI: `https://your-domain.vercel.app/auth/callback`
5. Copy Client ID and Client Secret

### TikTok

1. Go to [TikTok Developers](https://developers.tiktok.com)
2. Create a new app
3. Enable "Content Posting API"
4. Configure redirect URI: `https://your-domain.vercel.app/auth/callback`
5. Copy Client Key and Client Secret

## Deploy Background Worker (Optional)

The background worker processes the social media publishing queue.

### Deploy to Vercel Serverless Function

Create `api/worker.js`:

```javascript
import { processQueue } from '../worker.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await processQueue();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

Then set up a cron job in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/worker",
    "schedule": "*/5 * * * *"
  }]
}
```

### Or Deploy to Cloud Service

**AWS Lambda / Google Cloud Run / Railway / Render**

1. Package the worker: `worker.js` + dependencies
2. Set environment variables
3. Deploy as a scheduled job (every 1-5 minutes)

## Verification

After deployment:

1. ✅ Visit your Vercel URL
2. ✅ Check that the app loads
3. ✅ Verify Supabase connection (check browser console)
4. ✅ Test content generation with Google GenAI
5. ✅ Test publishing to social media (if configured)

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check build logs in Vercel dashboard

### App Loads but No Data

- Verify Supabase URL and anon key are correct
- Check that migrations ran successfully
- Verify storage bucket exists

### Content Generation Fails

- Verify `GEMINI_API_KEY` is set correctly
- Check API key has proper permissions
- Verify you have paid tier access for Veo/Pro models

### Social Media Publishing Fails

- Verify OAuth credentials are correct
- Check that redirect URIs match
- Verify tokens haven't expired

## Monitoring

- **Vercel Analytics**: Automatic in Vercel dashboard
- **Supabase Logs**: Dashboard → Logs
- **Error Tracking**: Consider adding Sentry or similar

## Custom Domain (Optional)

In Vercel Dashboard → Project → Settings → Domains:

1. Add your custom domain
2. Configure DNS records as instructed
3. SSL certificate is automatic

## Next Steps

1. Set up monitoring and alerts
2. Configure backup strategy for Supabase
3. Set up CI/CD pipeline for automated deployments
4. Add error tracking (Sentry, LogRocket, etc.)
5. Set up analytics (Google Analytics, Plausible, etc.)

## Support

For issues, check:
- Vercel deployment logs
- Supabase logs
- Browser console errors
- GitHub Issues

---

**Deployment Checklist**

- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Storage bucket created
- [ ] Google GenAI API key configured
- [ ] Social media OAuth apps created (optional)
- [ ] Background worker deployed (optional)
- [ ] Custom domain configured (optional)
- [ ] Deployment verified and tested

