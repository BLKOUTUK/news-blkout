/**
 * Test script comparing different query strategies for Event Registry
 */

import https from 'https';

const API_KEY = "a2109782-1945-45e8-a4f3-56c968a263ac";

// Original query (fails - too many keywords)
const originalQuery = {
    query: {
        "$query": {
            "$and": [
                {
                    "keyword": "Black and LGBT lives in UK, culture, social justice and human rights",
                    "keywordLoc": "body"
                },
                {
                    "keyword": "Black and LGBT rights and culture",
                    "keywordLoc": "body"
                },
                { "lang": "eng" }
            ]
        },
        "$filter": {
            "forceMaxDataTimeWindow": "31",
            "dataType": ["news", "pr", "blog"],
            "isDuplicate": "skipDuplicates",
            "hasDuplicate": "skipHasDuplicates"
        }
    },
    resultType: "uriWgtList",
    uriWgtListSortBy: "socialScore",
    apiKey: API_KEY
};

// Strategy 1: Simplified with OR logic
const strategy1 = {
    query: {
        "$query": {
            "$or": [
                { "keyword": "Black LGBT rights UK", "keywordLoc": "body" },
                { "keyword": "Black queer culture", "keywordLoc": "body" }
            ],
            "lang": "eng"
        },
        "$filter": {
            "forceMaxDataTimeWindow": "31",
            "dataType": ["news", "pr", "blog"],
            "isDuplicate": "skipDuplicates",
            "hasDuplicate": "skipHasDuplicates"
        }
    },
    resultType: "uriWgtList",
    uriWgtListSortBy: "socialScore",
    apiKey: API_KEY
};

// Strategy 2: Even simpler keywords
const strategy2 = {
    query: {
        "$query": {
            "$and": [
                { "keyword": "Black LGBT", "keywordLoc": "body" },
                { "lang": "eng" }
            ]
        },
        "$filter": {
            "forceMaxDataTimeWindow": "31",
            "dataType": ["news", "pr", "blog"],
            "isDuplicate": "skipDuplicates",
            "hasDuplicate": "skipHasDuplicates"
        }
    },
    resultType: "articles",
    articlesPage: 1,
    articlesCount: 10,
    articlesSortBy: "socialScore",
    includeArticleTitle: true,
    includeArticleBasicInfo: true,
    includeArticleBody: false,
    apiKey: API_KEY
};

// Strategy 3: Multiple specific terms with OR
const strategy3 = {
    query: {
        "$query": {
            "$or": [
                { "keyword": "Black LGBTQ", "keywordLoc": "body" },
                { "keyword": "Black queer", "keywordLoc": "body" },
                { "keyword": "Black trans", "keywordLoc": "body" }
            ],
            "lang": "eng"
        },
        "$filter": {
            "forceMaxDataTimeWindow": "31",
            "dataType": ["news", "pr", "blog"],
            "isDuplicate": "skipDuplicates",
            "hasDuplicate": "skipHasDuplicates"
        }
    },
    resultType: "articles",
    articlesPage: 1,
    articlesCount: 10,
    articlesSortBy: "socialScore",
    includeArticleTitle: true,
    includeArticleBasicInfo: true,
    includeArticleBody: false,
    apiKey: API_KEY
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
            }
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

        req.write(postData);
        req.end();
    });
}

async function runAllTests() {
    console.log('TESTING EVENT REGISTRY QUERY STRATEGIES\n');
    console.log('='.repeat(80) + '\n');

    const strategies = [
        { name: 'Strategy 1: Simplified OR logic', config: strategy1 },
        { name: 'Strategy 2: Simple AND with detailed results', config: strategy2 },
        { name: 'Strategy 3: Multiple specific terms', config: strategy3 }
    ];

    for (const { name, config } of strategies) {
        console.log(`\n${name}`);
        console.log('-'.repeat(80));

        try {
            const result = await testQuery(config, name);

            if (result.response.error) {
                console.log(`❌ ERROR: ${result.response.error}`);
            } else {
                // Handle different response types
                if (result.response.articles) {
                    const articles = result.response.articles.results || [];
                    console.log(`✅ SUCCESS: Found ${articles.length} articles`);

                    if (articles.length > 0) {
                        console.log('\nSample Articles:');
                        articles.slice(0, 3).forEach((article, i) => {
                            console.log(`\n  ${i + 1}. ${article.title || 'No title'}`);
                            console.log(`     Source: ${article.source?.title || 'Unknown'}`);
                            console.log(`     Date: ${article.dateTime || 'Unknown'}`);
                            console.log(`     URL: ${article.url || 'No URL'}`);
                        });
                    }
                } else if (result.response.uriWgtList) {
                    const results = result.response.uriWgtList.results || [];
                    console.log(`✅ SUCCESS: Found ${results.length} results`);

                    if (results.length > 0) {
                        console.log('\nTop URIs:');
                        results.slice(0, 5).forEach((item, i) => {
                            console.log(`  ${i + 1}. ${item.uri} (score: ${item.wgt})`);
                        });
                    }
                } else {
                    console.log('✅ Response received but unexpected format');
                    console.log(JSON.stringify(result.response, null, 2));
                }
            }
        } catch (error) {
            console.log(`❌ REQUEST FAILED: ${error.error?.message || error.error}`);
        }

        console.log('\n');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\nASSESSMENT COMPLETE\n');
}

runAllTests();
