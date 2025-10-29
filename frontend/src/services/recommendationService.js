import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_ENDPOINT || 'https://api-placeholder-url.execute-api.region.amazonaws.com/dev';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    return {
      Authorization: `Bearer ${token}`
    };
  } catch (error) {
    console.error('Error getting authentication token:', error);
    throw error;
  }
};

// Fetch recommendations for a specific portfolio
export const fetchRecommendations = async (portfolioId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/recommendations?portfolioId=${portfolioId}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
};

// Generate new recommendations for a portfolio
export const generateRecommendations = async (portfolioId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_URL}/recommendations/generate`, { portfolioId }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
};

// Apply a specific recommendation (e.g., buy or sell an asset)
export const applyRecommendation = async (recommendationId, action) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_URL}/recommendations/${recommendationId}/apply`, { action }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error applying recommendation:', error);
    throw error;
  }
};