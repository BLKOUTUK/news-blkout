# BLKOUT Newsroom - Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Repository Setup

- [ ] Initialize Git repository
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Set repository to private (initially)

```bash
cd news-blkout
git init
git add .
git commit -m "Initial commit: BLKOUT Newsroom platform"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Supabase Setup

- [ ] Create Supabase project
- [ ] Run database schema (`database/schema.sql`)
- [ ] Enable RLS policies
- [ ] Get Supabase URL and anon key
- [ ] Test database connection

**Steps:**

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to SQL Editor
3. Copy and paste the entire `database/schema.sql` file
4. Run the SQL commands
5. Verify tables are created in Table Editor
6. Copy your Supabase URL and anon key from Project Settings > API

### 3. Vercel Setup

- [ ] Create Vercel account (if not already)
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Set build settings
- [ ] Deploy

## 🚀 Deployment Steps

### Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your `news-blkout` GitHub repository
4. Select the repository and click "Import"

### Step 2: Configure Build Settings

Vercel should auto-detect Vite. Verify these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Environment Variables

Add these environment variables in Vercel dashboard:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ENV=production
VITE_API_URL=/api
```

**Important:** Vercel requires both with and without `VITE_` prefix:
- `SUPABASE_URL` (for API functions)
- `VITE_SUPABASE_URL` (for frontend)

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (usually 2-3 minutes)
3. Verify deployment at the provided URL

### Step 5: Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add custom domain: `news-blkout.vercel.app` (or your preferred subdomain)
3. Follow Vercel's DNS configuration instructions

## 🔧 Post-Deployment Configuration

### 1. Verify API Endpoints

Test these endpoints:

```bash
# List articles
curl https://news-blkout.vercel.app/api/news

# Get single article (replace ID)
curl https://news-blkout.vercel.app/api/news/{article-id}

# Newsletter subscription
curl -X POST https://news-blkout.vercel.app/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","frequency":"weekly"}'
```

### 2. Seed Initial Content (Optional)

Add sample articles to Supabase:

```sql
INSERT INTO newsroom_articles (
  title,
  excerpt,
  category,
  author,
  read_time,
  interest_score,
  status
) VALUES (
  'Welcome to BLKOUT Newsroom',
  'Community-curated news for Black queer liberation',
  'community',
  'BLKOUT Team',
  '2 min read',
  100,
  'published'
);
```

### 3. Configure CORS (If Needed)

Already configured in `vercel.json` and API files. Verify if issues arise.

### 4. Set Up Monitoring

- [ ] Enable Vercel Analytics
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure uptime monitoring

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to `main`:

```bash
git add .
git commit -m "Update newsroom features"
git push origin main
```

Vercel will:
1. Detect the push
2. Build the project
3. Run tests (if configured)
4. Deploy to production

## 🌍 Environment-Specific Deployments

### Preview Deployments

Every branch gets a preview deployment:

```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

Vercel creates a preview URL: `news-blkout-git-feature-new-feature.vercel.app`

### Production Deployment

Only `main` branch deploys to production: `news-blkout.vercel.app`

## 🔐 Security Checklist

- [ ] Environment variables are set in Vercel (not in code)
- [ ] Supabase RLS policies are enabled
- [ ] API routes have CORS configured
- [ ] No sensitive data in client-side code
- [ ] HTTPS enabled (automatic with Vercel)

## 📊 Monitoring & Maintenance

### Vercel Dashboard

Monitor:
- Build logs
- Function logs
- Analytics
- Bandwidth usage

### Supabase Dashboard

Monitor:
- Database size
- API requests
- Query performance
- Storage usage

### Regular Maintenance

- [ ] Weekly: Check error logs
- [ ] Monthly: Review analytics
- [ ] Quarterly: Update dependencies
- [ ] As needed: Database backups

## 🆘 Troubleshooting

### Build Fails

**Issue**: Build fails during deployment

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify `package.json` dependencies
3. Ensure TypeScript compiles: `npm run typecheck`
4. Check for missing environment variables

### API Returns 500

**Issue**: API endpoints return 500 errors

**Solutions:**
1. Check Vercel function logs
2. Verify Supabase credentials
3. Test database connection
4. Check API route handlers

### No Articles Showing

**Issue**: Frontend loads but no articles appear

**Solutions:**
1. Check browser console for errors
2. Verify API endpoint URLs
3. Check Supabase RLS policies
4. Ensure articles exist with `status='published'`

### Supabase Connection Issues

**Issue**: Cannot connect to Supabase

**Solutions:**
1. Verify environment variables are correct
2. Check Supabase project is active
3. Test connection with Supabase client
4. Verify RLS policies allow read access

## 📝 Deployment Checklist Summary

- [ ] Code pushed to GitHub
- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Vercel project connected
- [ ] Environment variables configured
- [ ] Initial deployment successful
- [ ] API endpoints tested
- [ ] Frontend loads correctly
- [ ] Sample content added (optional)
- [ ] Custom domain configured (optional)
- [ ] Monitoring enabled
- [ ] Documentation updated

## 🎉 Success!

Your BLKOUT Newsroom should now be live at:

**Production**: `https://news-blkout.vercel.app`

Share the link with the BLKOUT community and start curating liberation news!

---

**Need Help?**

- Check Vercel documentation: https://vercel.com/docs
- Check Supabase documentation: https://supabase.com/docs
- Contact BLKOUT team: newsroom@blkout.uk
