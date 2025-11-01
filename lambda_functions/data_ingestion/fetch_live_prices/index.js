const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const STOCK_PRICES_TABLE = process.env.STOCK_PRICES_TABLE || 'StockPrices';

exports.handler = async (event) => {
  console.log('🚀 Starting live price update...');
  
  const symbols = [
    'AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 
    'NVDA', 'META', 'NFLX', 'AMD', 'INTC'
  ];
  
  const results = [];
  
  for (const symbol of symbols) {
    try {
      // Get current price from DynamoDB
      const result = await dynamodb.get({
        TableName: STOCK_PRICES_TABLE,
        Key: { symbol }
      }).promise();
      
      if (!result.Item) {
        console.log(`⚠️ No price found for ${symbol}, skipping`);
        continue;
      }
      
      const currentPrice = result.Item.price;
      
      // Simulate realistic price movement (±2%)
      // In production, this would be replaced with Yahoo Finance API call
      const randomChange = (Math.random() - 0.5) * 0.04; // ±2% movement
      const newPrice = currentPrice * (1 + randomChange);
      const change24h = randomChange * 100;
      
      // Calculate high/low
      const high24h = newPrice * (1 + Math.random() * 0.02);
      const low24h = newPrice * (1 - Math.random() * 0.02);
      const volume = Math.floor(Math.random() * 50000000) + 10000000;
      
      // Update DynamoDB with new price
      await dynamodb.put({
        TableName: STOCK_PRICES_TABLE,
        Item: {
          symbol: symbol,
          price: parseFloat(newPrice.toFixed(2)),
          previousPrice: currentPrice,
          change24h: parseFloat(change24h.toFixed(2)),
          high24h: parseFloat(high24h.toFixed(2)),
          low24h: parseFloat(low24h.toFixed(2)),
          volume: volume,
          lastUpdated: new Date().toISOString(),
          marketCap: newPrice * (Math.random() * 1000000000 + 100000000)
        }
      }).promise();
      
      results.push({
        symbol,
        price: newPrice.toFixed(2),
        change: change24h.toFixed(2)
      });
      
      console.log(`✅ ${symbol}: $${newPrice.toFixed(2)} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%)`);
      
    } catch (error) {
      console.error(`❌ Error updating ${symbol}:`, error);
    }
  }
  
  console.log(`✅ Updated ${results.length} stock prices`);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Updated ${results.length} stocks`,
      updated: results,
      timestamp: new Date().toISOString()
    })
  };
};