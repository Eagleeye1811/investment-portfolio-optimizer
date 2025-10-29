const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PORTFOLIOS_TABLE = process.env.PORTFOLIOS_TABLE || 'Portfolios';
const ASSETS_TABLE = process.env.ASSETS_TABLE || 'Assets';

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Extract user ID from Cognito authorizer
  const userId = event.requestContext?.authorizer?.claims?.sub;
  
  if (!userId) {
    return {
      statusCode: 401,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  const httpMethod = event.httpMethod;
  const path = event.path;
  
  try {
    let response;
    
    if (httpMethod === 'GET' && path === '/portfolio') {
      response = await getPortfolio(userId);
    } else if (httpMethod === 'POST' && path.includes('/assets')) {
      const body = JSON.parse(event.body);
      response = await addAsset(userId, body);
    } else if (httpMethod === 'PUT' && path.includes('/assets')) {
      const assetId = extractAssetId(path);
      const body = JSON.parse(event.body);
      response = await updateAsset(userId, assetId, body);
    } else if (httpMethod === 'DELETE' && path.includes('/assets')) {
      const assetId = extractAssetId(path);
      response = await deleteAsset(userId, assetId);
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(response)
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

// Get user's complete portfolio
async function getPortfolio(userId) {
  // Get portfolio metadata
  const portfolioResult = await dynamodb.get({
    TableName: PORTFOLIOS_TABLE,
    Key: { userId }
  }).promise();
  
  let portfolio = portfolioResult.Item;
  
  // Create portfolio if doesn't exist
  if (!portfolio) {
    portfolio = {
      userId,
      name: 'My Portfolio',
      createdAt: new Date().toISOString(),
      assets: []
    };
    await dynamodb.put({
      TableName: PORTFOLIOS_TABLE,
      Item: portfolio
    }).promise();
  }
  
  // Get all assets for this portfolio
  const assetsResult = await dynamodb.query({
    TableName: ASSETS_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }).promise();
  
  const assets = assetsResult.Items || [];
  
  // Get current prices for all assets
  const assetsWithPrices = await Promise.all(
    assets.map(async (asset) => {
      const currentPrice = await getCurrentPrice(asset.symbol);
      return {
        ...asset,
        currentPrice,
        value: currentPrice * asset.quantity
      };
    })
  );
  
  // Calculate portfolio totals
  const totalValue = assetsWithPrices.reduce((sum, asset) => sum + asset.value, 0);
  const totalCost = assetsWithPrices.reduce((sum, asset) => sum + (asset.purchasePrice * asset.quantity), 0);
  const totalProfitLoss = totalValue - totalCost;
  const dayChange = totalValue * 0.018; // Mock day change (1.8%)
  
  return {
    id: portfolio.userId,
    name: portfolio.name,
    totalValue,
    dayChange,
    dayChangePercent: (dayChange / totalValue) * 100,
    totalProfitLoss,
    totalProfitLossPercent: (totalProfitLoss / totalCost) * 100,
    assets: assetsWithPrices
  };
}

// Add new asset to portfolio
async function addAsset(userId, assetData) {
  const assetId = `${userId}-${assetData.symbol}-${Date.now()}`;
  
  const asset = {
    userId,
    assetId,
    symbol: assetData.symbol,
    name: assetData.name,
    quantity: assetData.quantity,
    purchasePrice: assetData.purchasePrice,
    purchaseDate: assetData.purchaseDate || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  await dynamodb.put({
    TableName: ASSETS_TABLE,
    Item: asset
  }).promise();
  
  return asset;
}

// Update existing asset
async function updateAsset(userId, assetId, assetData) {
  const params = {
    TableName: ASSETS_TABLE,
    Key: { userId, assetId },
    UpdateExpression: 'SET quantity = :quantity, purchasePrice = :purchasePrice',
    ExpressionAttributeValues: {
      ':quantity': assetData.quantity,
      ':purchasePrice': assetData.purchasePrice
    },
    ReturnValues: 'ALL_NEW'
  };
  
  const result = await dynamodb.update(params).promise();
  return result.Attributes;
}

// Delete asset
async function deleteAsset(userId, assetId) {
  await dynamodb.delete({
    TableName: ASSETS_TABLE,
    Key: { userId, assetId }
  }).promise();
  
  return { success: true, assetId };
}

// Get current price from cache or external API
async function getCurrentPrice(symbol) {
  const PRICES_TABLE = process.env.STOCK_PRICES_TABLE || 'StockPrices';
  
  try {
    const result = await dynamodb.get({
      TableName: PRICES_TABLE,
      Key: { symbol }
    }).promise();
    
    if (result.Item && result.Item.price) {
      return result.Item.price;
    }
  } catch (error) {
    console.error('Error fetching price:', error);
  }
  
  // Return mock price if not found
  return Math.random() * 300 + 100;
}

// Helper functions
function extractAssetId(path) {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
  };
}