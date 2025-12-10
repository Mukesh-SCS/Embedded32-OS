import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboardState';
import { connectWS, disconnectWS } from '../services/ws';

const ConnectionManager: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const [url, setUrl] = useState(localStorage.getItem('wsUrl') || 'ws://localhost:9000');

  const connect = () => {
    connectWS(url, (msg) => {
      console.log('Dashboard received message:', msg);
      
      try {
        if (msg.type === 'j1939') {
          dispatch({ type: 'ADD_J1939_MESSAGE', message: msg });
        } else if (msg.type === 'can') {
          dispatch({ type: 'ADD_CAN_FRAME', frame: msg });
        } else if (msg.type === 'dm1' || msg.type === 'j1939.dm1') {
          // Handle DM1 fault messages - don't add to regular messages
          console.log('Received DM1 message with faults:', msg.faults);
          if (msg.faults && Array.isArray(msg.faults)) {
            console.log('Dispatching DM1 faults:', msg.faults);
            dispatch({ type: 'SET_DM1_FAULTS', faults: msg.faults });
          }
        } else if (msg.type === 'stats') {
          // Handle bus statistics
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
    <div className="connection-manager">
      <h2 style={{ margin: 0, fontSize: 16 }}>Connection</h2>
      <input 
        value={url} 
        onChange={e => setUrl(e.target.value)} 
        placeholder="ws://localhost:9000"
        disabled={state.connected}
      />
      <button 
        className="btn-connect"
        onClick={connect} 
        disabled={state.connected}
      >
        Connect
      </button>
      <button 
        className="btn-disconnect"
        onClick={disconnect} 
        disabled={!state.connected}
      >
        Disconnect
      </button>
      <div className="status-indicator">
        <div className={state.connected ? 'status-dot status-connected' : 'status-dot status-disconnected'} />
        {state.connected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};

export default ConnectionManager;
