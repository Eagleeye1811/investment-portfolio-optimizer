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
    let sentimentData;
    
    // 🔥 CHECK IF SENTIMENT WAS PASSED IN REQUEST BODY (POST method)
    if (event.httpMethod === 'POST' && event.body) {
      try {
        const body = JSON.parse(event.body);
        if (body.sentiment && Object.keys(body.sentiment).length > 0) {
          console.log('✅ Using sentiment data from request body (synchronized with sentiment-api)');
          sentimentData = body.sentiment;
        } else {
          console.log('⚠️ POST request but no valid sentiment in body, fetching from DB');
          sentimentData = await getSentimentForAssets(portfolio.assets);
        }
      } catch (parseError) {
        console.log('⚠️ Error parsing request body, fetching sentiment from DB');
        sentimentData = await getSentimentForAssets(portfolio.assets);
      }
    } else {
      console.log('⚠️ GET request or no body, fetching sentiment from DB');
      sentimentData = await getSentimentForAssets(portfolio.assets);
    }
    
    console.log('📊 Sentiment Data being used:', JSON.stringify(sentimentData, null, 2));
    
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
      
      prices[asset.symbol] = result.Item?.price || asset.purchasePrice * 1.05;
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
        // Calculate base averages
        const avgScores = { positive: 0, negative: 0, neutral: 0 };
        result.Items.forEach(item => {
          avgScores.positive += item.scores?.positive || 0;
          avgScores.negative += item.scores?.negative || 0;
          avgScores.neutral += item.scores?.neutral || 0;
        });
        
        const count = result.Items.length;
        const basePositive = avgScores.positive / count;
        const baseNegative = avgScores.negative / count;
        const baseNeutral = avgScores.neutral / count;
        
        // 🔥 ADD SAME DYNAMIC VARIATION as sentiment-api (±4%)
        const variation = (Math.random() - 0.5) * 0.08;
        
        let positive = basePositive + variation;
        let negative = baseNegative - (variation * 0.6);
        
        // Ensure values stay within [0, 1]
        positive = Math.max(0, Math.min(1, positive));
        negative = Math.max(0, Math.min(1, negative));
        const neutral = 1 - positive - negative;
        
        const trend = calculateTrend(result.Items);
        
        // Occasionally shift trend for realism
        let adjustedTrend = trend;
        if (Math.random() < 0.15) {
          if (trend === 'stable' && positive > 0.55) adjustedTrend = 'improving';
          else if (trend === 'stable' && negative > 0.55) adjustedTrend = 'declining';
        }
        
        sentiment[asset.symbol] = {
          positive: parseFloat(positive.toFixed(4)),
          negative: parseFloat(negative.toFixed(4)),
          neutral: parseFloat(neutral.toFixed(4)),
          trend: adjustedTrend,
          sampleSize: count
        };
        
        console.log(`✅ ${asset.symbol}: P=${(positive*100).toFixed(1)}% N=${(negative*100).toFixed(1)}% Trend=${adjustedTrend}`);
      } else {
        // Neutral sentiment
        sentiment[asset.symbol] = {
          positive: 0.33,
          negative: 0.33,
          neutral: 0.34,
          trend: 'stable',
          sampleSize: 0
        };
      }
    } catch (error) {
      console.error(`Error fetching sentiment for ${asset.symbol}:`, error);
      sentiment[asset.symbol] = {
        positive: 0.33,
        negative: 0.33,
        neutral: 0.34,
        trend: 'stable',
        sampleSize: 0
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
    
    // 🔥 IMPROVED THRESHOLDS - more sensitive to sentiment
    const isOverweighted = portfolioWeight > 25;
    const hasStrongNegativeSentiment = negativeScore > 0.55;
    const hasStrongPositiveSentiment = positiveScore > 0.55;
    const hasModerateNegativeSentiment = negativeScore > 0.45 && negativeScore <= 0.55;
    const hasModeratePositiveSentiment = positiveScore > 0.45 && positiveScore <= 0.55;
    
    let action = 'HOLD';
    let confidence = 0;
    let reasoning = [];
    
    // ============================================
    // SELL SCENARIOS (prioritized by severity)
    // ============================================
    
    // 1. CRITICAL: Strong negative sentiment with significant loss
    if (hasStrongNegativeSentiment && profitLossPercent < -20) {
      action = 'SELL';
      confidence = Math.min(95, 70 + (negativeScore * 30));
      reasoning.push(`⚠️ Strong negative sentiment (${(negativeScore * 100).toFixed(0)}%)`);
      reasoning.push(`📉 Currently down ${Math.abs(profitLossPercent).toFixed(1)}%`);
      reasoning.push('Exit position to limit further damage');
    }
    
    // 2. Strong negative sentiment with moderate loss
    else if (hasStrongNegativeSentiment && profitLossPercent < -10) {
      action = 'SELL';
      confidence = Math.min(90, 65 + (negativeScore * 30));
      reasoning.push(`⚠️ Strong negative sentiment (${(negativeScore * 100).toFixed(0)}%)`);
      reasoning.push(`📉 Down ${Math.abs(profitLossPercent).toFixed(1)}%`);
      reasoning.push('Cut losses before further decline');
    }
    
    // 3. Moderate negative sentiment with declining trend and loss
    else if (hasModerateNegativeSentiment && sentimentTrend === 'declining' && profitLossPercent < -5) {
      action = 'SELL';
      confidence = 75;
      reasoning.push(`⚠️ Negative sentiment (${(negativeScore * 100).toFixed(0)}%) with declining trend`);
      reasoning.push(`📉 Down ${Math.abs(profitLossPercent).toFixed(1)}%`);
      reasoning.push('Trend worsening - exit position');
    }
    
    // 4. Strong negative sentiment with profit (lock in gains)
    else if (hasStrongNegativeSentiment && profitLossPercent > 5) {
      action = 'SELL';
      confidence = 85;
      reasoning.push(`⚠️ Strong negative sentiment (${(negativeScore * 100).toFixed(0)}%)`);
      reasoning.push(`📈 Lock in ${profitLossPercent.toFixed(1)}% profit before decline`);
      reasoning.push('Protect gains with deteriorating sentiment');
    }
    
    // 5. Overconcentrated with good profit (rebalance) - unless very positive sentiment
    else if (isOverweighted && profitLossPercent > 30 && !hasStrongPositiveSentiment) {
      action = 'SELL';
      confidence = 80;
      reasoning.push(`⚖️ Overweight at ${portfolioWeight.toFixed(1)}% of portfolio`);
      reasoning.push(`📈 Take profits at ${profitLossPercent.toFixed(1)}% gain`);
      reasoning.push('Reduce concentration risk');
    }
    
    // ============================================
    // BUY SCENARIOS
    // ============================================
    
    // 6. Strong positive sentiment with dip (buy opportunity)
    else if (hasStrongPositiveSentiment && profitLossPercent < -5 && profitLossPercent > -25) {
      action = 'BUY';
      confidence = Math.min(90, 65 + (positiveScore * 30));
      reasoning.push(`✅ Strong positive sentiment (${(positiveScore * 100).toFixed(0)}%)`);
      reasoning.push(`📉 ${Math.abs(profitLossPercent).toFixed(1)}% below purchase price`);
      reasoning.push('Buying opportunity - average down with strong outlook');
    }
    
    // 7. Strong positive sentiment, improving trend, underweight
    else if (hasStrongPositiveSentiment && sentimentTrend === 'improving' && portfolioWeight < 15) {
      action = 'BUY';
      confidence = 85;
      reasoning.push(`✅ Strong positive sentiment (${(positiveScore * 100).toFixed(0)}%)`);
      reasoning.push(`📈 Improving sentiment trend`);
      reasoning.push(`⚖️ Underweight at ${portfolioWeight.toFixed(1)}%`);
      reasoning.push('Increase position size');
    }
    
    // 🔥 8. Strong positive sentiment with profit and room to grow (CRITICAL - COMES BEFORE GENERIC HOLD!)
    else if (hasStrongPositiveSentiment && profitLossPercent > 0 && profitLossPercent < 30 && portfolioWeight < 20) {
      action = 'BUY';
      confidence = Math.min(88, 70 + (positiveScore * 20));
      reasoning.push(`✅ Strong positive sentiment (${(positiveScore * 100).toFixed(0)}%)`);
      reasoning.push(`📈 Currently up ${profitLossPercent.toFixed(1)}%`);
      reasoning.push(`⚖️ Position at ${portfolioWeight.toFixed(1)}% - room to grow`);
      reasoning.push('Add to winning position with strong sentiment');
    }
    
    // 9. Moderate positive sentiment with improving trend
    else if (hasModeratePositiveSentiment && sentimentTrend === 'improving' && profitLossPercent < 15) {
      action = 'BUY';
      confidence = 75;
      reasoning.push(`✅ Positive sentiment (${(positiveScore * 100).toFixed(0)}%) trending up`);
      reasoning.push('Momentum building - consider adding to position');
    }
    
    // ============================================
    // HOLD SCENARIOS
    // ============================================
    
    // 10. Winner with strong positive sentiment - ONLY if already large position (≥20%)
    else if (profitLossPercent > 5 && hasStrongPositiveSentiment && portfolioWeight >= 20) {
      action = 'HOLD';
      confidence = 85;
      reasoning.push(`📈 Up ${profitLossPercent.toFixed(1)}%`);
      reasoning.push(`✅ Strong positive sentiment (${(positiveScore * 100).toFixed(0)}%)`);
      reasoning.push(`⚖️ Position at ${portfolioWeight.toFixed(1)}% - already well-sized`);
      reasoning.push('Let winners run with strong sentiment');
      if (isOverweighted) {
        reasoning.push('⚠️ Monitor - consider partial profits if > 40% of portfolio');
      }
    }
    
    // 11. Moderate profit with NEUTRAL sentiment (NOT strong positive!)
    else if (profitLossPercent > 0 && profitLossPercent < 30 && !hasStrongNegativeSentiment && !hasStrongPositiveSentiment) {
      action = 'HOLD';
      confidence = 70;
      reasoning.push(`📈 Up ${profitLossPercent.toFixed(1)}%`);
      reasoning.push(`Sentiment: Neutral (${(positiveScore * 100).toFixed(0)}% positive)`);
      reasoning.push('Maintain position');
    }
    
    // 12. Near entry price with neutral sentiment
    else if (Math.abs(profitLossPercent) < 10 && !hasStrongNegativeSentiment && !hasStrongPositiveSentiment) {
      action = 'HOLD';
      confidence = 65;
      reasoning.push(`📊 Near entry (${profitLossPercent >= 0 ? '+' : ''}${profitLossPercent.toFixed(1)}%)`);
      reasoning.push('Sentiment neutral - wait for clearer trend');
    }
    
    // 13. Default hold
    else {
      action = 'HOLD';
      confidence = 60;
      if (profitLossPercent < -5) {
        reasoning.push(`📉 Down ${Math.abs(profitLossPercent).toFixed(1)}%`);
        reasoning.push(`Sentiment: ${(positiveScore * 100).toFixed(0)}% positive, ${(negativeScore * 100).toFixed(0)}% negative`);
        reasoning.push('Monitor closely for changes');
      } else if (profitLossPercent > 0) {
        reasoning.push(`📈 Up ${profitLossPercent.toFixed(1)}%`);
        reasoning.push('Maintain current position');
      } else {
        reasoning.push('Position near entry - hold and monitor');
      }
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
      priority: confidence > 80 ? 'HIGH' : confidence > 65 ? 'MEDIUM' : 'LOW'
    });
    
    console.log(`💡 ${asset.symbol}: ${action} (${confidence}% confidence) | P/L: ${profitLossPercent.toFixed(1)}% | Weight: ${portfolioWeight.toFixed(1)}% | Sentiment: P${(positiveScore * 100).toFixed(0)}% N${(negativeScore * 100).toFixed(0)}%`);
  }
  
  // Sort by confidence (highest priority first)
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