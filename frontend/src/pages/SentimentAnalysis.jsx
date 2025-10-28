import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, Tabs, Tab, Chip } from '@mui/material';
import Header from '../components/Header';
import { fetchSentimentData } from '../services/sentimentService';
import { fetchPortfolioData } from '../services/portfolioService';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SentimentAnalysis = () => {
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // First get the portfolio to know which symbols to analyze
        const portfolio = await fetchPortfolioData();
        const portfolioSymbols = portfolio.assets.map(asset => asset.symbol);
        setSymbols(portfolioSymbols);
        
        if (portfolioSymbols.length > 0) {
          setSelectedSymbol(portfolioSymbols[0]);
          
          // Then fetch sentiment data for these symbols
          const sentimentResult = await fetchSentimentData(portfolioSymbols);
          setSentimentData(sentimentResult);
        }
      } catch (err) {
        console.error('Error loading sentiment data:', err);
        setError('Failed to load sentiment data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Mock sentiment data for development
  const mockSentimentData = {
    AAPL: {
      overall: 'POSITIVE',
      historical: [
        { date: '2023-05-01', positive: 0.65, negative: 0.10, neutral: 0.20, mixed: 0.05 },
        { date: '2023-05-08', positive: 0.70, negative: 0.08, neutral: 0.17, mixed: 0.05 },
        { date: '2023-05-15', positive: 0.60, negative: 0.15, neutral: 0.20, mixed: 0.05 },
        { date: '2023-05-22', positive: 0.72, negative: 0.10, neutral: 0.15, mixed: 0.03 },
        { date: '2023-05-29', positive: 0.68, negative: 0.12, neutral: 0.15, mixed: 0.05 },
      ],
      sources: {
        news: [
          { title: 'Apple Reports Strong Earnings', sentiment: 'POSITIVE', date: '2023-05-28', source: 'Financial Times' },
          { title: 'New iPhone Features Leaked', sentiment: 'POSITIVE', date: '2023-05-25', source: 'TechCrunch' },
          { title: 'Supply Chain Concerns for Apple', sentiment: 'NEGATIVE', date: '2023-05-20', source: 'Wall Street Journal' },
        ],
        twitter: [
          { text: 'Loving the new MacBook Pro!', sentiment: 'POSITIVE', date: '2023-05-29' },
          { text: "Apple's customer service is amazing", sentiment: 'POSITIVE', date: '2023-05-27' },
          { text: 'iPhone battery drain issues after update', sentiment: 'NEGATIVE', date: '2023-05-26' },
        ]
      }
    },
    MSFT: {
      overall: 'POSITIVE',
      historical: [
        { date: '2023-05-01', positive: 0.72, negative: 0.08, neutral: 0.15, mixed: 0.05 },
        { date: '2023-05-08', positive: 0.75, negative: 0.07, neutral: 0.13, mixed: 0.05 },
        { date: '2023-05-15', positive: 0.70, negative: 0.10, neutral: 0.15, mixed: 0.05 },
        { date: '2023-05-22', positive: 0.68, negative: 0.12, neutral: 0.15, mixed: 0.05 },
        { date: '2023-05-29', positive: 0.78, negative: 0.07, neutral: 0.12, mixed: 0.03 },
      ],
      sources: {
        news: [
          { title: 'Microsoft Azure Growth Continues', sentiment: 'POSITIVE', date: '2023-05-27', source: 'CNBC' },
          { title: 'Microsoft Teams Gets New Features', sentiment: 'POSITIVE', date: '2023-05-24', source: 'The Verge' },
          { title: 'Windows 11 Update Issues Reported', sentiment: 'NEGATIVE', date: '2023-05-18', source: 'PC World' },
        ],
        twitter: [
          { text: 'Azure is the best cloud platform!', sentiment: 'POSITIVE', date: '2023-05-29' },
          { text: "Microsoft's AI investments paying off", sentiment: 'POSITIVE', date: '2023-05-26' },
          { text: 'Windows update crashed my PC again', sentiment: 'NEGATIVE', date: '2023-05-25' },
        ]
      }
    }
  };
  
  const data = sentimentData || mockSentimentData;
  const currentSymbolData = selectedSymbol ? data[selectedSymbol] : null;

  const handleSymbolChange = (symbol) => {
    setSelectedSymbol(symbol);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getSentimentChartData = () => {
    if (!currentSymbolData) return null;
    
    return {
      labels: currentSymbolData.historical.map(item => item.date),
      datasets: [
        {
          label: 'Positive',
          data: currentSymbolData.historical.map(item => item.positive),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
          stack: 'Stack 0',
        },
        {
          label: 'Negative',
          data: currentSymbolData.historical.map(item => item.negative),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
          stack: 'Stack 0',
        },
        {
          label: 'Neutral',
          data: currentSymbolData.historical.map(item => item.neutral),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1,
          stack: 'Stack 0',
        },
        {
          label: 'Mixed',
          data: currentSymbolData.historical.map(item => item.mixed),
          backgroundColor: 'rgba(255, 206, 86, 0.5)',
          borderColor: 'rgb(255, 206, 86)',
          borderWidth: 1,
          stack: 'Stack 0',
        },
      ],
    };
  };

  const getSentimentChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `Sentiment Analysis for ${selectedSymbol}`,
        },
      },
      scales: {
        y: {
          stacked: true,
          beginAtZero: true,
          max: 1,
        },
        x: {
          stacked: true,
        },
      },
    };
  };

  const renderSourceItems = (sourceType) => {
    if (!currentSymbolData || !currentSymbolData.sources[sourceType]) {
      return <Typography>No {sourceType} data available</Typography>;
    }

    return currentSymbolData.sources[sourceType].map((item, index) => (
      <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {item.title || item.text}
          </Typography>
          <Chip 
            label={item.sentiment} 
            color={item.sentiment === 'POSITIVE' ? 'success' : item.sentiment === 'NEGATIVE' ? 'error' : 'default'} 
            size="small"
          />
        </Box>
        {sourceType === 'news' && (
          <Typography variant="body2" color="textSecondary">
            Source: {item.source} | {item.date}
          </Typography>
        )}
        {sourceType === 'twitter' && (
          <Typography variant="body2" color="textSecondary">
            {item.date}
          </Typography>
        )}
      </Paper>
    ));
  };

  if (loading) {
    return <div>Loading sentiment analysis...</div>;
  }

  return (
    <>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        
        <Typography variant="h4" component="h1" gutterBottom>
          Market Sentiment Analysis
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Select Stock</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {symbols.map(symbol => (
              <Chip
                key={symbol}
                label={symbol}
                onClick={() => handleSymbolChange(symbol)}
                color={selectedSymbol === symbol ? 'primary' : 'default'}
                variant={selectedSymbol === symbol ? 'filled' : 'outlined'}
                sx={{ fontSize: '1rem' }}
              />
            ))}
          </Box>
        </Box>
        
        {currentSymbolData && (
          <Grid container spacing={3}>
            {/* Overall Sentiment */}
            <Grid item xs={12} md={4} lg={3}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Overall Sentiment</Typography>
                <Typography 
                  variant="h3" 
                  color={
                    currentSymbolData.overall === 'POSITIVE' ? 'success.main' :
                    currentSymbolData.overall === 'NEGATIVE' ? 'error.main' :
                    'text.primary'
                  }
                  sx={{ mb: 2 }}
                >
                  {currentSymbolData.overall}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Based on analysis of news articles and social media mentions over the past 7 days.
                </Typography>
              </Paper>
            </Grid>
            
            {/* Sentiment Chart */}
            <Grid item xs={12} md={8} lg={9}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Box sx={{ height: 300 }}>
                  <Bar data={getSentimentChartData()} options={getSentimentChartOptions()} />
                </Box>
              </Paper>
            </Grid>
            
            {/* News and Social Media Tabs */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="News Articles" />
                    <Tab label="Social Media" />
                  </Tabs>
                </Box>
                <Box sx={{ p: 1 }}>
                  {tabValue === 0 && (
                    <div>{renderSourceItems('news')}</div>
                  )}
                  {tabValue === 1 && (
                    <div>{renderSourceItems('twitter')}</div>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
};

export default SentimentAnalysis;
