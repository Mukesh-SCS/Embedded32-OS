import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboardState';
import { connectWS, disconnectWS } from '../services/ws';

const ConnectionManager: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const storedUrl = localStorage.getItem('wsUrl');
  const defaultUrl = 'ws://localhost:9001';
  const [url, setUrl] = useState(
    storedUrl && storedUrl.includes('9001') ? storedUrl : defaultUrl
  );

  const connect = () => {
    connectWS(url, (msg) => {
      console.log('Dashboard received message:', msg);
      
      try {
        if (msg.type === 'j1939') {
          dispatch({ type: 'ADD_J1939_MESSAGE', message: msg });
        } else if (msg.type === 'can') {
          dispatch({ type: 'ADD_CAN_FRAME', frame: msg });
        } else if (msg.type === 'dm1' || msg.type === 'j1939.dm1') {
          console.log('Received DM1 message with faults:', msg.faults);
          if (msg.faults && Array.isArray(msg.faults)) {
            console.log('Dispatching DM1 faults:', msg.faults);
            dispatch({ type: 'SET_DM1_FAULTS', faults: msg.faults });
          }
        } else if (msg.type === 'stats') {
          dispatch({ type: 'UPDATE_BUS_STATS', stats: { 
            framesPerSec: msg.fps || 0, 
            busLoad: msg.load || 0 
          }});
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error, msg);
      }
    });
    dispatch({ type: 'SET_CONNECTED', value: true });
    localStorage.setItem('wsUrl', url);
  };

  const disconnect = () => {
    disconnectWS();
    dispatch({ type: 'SET_CONNECTED', value: false });
  };

  return (
    <div className="card">
      <div className="card-header">
        <span>Connection</span>
        <span className={`status-pill ${state.connected ? 'ok' : 'danger'}`}>
          {state.connected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>
      <div className="card-body" style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
        <input 
          value={url} 
          onChange={e => setUrl(e.target.value)} 
          placeholder="ws://localhost:9001"
          disabled={state.connected}
          style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid #d1d5db' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-primary"
            onClick={connect} 
            disabled={state.connected}
          >
            Connect
          </button>
          <button 
            className="btn btn-outline"
            onClick={disconnect} 
            disabled={!state.connected}
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionManager;
