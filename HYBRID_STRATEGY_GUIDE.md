# Hybrid News Gathering Strategy Guide
## Event Registry + RSS Feeds for Black LGBT UK Coverage

---

## Executive Summary

**Hybrid approach combines:**
- **Event Registry API**: ~11 articles/month from general news sources
- **RSS Feeds**: 50-200 articles/month from 11 specialized sources
- **Total Coverage**: ~60-210 articles/month with high relevance

---

## Event Registry Performance

### Test Results

| Query Type | Articles Found | Status | Notes |
|------------|----------------|--------|-------|
| Black LGBT UK Focus | 2 | ✅ Works | Best performing query |
| Black Trans UK | 0 | ⚠️ Limited | Very niche, few results |
| Intersectional Rights | 9 | ⚠️ Mixed | Some irrelevant results |

### Optimized Event Registry Configuration

**Primary Query** (use this one):
```json
{
  "query": {
    "$query": {
      "$or": [
        {
          "keyword": "UK Black Pride",
          "keywordLoc": "title,body"
        },
        {
          "keyword": "Black LGBTQ Britain",
          "keywordLoc": "title,body"
        },
        {
          "keyword": "Black queer UK",
          "keywordLoc": "title,body"
        }
      ],
      "lang": "eng"
    },
    "$filter": {
      "forceMaxDataTimeWindow": "31",
      "dataType": ["news", "blog"],
      "isDuplicate": "skipDuplicates",
      "hasDuplicate": "skipHasDuplicates",
      "startSourceRankPercentile": 0,
      "endSourceRankPercentile": 60
    }
  },
  "resultType": "articles",
  "articlesPage": 1,
  "articlesCount": 100,
  "articlesSortBy": "socialScore",
  "includeArticleTitle": true,
  "includeArticleBasicInfo": true,
  "includeArticleBody": true,
  "includeSourceTitle": true,
  "apiKey": "YOUR_API_KEY"
}
```

**Key Features:**
- ✅ Under 15 keyword limit
- ✅ OR logic for flexibility
- ✅ Source quality filter (top 60%)
- ✅ Deduplication enabled
- ✅ 31-day rolling window

---

## RSS Feed Sources

### Priority Tier 1: HIGH (Implement First) ⭐

| Source | URL | Why Critical |
|--------|-----|--------------|
| **Pink News UK** | https://www.pinknews.co.uk/feed/ | Primary UK LGBTQ+ news source |
| **Attitude Magazine** | https://attitude.co.uk/feed/ | UK LGBTQ+ culture and lifestyle |
| **gal-dem** | https://gal-dem.com/feed/ | Women and non-binary people of colour |
| **The Voice UK** | https://www.voice-online.co.uk/feed/ | Leading Black British newspaper |
| **Guardian - LGBTQ+** | https://www.theguardian.com/world/lgbt-rights/rss | Quality mainstream coverage |
| **Guardian - Race** | https://www.theguardian.com/world/race/rss | Race and identity coverage |

**Expected Output**: 30-100 articles/month from these 6 feeds

### Priority Tier 2: MEDIUM (Add After Tier 1) ◆

| Source | URL | Purpose |
|--------|-----|---------|
| **Gay Times UK** | https://www.gaytimes.co.uk/feed/ | LGBTQ+ news and culture |
| **DIVA Magazine** | https://divamag.co.uk/feed/ | Lesbian and bisexual women |
| **Media Diversified** | https://mediadiversified.org/feed/ | Marginalized perspectives |
| **BBC News - LGBTQ** | https://feeds.bbci.co.uk/news/topics/c7zp58j8wnyt/lgbtq/rss.xml | Mainstream UK coverage |

**Expected Output**: 20-60 articles/month from these 4 feeds

### Priority Tier 3: LOW (Optional) ○

| Source | URL | Purpose |
|--------|-----|---------|
| **Independent UK** | https://www.independent.co.uk/news/uk/rss | General UK news (filter needed) |

**Expected Output**: 10-40 articles/month (with filtering)

---

## Implementation Plan

### Phase 1: Core Setup (Week 1)
1. ✅ Set up 6 HIGH priority RSS feeds
2. ✅ Implement Event Registry "Black LGBT UK Focus" query
3. ✅ Set up deduplication system
4. ✅ Test data collection for 7 days

### Phase 2: Expansion (Week 2)
1. ✅ Add 4 MEDIUM priority RSS feeds
2. ✅ Implement content filtering/relevance scoring
3. ✅ Set up automated refresh schedules
4. ✅ Monitor quality and adjust

### Phase 3: Optimization (Week 3+)
1. ✅ Add additional Event Registry queries if needed
2. ✅ Fine-tune filtering rules
3. ✅ Add LOW priority feeds if coverage gaps exist
4. ✅ Implement alerting for high-relevance stories

---

## Refresh Schedule

### Recommended Cron Jobs

```bash
# Event Registry - Daily at midnight
0 0 * * * /path/to/fetch-event-registry.sh

# RSS High Priority - Every 6 hours
0 */6 * * * /path/to/fetch-rss-high.sh

# RSS Medium Priority - Every 12 hours
0 */12 * * * /path/to/fetch-rss-medium.sh

# RSS Low Priority - Daily at 6am
0 6 * * * /path/to/fetch-rss-low.sh
```

### Why These Schedules?

- **Event Registry (Daily)**: API quota management, breaking news caught next day
- **RSS High (6hrs)**: Specialized sources update frequently
- **RSS Medium (12hrs)**: Less frequent updates, saves resources
- **RSS Low (Daily)**: General news, filter for relevant content

---

## Content Processing Pipeline

### 1. Collection
```
Event Registry API → Raw Articles
RSS Feeds → Raw Articles
    ↓
Combined Pool
```

### 2. Deduplication
```
Title Similarity Check (85% threshold)
URL Matching
Same Source + Date
    ↓
Unique Articles
```

### 3. Relevance Filtering
```javascript
// Score each article 0-10
const relevanceScore =
  (blackLGBTFocus ? 3 : 0) +
  (ukFocus ? 2 : 0) +
  (cultureOrRights ? 2 : 0) +
  (qualitySource ? 2 : 0) +
  (socialEngagement ? 1 : 0) -
  (partisanSource ? 3 : 0);

// Keep articles scoring 3+
```

### 4. Categorization
```
- Rights & Activism
- Culture & Arts
- Community News
- History
- Politics & Policy
```

### 5. Distribution
```
High Priority (8+) → Immediate alert
Medium Priority (5-7) → Daily digest
Low Priority (3-4) → Weekly roundup
```

---

## Expected Coverage Comparison

### Original Approach (Event Registry Only)
- ❌ 0 articles (query failed)
- ❌ High API costs per article
- ❌ Poor relevance (if fixed)

### RSS Only Approach
- ✅ 50-200 articles/month
- ✅ High relevance
- ✅ Free
- ⚠️ May miss general news sources

### Hybrid Approach (RECOMMENDED) ⭐
- ✅ 60-210 articles/month
- ✅ High relevance from RSS
- ✅ Broad coverage from Event Registry
- ✅ Redundancy prevents missed stories
- ✅ Cost-effective (mainly free RSS)

---

## Quality Metrics to Monitor

Track these metrics weekly:

| Metric | Target | Action if Below |
|--------|--------|----------------|
| Total Articles | 60+ | Check feeds, verify they're active |
| UK-Relevant % | >70% | Adjust filtering rules |
| Black LGBT Focus % | >60% | Review source selection |
| Quality Sources % | >50% | Add more quality RSS feeds |
| Partisan Sources % | <10% | Strengthen filtering |
| Duplicates Caught | 10-20% | Normal; adjust if higher |

---

## Cost Analysis

### Event Registry
- **Current Plan**: $0/month (likely free tier)
- **API Calls**: ~30/month (daily checks)
- **Cost per Article**: High (only 11 articles/month)

### RSS Feeds
- **Cost**: $0/month
- **Bandwidth**: Minimal
- **Articles**: 50-200/month
- **Cost per Article**: $0

### Hybrid Total
- **Monthly Cost**: $0
- **Monthly Articles**: 60-210
- **Cost per Article**: $0
- **Winner**: Hybrid approach ⭐

---

## Troubleshooting

### Event Registry Returns 0 Results
✅ This is expected - the topic is very niche
✅ Keep the query but don't rely on it solely
✅ RSS feeds will provide bulk of content

### RSS Feed Not Working
1. Check if feed URL has changed
2. Verify feed is still active (test in browser)
3. Check for rate limiting
4. Ensure User-Agent header is set

### Too Much Irrelevant Content
1. Tighten keyword filters
2. Reduce low-priority sources
3. Increase relevance score threshold
4. Add source blacklist

### Not Enough Content
1. Add more RSS feeds from similar sources
2. Reduce relevance threshold temporarily
3. Expand geographic scope (add other English-speaking countries)
4. Add more Event Registry queries

---

## Next Steps

1. ✅ Review [optimized-event-registry-config.json](optimized-event-registry-config.json)
2. ✅ Review [hybrid-strategy-config.json](hybrid-strategy-config.json)
3. ✅ Implement HIGH priority RSS feeds first
4. ✅ Set up Event Registry query
5. ✅ Build deduplication system
6. ✅ Test for 1 week and adjust

---

## Files Created for You

- `optimized-event-registry-config.json` - Ready-to-use Event Registry config
- `hybrid-strategy-config.json` - Complete implementation configuration
- `hybrid-newsgathering-strategy.js` - Test script
- `QUERY_EFFECTIVENESS_ASSESSMENT.md` - Detailed test results
- `HYBRID_STRATEGY_GUIDE.md` - This guide

Run `node hybrid-newsgathering-strategy.js` to see the full strategy in action.
