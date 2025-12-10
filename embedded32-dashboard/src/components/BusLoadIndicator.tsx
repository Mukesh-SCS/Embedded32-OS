import React from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const BusLoadIndicator: React.FC = () => {
  const { state } = useDashboard();
  const { framesPerSec, busLoad } = state.busStats;

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
      fontSize: 13,
      alignItems: 'center'
    }}>
      <div>
        <strong>Frames/sec:</strong> <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1976d2' }}>{framesPerSec}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong>Bus Load:</strong>
        <div style={{ 
          width: 120, 
          height: 16, 
          background: '#e0e0e0', 
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #ccc'
        }}>
          <div style={{ 
            width: `${Math.min(busLoad, 100)}%`, 
            height: '100%', 
            background: getLoadColor(),
            transition: 'width 0.3s, background 0.3s'
          }} />
        </div>
        <span style={{ fontWeight: 'bold', minWidth: 50, color: getLoadColor() }}>
          {busLoad.toFixed(1)}%
        </span>
      </div>
      {state.isPaused && (
        <div style={{ 
          marginLeft: 'auto', 
          background: '#ff9800', 
          color: 'white', 
          padding: '4px 12px', 
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 'bold'
        }}>
          ⏸ PAUSED
        </div>
      )}
    </div>
  );
};

export default BusLoadIndicator;
