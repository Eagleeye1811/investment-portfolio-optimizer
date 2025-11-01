#!/bin/bash

echo "🚀 Seeding all test data for Portfolio Optimizer..."
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

echo "1️⃣ Seeding stock prices..."
node seed-stock-prices.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to seed stock prices"
    exit 1
fi

echo ""
echo "2️⃣ Seeding sentiment data..."
node seed-sentiment-data.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to seed sentiment data"
    exit 1
fi

echo ""
echo "✅ All data seeded successfully!"
echo ""
echo "🎯 Expected Recommendations:"
echo "   AAPL  → 🟢 BUY   (Strong positive sentiment)"
echo "   NVDA  → 🟢 BUY   (Very strong positive sentiment)"
echo "   AMZN  → 🟢 BUY   (Strong positive sentiment)"
echo "   TSLA  → 🔴 SELL  (Strong negative sentiment)"
echo "   META  → 🔴 SELL  (Negative sentiment)"
echo "   MSFT  → 🔵 HOLD  (Neutral sentiment)"
echo "   GOOGL → 🔵 HOLD  (Neutral sentiment)"
echo ""
echo "🔄 Refresh your dashboard to see dynamic recommendations!"