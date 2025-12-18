import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '../hooks/useDashboardState';

const EngineChart: React.FC = () => {
  const { state } = useDashboard();
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const latestMessages = state.messages
        .filter(msg => msg.parameters?.spnValues?.engineSpeed || msg.parameters?.spnValues?.coolantTemp)
        .slice(0, 50)
        .reverse()
        .map(msg => ({
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
          engineSpeed: msg.parameters?.spnValues?.engineSpeed || 0,
          coolantTemp: msg.parameters?.spnValues?.coolantTemp || 0,
        }));
      
      setChartData(latestMessages);
    }, 100);
    
    return () => clearInterval(interval);
  }, [state.messages]);

  if (chartData.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span>Engine Telemetry</span>
        </div>
        <div className="card-body">
          <div className="empty-state" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No telemetry yet – start Engine ECU to stream data
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span>Engine Telemetry</span>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 4 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line 
              type="natural" 
              dataKey="engineSpeed" 
              stroke="#2563eb" 
              name="RPM" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line 
              type="natural" 
              dataKey="coolantTemp" 
              stroke="#22c55e" 
              name="Coolant °C" 
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
