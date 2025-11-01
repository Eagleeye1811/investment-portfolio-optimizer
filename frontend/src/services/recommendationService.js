import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_ENDPOINT || 'https://api-placeholder-url.execute-api.region.amazonaws.com/dev';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('Error getting authentication token:', error);
    throw error;
  }
};

// Fetch AI-powered portfolio recommendations
// Now accepts sentiment data to ensure consistency
export const fetchRecommendations = async (sentimentData = null) => {
  try {
    const headers = await getAuthHeaders();
    
    // If sentiment data is provided, send it in the request body
    if (sentimentData) {
      const response = await axios.post(`${API_URL}/recommendations`, 
        { sentiment: sentimentData },
        { headers }
      );
      return response.data;
    } else {
      // Fallback to GET if no sentiment provided (Lambda will fetch it)
      const response = await axios.get(`${API_URL}/recommendations`, { headers });
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
};

// Fetch recommendations with portfolio analysis
export const fetchDetailedRecommendations = async (portfolioId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/recommendations/detailed?portfolioId=${portfolioId}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching detailed recommendations:', error);
    throw error;
  }
};

// Fetch recommendation history
export const fetchRecommendationHistory = async (limit = 10) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/recommendations/history?limit=${limit}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching recommendation history:', error);
    throw error;
  }
};