/**
 * Test the improved query configuration against the original approach
 */

import https from 'https';
import fs from 'fs';

// Load the improved config
const improvedConfig = JSON.parse(
    fs.readFileSync('./improved-query-config.json', 'utf8')
);

// Alternative strategies for comparison
const strategies = {
    improved: {
        name: "Improved: Concepts + Location + Source Quality",
        config: improvedConfig
    },

    cultureFocused: {
        name: "Culture-Focused: Arts & Society Categories",
        config: {
            query: {
                "$query": {
                    "$and": [
                        {
                            "$or": [
                                { "keyword": "Black LGBTQ culture", "keywordLoc": "title,body" },
                                { "keyword": "Black queer community", "keywordLoc": "title,body" },
                                { "keyword": "Black LGBT history", "keywordLoc": "title,body" }
                            ]
                        },
                        {
                            "locationUri": "http://en.wikipedia.org/wiki/United_Kingdom"
                        },
                        {
                            "categoryUri": [
                                "dmoz/Society",
                                "dmoz/Arts"
                            ]
                        }
                    ]
                },
                "$filter": {
                    "forceMaxDataTimeWindow": "31",
                    "dataType": ["news", "blog"],
                    "isDuplicate": "skipDuplicates",
                    "hasDuplicate": "skipHasDuplicates",
                    "startSourceRankPercentile": 0,
                    "endSourceRankPercentile": 50
                }
            },
            resultType: "articles",
            articlesPage: 1,
            articlesCount: 30,
            articlesSortBy: "rel",
            includeArticleTitle: true,
            includeArticleBasicInfo: true,
            includeArticleBody: false,
            includeArticleCategories: true,
            includeSourceTitle: true,
            includeSourceRanking: true,
            apiKey: "a2109782-1945-45e8-a4f3-56c968a263ac"
        }
    },

    rightsActivism: {
        name: "Rights & Activism Focused",
        config: {
            query: {
                "$query": {
                    "$and": [
                        {
                            "$or": [
                                { "keyword": "LGBT rights", "keywordLoc": "title,body" },
                                { "keyword": "racial justice", "keywordLoc": "title,body" },
                                { "keyword": "intersectionality", "keywordLoc": "title,body" }
                            ]
                        },
                        {
                            "$or": [
                                { "keyword": "Black", "keywordLoc": "title,body" },
                                { "keyword": "BAME", "keywordLoc": "title,body" }
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
                    "isDuplicate": "skipDuplicates",
                    "hasDuplicate": "skipHasDuplicates",
                    "startSourceRankPercentile": 0,
                    "endSourceRankPercentile": 60
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
            includeSourceRanking: true,
            apiKey: "a2109782-1945-45e8-a4f3-56c968a263ac"
        }
    }
};

async function testQuery(queryConfig, strategyName) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(queryConfig);

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

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve({ strategyName, response, statusCode: res.statusCode });
                } catch (error) {
                    reject({ strategyName, error, rawData: data });
                }
            });
        });

        req.on('error', (error) => {
            reject({ strategyName, error });
        });

        req.on('timeout', () => {
            req.destroy();
            reject({ strategyName, error: new Error('Request timeout') });
        });

        req.write(postData);
        req.end();
    });
}

function analyzeArticleRelevance(article) {
    const title = (article.title || '').toLowerCase();
    const body = (article.body || '').toLowerCase();
    const source = article.source?.title || 'Unknown';

    // Check for relevant topics
    const relevantTopics = {
        blackLGBT: /black.{0,20}(lgbt|lgbtq|queer|trans|gay|lesbian)/i.test(title + ' ' + body),
        ukFocus: /uk|united kingdom|britain|british|london|manchester|birmingham/i.test(title + ' ' + body),
        culture: /culture|community|arts|history|identity|celebration/i.test(title + ' ' + body),
        rights: /rights|justice|equality|discrimination|activism|protest/i.test(title + ' ' + body),
        political: /trump|biden|election|republican|democrat/i.test(title + ' ' + body)
    };

    // Check source quality indicators
    const sourceQuality = {
        partisan: /breitbart|daily wire|blaze|infowars|newsmax/i.test(source),
        mainstream: /bbc|guardian|independent|times|telegraph/i.test(source),
        community: /pink news|attitude|diva|voice|gal-dem/i.test(source)
    };

    return {
        relevantTopics,
        sourceQuality,
        relevanceScore: (
            (relevantTopics.blackLGBT ? 3 : 0) +
            (relevantTopics.ukFocus ? 2 : 0) +
            (relevantTopics.culture ? 1 : 0) +
            (relevantTopics.rights ? 1 : 0) -
            (relevantTopics.political ? 2 : 0) -
            (sourceQuality.partisan ? 2 : 0) +
            (sourceQuality.mainstream ? 1 : 0) +
            (sourceQuality.community ? 2 : 0)
        )
    };
}

async function runComparison() {
    console.log('IMPROVED QUERY CONFIGURATION TEST\n');
    console.log('='.repeat(100) + '\n');

    for (const [key, { name, config }] of Object.entries(strategies)) {
        console.log(`\n${name}`);
        console.log('-'.repeat(100));

        try {
            const result = await testQuery(config, name);

            if (result.response.error) {
                console.log(`❌ ERROR: ${result.response.error}`);
                continue;
            }

            const articles = result.response.articles?.results || [];
            console.log(`\n✅ Found ${articles.length} articles`);

            if (articles.length === 0) {
                console.log('⚠️  No results - query may be too restrictive\n');
                continue;
            }

            // Analyze relevance
            const analyzed = articles.map(article => ({
                article,
                analysis: analyzeArticleRelevance(article)
            }));

            // Sort by relevance score
            analyzed.sort((a, b) => b.analysis.relevanceScore - a.analysis.relevanceScore);

            // Calculate stats
            const avgRelevance = analyzed.reduce((sum, a) => sum + a.analysis.relevanceScore, 0) / analyzed.length;
            const highlyRelevant = analyzed.filter(a => a.analysis.relevanceScore >= 3).length;
            const ukFocused = analyzed.filter(a => a.analysis.analysis.relevantTopics.ukFocus).length;
            const blackLGBTFocused = analyzed.filter(a => a.analysis.analysis.relevantTopics.blackLGBT).length;
            const partisanSources = analyzed.filter(a => a.analysis.analysis.sourceQuality.partisan).length;

            console.log('\n📊 RELEVANCE METRICS:');
            console.log(`   Average Relevance Score: ${avgRelevance.toFixed(2)}/10`);
            console.log(`   Highly Relevant Articles: ${highlyRelevant}/${articles.length} (${((highlyRelevant/articles.length)*100).toFixed(1)}%)`);
            console.log(`   UK-Focused: ${ukFocused}/${articles.length} (${((ukFocused/articles.length)*100).toFixed(1)}%)`);
            console.log(`   Black LGBT Content: ${blackLGBTFocused}/${articles.length} (${((blackLGBTFocused/articles.length)*100).toFixed(1)}%)`);
            console.log(`   Partisan Sources: ${partisanSources}/${articles.length} (${((partisanSources/articles.length)*100).toFixed(1)}%)`);

            console.log('\n📰 TOP 5 MOST RELEVANT ARTICLES:\n');
            analyzed.slice(0, 5).forEach((item, i) => {
                const { article, analysis } = item;
                console.log(`${i + 1}. [Score: ${analysis.relevanceScore}] ${article.title}`);
                console.log(`   Source: ${article.source?.title || 'Unknown'} | Date: ${article.dateTime?.split('T')[0] || 'Unknown'}`);
                console.log(`   URL: ${article.url || 'No URL'}`);
                console.log(`   Topics: ${Object.entries(analysis.relevantTopics).filter(([k,v]) => v).map(([k]) => k).join(', ') || 'None detected'}`);
                console.log('');
            });

        } catch (error) {
            console.log(`❌ REQUEST FAILED: ${error.error?.message || error.error || 'Unknown error'}`);
        }

        console.log('\n');
    }

    console.log('='.repeat(100));
    console.log('\n✨ COMPARISON COMPLETE\n');
}

runComparison();
