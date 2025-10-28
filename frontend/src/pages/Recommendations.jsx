import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  DonutLarge as DonutLargeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import Header from '../components/Header';
import { fetchRecommendations } from '../services/recommendationService';
import { fetchPortfolioData } from '../services/portfolioService';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // First get the portfolio
        const portfolioData = await fetchPortfolioData();
        setPortfolio(portfolioData);
        
        // Then fetch recommendations for this portfolio
        const recs = await fetchRecommendations(portfolioData.id);
        setRecommendations(recs);
      } catch (err) {
        console.error('Error loading recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Mock recommendations data for development
  const mockRecommendations = {
    timestamp: '2023-05-30T14:30:00Z',
    recommendations: [
      {
        symbol: 'AAPL',
        action: 'BUY',
        strength: 'STRONG',
        targetAllocation: 8,
        reasoning: 'Strong buy recommendation based on positive price momentum (5.2%) and favorable sentiment analysis.',
        current: {
          price: 175.43,
          change: 4.2,
          allocation: 5
        }
      },
      {
        symbol: 'MSFT',
        action: 'HOLD',
        strength: 'MODERATE',
        targetAllocation: 5,
        reasoning: 'Maintain current position based on balanced risk and reward outlook.',
        current: {
          price: 290.12,
          change: 1.3,
          allocation: 5
        }
      },
      {
        symbol: 'TSLA',
        action: 'SELL',
        strength: 'MODERATE',
        targetAllocation: 4,
        reasoning: 'Moderate sell recommendation based on negative price trend (-2.4%) and unfavorable market sentiment.',
        current: {
          price: 780.25,
          change: -2.4,
          allocation: 6
        }
      },
      {
        symbol: 'NVDA',
        action: 'BUY',
        strength: 'MODERATE',
        targetAllocation: 5,
        reasoning: 'Based on market trends and sector analysis, adding NVDA would improve portfolio diversification.',
        current: {
          price: 925.50,
          change: 3.1,
          allocation: 0
        }
      },
    ]
  };
  
  const data = recommendations || mockRecommendations;

  const handleOpenDetails = (recommendation) => {
    setSelectedRecommendation(recommendation);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'BUY':
        return 'success';
      case 'SELL':
        return 'error';
      case 'HOLD':
      default:
        return 'info';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'BUY':
        return <TrendingUpIcon />;
      case 'SELL':
        return <TrendingDownIcon />;
      case 'HOLD':
      default:
        return <DonutLargeIcon />;
    }
  };

  if (loading) {
    return <div>Loading recommendations...</div>;
  }

  return (
    <>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            AI Portfolio Recommendations
          </Typography>
          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              Last updated: {new Date(data.timestamp).toLocaleString()}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body1" paragraph>
          Based on market data, sentiment analysis, and your portfolio's performance, our AI recommends the following actions:
        </Typography>
        
        <Grid container spacing={3}>
          {data.recommendations.map((recommendation, index) => (
            <Grid item xs={12} md={6} lg={3} key={index}>
              <Card 
                elevation={3}
                sx={{ 
                  height: '100%',
                  borderLeft: 5, 
                  borderColor: `${getActionColor(recommendation.action)}.main` 
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">
                      {recommendation.symbol}
                    </Typography>
                    <Chip
                      label={recommendation.action}
                      color={getActionColor(recommendation.action)}
                      icon={getActionIcon(recommendation.action)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Strength: {recommendation.strength}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {recommendation.reasoning.slice(0, 100)}...
                  </Typography>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2">
                      Price: ${recommendation.current.price}
                    </Typography>
                    <Typography 
                      variant="body2"
                      color={recommendation.current.change >= 0 ? 'success.main' : 'error.main'}
                    >
                      {recommendation.current.change > 0 ? '+' : ''}
                      {recommendation.current.change}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={<InfoIcon />}
                      onClick={() => handleOpenDetails(recommendation)}
                    >
                      Details
                    </Button>
                    <Typography variant="body2">
                      Target: {recommendation.targetAllocation}% allocation
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Recommendation Details Dialog */}
        <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
          {selectedRecommendation && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {selectedRecommendation.symbol}
                  <Chip
                    label={selectedRecommendation.action}
                    color={getActionColor(selectedRecommendation.action)}
                    size="small"
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Typography variant="subtitle1" gutterBottom>
                  {selectedRecommendation.strength} {selectedRecommendation.action} Recommendation
                </Typography>
                
                <Typography variant="body1" paragraph>
                  {selectedRecommendation.reasoning}
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Current Price" 
                      secondary={`$${selectedRecommendation.current.price} (${selectedRecommendation.current.change > 0 ? '+' : ''}${selectedRecommendation.current.change}%)`} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Current Allocation" 
                      secondary={`${selectedRecommendation.current.allocation}% of portfolio`} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Recommended Allocation" 
                      secondary={`${selectedRecommendation.targetAllocation}% of portfolio`} 
                    />
                  </ListItem>
                </List>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDetails}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </>
  );
};

export default Recommendations;
