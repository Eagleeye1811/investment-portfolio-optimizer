import axios from 'axios';
// Fix import path
import { Auth } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_ENDPOINT || 'https://api-placeholder-url.execute-api.region.amazonaws.com/dev';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  try {
    const session = await Auth.currentSession();
    const token = session.getIdToken().getJwtToken();
    return {
      Authorization: `Bearer ${token}`
    };
  } catch (error) {
    console.error('Error getting authentication token:', error);
    throw error;
  }
};

// Fetch portfolio data for the authenticated user
export const fetchPortfolioData = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/portfolio`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    throw error;
  }
};

// Add a new asset to the portfolio
export const addAssetToPortfolio = async (assetData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_URL}/portfolio/assets`, assetData, { headers });
    return response.data;
  } catch (error) {
    console.error('Error adding asset to portfolio:', error);
    throw error;
  }
};

// Update an existing asset in the portfolio
export const updateAsset = async (assetId, assetData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_URL}/portfolio/assets/${assetId}`, assetData, { headers });
    return response.data;
  } catch (error) {
    console.error('Error updating asset:', error);
    throw error;
  }
};

// Delete an asset from the portfolio
export const deleteAsset = async (assetId) => {
  try {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_URL}/portfolio/assets/${assetId}`, { headers });
    return true;
  } catch (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }
};

// Get historical portfolio performance
export const fetchPortfolioHistory = async (timeframe = '1y') => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/portfolio/history?timeframe=${timeframe}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
    throw error;
  }
};
