const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PORTFOLIOS_TABLE = process.env.PORTFOLIOS_TABLE || 'Portfolios';
const ASSETS_TABLE = process.env.ASSETS_TABLE || 'Assets';
const SENTIMENT_TABLE = process.env.SENTIMENT_TABLE || 'StockSentiment';
const STOCK_PRICES_TABLE = process.env.STOCK_PRICES_TABLE || 'StockPrices';

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const userId = event.requestContext?.authorizer?.claims?.sub;
  
  if (!userId) {
    return {
      statusCode: 401,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    // 1. Get user's portfolio
    const portfolio = await getUserPortfolio(userId);
    
    if (!portfolio.assets || portfolio.assets.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          recommendations: [],
          portfolioMetrics: {
            totalValue: 0,
            totalProfitLossPercent: 0,
            overallSentiment: 'neutral',
            concentrationRisk: 0
          },
          message: 'No assets in portfolio'
        })
      };
    }
    
    // 2. Get current prices
    const currentPrices = await getCurrentPrices(portfolio.assets);
    
    // 3. Get sentiment data
    const sentimentData = await getSentimentForAssets(portfolio.assets);
    
    // 4. Calculate portfolio metrics
    const portfolioMetrics = calculatePortfolioMetrics(
      portfolio,
      currentPrices,
      sentimentData
    );
    
    // 5. Generate personalized recommendations
    const recommendations = generateRecommendations(
      portfolio,
      currentPrices,
      sentimentData,
      portfolioMetrics
    );
    
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        recommendations,
        portfolioMetrics,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function getUserPortfolio(userId) {
  const assetsResult = await dynamodb.query({
    TableName: ASSETS_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }).promise();
  
  return {
    userId,
    assets: assetsResult.Items || []
  };
}

async function getCurrentPrices(assets) {
  const prices = {};
  
  for (const asset of assets) {
    try {
      const result = await dynamodb.get({
        TableName: STOCK_PRICES_TABLE,
        Key: { symbol: asset.symbol }
      }).promise();
      
      prices[asset.symbol] = result.Item?.price || asset.purchasePrice * 1.05; // Mock +5%
    } catch (error) {
      console.error(`Error fetching price for ${asset.symbol}:`, error);
      prices[asset.symbol] = asset.purchasePrice;
    }
  }
  
  return prices;
}

async function getSentimentForAssets(assets) {
  const sentiment = {};
  
  for (const asset of assets) {
    try {
      const result = await dynamodb.query({
        TableName: SENTIMENT_TABLE,
        IndexName: 'symbol-timestamp-index',
        KeyConditionExpression: 'symbol = :symbol',
        ExpressionAttributeValues: {
          ':symbol': asset.symbol
        },
        Limit: 50,
        ScanIndexForward: false
      }).promise();
      
      if (result.Items.length > 0) {
        // Calculate averages
        const avgScores = { positive: 0, negative: 0, neutral: 0 };
        result.Items.forEach(item => {
          avgScores.positive += item.scores?.positive || 0;
          avgScores.negative += item.scores?.negative || 0;
          avgScores.neutral += item.scores?.neutral || 0;
        });
        
        const count = result.Items.length;
        sentiment[asset.symbol] = {
          positive: avgScores.positive / count,
          negative: avgScores.negative / count,
          neutral: avgScores.neutral / count,
          trend: calculateTrend(result.Items)
        };
      } else {
        // Neutral sentiment
        sentiment[asset.symbol] = {
          positive: 0.33,
          negative: 0.33,
          neutral: 0.34,
          trend: 'stable'
        };
      }
    } catch (error) {
      console.error(`Error fetching sentiment for ${asset.symbol}:`, error);
      sentiment[asset.symbol] = {
        positive: 0.33,
        negative: 0.33,
        neutral: 0.34,
        trend: 'stable'
      };
    }
  }
  
  return sentiment;
}

function calculatePortfolioMetrics(portfolio, prices, sentiment) {
  let totalValue = 0;
  let totalCost = 0;
  const positionValues = [];
  
  let sentimentSum = { positive: 0, negative: 0, neutral: 0 };
  let sentimentCount = 0;
  
  for (const asset of portfolio.assets) {
    const currentPrice = prices[asset.symbol];
    const positionValue = currentPrice * asset.quantity;
    const costBasis = asset.purchasePrice * asset.quantity;
    
    totalValue += positionValue;
    totalCost += costBasis;
    positionValues.push({ symbol: asset.symbol, value: positionValue });
    
    if (sentiment[asset.symbol]) {
      sentimentSum.positive += sentiment[asset.symbol].positive;
      sentimentSum.negative += sentiment[asset.symbol].negative;
      sentimentSum.neutral += sentiment[asset.symbol].neutral;
      sentimentCount++;
    }
  }
  
  // Concentration risk
  positionValues.sort((a, b) => b.value - a.value);
  const top2Value = positionValues.slice(0, 2).reduce((sum, p) => sum + p.value, 0);
  const concentrationRisk = totalValue > 0 ? top2Value / totalValue : 0;
  
  // Average sentiment
  const avgSentiment = sentimentCount > 0 ? {
    positive: sentimentSum.positive / sentimentCount,
    negative: sentimentSum.negative / sentimentCount,
    neutral: sentimentSum.neutral / sentimentCount
  } : { positive: 0.33, negative: 0.33, neutral: 0.34 };
  
  const overallSentiment = 
    avgSentiment.negative > 0.5 ? 'bearish' :
    avgSentiment.positive > 0.5 ? 'bullish' : 'neutral';
  
  return {
    totalValue,
    totalCost,
    totalProfitLoss: totalValue - totalCost,
    totalProfitLossPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    concentrationRisk,
    overallSentiment,
    avgSentiment
  };
}

function generateRecommendations(portfolio, prices, sentiment, metrics) {
  const recommendations = [];
  
  for (const asset of portfolio.assets) {
    const currentPrice = prices[asset.symbol];
    const assetSentiment = sentiment[asset.symbol];
    
    const profitLoss = currentPrice - asset.purchasePrice;
    const profitLossPercent = (profitLoss / asset.purchasePrice) * 100;
    const positionValue = currentPrice * asset.quantity;
    const portfolioWeight = (positionValue / metrics.totalValue) * 100;
    
    const positiveScore = assetSentiment?.positive || 0;
    const negativeScore = assetSentiment?.negative || 0;
    const sentimentTrend = assetSentiment?.trend || 'stable';
    
    const isOverweighted = portfolioWeight > 25;
    const hasNegativeSentiment = negativeScore > 0.6;
    const hasPositiveSentiment = positiveScore > 0.6;
    
    let action = 'HOLD';
    let confidence = 0;
    let reasoning = [];
    
    // SELL scenarios
    if (hasNegativeSentiment && profitLossPercent > 5) {
      action = 'SELL';
      confidence = Math.min(95, negativeScore * 100);
      reasoning.push(`Strong negative sentiment (${(negativeScore * 100).toFixed(0)}%)`);
      reasoning.push(`Lock in ${profitLossPercent.toFixed(1)}% profit before potential decline`);
    } else if (isOverweighted && profitLossPercent > 15) {
      action = 'SELL';
      confidence = 80;
      reasoning.push(`Position is ${portfolioWeight.toFixed(1)}% of portfolio (overconcentrated)`);
      reasoning.push(`Take profits at ${profitLossPercent.toFixed(1)}% gain and rebalance`);
    } else if (hasNegativeSentiment && sentimentTrend === 'declining') {
      action = 'SELL';
      confidence = 75;
      reasoning.push('Sentiment declining over past 7 days');
      reasoning.push('Exit before further deterioration');
    }
    
    // BUY scenarios
    else if (hasPositiveSentiment && profitLossPercent < -5) {
      action = 'BUY';
      confidence = Math.min(90, positiveScore * 100);
      reasoning.push(`Strong positive sentiment (${(positiveScore * 100).toFixed(0)}%)`);
      reasoning.push(`Currently ${Math.abs(profitLossPercent).toFixed(1)}% below purchase price`);
      reasoning.push('Opportunity to average down with positive outlook');
    } else if (hasPositiveSentiment && portfolioWeight < 10 && sentimentTrend === 'improving') {
      action = 'BUY';
      confidence = 85;
      reasoning.push('Improving sentiment trend');
      reasoning.push(`Underweight at ${portfolioWeight.toFixed(1)}% of portfolio`);
      reasoning.push('Increase position size');
    }
    
    // HOLD scenarios
    else if (profitLossPercent > 0 && profitLossPercent < 15 && !hasNegativeSentiment) {
      action = 'HOLD';
      confidence = 70;
      reasoning.push(`Currently up ${profitLossPercent.toFixed(1)}%`);
      reasoning.push('Sentiment neutral to positive');
      reasoning.push('Let winners run');
    } else {
      action = 'HOLD';
      confidence = 65;
      reasoning.push('Position near entry price');
      reasoning.push('Wait for clearer trend');
    }
    
    recommendations.push({
      symbol: asset.symbol,
      action,
      confidence,
      reasoning,
      currentPrice,
      purchasePrice: asset.purchasePrice,
      profitLoss: profitLossPercent.toFixed(2),
      quantity: asset.quantity,
      portfolioWeight: portfolioWeight.toFixed(1),
      sentiment: {
        positive: positiveScore,
        negative: negativeScore,
        trend: sentimentTrend
      },
      priority: confidence > 80 ? 'HIGH' : confidence > 60 ? 'MEDIUM' : 'LOW'
    });
  }
  
  recommendations.sort((a, b) => b.confidence - a.confidence);
  
  return recommendations;
}

function calculateTrend(items) {
  if (items.length < 10) return 'stable';
  
  const recent = items.slice(0, 10);
  const older = items.slice(10, 20);
  
  if (older.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((sum, item) => sum + (item.scores?.positive || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, item) => sum + (item.scores?.positive || 0), 0) / older.length;
  
  if (recentAvg > olderAvg + 0.1) return 'improving';
  if (recentAvg < olderAvg - 0.1) return 'declining';
  return 'stable';
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json'
  };
}