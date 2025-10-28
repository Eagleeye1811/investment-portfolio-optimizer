import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PortfolioChart = ({ portfolio }) => {
  // Placeholder data - in a real app this would come from the API
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Portfolio Value ($)',
        data: [22000, 22500, 23200, 24100, 23800, 24500, 25100, 24900, 25300, 25750],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
      },
      {
        label: 'S&P 500',
        data: [22000, 22200, 22800, 23200, 23500, 23800, 24100, 24300, 24600, 24900],
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderDash: [5, 5],
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Portfolio Performance',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <Box sx={{ height: 300 }}>
      <Typography variant="h6" gutterBottom component="div">
        Performance History
      </Typography>
      <Line options={options} data={data} />
    </Box>
  );
};

export default PortfolioChart;
