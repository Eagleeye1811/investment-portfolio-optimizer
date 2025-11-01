import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';

const AssetTable = ({ assets, onEdit, onDelete, showActions = false }) => {
  return (
    <TableContainer component={Paper} elevation={0}>
      <Table sx={{ minWidth: 650 }} aria-label="portfolio assets">
        <TableHead>
          <TableRow>
            <TableCell>Symbol</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">Quantity</TableCell>
            <TableCell align="right">Purchase Price</TableCell>
            <TableCell align="right">Current Price</TableCell>
            <TableCell align="right">24h Change</TableCell>
            <TableCell align="right">Value</TableCell>
            <TableCell align="right">Gain/Loss</TableCell>
            {showActions && <TableCell align="center">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {assets.map((asset) => {
            const purchaseValue = asset.purchasePrice * asset.quantity;
            const currentValue = asset.currentPrice * asset.quantity;
            const gainLoss = currentValue - purchaseValue;
            const gainLossPercent = (gainLoss / purchaseValue) * 100;
            const change24h = asset.change24h || 0;
            const is24hUp = change24h >= 0;
            
            return (
              <TableRow
                key={asset.id || asset.assetId}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                className="price-update"
              >
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" fontWeight="600">
                      {asset.symbol}
                    </Typography>
                    {is24hUp ? (
                      <TrendingUpIcon fontSize="small" sx={{ color: '#22c55e' }} />
                    ) : (
                      <TrendingDownIcon fontSize="small" sx={{ color: '#ef4444' }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell>{asset.name}</TableCell>
                <TableCell align="right">{asset.quantity}</TableCell>
                <TableCell align="right">${asset.purchasePrice.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Typography 
                    className={is24hUp ? 'price-up' : 'price-down'}
                    fontWeight="600"
                  >
                    ${asset.currentPrice.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip 
                    label={`${is24hUp ? '+' : ''}${change24h.toFixed(2)}%`}
                    size="small"
                    color={is24hUp ? 'success' : 'error'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">${currentValue.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${gainLoss >= 0 ? '+' : ''}$${Math.abs(gainLoss).toFixed(2)} (${gainLossPercent.toFixed(2)}%)`}
                    color={gainLoss >= 0 ? 'success' : 'error'}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                {showActions && (
                  <TableCell align="center">
                    <IconButton 
                      aria-label="edit" 
                      size="small"
                      onClick={() => onEdit && onEdit(asset)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      aria-label="delete" 
                      size="small"
                      onClick={() => onDelete && onDelete(asset.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AssetTable;