# Event Registry Query Effectiveness Assessment

## Executive Summary

Your original query approach is **NOT EFFECTIVE** for gathering news about Black and LGBT lives, culture, and rights in the UK. Testing revealed critical structural problems and poor content relevance.

---

## Original Query Problems

### 1. **Technical Failure**
```
ERROR: Too many keywords specified (18 used, 15 allowed)
```
- Your subscription allows max 15 keywords
- Comma-separated phrases count each word individually
- Query failed to execute at all

### 2. **Structural Issues**

| Problem | Impact |
|---------|--------|
| **Overly restrictive AND logic** | Both long keyword strings must match simultaneously → zero results |
| **Verbose keyword strings** | Unlikely to match verbatim text in articles |
| **Redundant conditions** | Second keyword largely duplicates the first |
| **No geographic filtering** | "UK" in keywords doesn't actually filter by location |
| **No source quality control** | Returns partisan political sites |

---

## Test Results Summary

### Query Performance Comparison

| Strategy | Results | UK Content | Black LGBT Focus | Quality Sources | Partisan Sources |
|----------|---------|------------|------------------|----------------|------------------|
| **Baseline (simple keywords)** | 30 | 0% | 6.7% | 0% | 3.3% |
| **With UK Location Filter** | 0 | N/A | N/A | N/A | N/A |
| **With Source Quality Filter** | 30 | 0% | 3.3% | 0% | **13.3%** |
| **Multiple Terms OR** | 1 | 0% | 0% | 0% | 0% |
| **RECOMMENDED Balanced** | 50 | 0% | 4.0% | 2.0% | 8.0% |

### Key Findings

#### ❌ Critical Problems Identified:

1. **Zero UK-focused content** across ALL strategies
   - Despite UK location filters, no articles about UK issues
   - All content is US-centric

2. **Extremely low Black LGBT relevance** (2-6% of results)
   - Most articles mention terms tangentially
   - Very few articles actually ABOUT Black LGBT communities

3. **Source quality issues**
   - Partisan sites (Breitbart, Daily Wire) appear frequently
   - Mainstream quality sources (BBC, Guardian) mostly absent
   - LGBT-focused outlets (Pink News, Advocate) rare

4. **Content relevance failures**
   - Sample articles show political controversies, not culture/rights
   - Many articles about political figures (Joy Reid, Karine Jean-Pierre)
   - Minimal coverage of community, arts, activism

---

## Why This Approach Fails

### 1. **Event Registry Algorithm Limitations**
- Keyword matching is too broad and literal
- Location filters don't work as expected for intersectional topics
- Source ranking doesn't filter partisan outlets effectively

### 2. **Topic Scarcity**
- "Black LGBT" content in UK is a niche intersection
- Limited mainstream media coverage
- May need specialized sources (Pink News, Attitude, Gal-dem, The Voice)

### 3. **Search Strategy Mismatch**
- General news API not optimized for intersectional identity topics
- Better suited for mainstream news events
- Misses community-focused publications

---

## Recommended Alternatives

### Option 1: RSS Feeds from Targeted Sources ⭐ BEST
Directly subscribe to publications covering this beat:

**UK-Specific LGBTQ+ Media:**
- Pink News UK
- Attitude Magazine
- DIVA Magazine
- Gay Times UK

**UK Black Media:**
- The Voice UK
- gal-dem
- Media Diversified

**Mainstream with Good Coverage:**
- BBC News (LGBTQ+ section)
- The Guardian (UK LGBTQ+ and Race coverage)
- Independent UK

**Why better:**
- Direct access to specialized coverage
- No irrelevant results
- More reliable and consistent
- Free (most offer RSS)

### Option 2: Social Media Monitoring
Track hashtags and accounts:
- Twitter/X: #BlackLGBTUK, #BlackQueerUK, #UKBlackPride
- Instagram: @ukblackpride, @galdemzine
- Facebook: UK Black Pride groups

### Option 3: Specialized News Aggregators
- Moreover.com (better filtering)
- Factiva (expensive but comprehensive)
- NewsWhip (social engagement focus)

### Option 4: Improved Event Registry Strategy
If you must use Event Registry:

```json
{
  "query": {
    "$query": {
      "$or": [
        {"keyword": "UK Black Pride", "keywordLoc": "title,body"},
        {"keyword": "Black LGBT UK", "keywordLoc": "title,body"},
        {"keyword": "British Black queer", "keywordLoc": "title,body"}
      ],
      "lang": "eng"
    },
    "$filter": {
      "forceMaxDataTimeWindow": "31",
      "dataType": ["news", "blog"],
      "isDuplicate": "skipDuplicates",
      "sourceUri": [
        "pinknews.co.uk",
        "theguardian.com",
        "independent.co.uk",
        "bbc.com"
      ]
    }
  },
  "resultType": "articles",
  "articlesCount": 50,
  "articlesSortBy": "socialScore"
}
```

**Key changes:**
- Specific UK-focused phrases
- OR logic for flexibility
- Explicit source whitelisting
- Removed restrictive AND conditions

**Caveats:**
- Still likely to return very few results
- RSS feeds would be more reliable

---

## Bottom Line Recommendation

**Switch to RSS feed aggregation** for these reasons:

1. ✅ **Reliable**: Direct from specialized sources
2. ✅ **Relevant**: 100% on-topic content
3. ✅ **Cost-effective**: Free vs paid API
4. ✅ **Comprehensive**: Catches community media Event Registry misses
5. ✅ **Simple**: No complex query tuning needed

### Suggested RSS Feed Strategy

**Tier 1 (Must-have):**
- Pink News UK RSS
- UK Black Pride website/social
- gal-dem articles feed

**Tier 2 (Valuable):**
- The Guardian LGBTQ+ section RSS
- BBC News LGBTQ+ RSS
- Attitude Magazine RSS

**Tier 3 (Supplementary):**
- Gay Times UK
- The Voice newspaper
- Media Diversified

This would give you **comprehensive, relevant, UK-focused coverage** of Black LGBT lives, culture, and rights without the filtering challenges of general news APIs.

---

## Testing Files Created

For your reference, I've created these test files:
- [test-event-registry-query.js](test-event-registry-query.js) - Original query test
- [test-improved-queries.js](test-improved-queries.js) - Initial improvement attempts
- [balanced-query-test.js](balanced-query-test.js) - Comprehensive strategy comparison
- [improved-query-config.json](improved-query-config.json) - Sample improved config

Run `node balanced-query-test.js` to reproduce these results.
