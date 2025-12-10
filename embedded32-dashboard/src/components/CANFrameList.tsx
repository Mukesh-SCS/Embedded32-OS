import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const CANFrameList: React.FC = () => {
  const { state } = useDashboard();
  const [showFrames, setShowFrames] = useState(false);
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Raw CAN Frames</h2>
        <button 
          onClick={() => setShowFrames(!showFrames)}
          style={{ padding: '4px 12px', fontSize: 12 }}
        >
          {showFrames ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {showFrames && (
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {state.canFrames.length === 0 ? (
            <div style={{ padding: 12, color: '#666', fontSize: 13 }}>No CAN frames received</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>CAN ID</th>
                  <th>Data</th>
                  <th>Length</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {state.canFrames.slice(0, 100).map((frame, idx) => (
                  <tr key={idx}>
                    <td>0x{frame.id.toString(16).toUpperCase().padStart(8, '0')}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {frame.data.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
                    </td>
                    <td>{frame.data.length}</td>
                    <td>{new Date(frame.timestamp * 1000).toLocaleTimeString()}.{(frame.timestamp * 1000 % 1000).toFixed(0).padStart(3, '0')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default CANFrameList;
