/**
 * Balanced query strategies - finding the sweet spot between relevance and results
 */

import https from 'https';

const API_KEY = "a2109782-1945-45e8-a4f3-56c968a263ac";

const strategies = {
    baseline: {
        name: "Baseline: Simple keyword approach",
        config: {
            query: {
                "$query": {
                    "$and": [
                        {
                            "keyword": "Black LGBTQ",
                            "keywordLoc": "title,body"
                        },
                        {
                            "lang": "eng"
                        }
                    ]
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

    withLocation: {
        name: "With UK Location Filter",
        config: {
            query: {
                "$query": {
                    "$and": [
                        {
                            "$or": [
                                { "keyword": "Black LGBTQ", "keywordLoc": "title,body" },
                                { "keyword": "Black queer", "keywordLoc": "title,body" }
                            ]
                        },
                        {
                            "locationUri": "http://en.wikipedia.org/wiki/United_Kingdom"
                        }
                    ]
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
            includeArticleLocation: true,
            apiKey: API_KEY
        }
    },

    withSourceFilter: {
        name: "With Source Quality Filter",
        config: {
            query: {
                "$query": {
                    "$and": [
                        {
                            "$or": [
                                { "keyword": "Black LGBTQ", "keywordLoc": "title,body" },
                                { "keyword": "Black queer", "keywordLoc": "title,body" },
                                { "keyword": "Black trans", "keywordLoc": "title,body" }
                            ]
                        },
                        {
                            "lang": "eng"
                        }
                    ]
                },
                "$filter": {
                    "forceMaxDataTimeWindow": "31",
                    "dataType": ["news", "blog"],
                    "isDuplicate": "skipDuplicates",
                    "startSourceRankPercentile": 0,
                    "endSourceRankPercentile": 40
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
            includeSourceRanking: true,
            apiKey: API_KEY
        }
    },

    multiTermOR: {
        name: "Multiple Terms with OR Logic",
        config: {
            query: {
                "$query": {
                    "$or": [
                        { "keyword": "Black LGBTQ rights", "keywordLoc": "title,body" },
                        { "keyword": "Black queer community", "keywordLoc": "title,body" },
                        { "keyword": "Black trans justice", "keywordLoc": "title,body" },
                        { "keyword": "Black LGBT culture", "keywordLoc": "title,body" }
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
    },

    recommended: {
        name: "RECOMMENDED: Balanced approach",
        config: {
            query: {
                "$query": {
                    "$and": [
                        {
                            "$or": [
                                { "keyword": "Black LGBTQ", "keywordLoc": "title,body" },
                                { "keyword": "Black queer", "keywordLoc": "title,body" },
                                { "keyword": "Black trans", "keywordLoc": "title,body" },
                                { "keyword": "Black LGBT", "keywordLoc": "title,body" }
                            ]
                        }
                    ],
                    "lang": "eng"
                },
                "$filter": {
                    "forceMaxDataTimeWindow": "31",
                    "dataType": ["news", "blog"],
                    "isDuplicate": "skipDuplicates",
                    "startSourceRankPercentile": 0,
                    "endSourceRankPercentile": 50
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
            includeSourceRanking: true,
            apiKey: API_KEY
        }
    }
};

async function testQuery(config) {
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
            timeout: 20000
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

function analyzeResults(articles) {
    if (!articles || articles.length === 0) return null;

    const analysis = {
        total: articles.length,
        sources: {},
        ukRelated: 0,
        blackLGBTFocused: 0,
        partisan: 0,
        quality: 0
    };

    const partisanSources = /breitbart|daily wire|blaze|newsmax|infowars|gateway pundit/i;
    const qualitySources = /bbc|guardian|independent|reuters|ap news|npr|pink news|them|advocate|attitude/i;
    const ukIndicators = /uk|britain|british|london|manchester|birmingham|scotland|wales|england/i;

    articles.forEach(article => {
        const title = (article.title || '').toLowerCase();
        const source = article.source?.title || '';

        // Count sources
        analysis.sources[source] = (analysis.sources[source] || 0) + 1;

        // Check indicators
        if (ukIndicators.test(title)) analysis.ukRelated++;
        if (/black.{0,30}(lgbt|lgbtq|queer|trans)/i.test(title)) analysis.blackLGBTFocused++;
        if (partisanSources.test(source)) analysis.partisan++;
        if (qualitySources.test(source)) analysis.quality++;
    });

    return analysis;
}

async function runTests() {
    console.log('BALANCED QUERY STRATEGY COMPARISON\n');
    console.log('='.repeat(100) + '\n');
    console.log('Testing multiple approaches to find optimal balance between results and relevance...\n');

    for (const [key, { name, config }] of Object.entries(strategies)) {
        console.log(`\n${name}`);
        console.log('-'.repeat(100));

        try {
            const result = await testQuery(config);

            if (result.response.error) {
                console.log(`❌ ERROR: ${result.response.error}\n`);
                continue;
            }

            const articles = result.response.articles?.results || [];
            const analysis = analyzeResults(articles);

            if (!analysis) {
                console.log('⚠️  No results found\n');
                continue;
            }

            console.log(`\n✅ Found ${analysis.total} articles\n`);

            // Display metrics
            console.log('📊 QUALITY METRICS:');
            console.log(`   UK-Related Content: ${analysis.ukRelated}/${analysis.total} (${((analysis.ukRelated/analysis.total)*100).toFixed(1)}%)`);
            console.log(`   Black LGBT Focused: ${analysis.blackLGBTFocused}/${analysis.total} (${((analysis.blackLGBTFocused/analysis.total)*100).toFixed(1)}%)`);
            console.log(`   Quality Sources: ${analysis.quality}/${analysis.total} (${((analysis.quality/analysis.total)*100).toFixed(1)}%)`);
            console.log(`   Partisan Sources: ${analysis.partisan}/${analysis.total} (${((analysis.partisan/analysis.total)*100).toFixed(1)}%)`);

            // Top sources
            const topSources = Object.entries(analysis.sources)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            console.log('\n📰 TOP SOURCES:');
            topSources.forEach(([source, count]) => {
                console.log(`   ${source}: ${count} articles`);
            });

            // Sample articles
            console.log('\n📄 SAMPLE ARTICLES:\n');
            articles.slice(0, 5).forEach((article, i) => {
                console.log(`${i + 1}. ${article.title}`);
                console.log(`   ${article.source?.title || 'Unknown'} | ${article.dateTime?.split('T')[0] || 'Unknown'}`);
                console.log(`   ${article.url || 'No URL'}\n`);
            });

        } catch (error) {
            console.log(`❌ REQUEST FAILED: ${error.message || error}\n`);
        }
    }

    console.log('='.repeat(100));
    console.log('\n✨ ASSESSMENT COMPLETE\n');
}

runTests();
