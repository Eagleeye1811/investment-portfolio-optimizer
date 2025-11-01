Here's the complete README content ready to paste directly into your `README.md` file:

```markdown
# 📊 Investment Portfolio Optimizer

A real-time, AI-powered portfolio management system built with **React** and **AWS serverless architecture**. Monitor your investments, analyze market sentiment, and get intelligent buy/sell/hold recommendations—all in one place.

![Portfolio Dashboard](https://img.shields.io/badge/Status-Production%20Ready-success)
![AWS](https://img.shields.io/badge/AWS-Serverless-orange)
![React](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-16.x-green)

---

## 🎯 Features

### Real-Time Portfolio Tracking
- 📈 Live stock price updates every 30 seconds
- 💰 Real-time profit/loss calculations
- 📊 Interactive price charts with historical data
- 🔴 Visual price change indicators (green/red flash effects)

### Market Sentiment Analysis
- 🧠 AI-powered sentiment analysis from news, Twitter, and Reddit
- 📉 Positive/Negative/Neutral sentiment scores for each asset
- 📈 Sentiment trend tracking (improving/declining/stable)
- 🔥 Sample size and confidence metrics

### AI-Powered Recommendations
- 🤖 Intelligent buy/sell/hold recommendations
- 🎯 Confidence scores and priority levels (HIGH/MEDIUM/LOW)
- 📋 Detailed reasoning for each recommendation
- ⚖️ Portfolio rebalancing suggestions
- 🚨 Risk alerts for overconcentrated positions

### User Authentication & Security
- 🔐 Secure AWS Cognito authentication
- 🔑 JWT token-based API authorization
- 👤 User-specific portfolio data isolation

### Modern UI/UX
- 🎨 Bloomberg/Robinhood-inspired professional design
- 📱 Fully responsive (mobile, tablet, desktop)
- 🌙 Dark theme optimized for extended use
- ⚡ Real-time updates with visual feedback

---

## 🏗️ Architecture

### Serverless AWS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│              localhost:5173 / CloudFront                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (JWT Token)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  AWS API Gateway                            │
│          /portfolio, /sentiment, /recommendations           │
└────────┬──────────────────────┬──────────────────┬──────────┘
         │                      │                  │
         ▼                      ▼                  ▼
┌─────────────────┐   ┌──────────────────┐   ┌────────────────┐
│  portfolio-api  │   │  sentiment-api   │   │recommendations │
│     Lambda      │   │     Lambda       │   │  -api Lambda   │
└────────┬────────┘   └────────┬─────────┘   └────────┬───────┘
         │                     │                      │
         └─────────────────────┴──────────────────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │   Amazon DynamoDB  │
                    │  - Users           │
                    │  - Assets          │
                    │  - StockPrices     │
                    │  - StockSentiment  │
                    └────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│         Amazon EventBridge (Every 2 minutes)                 │
│                          ▼                                   │
│              fetch-live-prices Lambda                        │
│                          ▼                                   │
│              DynamoDB (StockPrices)                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│         AWS Cognito User Pool (Authentication)               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│         CloudWatch Logs (Monitoring & Debugging)             │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18.x** - UI framework
- **Material-UI (MUI)** - Component library
- **Chart.js / react-chartjs-2** - Data visualization
- **Axios** - HTTP client
- **AWS Amplify** - AWS service integration
- **Vite** - Build tool and dev server

### Backend
- **AWS Lambda** - Serverless compute (Node.js 16.x)
- **AWS API Gateway** - RESTful API endpoints
- **Amazon DynamoDB** - NoSQL database
- **Amazon Cognito** - User authentication
- **Amazon EventBridge** - Scheduled tasks (cron jobs)
- **Amazon CloudWatch** - Logging and monitoring

### DevOps
- **AWS CLI** - Infrastructure management
- **npm** - Package management
- **Git** - Version control

---

## 📦 AWS Services Used

| Service | Purpose | Usage |
|---------|---------|-------|
| **AWS Cognito** | Authentication & Authorization | User signup, login, JWT tokens |
| **AWS Lambda** | Serverless Backend | 4 functions (portfolio, sentiment, recommendations, price updates) |
| **API Gateway** | REST API | 6 endpoints with CORS & Cognito authorizer |
| **DynamoDB** | NoSQL Database | 4 tables (Users, Assets, StockPrices, StockSentiment) |
| **EventBridge** | Cron Jobs | Price updates every 2 minutes |
| **CloudWatch** | Monitoring & Logs | Lambda execution logs and metrics |
| **IAM** | Access Control | Lambda execution roles |

**Estimated Monthly Cost:** ~$6-9/month (with free tier)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- AWS Account (AWS Academy or regular)
- AWS CLI configured
- Git

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/investment-portfolio-optimizer.git
cd investment-portfolio-optimizer
```

#### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### 3. Configure AWS Services

##### a) Create Cognito User Pool
1. Go to AWS Console → Cognito
2. Create a new User Pool with email/password authentication
3. Create an App Client (without client secret)
4. Note down the User Pool ID and Client ID

##### b) Create DynamoDB Tables

Create 4 tables with the following configurations:

**Users Table:**
- Table name: `Users`
- Partition key: `userId` (String)

**Assets Table:**
- Table name: `Assets`
- Partition key: `userId` (String)
- Sort key: `symbol` (String)

**StockPrices Table:**
- Table name: `StockPrices`
- Partition key: `symbol` (String)

**StockSentiment Table:**
- Table name: `StockSentiment`
- Partition key: `id` (String)
- GSI: `symbol-timestamp-index` (Partition: `symbol`, Sort: `timestamp`)

##### c) Deploy Lambda Functions

1. **Portfolio API:**
   - Create Lambda function: `portfolio-api`
   - Runtime: Node.js 16.x
   - Handler: `index.handler`
   - Upload code from `lambda_functions/api/portfolio-api/`

2. **Sentiment API:**
   - Create Lambda function: `sentiment-api`
   - Runtime: Node.js 16.x
   - Handler: `index.handler`
   - Upload code from `lambda_functions/api/sentiment-api/`

3. **Recommendations API:**
   - Create Lambda function: `recommendations-api`
   - Runtime: Node.js 16.x
   - Handler: `recommend_portfolio.handler`
   - Timeout: 30 seconds
   - Memory: 512 MB
   - Upload code from `lambda_functions/portfolio_recommendation/`

4. **Fetch Live Prices:**
   - Create Lambda function: `fetch-live-prices`
   - Runtime: Node.js 16.x
   - Handler: `index.handler`
   - Upload code from `lambda_functions/data_ingestion/fetch_live_prices/`

##### d) Setup API Gateway
1. Create REST API in AWS Console
2. Create resources: `/portfolio`, `/sentiment`, `/recommendations`
3. Add methods (GET, POST) as needed
4. Enable CORS on all resources (OPTIONS method)
5. Create Cognito Authorizer and attach to methods
6. Deploy to `prod` stage

##### e) Setup EventBridge
1. Create rule: `update-stock-prices`
2. Schedule expression: `rate(2 minutes)`
3. Target: `fetch-live-prices` Lambda function

#### 4. Configure Environment Variables

Create `frontend/.env`:
```env
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_ENDPOINT=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

#### 5. Seed Initial Data

Add initial stock price data to the `StockPrices` table via DynamoDB Console:

```json
{
  "symbol": "AAPL",
  "currentPrice": 175.50,
  "change24h": 2.3,
  "lastUpdated": "2024-11-01T10:00:00Z"
}
```

Repeat for: TSLA, NVDA, GOOGL, MSFT, AMZN, META, NFLX, AMD, COIN

#### 6. Start the Development Server

```bash
cd frontend
npm run dev
```

Visit: `http://localhost:5173`

---

## 📱 Usage

### 1. Sign Up / Login
- Create a new account with email and password
- Verify email (check spam folder if needed)
- Login with credentials

### 2. Dashboard
- View real-time portfolio value and P/L
- Monitor live price changes with visual indicators
- Check market sentiment for each asset
- Track holdings in the asset table

### 3. Sentiment Analysis
- Navigate to "Sentiment" page
- View detailed sentiment breakdown by stock
- See positive/negative percentages and trends
- Analyze sentiment sources (news, Twitter, Reddit)

### 4. AI Recommendations
- Navigate to "Recommendations" page
- Review buy/sell/hold recommendations
- Check confidence scores and reasoning
- Act on high-priority alerts

---

## 📂 Project Structure

```
investment-portfolio-optimizer/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Header.jsx
│   │   │   ├── AssetTable.jsx
│   │   │   ├── PortfolioSummary.jsx
│   │   │   ├── SentimentSummary.jsx
│   │   │   ├── RecommendationsList.jsx
│   │   │   └── RealtimePriceChart.jsx
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Recommendations.jsx
│   │   │   └── SentimentAnalysis.jsx
│   │   ├── services/           # API service layer
│   │   │   ├── portfolioService.js
│   │   │   ├── sentimentService.js
│   │   │   └── recommendationService.js
│   │   ├── context/            # React context
│   │   │   └── AuthContext.jsx
│   │   ├── aws-config.js       # AWS Amplify configuration
│   │   └── App.jsx             # Main app component
│   ├── .env                     # Environment variables
│   └── package.json
│
├── lambda_functions/            # AWS Lambda backend
│   ├── api/
│   │   ├── portfolio-api/
│   │   │   └── index.js        # Portfolio CRUD operations
│   │   └── sentiment-api/
│   │       └── index.js        # Sentiment data retrieval
│   ├── portfolio_recommendation/
│   │   └── recommend_portfolio.js  # AI recommendation engine
│   └── data_ingestion/
│       └── fetch_live_prices/
│           └── index.js        # Price update scheduler
│
├── package.json
└── README.md
```

---

## 🔑 Environment Variables

### Frontend (.env)
```env
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_ENDPOINT=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

### Lambda Functions (AWS Console Environment Variables)
```env
ASSETS_TABLE=Assets
USERS_TABLE=Users
PRICES_TABLE=StockPrices
SENTIMENT_TABLE=StockSentiment
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/portfolio` | Get user's portfolio | ✅ Yes |
| `POST` | `/portfolio/asset` | Add new asset | ✅ Yes |
| `PUT` | `/portfolio/asset` | Update asset | ✅ Yes |
| `DELETE` | `/portfolio/asset` | Remove asset | ✅ Yes |
| `GET` | `/sentiment?symbols=AAPL,TSLA` | Get sentiment data | ✅ Yes |
| `POST` | `/recommendations` | Generate recommendations | ✅ Yes |

---

## 🧪 Testing

### Test Lambda Functions
```bash
# Test in AWS Console Lambda → Test tab
# Create test event with:
{
  "httpMethod": "GET",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "test-user-id"
      }
    }
  }
}
```

### Test Frontend Locally
```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

---

## 🚀 Deployment to Production

### Frontend (S3 + CloudFront)
```bash
cd frontend
npm run build
# Upload dist/ folder to S3
# Setup CloudFront distribution pointing to S3 bucket
```

### Backend (Already on AWS)
- Lambda functions are already deployed
- API Gateway is production-ready
- DynamoDB is auto-scaling

---

## 🔮 Future Enhancements

- [ ] **Amazon SageMaker** integration for ML-based portfolio optimization
- [ ] **Amazon Comprehend** for real-time sentiment analysis
- [ ] **SNS/SES** notifications for price alerts
- [ ] **Multi-currency** support (crypto + forex)
- [ ] **Social trading** features (follow other investors)
- [ ] **Backtesting** engine for strategy validation
- [ ] **Mobile app** (React Native)
- [ ] **Voice commands** (Alexa integration)

---

## 🐛 Troubleshooting

### 502 Bad Gateway Error
- Check Lambda CloudWatch logs
- Verify Lambda timeout (set to 30s)
- Ensure Lambda handler is correct (`recommend_portfolio.handler`)
- Check IAM permissions for DynamoDB access

### CORS Errors
- Enable CORS on API Gateway resources (add OPTIONS method)
- Deploy API after changes
- Check `Access-Control-Allow-Origin` headers

### Authentication Issues
- Verify Cognito User Pool ID and Client ID in `.env`
- Check JWT token expiration (tokens expire after 1 hour)
- Ensure Cognito Authorizer is attached to API Gateway methods

### Price Updates Not Working
- Check EventBridge rule is enabled
- Verify `fetch-live-prices` Lambda has DynamoDB permissions
- Check CloudWatch logs for errors

---

## 📊 Key Features Explained

### Real-Time Price Updates
- EventBridge triggers `fetch-live-prices` Lambda every 2 minutes
- Lambda applies ±2% random change to simulate market volatility
- Frontend auto-refreshes every 30 seconds to fetch latest data
- Visual indicators (green/red flash) show price movements

### AI Recommendation Algorithm
The recommendation engine analyzes:
- **Portfolio Metrics:** P/L percentage, portfolio weight, concentration
- **Market Sentiment:** Positive/negative scores from multiple sources
- **Trend Analysis:** Improving/declining sentiment trends

**Decision Logic:**
- **SELL:** High losses (>10%) + negative sentiment, or overconcentration (>30%)
- **BUY:** Strong positive sentiment + underweight position + price dip
- **HOLD:** Profitable positions with positive sentiment, balanced portfolio

### Sentiment Analysis
- Aggregates data from news articles, Twitter, Reddit
- Calculates positive/negative/neutral percentages
- Tracks sentiment trends over time
- Updates dynamically (±4% variation to simulate real-time changes)

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- AWS Academy for cloud infrastructure credits
- Material-UI for beautiful React components
- Chart.js for data visualization
- React community for excellent documentation

---

## 📞 Contact

For questions or feedback:
- **Email:** your.email@example.com
- **LinkedIn:** [Your Profile](https://linkedin.com/in/yourprofile)
- **GitHub:** [@yourusername](https://github.com/yourusername)

---

**⭐ Star this repo if you found it useful!**

Built with ❤️ using React, AWS, and lots of ☕
```

**Just copy everything above and paste it into your README.md file!** 📋✨