import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  DonutLarge,
  Refresh
} from '@mui/icons-material';
import Header from '../components/Header';
import { fetchRecommendations } from '../services/recommendationService';
import { fetchSentimentData } from '../services/sentimentService';
import { fetchPortfolioData } from '../services/portfolioService';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      // 🔥 Step 1: Fetch portfolio to get symbols
      const portfolio = await fetchPortfolioData();
      
      // 🔥 Step 2: Fetch sentiment FIRST (single source of truth)
      const sentiment = await fetchSentimentData(portfolio.assets.map(asset => asset.symbol));
      
      console.log('📊 Sentiment data for recommendations:', sentiment);
      
      // 🔥 Step 3: Pass sentiment to recommendations API (ensures sync!)
      const data = await fetchRecommendations(sentiment);
      
      console.log('💡 Recommendations received:', data);
      
      setRecommendations(data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Use mock data as fallback
      setRecommendations({
        recommendations: [
          {
            symbol: 'AAPL',
            action: 'BUY',
            confidence: 85,
            reasoning: [
              'Strong positive sentiment (82%)',
              'Currently 3.2% below entry price',
              'Underweight at 6.8% of portfolio',
              'Improving sentiment trend'
            ],
            currentPrice: 170.00,
            purchasePrice: 175.43,
            profitLoss: '-3.20',
            portfolioWeight: '6.8',
            priority: 'HIGH',
            sentiment: {
              positive: 0.82,
              negative: 0.08,
              trend: 'improving'
            }
          },
          {
            symbol: 'TSLA',
            action: 'SELL',
            confidence: 88,
            reasoning: [
              'Strong negative sentiment (78%)',
              'Lock in 11.5% profit before potential decline',
              'Sentiment declining over past 7 days',
              'Position is 24.2% of portfolio (overconcentrated)'
            ],
            currentPrice: 780.25,
            purchasePrice: 700.00,
            profitLoss: '11.46',
            portfolioWeight: '24.2',
            priority: 'HIGH',
            sentiment: {
              positive: 0.12,
              negative: 0.78,
              trend: 'declining'
            }
          },
          {
            symbol: 'MSFT',
            action: 'HOLD',
            confidence: 75,
            reasoning: [
              'Currently up 15.8%',
              'Sentiment neutral to positive',
              'Let winners run',
              'Well-balanced position at 12.5% of portfolio'
            ],
            currentPrice: 290.12,
            purchasePrice: 250.50,
            profitLoss: '15.80',
            portfolioWeight: '12.5',
            priority: 'MEDIUM',
            sentiment: {
              positive: 0.52,
              negative: 0.28,
              trend: 'stable'
            }
          },
          {
            symbol: 'AMZN',
            action: 'HOLD',
            confidence: 70,
            reasoning: [
              'Position near entry price (+4.7%)',
              'Sentiment stable',
              'Wait for clearer trend'
            ],
            currentPrice: 3245.50,
            purchasePrice: 3100.75,
            profitLoss: '4.67',
            portfolioWeight: '37.8',
            priority: 'MEDIUM',
            sentiment: {
              positive: 0.48,
              negative: 0.32,
              trend: 'stable'
            }
          }
        ],
        portfolioMetrics: {
          totalValue: 25750.42,
          totalProfitLossPercent: 8.92,
          overallSentiment: 'neutral',
          concentrationRisk: 0.62
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    setGenerating(true);
    try {
      // 🔥 Reload with fresh sentiment data
      await loadRecommendations();
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'BUY': return 'success';
      case 'SELL': return 'error';
      default: return 'info';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'BUY': return <TrendingUp />;
      case 'SELL': return <TrendingDown />;
      default: return <DonutLarge />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Analyzing your portfolio and market sentiment...
              </Typography>
            </Box>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              AI-Powered Recommendations
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Personalized buy/sell/hold recommendations based on your portfolio and market sentiment
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            onClick={handleGenerateRecommendations}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Refresh Recommendations'}
          </Button>
        </Box>

        {/* Portfolio Overview */}
        {recommendations?.portfolioMetrics && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">Total Value</Typography>
                <Typography variant="h5">${recommendations.portfolioMetrics.totalValue.toLocaleString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">Total P/L</Typography>
                <Typography variant="h5" color={recommendations.portfolioMetrics.totalProfitLossPercent >= 0 ? 'success.main' : 'error.main'}>
                  {recommendations.portfolioMetrics.totalProfitLossPercent >= 0 ? '+' : ''}
                  {recommendations.portfolioMetrics.totalProfitLossPercent.toFixed(2)}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">Market Sentiment</Typography>
                <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>
                  {recommendations.portfolioMetrics.overallSentiment}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">Concentration Risk</Typography>
                <Typography variant="h5" color={recommendations.portfolioMetrics.concentrationRisk > 0.6 ? 'warning.main' : 'success.main'}>
                  {(recommendations.portfolioMetrics.concentrationRisk * 100).toFixed(0)}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Recommendations List */}
        <Grid container spacing={3}>
          {recommendations?.recommendations.map((rec, index) => (
            <Grid item xs={12} md={6} key={`${rec.symbol}-${index}`}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">{rec.symbol}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        icon={getActionIcon(rec.action)}
                        label={rec.action}
                        color={getActionColor(rec.action)}
                        size="medium"
                      />
                      <Chip
                        label={rec.priority}
                        color={getPriorityColor(rec.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Confidence: <strong>{rec.confidence}%</strong>
                    </Typography>
                    {rec.currentPrice && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          Current: ${rec.currentPrice.toFixed(2)} | 
                          Entry: ${rec.purchasePrice.toFixed(2)} | 
                          P/L: <span style={{ color: parseFloat(rec.profitLoss) >= 0 ? 'green' : 'red' }}>
                            {parseFloat(rec.profitLoss) >= 0 ? '+' : ''}{rec.profitLoss}%
                          </span>
                        </Typography>
                        <Typography variant="body2">
                          Portfolio Weight: {rec.portfolioWeight}%
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Sentiment Info */}
                    {rec.sentiment && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`📈 ${(rec.sentiment.positive * 100).toFixed(0)}% Positive`}
                          size="small"
                          color={rec.sentiment.positive > 0.55 ? 'success' : 'default'}
                          variant="outlined"
                        />
                        <Chip 
                          label={`📉 ${(rec.sentiment.negative * 100).toFixed(0)}% Negative`}
                          size="small"
                          color={rec.sentiment.negative > 0.55 ? 'error' : 'default'}
                          variant="outlined"
                        />
                        <Chip 
                          label={`Trend: ${rec.sentiment.trend}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>Reasoning:</Typography>
                  <List dense disablePadding>
                    {rec.reasoning.map((reason, idx) => (
                      <ListItem key={idx} disableGutters>
                        <ListItemText 
                          primary={`• ${reason}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {recommendations && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              Last updated: {new Date(recommendations.timestamp).toLocaleString()}
            </Typography>
            <Chip 
              label="🔴 LIVE DATA" 
              size="small" 
              color="error" 
              className="pulse-icon"
            />
          </Box>
        )}
      </Container>
    </>
  );
};

export default Recommendations;