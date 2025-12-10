import React, { useState, useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const BusLoadIndicator: React.FC = () => {
  const { state } = useDashboard();
  const [framesPerSec, setFramesPerSec] = useState(0);
  const [busLoad, setBusLoad] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Calculate frames per second from last second of messages
      const now = Date.now() / 1000;
      const recentFrames = state.canFrames.filter(f => f.timestamp > now - 1);
      const fps = recentFrames.length;
      setFramesPerSec(fps);
      
      // Estimate bus load (assuming 500kbps CAN bus, ~64 bits per frame average)
      const bitsPerSec = fps * 64;
      const load = (bitsPerSec / 500000) * 100;
      setBusLoad(Math.min(load, 100));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.canFrames]);

  const getLoadColor = () => {
    if (busLoad < 50) return '#4caf50';
    if (busLoad < 80) return '#ff9800';
    return '#f44336';
  };

  return (
    <div style={{ 
      padding: 12, 
      background: '#f5f5f5', 
      borderRadius: 4,
      display: 'flex',
      gap: 16,
      fontSize: 13
    }}>
      <div>
        <strong>Frames/sec:</strong> {framesPerSec}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong>Bus Load:</strong>
        <div style={{ 
          width: 100, 
          height: 12, 
          background: '#e0e0e0', 
          borderRadius: 6,
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${busLoad}%`, 
            height: '100%', 
            background: getLoadColor(),
            transition: 'width 0.3s'
          }} />
        </div>
        <span>{busLoad.toFixed(1)}%</span>
      </div>
    </div>
  );
};

export default BusLoadIndicator;
