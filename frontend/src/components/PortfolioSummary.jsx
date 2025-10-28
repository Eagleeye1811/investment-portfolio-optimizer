import React from 'react';
import { Typography, Box } from '@mui/material';

const PortfolioSummary = ({ portfolio }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom component="div">
        Portfolio Summary
      </Typography>
      <Typography variant="h4" component="div">
        ${portfolio.totalValue.toLocaleString()}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Typography 
          variant="body1"
          color={portfolio.dayChange >= 0 ? 'success.main' : 'error.main'}
        >
          {portfolio.dayChange >= 0 ? '+' : ''}
          ${portfolio.dayChange.toLocaleString()} 
          ({portfolio.dayChange >= 0 ? '+' : ''}
          {portfolio.dayChangePercent.toFixed(2)}%)
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
          Today
        </Typography>
      </Box>
    </Box>
  );
};

export default PortfolioSummary;
