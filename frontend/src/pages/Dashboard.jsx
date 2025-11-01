import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Container, Grid, Paper, Typography, Button, Box, Chip, IconButton, 
  Card, CardContent, LinearProgress, Divider, Avatar
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import PortfolioSummary from '../components/PortfolioSummary';
import PortfolioChart from '../components/PortfolioChart';
import AssetTable from '../components/AssetTable';
import SentimentSummary from '../components/SentimentSummary';
import RecommendationsList from '../components/RecommendationsList';
import RealtimePriceChart from '../components/RealtimePriceChart';
import { fetchPortfolioData } from '../services/portfolioService';
import { fetchSentimentData } from '../services/sentimentService';
import { fetchRecommendations } from '../services/recommendationService';
import Header from '../components/Header';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [portfolioData, setPortfolioData] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [priceChanges, setPriceChanges] = useState({});
  const [previousPrices, setPreviousPrices] = useState({});

  const loadDashboardData = async (showLoader = false) => {
    try {
      if (showLoader) setRefreshing(true);
      
      const portfolio = await fetchPortfolioData();
      
      // Track previous prices before updating
      if (portfolioData?.assets) {
        const prevPrices = {};
        portfolioData.assets.forEach(asset => {
          prevPrices[asset.symbol] = asset.currentPrice;
        });
        setPreviousPrices(prevPrices);
      }
      
      // Track price changes for flash animation
      if (portfolioData) {
        const changes = {};
        portfolio.assets.forEach(asset => {
          const oldAsset = portfolioData.assets.find(a => a.symbol === asset.symbol);
          if (oldAsset && oldAsset.currentPrice !== asset.currentPrice) {
            changes[asset.symbol] = asset.currentPrice > oldAsset.currentPrice ? 'up' : 'down';
            // Clear the flash after 2 seconds
            setTimeout(() => {
              setPriceChanges(prev => ({ ...prev, [asset.symbol]: null }));
            }, 2000);
          }
        });
        setPriceChanges(changes);
      }
      
      setPortfolioData(portfolio);
      
      // 🔥 FETCH SENTIMENT FIRST (single source of truth)
      const sentiment = await fetchSentimentData(portfolio.assets.map(asset => asset.symbol));
      setSentimentData(sentiment);
      
      console.log('📊 Sentiment from API:', sentiment);
      
      // 🔥 PASS SENTIMENT TO RECOMMENDATIONS (ensures perfect sync!)
      const recs = await fetchRecommendations(sentiment);
      setRecommendations(recs);
      
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      console.error('❌ Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, portfolioData]);

  const handleManualRefresh = () => {
    loadDashboardData(true);
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" gutterBottom>Loading your portfolio...</Typography>
            <LinearProgress sx={{ mt: 2, maxWidth: 400, mx: 'auto' }} />
          </Box>
        </Container>
      </>
    );
  }

  const totalValue = portfolioData?.totalValue || 0;
  const dayChange = portfolioData?.dayChange || 0;
  const dayChangePercent = portfolioData?.dayChangePercent || 0;
  const totalProfitLoss = portfolioData?.totalProfitLoss || 0;
  const totalProfitLossPercent = portfolioData?.totalProfitLossPercent || 0;

  return (
    <>
      <Header />
      
      {/* Top Status Bar */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: 1,
        px: 3
      }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Chip 
                label={autoRefresh ? '🟢 LIVE' : '⏸ PAUSED'}
                size="small"
                sx={{ 
                  bgcolor: autoRefresh ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'pulse-icon' : ''}
              />
              <Typography variant="body2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
              <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' } }}>
                Market: <strong>OPEN</strong>
              </Typography>
            </Box>
            <IconButton 
              onClick={handleManualRefresh}
              disabled={refreshing}
              sx={{ color: 'white' }}
            >
              <RefreshIcon className={refreshing ? 'rotating' : ''} />
            </IconButton>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        {error && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#fee', border: '1px solid #fcc' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}

        {/* Portfolio Overview Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Total Value Card */}
          <Grid item xs={12} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1 }}>
                    <AccountBalanceIcon />
                  </Avatar>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Value
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" className="number-change">
                  ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {dayChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  <Typography variant="h6" sx={{ ml: 0.5 }}>
                    {dayChange >= 0 ? '+' : ''}${Math.abs(dayChange).toFixed(2)} ({dayChange >= 0 ? '+' : ''}{dayChangePercent.toFixed(2)}%)
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Today's Change</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Total P/L Card */}
          <Grid item xs={12} md={3}>
            <Card sx={{ 
              background: totalProfitLoss >= 0 
                ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
              color: 'white',
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1 }}>
                    <ShowChartIcon />
                  </Avatar>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Gain/Loss
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold">
                  {totalProfitLoss >= 0 ? '+' : ''}${Math.abs(totalProfitLoss).toFixed(2)}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Since Purchase</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Assets Count Card */}
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: '#f59e0b', mr: 1 }}>
                    <AssessmentIcon />
                  </Avatar>
                  <Typography variant="body2" color="textSecondary">
                    Holdings
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  {portfolioData?.assets?.length || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Different Assets
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Best: {portfolioData?.assets?.[0]?.symbol || 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendations Count */}
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: '#ef4444', mr: 1 }}>
                    <NotificationsIcon />
                  </Avatar>
                  <Typography variant="body2" color="textSecondary">
                    AI Alerts
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="error">
                  {recommendations?.recommendations?.filter(r => r.priority === 'HIGH').length || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  High Priority Actions
                </Typography>
                <Button 
                  size="small" 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/recommendations')}
                >
                  View All →
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column - Portfolio Details */}
          <Grid item xs={12} lg={8}>
            {/* Live Price Ticker */}
            <Paper sx={{ mb: 3, p: 2, bgcolor: '#000', color: '#fff', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', gap: 4, overflowX: 'auto', py: 1 }}>
                {portfolioData?.assets?.map(asset => (
                  <Box 
                    key={asset.symbol} 
                    sx={{ 
                      minWidth: 150,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      transition: 'all 0.3s ease',
                      borderRadius: 1,
                      p: 1
                    }}
                    className={priceChanges[asset.symbol] === 'up' ? 'flash-green-bg' : priceChanges[asset.symbol] === 'down' ? 'flash-red-bg' : ''}
                  >
                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#22c55e' }}>
                      {asset.symbol}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      ${asset.currentPrice?.toFixed(2) || '0.00'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {(asset.change24h || 0) >= 0 ? (
                        <TrendingUpIcon sx={{ fontSize: 16, color: '#22c55e' }} />
                      ) : (
                        <TrendingDownIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                      )}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: (asset.change24h || 0) >= 0 ? '#22c55e' : '#ef4444',
                          fontWeight: 'bold'
                        }}
                      >
                        {(asset.change24h || 0) >= 0 ? '+' : ''}{(asset.change24h || 0).toFixed(2)}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Real-Time Price Chart */}
            <Box sx={{ mb: 3 }}>
              <RealtimePriceChart assets={portfolioData?.assets || []} />
            </Box>

            {/* Asset Table */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Your Holdings
                </Typography>
                <Chip label={`${portfolioData?.assets?.length || 0} Assets`} size="small" />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <AssetTable assets={portfolioData?.assets || []} />
            </Paper>

            {/* Portfolio Performance Chart */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Portfolio Performance
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <PortfolioChart portfolio={portfolioData} />
            </Paper>
          </Grid>

          {/* Right Column - Insights */}
          <Grid item xs={12} lg={4}>
            {/* Sentiment Card */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Market Sentiment
                </Typography>
                <Chip label="AI Powered" size="small" color="primary" />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <SentimentSummary sentiment={sentimentData} />
              <Button 
                fullWidth
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/sentiment')}
              >
                View Detailed Analysis →
              </Button>
            </Paper>

            {/* Recommendations Card */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  AI Recommendations
                </Typography>
                <Chip 
                  label={`${recommendations?.recommendations?.length || 0} Actions`}
                  size="small" 
                  color="error"
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <RecommendationsList recommendations={recommendations} />
              <Button 
                fullWidth
                variant="contained" 
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => navigate('/recommendations')}
              >
                View All Recommendations →
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Dashboard;