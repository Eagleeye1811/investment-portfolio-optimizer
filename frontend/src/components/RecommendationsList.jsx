import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Chip,
  Divider 
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  DonutLarge as DonutLargeIcon
} from '@mui/icons-material';

const RecommendationsList = ({ recommendations }) => {
  // Mock recommendations data when real data is unavailable
  const mockRecommendations = {
    recommendations: [
      {
        symbol: 'AAPL',
        action: 'BUY',
        strength: 'STRONG',
        reasoning: 'Strong growth potential and positive sentiment'
      },
      {
        symbol: 'TSLA',
        action: 'SELL',
        strength: 'MODERATE',
        reasoning: 'Increasing competition and overvalued'
      },
      {
        symbol: 'MSFT',
        action: 'HOLD',
        strength: 'MODERATE',
        reasoning: 'Stable performance with moderate upside'
      }
    ]
  };
  
  const data = recommendations || mockRecommendations;
  
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
        return <TrendingUpIcon fontSize="small" />;
      case 'SELL':
        return <TrendingDownIcon fontSize="small" />;
      case 'HOLD':
      default:
        return <DonutLargeIcon fontSize="small" />;
    }
  };
  
  return (
    <Box>
      <List dense disablePadding>
        {data.recommendations.slice(0, 3).map((rec, index) => (
          <React.Fragment key={`${rec.symbol}-${index}`}>
            {index > 0 && <Divider component="li" />}
            <ListItem disableGutters>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2">{rec.symbol}</Typography>
                    <Chip
                      label={rec.action}
                      size="small"
                      color={getActionColor(rec.action)}
                      icon={getActionIcon(rec.action)}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="textSecondary">
                    {rec.reasoning}
                  </Typography>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
      
      {data.recommendations.length > 3 && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          Plus {data.recommendations.length - 3} more recommendations...
        </Typography>
      )}
    </Box>
  );
};

export default RecommendationsList;
