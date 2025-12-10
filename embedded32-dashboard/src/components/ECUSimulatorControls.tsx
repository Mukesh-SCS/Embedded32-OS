import React, { useState } from 'react';

const ECUSimulatorControls: React.FC = () => {
  const [engineRunning, setEngineRunning] = useState(false);
  const [rpm, setRpm] = useState(800);
  const [faultActive, setFaultActive] = useState(false);

  const startEngine = () => {
    setEngineRunning(true);
    // TODO: Send WebSocket message to start engine simulation
    console.log('Starting engine...');
  };

  const stopEngine = () => {
    setEngineRunning(false);
    setRpm(0);
    // TODO: Send WebSocket message to stop engine simulation
    console.log('Stopping engine...');
  };

  const toggleFault = () => {
    setFaultActive(!faultActive);
    // TODO: Send WebSocket message to toggle DM1 fault
    console.log('Toggling fault:', !faultActive);
  };

  const adjustRpm = (delta: number) => {
    const newRpm = Math.max(0, Math.min(3000, rpm + delta));
    setRpm(newRpm);
    // TODO: Send WebSocket message to adjust RPM
    console.log('Adjusting RPM to:', newRpm);
  };

  return (
    <div>
      <h2>ECU Simulator Controls</h2>
      
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="section" style={{ minWidth: 200 }}>
          <h3 style={{ fontSize: 14, marginTop: 0 }}>Engine Control</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button 
              onClick={startEngine} 
              disabled={engineRunning}
              style={{ 
                flex: 1,
                background: engineRunning ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 4,
                cursor: engineRunning ? 'not-allowed' : 'pointer'
              }}
            >
              Start Engine
            </button>
            <button 
              onClick={stopEngine} 
              disabled={!engineRunning}
              style={{ 
                flex: 1,
                background: !engineRunning ? '#ccc' : '#f44336',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 4,
                cursor: !engineRunning ? 'not-allowed' : 'pointer'
              }}
            >
              Stop Engine
            </button>
          </div>
          
          <div style={{ marginBottom: 8 }}>
            <strong>Status:</strong> {engineRunning ? '🟢 Running' : '🔴 Stopped'}
          </div>
        </div>

        <div className="section" style={{ minWidth: 200 }}>
          <h3 style={{ fontSize: 14, marginTop: 0 }}>RPM Control</h3>
          <div style={{ marginBottom: 8 }}>
            <strong>Current RPM:</strong> {rpm}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => adjustRpm(-100)} 
              disabled={!engineRunning}
              style={{ 
                flex: 1,
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: !engineRunning ? 'not-allowed' : 'pointer',
                background: !engineRunning ? '#f5f5f5' : 'white'
              }}
            >
              -100
            </button>
            <button 
              onClick={() => adjustRpm(100)} 
              disabled={!engineRunning}
              style={{ 
                flex: 1,
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: !engineRunning ? 'not-allowed' : 'pointer',
                background: !engineRunning ? '#f5f5f5' : 'white'
              }}
            >
              +100
            </button>
          </div>
        </div>

        <div className="section" style={{ minWidth: 200 }}>
          <h3 style={{ fontSize: 14, marginTop: 0 }}>Fault Injection</h3>
          <button 
            onClick={toggleFault}
            style={{ 
              width: '100%',
              background: faultActive ? '#f44336' : '#ff9800',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {faultActive ? '⚠️ Clear DM1 Fault' : '⚠️ Inject DM1 Fault'}
          </button>
          <div style={{ marginTop: 8, fontSize: 13 }}>
            <strong>Fault Status:</strong> {faultActive ? '⚠️ Active' : '✅ None'}
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        background: '#fff3cd', 
        borderRadius: 4,
        fontSize: 12,
        color: '#856404'
      }}>
        <strong>Note:</strong> These controls will send commands to the WebSocket bridge when fully integrated.
      </div>
    </div>
  );
};

export default ECUSimulatorControls;
