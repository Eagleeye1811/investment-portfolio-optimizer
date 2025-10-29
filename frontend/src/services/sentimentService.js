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

// Fetch sentiment data for specific symbols
export const fetchSentimentData = async (symbols) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/sentiment?symbols=${symbols.join(',')}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching sentiment data:', error);
    throw error;
  }
};

// Fetch historical sentiment data for a symbol
export const fetchSentimentHistory = async (symbol, timeframe = '7d') => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/sentiment/${symbol}/history?timeframe=${timeframe}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching sentiment history:', error);
    throw error;
  }
};

// Fetch news sources for a symbol with sentiment analysis
export const fetchNewsSentiment = async (symbol, limit = 10) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/sentiment/${symbol}/news?limit=${limit}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching news sentiment:', error);
    throw error;
  }
};

// Fetch social media sentiment for a symbol
export const fetchSocialSentiment = async (symbol, limit = 20) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/sentiment/${symbol}/social?limit=${limit}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching social sentiment:', error);
    throw error;
  }
};