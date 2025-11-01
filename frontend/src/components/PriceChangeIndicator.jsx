import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';

const PriceChangeIndicator = ({ currentPrice, previousPrice, symbol }) => {
  const [flash, setFlash] = useState(false);
  const [direction, setDirection] = useState('neutral');

  useEffect(() => {
    if (previousPrice && currentPrice !== previousPrice) {
      const newDirection = currentPrice > previousPrice ? 'up' : 'down';
      setDirection(newDirection);
      setFlash(true);
      
      // Remove flash after animation
      setTimeout(() => setFlash(false), 1000);
    }
  }, [currentPrice, previousPrice]);

  const change = previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        transition: 'all 0.3s ease'
      }}
      className={flash ? (direction === 'up' ? 'flash-green-bg' : 'flash-red-bg') : ''}
    >
      <Typography 
        variant="h5" 
        fontWeight="bold"
        sx={{ 
          color: isPositive ? '#22c55e' : '#ef4444',
          textShadow: flash ? '0 0 10px currentColor' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        ${currentPrice.toFixed(2)}
      </Typography>
      {change !== 0 && (
        <>
          {isPositive ? (
            <TrendingUp sx={{ color: '#22c55e', fontSize: 28 }} />
          ) : (
            <TrendingDown sx={{ color: '#ef4444', fontSize: 28 }} />
          )}
          <Chip 
            label={`${isPositive ? '+' : ''}${change.toFixed(2)}%`}
            size="small"
            sx={{
              bgcolor: isPositive ? '#22c55e' : '#ef4444',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </>
      )}
    </Box>
  );
};

export default PriceChangeIndicator;