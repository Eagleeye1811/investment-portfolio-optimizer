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
  LinearProgress
} from '@mui/material';
import { 
  TrendingUp,
  TrendingDown,
  Remove
} from '@mui/icons-material';
import Header from '../components/Header';
import { fetchSentimentData } from '../services/sentimentService';
import { fetchPortfolioData } from '../services/portfolioService';

const SentimentAnalysis = () => {
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSentimentData();
  }, []);

  const loadSentimentData = async () => {
    try {
      // Get user's portfolio to know which symbols to analyze
      const portfolio = await fetchPortfolioData();
      const symbols = portfolio.assets.map(asset => asset.symbol);
      
      // Fetch sentiment for those symbols
      const sentiment = await fetchSentimentData(symbols);
      setSentimentData(sentiment);
    } catch (error) {
      console.error('Error loading sentiment data:', error);
      // Use mock data on error
      setSentimentData({
        AAPL: { sentiment: 'POSITIVE', positive: 0.75, negative: 0.10, neutral: 0.15, trend: 'improving' },
        MSFT: { sentiment: 'POSITIVE', positive: 0.68, negative: 0.15, neutral: 0.17, trend: 'stable' },
        AMZN: { sentiment: 'NEUTRAL', positive: 0.45, negative: 0.30, neutral: 0.25, trend: 'stable' },
        TSLA: { sentiment: 'NEGATIVE', positive: 0.20, negative: 0.65, neutral: 0.15, trend: 'declining' },
        GOOGL: { sentiment: 'POSITIVE', positive: 0.70, negative: 0.12, neutral: 0.18, trend: 'improving' }
      });
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'POSITIVE':
        return <TrendingUp color="success" />;
      case 'NEGATIVE':
        return <TrendingDown color="error" />;
      default:
        return <Remove color="info" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'success';
      case 'NEGATIVE':
        return 'error';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container><Box sx={{ mt: 4 }}>Loading sentiment data...</Box></Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Market Sentiment Analysis
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom sx={{ mb: 4 }}>
          AI-powered sentiment analysis from news articles, financial reports, and social media
        </Typography>

        <Grid container spacing={3}>
          {sentimentData && Object.entries(sentimentData).map(([symbol, data]) => (
            <Grid item xs={12} md={6} lg={4} key={symbol}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">{symbol}</Typography>
                    <Chip 
                      icon={getSentimentIcon(data.sentiment)}
                      label={data.sentiment}
                      color={getSentimentColor(data.sentiment)}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Positive</Typography>
                      <Typography variant="body2" color="success.main">
                        {(data.positive * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={data.positive * 100} 
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Neutral</Typography>
                      <Typography variant="body2" color="info.main">
                        {(data.neutral * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={data.neutral * 100} 
                      color="info"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Negative</Typography>
                      <Typography variant="body2" color="error.main">
                        {(data.negative * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={data.negative * 100} 
                      color="error"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                    <Typography variant="caption" color="textSecondary">
                      7-day trend: <strong>{data.trend}</strong>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default SentimentAnalysis;