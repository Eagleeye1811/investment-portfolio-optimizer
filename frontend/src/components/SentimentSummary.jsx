import React from 'react';
import { Box, Typography, Chip, Divider, Grid, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

const SentimentSummary = ({ sentiment }) => {
  // If no sentiment data, show loading or empty state
  if (!sentiment || Object.keys(sentiment).length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body2" color="textSecondary">
          Loading sentiment data...
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }
  
  const getSentimentColor = (sentimentType) => {
    switch (sentimentType) {
      case 'POSITIVE':
        return 'success';
      case 'NEGATIVE':
        return 'error';
      case 'NEUTRAL':
      default:
        return 'info';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp fontSize="small" sx={{ color: '#22c55e' }} />;
      case 'declining':
        return <TrendingDown fontSize="small" sx={{ color: '#ef4444' }} />;
      case 'stable':
      default:
        return <TrendingFlat fontSize="small" sx={{ color: '#64748b' }} />;
    }
  };
  
  return (
    <Box>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Current market sentiment analysis for your assets:
      </Typography>
      
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {Object.entries(sentiment).map(([symbol, data]) => {
          // Handle the actual API response structure
          const sentimentType = data.sentiment || 'NEUTRAL';
          const positiveScore = (data.positive * 100).toFixed(1);
          const negativeScore = (data.negative * 100).toFixed(1);
          const trend = data.trend || 'stable';
          
          return (
            <Grid item xs={12} sm={6} md={6} lg={6} key={symbol}>
              <Box sx={{ 
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 2,
                  borderColor: getSentimentColor(sentimentType) + '.main'
                }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">{symbol}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {getTrendIcon(trend)}
                    <Chip
                      label={sentimentType}
                      size="small"
                      color={getSentimentColor(sentimentType)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
                
                {/* Sentiment Score Bars */}
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="success.main">
                      Positive: {positiveScore}%
                    </Typography>
                    <Typography variant="caption" color="error.main">
                      Negative: {negativeScore}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, height: 6, borderRadius: 1, overflow: 'hidden' }}>
                    <Box 
                      sx={{ 
                        flex: data.positive, 
                        bgcolor: '#22c55e',
                        transition: 'flex 0.5s ease'
                      }} 
                    />
                    <Box 
                      sx={{ 
                        flex: data.neutral, 
                        bgcolor: '#94a3b8',
                        transition: 'flex 0.5s ease'
                      }} 
                    />
                    <Box 
                      sx={{ 
                        flex: data.negative, 
                        bgcolor: '#ef4444',
                        transition: 'flex 0.5s ease'
                      }} 
                    />
                  </Box>
                </Box>
                
                {/* Sample Size Badge */}
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Based on {data.sampleSize || 0} sources • {trend}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
      
      <Divider sx={{ my: 1.5 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          Based on analysis of news, financial reports, and social media.
        </Typography>
        {sentiment && Object.values(sentiment)[0]?.lastUpdated && (
          <Chip 
            label="🔴 LIVE" 
            size="small" 
            color="error" 
            className="pulse-icon"
            sx={{ fontSize: '0.65rem' }}
          />
        )}
      </Box>
    </Box>
  );
};

export default SentimentSummary;