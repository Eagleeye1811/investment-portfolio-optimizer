import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Grid, Paper, Typography, Button, Box } from '@mui/material';
import PortfolioSummary from '../components/PortfolioSummary';
import PortfolioChart from '../components/PortfolioChart';
import AssetTable from '../components/AssetTable';
import SentimentSummary from '../components/SentimentSummary';
import RecommendationsList from '../components/RecommendationsList';
import { fetchPortfolioData } from '../services/portfolioService';
import { fetchSentimentData } from '../services/sentimentService';
import { fetchRecommendations } from '../services/recommendationService';
import Header from '../components/Header';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [portfolioData, setPortfolioData] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch portfolio data
        const portfolio = await fetchPortfolioData();
        setPortfolioData(portfolio);
        
        // Fetch sentiment data for portfolio assets
        const sentiment = await fetchSentimentData(portfolio.assets.map(asset => asset.symbol));
        setSentimentData(sentiment);
        
        // Fetch recommendations
        const recs = await fetchRecommendations(portfolio.id);
        setRecommendations(recs);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Placeholder data for development
  const placeholderPortfolio = {
    totalValue: 25750.42,
    dayChange: 450.23,
    dayChangePercent: 1.78,
    assets: [
      { id: 1, symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, purchasePrice: 150.25, currentPrice: 175.43, value: 1754.30 },
      { id: 2, symbol: 'MSFT', name: 'Microsoft', quantity: 5, purchasePrice: 250.50, currentPrice: 290.12, value: 1450.60 },
      { id: 3, symbol: 'AMZN', name: 'Amazon', quantity: 3, purchasePrice: 3100.75, currentPrice: 3245.50, value: 9736.50 },
      { id: 4, symbol: 'TSLA', name: 'Tesla', quantity: 8, purchasePrice: 700.00, currentPrice: 780.25, value: 6242.00 },
      { id: 5, symbol: 'GOOGL', name: 'Alphabet', quantity: 2, purchasePrice: 2800.50, currentPrice: 2895.50, value: 5791.00 }
    ]
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error && <Typography color="error">{error}</Typography>}
        
        <Grid container spacing={3}>
          {/* Portfolio Summary */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <PortfolioSummary portfolio={portfolioData || placeholderPortfolio} />
            </Paper>
          </Grid>
          
          {/* Portfolio Chart */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <PortfolioChart portfolio={portfolioData || placeholderPortfolio} />
            </Paper>
          </Grid>
          
          {/* Asset Table */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Portfolio Assets
              </Typography>
              <AssetTable assets={portfolioData?.assets || placeholderPortfolio.assets} />
            </Paper>
          </Grid>
          
          {/* Sentiment Analysis */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom component="div">
                Market Sentiment
              </Typography>
              <SentimentSummary sentiment={sentimentData} />
              <Button 
                variant="text" 
                color="primary" 
                sx={{ alignSelf: 'flex-end', mt: 2 }}
                onClick={() => navigate('/sentiment')}
              >
                View Details
              </Button>
            </Paper>
          </Grid>
          
          {/* Recommendations */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom component="div">
                AI Recommendations
              </Typography>
              <RecommendationsList recommendations={recommendations} />
              <Button 
                variant="text" 
                color="primary" 
                sx={{ alignSelf: 'flex-end', mt: 2 }}
                onClick={() => navigate('/recommendations')}
              >
                View All Recommendations
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Dashboard;
