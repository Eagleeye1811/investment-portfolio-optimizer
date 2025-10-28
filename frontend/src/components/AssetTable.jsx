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
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
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
            
            return (
              <TableRow
                key={asset.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {asset.symbol}
                </TableCell>
                <TableCell>{asset.name}</TableCell>
                <TableCell align="right">{asset.quantity}</TableCell>
                <TableCell align="right">${asset.purchasePrice.toFixed(2)}</TableCell>
                <TableCell align="right">${asset.currentPrice.toFixed(2)}</TableCell>
                <TableCell align="right">${currentValue.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)} (${gainLossPercent.toFixed(2)}%)`}
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
