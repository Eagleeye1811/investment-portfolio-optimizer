const AWS = require('aws-sdk');
const sagemakerRuntime = new AWS.SageMakerRuntime();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Environment variables
const SAGEMAKER_ENDPOINT = process.env.SAGEMAKER_ENDPOINT;
const STOCKS_TABLE = process.env.STOCKS_TABLE || 'StockPrices';
const SENTIMENT_TABLE = process.env.SENTIMENT_TABLE || 'StockSentiment';
const RECOMMENDATIONS_TABLE = process.env.RECOMMENDATIONS_TABLE || 'PortfolioRecommendations';
const PORTFOLIO_TABLE = process.env.PORTFOLIO_TABLE || 'UserPortfolios';

/**
 * Generate portfolio recommendations based on:
 * - Current market data
 * - User's existing portfolio
 * - Sentiment analysis
 * - Risk tolerance and investment goals
 */
exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event));
    
    try {
        // Extract user ID and portfolio ID from event
        const { userId, portfolioId } = event;
        
        if (!userId || !portfolioId) {
            throw new Error('Missing userId or portfolioId in request');
        }
        
        // 1. Retrieve user's portfolio
        const portfolio = await getUserPortfolio(userId, portfolioId);
        
        // 2. Get current stock prices for portfolio assets
        const symbols = portfolio.assets.map(asset => asset.symbol);
        const stockPrices = await getStockPrices(symbols);
        
        // 3. Fetch sentiment data for the symbols
        const sentimentData = await getSentimentData(symbols);
        
        // 4. Prepare data for SageMaker model
        const modelInput = prepareModelInput(portfolio, stockPrices, sentimentData);
        
        // 5. Call SageMaker endpoint for recommendations
        const recommendations = await callSageMakerEndpoint(modelInput);
        
        // 6. Store recommendations in DynamoDB
        await storeRecommendations(userId, portfolioId, recommendations);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                userId,
                portfolioId,
                recommendations,
                timestamp: new Date().toISOString()
            })
        };
    } catch (error) {
        console.error('Error generating portfolio recommendations:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error generating portfolio recommendations',
                error: error.message
            })
        };
    }
};

/**
 * Get user portfolio from DynamoDB
 */
async function getUserPortfolio(userId, portfolioId) {
    const params = {
        TableName: PORTFOLIO_TABLE,
        Key: {
            userId,
            portfolioId
        }
    };
    
    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
        throw new Error(`Portfolio not found for user ${userId} and portfolio ${portfolioId}`);
    }
    
    return result.Item;
}

/**
 * Get current stock prices from DynamoDB
 */
async function getStockPrices(symbols) {
    const promises = symbols.map(symbol => {
        const params = {
            TableName: STOCKS_TABLE,
            KeyConditionExpression: 'symbol = :symbol',
            ExpressionAttributeValues: {
                ':symbol': symbol
            },
            Limit: 1,
            ScanIndexForward: false // Get most recent first
        };
        
        return dynamoDB.query(params).promise()
            .then(result => {
                if (result.Items && result.Items.length > 0) {
                    return result.Items[0];
                }
                return null;
            });
    });
    
    const results = await Promise.all(promises);
    
    // Create a map of symbol to price data
    const priceMap = {};
    results.forEach(item => {
        if (item) {
            priceMap[item.symbol] = item;
        }
    });
    
    return priceMap;
}

/**
 * Get sentiment data for symbols
 */
async function getSentimentData(symbols) {
    const sentimentMap = {};
    
    for (const symbol of symbols) {
        const params = {
            TableName: SENTIMENT_TABLE,
            IndexName: 'SymbolTimestampIndex',
            KeyConditionExpression: 'symbol = :symbol',
            ExpressionAttributeValues: {
                ':symbol': symbol
            },
            Limit: 20, // Get recent sentiment entries
            ScanIndexForward: false // Most recent first
        };
        
        const result = await dynamoDB.query(params).promise();
        
        if (result.Items && result.Items.length > 0) {
            // Calculate average sentiment scores
            const scores = result.Items.reduce((acc, item) => {
                acc.positive += item.scores.positive;
                acc.negative += item.scores.negative;
                acc.neutral += item.scores.neutral;
                acc.mixed += item.scores.mixed;
                return acc;
            }, { positive: 0, negative: 0, neutral: 0, mixed: 0 });
            
            const count = result.Items.length;
            sentimentMap[symbol] = {
                positive: scores.positive / count,
                negative: scores.negative / count,
                neutral: scores.neutral / count,
                mixed: scores.mixed / count,
                overallSentiment: calculateOverallSentiment(scores, count)
            };
        } else {
            sentimentMap[symbol] = null;
        }
    }
    
    return sentimentMap;
}

/**
 * Calculate overall sentiment based on average scores
 */
function calculateOverallSentiment(scores, count) {
    const avg = {
        positive: scores.positive / count,
        negative: scores.negative / count,
        neutral: scores.neutral / count,
        mixed: scores.mixed / count
    };
    
    // Find the highest sentiment score
    let highestScore = 0;
    let highestSentiment = 'NEUTRAL';
    
    for (const [sentiment, score] of Object.entries(avg)) {
        if (score > highestScore) {
            highestScore = score;
            highestSentiment = sentiment.toUpperCase();
        }
    }
    
    return highestSentiment;
}

/**
 * Prepare input data for SageMaker model
 */
function prepareModelInput(portfolio, stockPrices, sentimentData) {
    // In a real implementation, this would prepare the data in the format
    // required by your specific SageMaker model
    
    const assets = portfolio.assets.map(asset => {
        const priceData = stockPrices[asset.symbol] || {};
        const sentiment = sentimentData[asset.symbol] || {};
        
        return {
            symbol: asset.symbol,
            quantity: asset.quantity,
            purchasePrice: asset.purchasePrice,
            currentPrice: priceData.price || asset.purchasePrice,
            priceChange: priceData.change || 0,
            priceChangePercent: priceData.changePercent || 0,
            sentimentPositive: sentiment.positive || 0.5,
            sentimentNegative: sentiment.negative || 0.1,
            sentimentNeutral: sentiment.neutral || 0.3,
            sentimentMixed: sentiment.mixed || 0.1
        };
    });
    
    return {
        portfolio: {
            id: portfolio.portfolioId,
            userId: portfolio.userId,
            riskTolerance: portfolio.riskTolerance || 'MODERATE',
            investmentGoal: portfolio.investmentGoal || 'GROWTH',
            assets
        }
    };
}

/**
 * Call SageMaker endpoint for recommendations
 */
async function callSageMakerEndpoint(modelInput) {
    // For this template, we're returning mock recommendations
    // In a real application, you would call the SageMaker endpoint
    
    if (!SAGEMAKER_ENDPOINT) {
        console.log('SageMaker endpoint not configured, returning mock recommendations');
        return generateMockRecommendations(modelInput);
    }
    
    try {
        const params = {
            EndpointName: SAGEMAKER_ENDPOINT,
            Body: JSON.stringify(modelInput),
            ContentType: 'application/json'
        };
        
        const response = await sagemakerRuntime.invokeEndpoint(params).promise();
        return JSON.parse(Buffer.from(response.Body).toString());
    } catch (error) {
        console.error('Error calling SageMaker endpoint:', error);
        // Fall back to mock recommendations
        return generateMockRecommendations(modelInput);
    }
}

/**
 * Generate mock recommendations for development and testing
 */
function generateMockRecommendations(modelInput) {
    const assets = modelInput.portfolio.assets;
    const recommendations = [];
    
    const actions = ['BUY', 'SELL', 'HOLD'];
    const strengths = ['STRONG', 'MODERATE', 'WEAK'];
    
    for (const asset of assets) {
        // Simple logic for mock recommendations
        let action = 'HOLD';
        let strength = 'MODERATE';
        
        // Price change based recommendation
        if (asset.priceChange > 0 && asset.sentimentPositive > 0.6) {
            action = 'BUY';
            strength = asset.priceChangePercent > 2 ? 'STRONG' : 'MODERATE';
        } else if (asset.priceChange < 0 && asset.sentimentNegative > 0.6) {
            action = 'SELL';
            strength = asset.priceChangePercent < -2 ? 'STRONG' : 'MODERATE';
        }
        
        recommendations.push({
            symbol: asset.symbol,
            action,
            strength,
            targetAllocation: calculateTargetAllocation(asset, action, strength),
            reasoning: generateReasoning(asset, action, strength)
        });
    }
    
    // Also add 1-2 new stock recommendations
    const newStocks = ['NVDA', 'V', 'JPM', 'JNJ', 'PG'];
    const existingSymbols = assets.map(a => a.symbol);
    
    // Filter out stocks already in portfolio
    const availableNewStocks = newStocks.filter(stock => !existingSymbols.includes(stock));
    
    if (availableNewStocks.length > 0) {
        // Add 1 random new stock recommendation
        const newStock = availableNewStocks[Math.floor(Math.random() * availableNewStocks.length)];
        
        recommendations.push({
            symbol: newStock,
            action: 'BUY',
            strength: 'MODERATE',
            targetAllocation: 5, // Suggest 5% allocation
            reasoning: `Based on market trends and sector analysis, adding ${newStock} would improve portfolio diversification.`
        });
    }
    
    return {
        timestamp: new Date().toISOString(),
        recommendations
    };
}

/**
 * Calculate target allocation based on recommendation
 */
function calculateTargetAllocation(asset, action, strength) {
    // Simple mock logic for target allocation
    let currentAllocation = 5; // Default if unknown
    
    if (action === 'BUY') {
        return strength === 'STRONG' ? currentAllocation + 3 : currentAllocation + 1;
    } else if (action === 'SELL') {
        return strength === 'STRONG' ? Math.max(0, currentAllocation - 3) : Math.max(0, currentAllocation - 1);
    }
    
    return currentAllocation;
}

/**
 * Generate reasoning text for recommendation
 */
function generateReasoning(asset, action, strength) {
    if (action === 'BUY') {
        return `${strength} buy recommendation based on positive price momentum (${asset.priceChangePercent}%) and favorable sentiment analysis.`;
    } else if (action === 'SELL') {
        return `${strength} sell recommendation based on negative price trend (${asset.priceChangePercent}%) and unfavorable market sentiment.`;
    }
    
    return 'Maintain current position based on balanced risk and reward outlook.';
}

/**
 * Store recommendations in DynamoDB
 */
async function storeRecommendations(userId, portfolioId, recommendations) {
    const timestamp = new Date().toISOString();
    
    const params = {
        TableName: RECOMMENDATIONS_TABLE,
        Item: {
            userId,
            portfolioId,
            timestamp,
            recommendations: recommendations.recommendations,
            ttl: Math.floor(Date.now() / 1000) + (7 * 86400) // 7 days TTL
        }
    };
    
    await dynamoDB.put(params).promise();
    console.log(`Stored recommendations for portfolio ${portfolioId}`);
}
