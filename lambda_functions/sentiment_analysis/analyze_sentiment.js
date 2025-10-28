const AWS = require('aws-sdk');
const comprehend = new AWS.Comprehend();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Table name for sentiment data
const SENTIMENT_TABLE = process.env.SENTIMENT_TABLE || 'StockSentiment';

/**
 * Analyze sentiment from news and social media for stocks
 */
exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event));
    
    try {
        // Extract symbols and sources from event
        let { symbols = [], newsItems = [], tweets = [] } = event;
        
        if (symbols.length === 0) {
            throw new Error('No symbols provided for sentiment analysis');
        }
        
        // Analyze sentiment for all content
        const results = [];
        
        // Process news articles
        for (const item of newsItems) {
            if (item.text && item.text.length > 0) {
                const sentiment = await analyzeSentiment(item.text);
                
                // Determine which symbols are mentioned in this news item
                const mentionedSymbols = symbols.filter(symbol => 
                    item.text.includes(symbol) || 
                    (item.title && item.title.includes(symbol))
                );
                
                if (mentionedSymbols.length > 0) {
                    for (const symbol of mentionedSymbols) {
                        const result = {
                            symbol,
                            source: 'news',
                            sourceId: item.id || item.url,
                            title: item.title,
                            sentiment,
                            timestamp: new Date().toISOString()
                        };
                        
                        results.push(result);
                        
                        // Store sentiment in DynamoDB
                        await storeSentiment(result);
                    }
                }
            }
        }
        
        // Process tweets
        for (const tweet of tweets) {
            if (tweet.text && tweet.text.length > 0) {
                const sentiment = await analyzeSentiment(tweet.text);
                
                // Determine which symbols are mentioned in this tweet
                const mentionedSymbols = symbols.filter(symbol => 
                    tweet.text.includes(symbol) || 
                    tweet.text.includes(`$${symbol}`)
                );
                
                if (mentionedSymbols.length > 0) {
                    for (const symbol of mentionedSymbols) {
                        const result = {
                            symbol,
                            source: 'twitter',
                            sourceId: tweet.id,
                            sentiment,
                            timestamp: new Date().toISOString()
                        };
                        
                        results.push(result);
                        
                        // Store sentiment in DynamoDB
                        await storeSentiment(result);
                    }
                }
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Sentiment analysis completed',
                results
            })
        };
    } catch (error) {
        console.error('Error in sentiment analysis:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error in sentiment analysis',
                error: error.message
            })
        };
    }
};

/**
 * Analyze sentiment of text using AWS Comprehend
 */
async function analyzeSentiment(text) {
    // Truncate text to stay within Comprehend limits (5KB)
    const truncatedText = text.substring(0, 4900);
    
    const params = {
        Text: truncatedText,
        LanguageCode: 'en'
    };
    
    const sentiment = await comprehend.detectSentiment(params).promise();
    
    return {
        sentiment: sentiment.Sentiment,
        positive: sentiment.SentimentScore.Positive,
        negative: sentiment.SentimentScore.Negative,
        neutral: sentiment.SentimentScore.Neutral,
        mixed: sentiment.SentimentScore.Mixed
    };
}

/**
 * Store sentiment data in DynamoDB
 */
async function storeSentiment(sentimentData) {
    const params = {
        TableName: SENTIMENT_TABLE,
        Item: {
            id: `${sentimentData.symbol}:${sentimentData.source}:${sentimentData.sourceId}`,
            symbol: sentimentData.symbol,
            source: sentimentData.source,
            sourceId: sentimentData.sourceId,
            sentiment: sentimentData.sentiment.sentiment,
            scores: sentimentData.sentiment,
            timestamp: sentimentData.timestamp,
            title: sentimentData.title || null,
            ttl: Math.floor(Date.now() / 1000) + (7 * 86400) // 7 days TTL
        }
    };
    
    await dynamoDB.put(params).promise();
    console.log(`Stored sentiment for ${sentimentData.symbol} from ${sentimentData.source}`);
}
