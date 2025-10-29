const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const SENTIMENT_TABLE = process.env.SENTIMENT_TABLE || 'StockSentiment';

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
    const symbols = event.queryStringParameters?.symbols?.split(',') || [];
    
    if (symbols.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'No symbols provided' })
      };
    }
    
    const sentimentData = {};
    
    for (const symbol of symbols) {
      const sentiment = await getSentimentForSymbol(symbol);
      sentimentData[symbol] = sentiment;
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(sentimentData)
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function getSentimentForSymbol(symbol) {
  try {
    // Query last 50 sentiment records for this symbol
    const result = await dynamodb.query({
      TableName: SENTIMENT_TABLE,
      IndexName: 'symbol-timestamp-index',
      KeyConditionExpression: 'symbol = :symbol',
      ExpressionAttributeValues: {
        ':symbol': symbol
      },
      Limit: 50,
      ScanIndexForward: false // Most recent first
    }).promise();
    
    if (result.Items.length === 0) {
      // Return neutral sentiment if no data
      return {
        sentiment: 'NEUTRAL',
        positive: 0.33,
        negative: 0.33,
        neutral: 0.34,
        trend: 'stable',
        sampleSize: 0
      };
    }
    
    // Aggregate sentiment scores
    const avgScores = {
      positive: 0,
      negative: 0,
      neutral: 0
    };
    
    result.Items.forEach(item => {
      avgScores.positive += item.scores?.positive || 0;
      avgScores.negative += item.scores?.negative || 0;
      avgScores.neutral += item.scores?.neutral || 0;
    });
    
    const count = result.Items.length;
    const positive = avgScores.positive / count;
    const negative = avgScores.negative / count;
    const neutral = avgScores.neutral / count;
    
    // Determine overall sentiment
    let overallSentiment = 'NEUTRAL';
    if (positive > 0.5) overallSentiment = 'POSITIVE';
    else if (negative > 0.5) overallSentiment = 'NEGATIVE';
    
    // Calculate trend
    const trend = calculateTrend(result.Items);
    
    return {
      sentiment: overallSentiment,
      positive,
      negative,
      neutral,
      trend,
      sampleSize: count
    };
    
  } catch (error) {
    console.error(`Error getting sentiment for ${symbol}:`, error);
    // Return neutral on error
    return {
      sentiment: 'NEUTRAL',
      positive: 0.33,
      negative: 0.33,
      neutral: 0.34,
      trend: 'stable',
      sampleSize: 0
    };
  }
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
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json'
  };
}