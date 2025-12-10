import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '../hooks/useDashboardState';

const EngineChart: React.FC = () => {
  const { state } = useDashboard();
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Throttle updates to 10fps (100ms intervals)
  useEffect(() => {
    const interval = setInterval(() => {
      const latestMessages = state.messages
        .filter(msg => msg.parameters.engineSpeed || msg.parameters.coolantTemp)
        .slice(0, 50) // Keep last 50 data points
        .reverse()
        .map(msg => ({
          timestamp: new Date(msg.timestamp * 1000).toLocaleTimeString(),
          engineSpeed: msg.parameters.engineSpeed || 0,
          coolantTemp: msg.parameters.coolantTemp || 0,
        }));
      
      setChartData(latestMessages);
    }, 100); // 10fps
    
    return () => clearInterval(interval);
  }, [state.messages]);

  return (
    <div>
      <h2>Engine Telemetry</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line 
              type="natural" 
              dataKey="engineSpeed" 
              stroke="#2196f3" 
              name="Engine Speed (RPM)" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line 
              type="natural" 
              dataKey="coolantTemp" 
              stroke="#4caf50" 
              name="Coolant Temp (°C)" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EngineChart;
