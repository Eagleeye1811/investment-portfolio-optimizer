import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Box, Typography, Chip, Paper } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RealtimePriceChart = ({ assets }) => {
  const [priceHistory, setPriceHistory] = useState({});
  const [timestamps, setTimestamps] = useState([]);
  const maxDataPoints = 20; // Keep last 20 data points

  useEffect(() => {
    if (!assets || assets.length === 0) return;

    const now = new Date().toLocaleTimeString();
    
    // Update price history for each asset
    const newHistory = { ...priceHistory };
    
    assets.slice(0, 5).forEach(asset => { // Top 5 stocks only for clarity
      if (!newHistory[asset.symbol]) {
        newHistory[asset.symbol] = [];
      }
      
      // Add new price point
      newHistory[asset.symbol] = [
        ...newHistory[asset.symbol].slice(-maxDataPoints + 1),
        asset.currentPrice
      ];
    });

    setPriceHistory(newHistory);
    setTimestamps(prev => [...prev.slice(-maxDataPoints + 1), now]);
  }, [assets]);

  if (!assets || assets.length === 0) {
    return <Typography>Loading chart data...</Typography>
  }

  const topAssets = assets.slice(0, 5);
  
  const colors = [
    { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.1)' },
    { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' },
    { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.1)' },
    { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.1)' },
    { border: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.1)' }
  ];

  const chartData = {
    labels: timestamps,
    datasets: topAssets.map((asset, index) => ({
      label: asset.symbol,
      data: priceHistory[asset.symbol] || [],
      borderColor: colors[index].border,
      backgroundColor: colors[index].bg,
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 6
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12, weight: 'bold' }
        }
      },
      title: {
        display: true,
        text: 'Live Price Movement (Last 20 Updates)',
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%', minHeight: 400 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Real-Time Price Tracker
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label="🔴 LIVE" size="small" color="error" className="pulse-icon" />
          <Chip label={`${timestamps.length} data points`} size="small" variant="outlined" />
        </Box>
      </Box>
      <Box sx={{ height: 350 }}>
        <Line data={chartData} options={options} />
      </Box>
    </Paper>
  );
};

export default RealtimePriceChart;