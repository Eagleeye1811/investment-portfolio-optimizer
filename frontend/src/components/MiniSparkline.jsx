import React from 'react';
import { Line } from 'react-chartjs-2';
import { Box } from '@mui/material';

const MiniSparkline = ({ data, color = '#22c55e', height = 40 }) => {
  if (!data || data.length < 2) return null;

  const chartData = {
    labels: Array(data.length).fill(''),
    datasets: [{
      data: data,
      borderColor: color,
      backgroundColor: `${color}20`,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };

  return (
    <Box sx={{ height: height, width: 100 }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

export default MiniSparkline;