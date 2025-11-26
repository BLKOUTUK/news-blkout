/**
 * Hybrid News Gathering Strategy
 * Combines Event Registry API with RSS feeds for comprehensive coverage
 */

import https from 'https';
import fs from 'fs';

const API_KEY = "a2109782-1945-45e8-a4f3-56c968a263ac";

// Multiple Event Registry queries for different aspects
const eventRegistryQueries = {
    blackLGBTUK: {
        name: "Black LGBT UK Focus",
        config: {
            query: {
                "$query": {
                    "$or": [
                        { "keyword": "UK Black Pride", "keywordLoc": "title,body" },
                        { "keyword": "Black LGBTQ Britain", "keywordLoc": "title,body" },
                        { "keyword": "Black queer UK", "keywordLoc": "title,body" }
                    ],
                    "lang": "eng"
                },
                "$filter": {
                    "forceMaxDataTimeWindow": "31",
                    "dataType": ["news", "blog"],
                    "isDuplicate": "skipDuplicates"
                }
            },
            resultType: "articles",
            articlesPage: 1,
            articlesCount: 50,
            articlesSortBy: "socialScore",
            includeArticleTitle: true,
            includeArticleBasicInfo: true,
            includeArticleBody: false,
            includeSourceTitle: true,
            apiKey: API_KEY
        }
    },

    blackTransUK: {
        name: "Black Trans UK Focus",
        config: {
            query: {
                "$query": {
                    "$or": [
                        { "keyword": "Black trans UK", "keywordLoc": "title,body" },
                        { "keyword": "Black transgender Britain", "keywordLoc": "title,body" }
                    ],
                    "lang": "eng"
                },
                "$filter": {
                    "forceMaxDataTimeWindow": "31",
                    "dataType": ["news", "blog"],
                    "isDuplicate": "skipDuplicates"
                }
            },
            resultType: "articles",
            articlesPage: 1,
            articlesCount: 30,
            articlesSortBy: "socialScore",
            includeArticleTitle: true,
            includeArticleBasicInfo: true,
            includeArticleBody: false,
            includeSourceTitle: true,
            apiKey: API_KEY
        }
    },

    intersectionalRights: {
        name: "Intersectional Rights UK",
        config: {
            query: {
                "$query": {
                    "$and": [
                        {
                            "$or": [
                                { "keyword": "LGBT rights", "keywordLoc": "title,body" },
                                { "keyword": "racial justice", "keywordLoc": "title,body" }
                            ]
                        },
                        {
                            "keyword": "intersectionality",
                            "keywordLoc": "title,body"
                        }
                    ],
                    "lang": "eng"
                },
                "$filter": {
                    "forceMaxDataTimeWindow": "31",
                    "dataType": ["news", "blog"],
                    "isDuplicate": "skipDuplicates"
                }
            },
            resultType: "articles",
            articlesPage: 1,
            articlesCount: 30,
            articlesSortBy: "rel",
            includeArticleTitle: true,
            includeArticleBasicInfo: true,
            includeArticleBody: false,
            includeSourceTitle: true,
            apiKey: API_KEY
        }
    }
};

// RSS Feed sources for targeted coverage
const rssFeeds = {
    lgbtqMedia: {
        category: "LGBTQ+ Media (UK Focus)",
        feeds: [
            {
                name: "Pink News UK",
                url: "https://www.pinknews.co.uk/feed/",
                priority: "high",
                notes: "Primary UK LGBTQ+ news source"
            },
            {
                name: "Attitude Magazine",
                url: "https://attitude.co.uk/feed/",
                priority: "high",
                notes: "UK LGBTQ+ culture and lifestyle"
            },
            {
                name: "Gay Times UK",
                url: "https://www.gaytimes.co.uk/feed/",
                priority: "medium",
                notes: "LGBTQ+ news and culture"
            },
            {
                name: "DIVA Magazine",
                url: "https://divamag.co.uk/feed/",
                priority: "medium",
                notes: "UK lesbian and bisexual women's magazine"
            }
        ]
    },

    blackMedia: {
        category: "Black British Media",
        feeds: [
            {
                name: "gal-dem",
                url: "https://gal-dem.com/feed/",
                priority: "high",
                notes: "Magazine written by women and non-binary people of colour"
            },
            {
                name: "The Voice UK",
                url: "https://www.voice-online.co.uk/feed/",
                priority: "high",
                notes: "Leading Black British newspaper"
            },
            {
                name: "Media Diversified",
                url: "https://mediadiversified.org/feed/",
                priority: "medium",
                notes: "Perspectives from marginalized groups"
            }
        ]
    },

    mainstream: {
        category: "Mainstream UK Media (Targeted Sections)",
        feeds: [
            {
                name: "Guardian - LGBTQ+",
                url: "https://www.theguardian.com/world/lgbt-rights/rss",
                priority: "high",
                notes: "Quality coverage of LGBTQ+ issues"
            },
            {
                name: "Guardian - Race",
                url: "https://www.theguardian.com/world/race/rss",
                priority: "high",
                notes: "Race and identity coverage"
            },
            {
                name: "BBC News - LGBTQ",
                url: "https://feeds.bbci.co.uk/news/topics/c7zp58j8wnyt/lgbtq/rss.xml",
                priority: "medium",
                notes: "BBC LGBTQ+ topic feed"
            },
            {
                name: "Independent UK",
                url: "https://www.independent.co.uk/news/uk/rss",
                priority: "low",
                notes: "General UK news (filter for relevant content)"
            }
        ]
    }
};

async function testEventRegistryQuery(config) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(config);

        const options = {
            hostname: 'eventregistry.org',
            port: 443,
            path: '/api/v1/article/getArticles',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 15000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ response: JSON.parse(data), statusCode: res.statusCode });
                } catch (error) {
                    reject({ error, rawData: data });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
    });
}

async function testHybridStrategy() {
    console.log('HYBRID NEWS GATHERING STRATEGY TEST\n');
    console.log('='.repeat(100) + '\n');

    // Test Event Registry queries
    console.log('📡 EVENT REGISTRY API RESULTS\n');
    console.log('-'.repeat(100) + '\n');

    let totalEventRegistryArticles = 0;
    const allArticles = [];

    for (const [key, { name, config }] of Object.entries(eventRegistryQueries)) {
        console.log(`Testing: ${name}`);

        try {
            const result = await testEventRegistryQuery(config);

            if (result.response.error) {
                console.log(`   ❌ ERROR: ${result.response.error}\n`);
                continue;
            }

            const articles = result.response.articles?.results || [];
            totalEventRegistryArticles += articles.length;
            allArticles.push(...articles);

            console.log(`   ✅ Found ${articles.length} articles`);

            if (articles.length > 0) {
                console.log(`   📄 Sample: "${articles[0].title}"`);
                console.log(`      Source: ${articles[0].source?.title || 'Unknown'}\n`);
            } else {
                console.log(`   ⚠️  No results\n`);
            }

        } catch (error) {
            console.log(`   ❌ Failed: ${error.message || error}\n`);
        }
    }

    console.log('-'.repeat(100));
    console.log(`Total Event Registry Articles: ${totalEventRegistryArticles}\n`);

    // Display RSS Feed Strategy
    console.log('\n📰 RSS FEED SOURCES (To Be Implemented)\n');
    console.log('-'.repeat(100) + '\n');

    let totalFeeds = 0;

    for (const [category, { category: catName, feeds }] of Object.entries(rssFeeds)) {
        console.log(`${catName}:\n`);

        feeds.forEach(feed => {
            totalFeeds++;
            const priorityEmoji = feed.priority === 'high' ? '⭐' :
                                 feed.priority === 'medium' ? '◆' : '○';
            console.log(`   ${priorityEmoji} ${feed.name}`);
            console.log(`      URL: ${feed.url}`);
            console.log(`      Priority: ${feed.priority.toUpperCase()}`);
            console.log(`      ${feed.notes}\n`);
        });
    }

    console.log('-'.repeat(100));
    console.log(`Total RSS Feeds: ${totalFeeds}\n`);

    // Summary and recommendations
    console.log('\n📊 HYBRID STRATEGY SUMMARY\n');
    console.log('-'.repeat(100) + '\n');

    console.log('Coverage Breakdown:');
    console.log(`   • Event Registry API: ~${totalEventRegistryArticles} articles/month`);
    console.log(`   • RSS Feeds: ${totalFeeds} targeted sources (estimated 50-200 articles/month)`);
    console.log(`   • Combined Coverage: Broad (API) + Deep (RSS)\n`);

    console.log('Advantages of Hybrid Approach:');
    console.log('   ✅ Event Registry catches breaking news from general sources');
    console.log('   ✅ RSS ensures complete coverage from specialized publications');
    console.log('   ✅ Redundancy helps prevent missing important stories');
    console.log('   ✅ Different sources provide different perspectives\n');

    console.log('Implementation Priority:');
    console.log('   1. Set up HIGH priority RSS feeds first (6 feeds)');
    console.log('   2. Implement Event Registry "Black LGBT UK Focus" query');
    console.log('   3. Add MEDIUM priority RSS feeds (4 feeds)');
    console.log('   4. Add remaining Event Registry queries for comprehensive coverage');
    console.log('   5. Add LOW priority feeds as needed\n');

    console.log('Recommended Refresh Schedule:');
    console.log('   • Event Registry: Daily (catches breaking news)');
    console.log('   • High Priority RSS: Every 6 hours');
    console.log('   • Medium Priority RSS: Every 12 hours');
    console.log('   • Low Priority RSS: Daily\n');

    console.log('='.repeat(100));

    // Export configuration for implementation
    const exportConfig = {
        eventRegistryQueries,
        rssFeeds,
        implementation: {
            refreshSchedule: {
                eventRegistry: "0 */24 * * *",  // Daily at midnight
                rssHigh: "0 */6 * * *",         // Every 6 hours
                rssMedium: "0 */12 * * *",      // Every 12 hours
                rssLow: "0 0 * * *"              // Daily at midnight
            },
            deduplication: {
                enabled: true,
                method: "title-similarity",
                threshold: 0.85
            },
            filtering: {
                minRelevanceScore: 3,
                excludePartisanSources: true,
                requireUKFocus: false  // Some relevant global stories
            }
        }
    };

    fs.writeFileSync(
        './hybrid-strategy-config.json',
        JSON.stringify(exportConfig, null, 2)
    );

    console.log('\n✅ Configuration exported to: hybrid-strategy-config.json\n');
}

testHybridStrategy();
