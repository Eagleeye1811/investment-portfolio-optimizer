import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Box,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import Header from '../components/Header';
import AssetTable from '../components/AssetTable';
import PortfolioChart from '../components/PortfolioChart';
import { fetchPortfolioData, addAssetToPortfolio, updateAsset, deleteAsset } from '../services/portfolioService';

const PortfolioDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAddAssetDialog, setOpenAddAssetDialog] = useState(false);
  const [openEditAssetDialog, setOpenEditAssetDialog] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({
    symbol: '',
    quantity: '',
    purchasePrice: ''
  });

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const data = await fetchPortfolioData(id);
        setPortfolio(data);
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        setError('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    };
    
    loadPortfolio();
  }, [id]);

  const handleAddAssetOpen = () => {
    setAssetForm({
      symbol: '',
      quantity: '',
      purchasePrice: ''
    });
    setOpenAddAssetDialog(true);
  };

  const handleEditAssetOpen = (asset) => {
    setCurrentAsset(asset);
    setAssetForm({
      symbol: asset.symbol,
      quantity: asset.quantity.toString(),
      purchasePrice: asset.purchasePrice.toString()
    });
    setOpenEditAssetDialog(true);
  };

  const handleDialogClose = () => {
    setOpenAddAssetDialog(false);
    setOpenEditAssetDialog(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAssetForm({
      ...assetForm,
      [name]: value
    });
  };

  const handleAddAsset = async () => {
    try {
      // Basic validation
      if (!assetForm.symbol || !assetForm.quantity || !assetForm.purchasePrice) {
        setError('All fields are required');
        return;
      }

      const newAsset = {
        ...assetForm,
        quantity: parseFloat(assetForm.quantity),
        purchasePrice: parseFloat(assetForm.purchasePrice),
        portfolioId: id
      };

      const result = await addAssetToPortfolio(newAsset);
      
      // Update portfolio state with new asset
      setPortfolio({
        ...portfolio,
        assets: [...portfolio.assets, result]
      });
      
      handleDialogClose();
    } catch (err) {
      console.error('Error adding asset:', err);
      setError('Failed to add asset');
    }
  };

  const handleUpdateAsset = async () => {
    try {
      if (!assetForm.quantity || !assetForm.purchasePrice) {
        setError('Quantity and purchase price are required');
        return;
      }

      const updatedAsset = {
        ...currentAsset,
        quantity: parseFloat(assetForm.quantity),
        purchasePrice: parseFloat(assetForm.purchasePrice)
      };

      await updateAsset(currentAsset.id, updatedAsset);
      
      // Update portfolio state with updated asset
      setPortfolio({
        ...portfolio,
        assets: portfolio.assets.map(asset => 
          asset.id === currentAsset.id ? updatedAsset : asset
        )
      });
      
      handleDialogClose();
    } catch (err) {
      console.error('Error updating asset:', err);
      setError('Failed to update asset');
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(assetId);
        
        // Update portfolio state by removing the deleted asset
        setPortfolio({
          ...portfolio,
          assets: portfolio.assets.filter(asset => asset.id !== assetId)
        });
      } catch (err) {
        console.error('Error deleting asset:', err);
        setError('Failed to delete asset');
      }
    }
  };

  // Placeholder portfolio for development
  const placeholderPortfolio = {
    id: id || '123',
    name: 'My Main Portfolio',
    description: 'Long-term investment strategy focusing on tech and healthcare',
    createdAt: '2023-01-15T12:00:00Z',
    totalValue: 25750.42,
    dayChange: 450.23,
    dayChangePercent: 1.78,
    assets: [
      { id: 1, symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, purchasePrice: 150.25, currentPrice: 175.43, value: 1754.30 },
      { id: 2, symbol: 'MSFT', name: 'Microsoft', quantity: 5, purchasePrice: 250.50, currentPrice: 290.12, value: 1450.60 },
      { id: 3, symbol: 'AMZN', name: 'Amazon', quantity: 3, purchasePrice: 3100.75, currentPrice: 3245.50, value: 9736.50 },
      { id: 4, symbol: 'TSLA', name: 'Tesla', quantity: 8, purchasePrice: 700.00, currentPrice: 780.25, value: 6242.00 },
      { id: 5, symbol: 'GOOGL', name: 'Alphabet', quantity: 2, purchasePrice: 2800.50, currentPrice: 2895.50, value: 5791.00 }
    ]
  };

  const currentPortfolio = portfolio || placeholderPortfolio;

  if (loading) {
    return <div>Loading portfolio details...</div>;
  }

  return (
    <>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {currentPortfolio.name}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleAddAssetOpen}
          >
            Add Asset
          </Button>
        </Box>
        
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          {currentPortfolio.description}
        </Typography>
        
        <Grid container spacing={3}>
          {/* Portfolio Value Summary */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Portfolio Value</Typography>
              <Typography variant="h3">${currentPortfolio.totalValue.toLocaleString()}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography 
                  variant="body1"
                  color={currentPortfolio.dayChange >= 0 ? 'success.main' : 'error.main'}
                >
                  {currentPortfolio.dayChange >= 0 ? '+' : ''}
                  ${currentPortfolio.dayChange.toLocaleString()} 
                  ({currentPortfolio.dayChange >= 0 ? '+' : ''}
                  {currentPortfolio.dayChangePercent.toFixed(2)}%)
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                  Today
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          {/* Portfolio Chart */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <PortfolioChart portfolio={currentPortfolio} />
            </Paper>
          </Grid>
          
          {/* Asset Table */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Assets</Typography>
              <AssetTable 
                assets={currentPortfolio.assets} 
                onEdit={handleEditAssetOpen} 
                onDelete={handleDeleteAsset}
                showActions={true}
              />
            </Paper>
          </Grid>
        </Grid>
        
        {/* Add Asset Dialog */}
        <Dialog open={openAddAssetDialog} onClose={handleDialogClose}>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Enter the details of the asset you want to add to your portfolio.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              name="symbol"
              label="Symbol (e.g., AAPL)"
              type="text"
              fullWidth
              variant="outlined"
              value={assetForm.symbol}
              onChange={handleFormChange}
              sx={{ mt: 2 }}
            />
            <TextField
              margin="dense"
              name="quantity"
              label="Quantity"
              type="number"
              fullWidth
              variant="outlined"
              value={assetForm.quantity}
              onChange={handleFormChange}
            />
            <TextField
              margin="dense"
              name="purchasePrice"
              label="Purchase Price ($)"
              type="number"
              fullWidth
              variant="outlined"
              value={assetForm.purchasePrice}
              onChange={handleFormChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button onClick={handleAddAsset}>Add</Button>
          </DialogActions>
        </Dialog>
        
        {/* Edit Asset Dialog */}
        <Dialog open={openEditAssetDialog} onClose={handleDialogClose}>
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              name="symbol"
              label="Symbol"
              type="text"
              fullWidth
              variant="outlined"
              value={assetForm.symbol}
              disabled
              sx={{ mt: 2 }}
            />
            <TextField
              margin="dense"
              name="quantity"
              label="Quantity"
              type="number"
              fullWidth
              variant="outlined"
              value={assetForm.quantity}
              onChange={handleFormChange}
            />
            <TextField
              margin="dense"
              name="purchasePrice"
              label="Purchase Price ($)"
              type="number"
              fullWidth
              variant="outlined"
              value={assetForm.purchasePrice}
              onChange={handleFormChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button onClick={handleUpdateAsset}>Save</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default PortfolioDetail;
