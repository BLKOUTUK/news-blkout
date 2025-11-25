# 🚀 Quick Deploy to Vercel

## Deploy Now (2 Minutes)

### Step 1: Open Vercel
Visit: **https://vercel.com/new**

### Step 2: Import Repository
1. Click "Import Git Repository"
2. Select: `BLKOUTUK/comms-blkout`
3. Branch: `feature/social-sync-studio`
4. Root Directory: Leave blank (or set to `socialsync-content-generation` if needed)

### Step 3: Configure Build
Vercel should auto-detect these settings:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables

Click "Environment Variables" and add:

#### Required (Minimum Setup):
```
GEMINI_API_KEY = your_google_genai_api_key_here
```

Get your key from: https://aistudio.google.com/app/apikey

#### Optional (Full Integration):
```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
VITE_INSTAGRAM_CLIENT_ID = your_instagram_client_id
VITE_INSTAGRAM_CLIENT_SECRET = your_instagram_client_secret
VITE_TIKTOK_CLIENT_KEY = your_tiktok_client_key
VITE_TIKTOK_CLIENT_SECRET = your_tiktok_client_secret
```

### Step 5: Deploy
Click **"Deploy"** button

⏱️ Build takes ~2-3 minutes

---

## After Deployment

You'll get:
- ✅ Production URL: `https://your-project.vercel.app`
- ✅ Automatic HTTPS/SSL
- ✅ Auto-deploy on every push to branch
- ✅ Preview deployments for PRs

---

## Test Your Deployment

1. Visit your Vercel URL
2. Try generating an image with Google Gemini
3. Check the Asset Library

---

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify `GEMINI_API_KEY` is valid
- Check build logs in Vercel dashboard

### App Loads but Generation Fails
- Verify `GEMINI_API_KEY` is correct
- Check you have paid tier access for Veo/Pro models
- Check browser console for errors

### Need Supabase Integration?
See `DEPLOYMENT.md` for full Supabase setup instructions

---

## Next Steps

1. **Set up custom domain** (optional)
   - Vercel Dashboard → Settings → Domains

2. **Set up Supabase** (for full features)
   - See `DEPLOYMENT.md` for instructions

3. **Configure social media** (for publishing)
   - Instagram: https://developers.facebook.com
   - TikTok: https://developers.tiktok.com

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Integration Guide**: See `INTEGRATION_GUIDE.md`

---

**Ready to deploy? Go to: https://vercel.com/new** 🚀

