#!/bin/bash

echo "🗄️  Creating DynamoDB Tables for Portfolio Optimizer..."
echo ""

# 1. Portfolios Table
echo "📊 Creating Portfolios table..."
aws dynamodb create-table \
  --table-name Portfolios \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 \
  --output json > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "   ✅ Portfolios table created"
else
  echo "   ⚠️  Portfolios table already exists or error occurred"
fi

# 2. Assets Table
echo "📊 Creating Assets table..."
aws dynamodb create-table \
  --table-name Assets \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=assetId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=assetId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 \
  --output json > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "   ✅ Assets table created"
else
  echo "   ⚠️  Assets table already exists or error occurred"
fi

# 3. StockPrices Table
echo "📊 Creating StockPrices table..."
aws dynamodb create-table \
  --table-name StockPrices \
  --attribute-definitions \
    AttributeName=symbol,AttributeType=S \
  --key-schema \
    AttributeName=symbol,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 \
  --output json > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "   ✅ StockPrices table created"
else
  echo "   ⚠️  StockPrices table already exists or error occurred"
fi

# 4. StockSentiment Table
echo "📊 Creating StockSentiment table..."
aws dynamodb create-table \
  --table-name StockSentiment \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=symbol,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    "IndexName=symbol-timestamp-index,KeySchema=[{AttributeName=symbol,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL}" \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 \
  --output json > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "   ✅ StockSentiment table created"
else
  echo "   ⚠️  StockSentiment table already exists or error occurred"
fi

echo ""
echo "⏳ Waiting for all tables to become active..."
aws dynamodb wait table-exists --table-name Portfolios --region us-east-1
aws dynamodb wait table-exists --table-name Assets --region us-east-1
aws dynamodb wait table-exists --table-name StockPrices --region us-east-1
aws dynamodb wait table-exists --table-name StockSentiment --region us-east-1

echo ""
echo "🎉 All DynamoDB tables are ready!"
echo ""
echo "📋 Summary:"
echo "   ✅ Portfolios - Stores user portfolio metadata"
echo "   ✅ Assets - Stores individual stock/crypto holdings"
echo "   ✅ StockPrices - Caches current market prices"
echo "   ✅ StockSentiment - Stores sentiment analysis results"
echo ""
echo "Next step: Deploy Lambda functions"