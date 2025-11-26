/**
 * Test script for Event Registry query effectiveness
 * Tests the current query configuration and reports results
 */

import https from 'https';

const queryConfig = {
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
                {
                    "lang": "eng"
                }
            ]
        },
        "$filter": {
            "forceMaxDataTimeWindow": "31",
            "dataType": [
                "news",
                "pr",
                "blog"
            ],
            "isDuplicate": "skipDuplicates",
            "hasDuplicate": "skipHasDuplicates"
        }
    },
    resultType: "uriWgtList",
    uriWgtListSortBy: "socialScore",
    apiKey: "a2109782-1945-45e8-a4f3-56c968a263ac"
};

function testQuery() {
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

    console.log('Testing Event Registry Query...\n');
    console.log('Query Configuration:');
    console.log(JSON.stringify(queryConfig, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);

                console.log('API Response Status:', res.statusCode);
                console.log('\n' + '='.repeat(80) + '\n');

                if (response.error) {
                    console.error('ERROR:', response.error);
                    return;
                }

                // Analyze results
                console.log('RESULTS ANALYSIS:\n');

                if (response.uriWgtList) {
                    const results = response.uriWgtList.results || [];
                    console.log(`Total Results Found: ${results.length}`);

                    if (results.length > 0) {
                        console.log('\nTop Results (by social score):');
                        results.slice(0, 5).forEach((item, index) => {
                            console.log(`\n${index + 1}. URI: ${item.uri}`);
                            console.log(`   Weight/Score: ${item.wgt}`);
                        });
                    } else {
                        console.log('\n⚠️  NO RESULTS FOUND');
                        console.log('This suggests the query is too restrictive.');
                    }
                } else {
                    console.log('Unexpected response structure:');
                    console.log(JSON.stringify(response, null, 2));
                }

                console.log('\n' + '='.repeat(80) + '\n');
                console.log('Full Response:');
                console.log(JSON.stringify(response, null, 2));

            } catch (error) {
                console.error('Error parsing response:', error);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('Request failed:', error);
    });

    req.write(postData);
    req.end();
}

// Run the test
testQuery();
