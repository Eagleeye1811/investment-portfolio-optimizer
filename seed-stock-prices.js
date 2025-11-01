const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

const STOCK_PRICES_TABLE = 'StockPrices';

// Realistic stock prices (as of late 2024)
const stockPrices = {
  'AAPL': 178.25,
  'TSLA': 245.80,
  'MSFT': 380.50,
  'AMZN': 155.30,
  'GOOGL': 142.75,
  'NVDA': 495.20,
  'META': 325.60,
  'NFLX': 445.90,
  'AMD': 115.40,
  'INTC': 42.35,
  'BTC': 42500.00,
  'ETH': 2250.00,
  'BNB': 315.50,
  'SOL': 98.25,
  'DOGE': 0.085
};

async function seedStockPrices() {
  console.log('🌱 Starting stock price seeding...\n');
  
  const items = [];
  
  for (const [symbol, price] of Object.entries(stockPrices)) {
    const item = {
      symbol: symbol,
      price: price,
      lastUpdated: new Date().toISOString(),
      volume: Math.floor(Math.random() * 50000000) + 10000000, // Random volume
      marketCap: price * (Math.random() * 1000000000 + 100000000),
      change24h: (Math.random() - 0.5) * 10, // ±5% daily change
      high24h: price * (1 + Math.random() * 0.03),
      low24h: price * (1 - Math.random() * 0.03)
    };
    
    items.push(item);
    console.log(`📈 ${symbol}: $${price.toLocaleString()}`);
  }
  
  // Batch write items
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    
    const params = {
      RequestItems: {
        [STOCK_PRICES_TABLE]: batch.map(item => ({
          PutRequest: { Item: item }
        }))
      }
    };
    
    try {
      await dynamodb.batchWrite(params).promise();
      console.log(`✅ Inserted batch of ${batch.length} prices`);
    } catch (error) {
      console.error('❌ Error inserting batch:', error.message);
    }
  }
  
  console.log(`\n✨ Successfully seeded ${items.length} stock prices!`);
}

seedStockPrices()
  .then(() => {
    console.log('\n✅ Stock price seeding completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Stock price seeding failed:', error);
    process.exit(1);
  });