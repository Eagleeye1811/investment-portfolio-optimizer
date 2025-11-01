const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const SENTIMENT_TABLE = 'StockSentiment';

// Sentiment data for all 10 stocks
const sentimentData = [
  // 🔴 NEGATIVE STOCKS
  {
    symbol: 'TSLA',
    sentiment: 'NEGATIVE',
    baseScores: { positive: 0.25, negative: 0.65, neutral: 0.10 },
    count: 50,
    titles: [
      'EV Market Share Declining for Tesla',
      'Tesla Faces Production Challenges',
      'Concerns Over Tesla Valuation',
      'Competition Intensifies in EV Market',
      'Tesla Stock Under Pressure'
    ]
  },
  {
    symbol: 'NFLX',
    sentiment: 'NEGATIVE',
    baseScores: { positive: 0.28, negative: 0.52, neutral: 0.20 },
    count: 40,
    titles: [
      'Netflix Subscriber Growth Slows',
      'Streaming Competition Hurts Netflix',
      'Netflix Content Costs Rising',
      'Market Share Loss for Netflix',
      'Netflix Faces Challenges'
    ]
  },
  
  // 🟢 POSITIVE STOCKS
  {
    symbol: 'AAPL',
    sentiment: 'POSITIVE',
    baseScores: { positive: 0.78, negative: 0.12, neutral: 0.10 },
    count: 50,
    titles: [
      'Apple Reports Strong iPhone Sales',
      'Apple Services Revenue Grows',
      'Positive Outlook for Apple',
      'Apple Innovation Impresses Market',
      'Apple Stock Rallies on Earnings'
    ]
  },
  {
    symbol: 'NVDA',
    sentiment: 'POSITIVE',
    baseScores: { positive: 0.82, negative: 0.08, neutral: 0.10 },
    count: 50,
    titles: [
      'NVIDIA AI Chip Demand Surges',
      'NVIDIA Dominates AI Market',
      'Strong Growth for NVIDIA',
      'NVIDIA Beats Earnings Expectations',
      'NVIDIA Stock Soars on AI Boom'
    ]
  },
  {
    symbol: 'GOOGL',
    sentiment: 'POSITIVE',
    baseScores: { positive: 0.62, negative: 0.18, neutral: 0.20 },
    count: 45,
    titles: [
      'Google Cloud Revenue Strong',
      'Alphabet Shows Solid Growth',
      'Google AI Advances Impress',
      'Positive Quarter for Alphabet',
      'Google Advertising Revenue Up'
    ]
  },
  
  // ⚪ NEUTRAL STOCKS
  {
    symbol: 'MSFT',
    sentiment: 'NEUTRAL',
    baseScores: { positive: 0.45, negative: 0.35, neutral: 0.20 },
    count: 40,
    titles: [
      'Microsoft Results Mixed',
      'Azure Growth Steady',
      'Microsoft Stock Stable',
      'Investors Cautious on Microsoft',
      'Microsoft Maintains Position'
    ]
  },
  {
    symbol: 'AMZN',
    sentiment: 'NEUTRAL',
    baseScores: { positive: 0.42, negative: 0.38, neutral: 0.20 },
    count: 40,
    titles: [
      'Amazon E-commerce Steady',
      'AWS Growth Slows Slightly',
      'Amazon Stock Range-Bound',
      'Mixed Signals for Amazon',
      'Amazon Results In-Line'
    ]
  },
  {
    symbol: 'META',
    sentiment: 'NEUTRAL',
    baseScores: { positive: 0.48, negative: 0.32, neutral: 0.20 },
    count: 40,
    titles: [
      'Meta User Growth Stable',
      'Mixed Results for Meta',
      'Meta AI Investments Continue',
      'Social Media Giant Holds Steady',
      'Meta Revenue Meets Expectations'
    ]
  },
  {
    symbol: 'AMD',
    sentiment: 'NEUTRAL',
    baseScores: { positive: 0.44, negative: 0.36, neutral: 0.20 },
    count: 40,
    titles: [
      'AMD Market Position Stable',
      'Chip Maker Shows Mixed Results',
      'AMD Competes in AI Market',
      'AMD Stock Holds Ground',
      'Neutral Outlook for AMD'
    ]
  },
  {
    symbol: 'INTC',
    sentiment: 'NEUTRAL',
    baseScores: { positive: 0.32, negative: 0.48, neutral: 0.20 },
    count: 40,
    titles: [
      'Intel Restructuring Continues',
      'Mixed Quarter for Intel',
      'Intel Faces Market Challenges',
      'Intel Stock Range-Bound',
      'Cautious Outlook for Intel'
    ]
  }
];

async function seedSentiment() {
  console.log('🌱 Starting sentiment data seeding...\n');
  
  let totalInserted = 0;
  
  for (const stock of sentimentData) {
    console.log(`📊 Seeding ${stock.count} sentiment records for ${stock.symbol} (${stock.sentiment})...`);
    
    const now = Date.now();
    const promises = [];
    
    for (let i = 0; i < stock.count; i++) {
      // Add small random variation to each record (±4%)
      const variation = (Math.random() - 0.5) * 0.08;
      const positive = Math.max(0, Math.min(1, stock.baseScores.positive + variation));
      const negative = Math.max(0, Math.min(1, stock.baseScores.negative - (variation * 0.6)));
      const neutral = 1 - positive - negative;
      
      const source = i % 3 === 0 ? 'news' : i % 3 === 1 ? 'twitter' : 'reddit';
      const itemTimestamp = now - (i * 3600000); // 1 hour apart
      const timestampISO = new Date(itemTimestamp).toISOString();
      const id = `${source}-${stock.symbol}-${itemTimestamp}`;
      
      const item = {
        id: id,
        symbol: stock.symbol,
        timestamp: timestampISO, // ✅ ISO 8601 format
        sentiment: stock.sentiment, // ✅ Overall sentiment
        source: source,
        sourceId: id, // ✅ Same as id
        scores: {
          positive: parseFloat(positive.toFixed(4)),
          negative: parseFloat(negative.toFixed(4)),
          neutral: parseFloat(neutral.toFixed(4))
        },
        title: stock.titles[i % stock.titles.length], // ✅ Rotate through titles
        ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // ✅ 30 days from now
      };
      
      promises.push(
        dynamodb.put({
          TableName: SENTIMENT_TABLE,
          Item: item
        }).promise()
      );
    }
    
    try {
      await Promise.all(promises);
      totalInserted += stock.count;
      console.log(`✅ Successfully seeded ${stock.count} records for ${stock.symbol}`);
      console.log(`   Sentiment: ${stock.sentiment} | P=${(stock.baseScores.positive * 100).toFixed(0)}% N=${(stock.baseScores.negative * 100).toFixed(0)}%\n`);
    } catch (error) {
      console.error(`❌ Error seeding ${stock.symbol}:`, error.message);
      console.error('Full error:', error);
    }
  }
  
  console.log('🎉 Sentiment seeding complete!');
  console.log(`\n📊 Total records inserted: ${totalInserted}`);
  console.log('\n📋 Summary:');
  console.log('   🔴 Negative: TSLA, NFLX');
  console.log('   🟢 Positive: AAPL, NVDA, GOOGL');
  console.log('   ⚪ Neutral: MSFT, AMZN, META, AMD, INTC');
}

seedSentiment().catch(console.error);