import React from 'react';
import { Box, Typography, Chip, Divider, Grid } from '@mui/material';

const SentimentSummary = ({ sentiment }) => {
  // Mock sentiment data when real data is unavailable
  const mockSentimentData = {
    AAPL: { overall: 'POSITIVE', score: 0.68 },
    MSFT: { overall: 'POSITIVE', score: 0.72 },
    AMZN: { overall: 'NEUTRAL', score: 0.52 },
    TSLA: { overall: 'NEGATIVE', score: 0.35 },
    GOOGL: { overall: 'POSITIVE', score: 0.64 }
  };
  
  const data = sentiment || mockSentimentData;
  
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'success';
      case 'NEGATIVE':
        return 'error';
      case 'NEUTRAL':
      default:
        return 'info';
    }
  };
  
  return (
    <Box>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Current market sentiment analysis for your assets:
      </Typography>
      
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {Object.entries(data).map(([symbol, sentimentData]) => (
          <Grid item xs={6} sm={4} md={6} lg={4} key={symbol}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1
            }}>
              <Typography variant="subtitle2">{symbol}</Typography>
              <Chip
                label={sentimentData.overall}
                size="small"
                color={getSentimentColor(sentimentData.overall)}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
      
      <Divider sx={{ my: 1.5 }} />
      
      <Typography variant="caption" color="textSecondary">
        Based on analysis of news, financial reports, and social media.
      </Typography>
    </Box>
  );
};

export default SentimentSummary;
