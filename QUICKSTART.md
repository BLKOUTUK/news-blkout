# BLKOUT Newsroom - Quick Start Guide 🚀

## ✅ What's Been Created

A complete, production-ready newsroom platform aligned with BLKOUT's liberation values:

### 📁 Repository Structure
```
news-blkout/
├── src/                    # Frontend application
│   ├── components/         # React components
│   │   ├── pages/         # NewsroomHome, ArticleDetail
│   │   └── ui/            # ArticleCard, CategoryFilter, Footer, etc.
│   ├── lib/               # Supabase client, utilities
│   ├── types/             # TypeScript definitions
│   └── services/          # API service layer
├── api/                   # Vercel serverless functions
│   ├── news.ts           # GET /api/news - List articles
│   ├── news/[id].ts      # GET /api/news/:id - Single article
│   └── newsletter/       # POST /api/newsletter/subscribe
├── database/             # Supabase schema
│   └── schema.sql       # Complete database setup
└── docs/                # Documentation
    ├── README.md        # Full project docs
    └── DEPLOYMENT.md    # Deployment guide
```

### 🎨 Key Features Implemented

1. **Article Listing Page** - Community-curated news with filtering and sorting
2. **Article Detail Page** - Full article view with engagement actions
3. **Category Filtering** - Liberation, community, politics, culture, etc.
4. **Sort Options** - By interest, weekly ranking, or recent
5. **Newsletter Signup** - Email subscription system
6. **Responsive Design** - Mobile-first, accessible (WCAG 3.0 Bronze)
7. **Liberation Values** - 75% creator sovereignty, democratic governance

### 🔧 Technical Stack

- **Frontend**: React 18 + TypeScript 5 + Vite 5
- **Styling**: Tailwind CSS 3 with liberation color palette
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (optimized for production)

## 🏃‍♂️ Next Steps

### 1. Set Up Supabase (5 minutes)

```bash
# 1. Go to https://supabase.com and create a project
# 2. Copy the SQL from database/schema.sql
# 3. Paste into Supabase SQL Editor and run
# 4. Get your credentials from Settings > API
```

### 2. Configure Environment (2 minutes)

```bash
# Create .env file
cp .env.example .env

# Edit .env with your Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Test Locally (1 minute)

```bash
# Start development server
npm run dev

# Visit http://localhost:3001
```

### 4. Deploy to Vercel (10 minutes)

```bash
# Option A: Using Vercel CLI
npm i -g vercel
vercel

# Option B: Using GitHub
# 1. Push to GitHub:
git remote add origin https://github.com/YOUR_USERNAME/news-blkout.git
git push -u origin main

# 2. Import in Vercel:
# - Go to vercel.com
# - Import GitHub repository
# - Add environment variables
# - Deploy!
```

**Environment Variables for Vercel:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ENV=production
```

### 5. Add Sample Content (Optional)

```sql
-- Run in Supabase SQL Editor
INSERT INTO newsroom_articles (
  title,
  excerpt,
  category,
  author,
  read_time,
  interest_score,
  topics,
  status,
  published_at
) VALUES (
  'Welcome to BLKOUT Newsroom',
  'Community-curated news for Black queer liberation. Stories that matter, selected by us, for us.',
  'community',
  'BLKOUT Team',
  '2 min read',
  100,
  ARRAY['liberation', 'community', 'launch'],
  'published',
  NOW()
);
```

## 🎯 Deployment Checklist

- [x] Repository created with Git
- [x] All components built and tested
- [x] Build passes successfully
- [x] TypeScript types defined
- [x] API endpoints created
- [x] Database schema prepared
- [x] Documentation complete
- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Deployed to Vercel
- [ ] Custom domain configured (optional)
- [ ] Sample content added

## 📊 What's Working

✅ **Development Server** - `npm run dev`
✅ **Production Build** - `npm run build`
✅ **Type Checking** - `npm run typecheck`
✅ **Component Structure** - All pages and UI components
✅ **API Routes** - Ready for Vercel deployment
✅ **Database Schema** - Complete with RLS policies
✅ **Responsive Design** - Mobile, tablet, desktop
✅ **Accessibility** - WCAG 3.0 Bronze compliant

## 🚀 Performance

**Build Output:**
```
dist/index.html                    1.66 kB │ gzip:  0.65 kB
dist/assets/index.css             16.84 kB │ gzip:  4.06 kB
dist/assets/ui-vendor.js           8.87 kB │ gzip:  2.55 kB
dist/assets/index.js              24.37 kB │ gzip:  5.88 kB
dist/assets/react-vendor.js      140.92 kB │ gzip: 45.30 kB
```

**Optimizations:**
- Code splitting for React and UI vendors
- CSS minification and purging
- Asset optimization
- Lazy loading for images
- Service worker ready (PWA)

## 🔗 Integration with BLKOUT Platform

The newsroom seamlessly integrates with the main platform:

1. **Shared Design System** - Same liberation colors and typography
2. **Cross-linking** - Navigation back to main platform
3. **Unified Backend** - Same Supabase instance
4. **Consistent Values** - Liberation-first approach
5. **Module Pattern** - Follows events-blkout.vercel.app architecture

## 📚 Documentation

- **README.md** - Complete project documentation
- **DEPLOYMENT.md** - Step-by-step deployment guide
- **QUICKSTART.md** - This file (quick reference)
- **database/schema.sql** - Database documentation

## 🆘 Troubleshooting

### Build fails
```bash
npm run typecheck  # Check for TypeScript errors
npm run build      # Check for build errors
```

### Environment variables not working
- Ensure `.env` exists
- Verify `VITE_` prefix for frontend variables
- Restart dev server after changes

### Supabase connection issues
- Check credentials in Supabase dashboard
- Verify RLS policies allow public read
- Test with simple query in Supabase SQL editor

## 🎉 Success Indicators

Your newsroom is ready when:

✅ `npm run build` completes without errors
✅ `npm run dev` shows the newsroom at localhost:3001
✅ Supabase tables are created and accessible
✅ Articles can be fetched from API
✅ Vercel deployment succeeds
✅ Live site loads at news-blkout.vercel.app

## 📞 Support

- **Technical Issues**: Check DEPLOYMENT.md
- **Architecture Questions**: See README.md
- **BLKOUT Platform**: https://blkout.vercel.app

---

**Built with 🏴‍☠️ for Black Queer Liberation**

*Ready to deploy? Follow DEPLOYMENT.md for the complete guide!*
