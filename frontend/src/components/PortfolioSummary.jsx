import React from 'react';
import { Typography, Box } from '@mui/material';

const PortfolioSummary = ({ portfolio }) => {
  // Provide default values if data is missing
  const totalValue = portfolio?.totalValue || 0;
  const dayChange = portfolio?.dayChange || 0;
  const dayChangePercent = portfolio?.dayChangePercent || 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom component="div">
        Portfolio Summary
      </Typography>
      <Typography variant="h4" component="div">
        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Typography 
          variant="body1"
          color={dayChange >= 0 ? 'success.main' : 'error.main'}
        >
          {dayChange >= 0 ? '+' : ''}
          ${dayChange.toFixed(2)} 
          ({dayChange >= 0 ? '+' : ''}
          {dayChangePercent.toFixed(2)}%)
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
          Today
        </Typography>
      </Box>
    </Box>
  );
};

export default PortfolioSummary;