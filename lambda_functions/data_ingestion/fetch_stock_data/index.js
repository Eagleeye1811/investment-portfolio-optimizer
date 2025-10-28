const axios = require('axios');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Environment variables (set in AWS Lambda)
const STOCK_API_KEY = process.env.STOCK_API_KEY;
const STOCK_API_URL = process.env.STOCK_API_URL || 'https://www.alphavantage.co/query';
const STOCKS_TABLE = process.env.STOCKS_TABLE || 'StockPrices';

/**
 * Fetch stock data from Alpha Vantage or similar API
 * and store in DynamoDB for further processing
 */
exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event));
    
    try {
        // Extract symbols from event or use default set
        let symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
        
        if (event.symbols && Array.isArray(event.symbols)) {
            symbols = event.symbols;
        }
        
        // Process each symbol
        const results = await Promise.all(
            symbols.map(symbol => fetchAndStoreStockData(symbol))
        );
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Stock data fetched and stored successfully',
                results
            })
        };
    } catch (error) {
        console.error('Error in stock data processing:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error processing stock data',
                error: error.message
            })
        };
    }
};

/**
 * Fetch stock data for a single symbol and store in DynamoDB
 */
async function fetchAndStoreStockData(symbol) {
    try {
        // Fetch stock data from API
        const response = await axios.get(STOCK_API_URL, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: symbol,
                apikey: STOCK_API_KEY
            }
        });
        
        if (!response.data || !response.data['Global Quote']) {
            throw new Error(`Invalid response for symbol ${symbol}`);
        }
        
        const quote = response.data['Global Quote'];
        
        // Transform data
        const stockData = {
            symbol: symbol,
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            volume: parseInt(quote['06. volume']),
            timestamp: new Date().toISOString(),
            ttl: Math.floor(Date.now() / 1000) + 86400 // 24 hours TTL
        };
        
        // Store in DynamoDB
        await dynamodb.put({
            TableName: STOCKS_TABLE,
            Item: stockData
        }).promise();
        
        console.log(`Successfully stored data for ${symbol}`);
        return { symbol, success: true };
    } catch (error) {
        console.error(`Error processing symbol ${symbol}:`, error);
        return { symbol, success: false, error: error.message };
    }
}
