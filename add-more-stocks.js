const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

// IMPORTANT: Replace with YOUR actual Cognito user ID
// Get it from: AWS Console → Cognito → User Pools → Users → Copy the "sub" value
const YOUR_USER_ID = '943854b8-6071-70d4-010e-fcfad5f8bc52';

const newStocks = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', quantity: 15, purchasePrice: 450.00, purchaseDate: '2024-01-15' },
  { symbol: 'META', name: 'Meta Platforms Inc', quantity: 7, purchasePrice: 280.00, purchaseDate: '2024-02-01' },
  { symbol: 'AMZN', name: 'Amazon.com Inc', quantity: 6, purchasePrice: 140.00, purchaseDate: '2024-01-20' },
  { symbol: 'GOOGL', name: 'Alphabet Inc', quantity: 8, purchasePrice: 135.00, purchaseDate: '2024-02-10' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', quantity: 20, purchasePrice: 95.00, purchaseDate: '2024-03-01' },
  { symbol: 'NFLX', name: 'Netflix Inc', quantity: 4, purchasePrice: 420.00, purchaseDate: '2024-01-25' },
  { symbol: 'INTC', name: 'Intel Corporation', quantity: 50, purchasePrice: 38.00, purchaseDate: '2024-02-15' }
];

async function addStocks() {
  console.log('🚀 Adding stocks to your portfolio...\n');
  
  for (const stock of newStocks) {
    const item = {
      userId: YOUR_USER_ID,
      assetId: `${YOUR_USER_ID}-${stock.symbol}-${Date.now()}`,
      symbol: stock.symbol,
      name: stock.name,
      quantity: stock.quantity,
      purchasePrice: stock.purchasePrice,
      purchaseDate: stock.purchaseDate,
      createdAt: new Date().toISOString()
    };
    
    try {
      await dynamodb.put({
        TableName: 'Assets',
        Item: item
      }).promise();
      
      console.log(`✅ Added ${stock.symbol} - ${stock.quantity} shares @ $${stock.purchasePrice}`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Error adding ${stock.symbol}:`, error.message);
    }
  }
  
  console.log('\n🎉 Successfully added all stocks!');
  console.log(`\n📊 Your portfolio now has ${newStocks.length + 3} stocks (3 existing + ${newStocks.length} new)`);
}

addStocks().catch(console.error);
