const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

const SENTIMENT_TABLE = 'StockSentiment';

// Realistic sentiment data for different scenarios
const sentimentProfiles = {
  'AAPL': { positive: 0.72, negative: 0.15, neutral: 0.13, trend: 'improving' },   // Strong BUY
  'TSLA': { positive: 0.25, negative: 0.65, neutral: 0.10, trend: 'declining' },   // Strong SELL
  'MSFT': { positive: 0.45, negative: 0.25, neutral: 0.30, trend: 'stable' },      // HOLD
  'AMZN': { positive: 0.68, negative: 0.18, neutral: 0.14, trend: 'improving' },   // BUY
  'GOOGL': { positive: 0.38, negative: 0.35, neutral: 0.27, trend: 'stable' },     // HOLD
  'NVDA': { positive: 0.78, negative: 0.12, neutral: 0.10, trend: 'improving' },   // Strong BUY
  'META': { positive: 0.30, negative: 0.58, neutral: 0.12, trend: 'declining' },   // SELL
  'BTC': { positive: 0.55, negative: 0.28, neutral: 0.17, trend: 'improving' },    // BUY
  'ETH': { positive: 0.62, negative: 0.22, neutral: 0.16, trend: 'improving' }     // BUY
};

const sources = ['twitter', 'news', 'reddit'];
const newsHeadlines = {
  'AAPL': [
    'Apple Reports Record Q4 Revenue',
    'iPhone 15 Sales Exceed Expectations',
    'Apple Services Growth Accelerates',
    'Analysts Upgrade Apple Price Target',
    'Apple AI Features Drive Innovation'
  ],
  'TSLA': [
    'Tesla Faces Increased Competition in China',
    'EV Market Share Declining for Tesla',
    'Musk Sells Additional Tesla Shares',
    'Production Issues at Texas Gigafactory',
    'Tesla Recalls Thousands of Vehicles'
  ],
  'MSFT': [
    'Microsoft Cloud Revenue Steady',
    'Azure Growth Meets Expectations',
    'Microsoft AI Investments Continue',
    'Office 365 Subscriber Base Stable',
    'Gaming Division Shows Mixed Results'
  ]
};

async function seedSentimentData() {
  console.log('🌱 Starting sentiment data seeding...\n');
  
  let totalInserted = 0;
  
  for (const [symbol, profile] of Object.entries(sentimentProfiles)) {
    console.log(`📊 Seeding sentiment for ${symbol}...`);
    
    // Create 30 sentiment records per symbol (simulate historical data)
    const items = [];
    const now = Date.now();
    
    for (let i = 0; i < 30; i++) {
      const timestamp = now - (i * 3600000); // 1 hour intervals
      
      // Add some variance to make it realistic
      const variance = (Math.random() - 0.5) * 0.1; // ±5%
      
      const positive = Math.max(0, Math.min(1, profile.positive + variance));
      const negative = Math.max(0, Math.min(1, profile.negative - variance));
      const neutral = 1 - positive - negative;
      
      const source = sources[Math.floor(Math.random() * sources.length)];
      const sourceId = `${source}-${symbol}-${timestamp}`;
      
      // Determine sentiment label
      let sentimentLabel = 'NEUTRAL';
      if (positive > 0.5) sentimentLabel = 'POSITIVE';
      else if (negative > 0.5) sentimentLabel = 'NEGATIVE';
      
      // Get headline if available
      const headlines = newsHeadlines[symbol] || ['Market analysis for ' + symbol];
      const title = headlines[Math.floor(Math.random() * headlines.length)];
      
      const item = {
        id: sourceId,
        symbol: symbol,
        source: source,
        sourceId: sourceId,
        sentiment: sentimentLabel,
        scores: {
          positive: parseFloat(positive.toFixed(4)),
          negative: parseFloat(negative.toFixed(4)),
          neutral: parseFloat(neutral.toFixed(4))
        },
        timestamp: new Date(timestamp).toISOString(),
        title: title,
        ttl: Math.floor((Date.now() + 30 * 24 * 3600000) / 1000) // 30 days
      };
      
      items.push(item);
    }
    
    // Batch write items
    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25);
      
      const params = {
        RequestItems: {
          [SENTIMENT_TABLE]: batch.map(item => ({
            PutRequest: { Item: item }
          }))
        }
      };
      
      try {
        await dynamodb.batchWrite(params).promise();
        totalInserted += batch.length;
        console.log(`  ✅ Inserted ${batch.length} records for ${symbol}`);
      } catch (error) {
        console.error(`  ❌ Error inserting batch for ${symbol}:`, error.message);
      }
    }
  }
  
  console.log(`\n✨ Successfully seeded ${totalInserted} sentiment records!`);
  console.log('\n📋 Sentiment Profile Summary:');
  Object.entries(sentimentProfiles).forEach(([symbol, profile]) => {
    const expectedAction = 
      profile.positive > 0.6 ? '🟢 BUY' : 
      profile.negative > 0.6 ? '🔴 SELL' : 
      '🔵 HOLD';
    console.log(`  ${symbol}: ${expectedAction} (P:${(profile.positive*100).toFixed(0)}% N:${(profile.negative*100).toFixed(0)}%)`);
  });
}

seedSentimentData()
  .then(() => {
    console.log('\n✅ Sentiment seeding completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Sentiment seeding failed:', error);
    process.exit(1);
  });