import React from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const BusLoadIndicator: React.FC = () => {
  const { state } = useDashboard();
  const { framesPerSec, busLoad } = state.busStats;

  const getLoadColor = () => {
    if (busLoad < 50) return '#22c55e';
    if (busLoad < 80) return '#f59e0b';
    return '#ef4444';
  };

  const getLoadStatus = () => {
    if (busLoad < 50) return 'ok';
    if (busLoad < 80) return 'warning';
    return 'danger';
  };

  return (
    <div className="card">
      <div className="card-header">
        <span>Bus Metrics</span>
        {state.isPaused && <span className="status-pill warning">⏸ Paused</span>}
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Frames/sec:</span>
          <strong style={{ fontSize: 18, color: '#2563eb' }}>{framesPerSec}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 70 }}>Bus Load:</span>
          <div style={{ 
            flex: 1,
            height: 20, 
            background: '#e5e7eb', 
            borderRadius: 4,
            overflow: 'hidden',
            border: `1px solid ${getLoadColor()}`
          }}>
            <div style={{ 
              width: `${Math.min(busLoad, 100)}%`, 
              height: '100%', 
              background: getLoadColor(),
              transition: 'width 0.3s, background 0.3s'
            }} />
          </div>
          <strong style={{ minWidth: 45, textAlign: 'right', color: getLoadColor() }}>
            {busLoad.toFixed(1)}%
          </strong>
        </div>
      </div>
    </div>
  );
};

export default BusLoadIndicator;
