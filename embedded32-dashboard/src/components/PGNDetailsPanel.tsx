import React from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const PGNDetailsPanel: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const { selectedPGN } = state;

  if (!selectedPGN) return null;

  const close = () => dispatch({ type: 'SET_SELECTED_PGN', pgn: null });

  const getPGNName = (pgn: string) => {
    const pgnMap: Record<string, string> = {
      '0XF004': 'EEC1 - Electronic Engine Controller 1',
      '0XF003': 'EEC2 - Electronic Engine Controller 2',
      '0XFEEE': 'Engine Temperature 1',
      '0XF001': 'ETC1 - Electronic Transmission Controller 1',
      '0XFEF2': 'Fuel Economy',
      '0XFECA': 'DM1 - Active Diagnostic Trouble Codes',
    };
    return pgnMap[pgn.toUpperCase()] || 'Unknown PGN';
  };

  const getDocumentation = (pgn: string) => {
    const docMap: Record<string, string> = {
      '0XF004': 'SAE J1939-71: Contains engine speed, torque, and driver\'s demand parameters.',
      '0XF003': 'SAE J1939-71: Contains acceleration control and engine load information.',
      '0XFEEE': 'SAE J1939-71: Contains engine coolant and oil temperature readings.',
      '0XF001': 'SAE J1939-71: Contains transmission gear, range, and mode information.',
      '0XFEF2': 'SAE J1939-71: Contains fuel rate and economy calculations.',
      '0XFECA': 'SAE J1939-73: Contains active diagnostic trouble codes (DTCs).',
    };
    return docMap[pgn.toUpperCase()] || 'No documentation available.';
  };

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: 400,
      background: 'white',
      borderLeft: '2px solid #ddd',
      boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
      padding: 20,
      overflowY: 'auto',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>PGN Details</h2>
        <button onClick={close} style={{
          background: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: 14
        }}>✕ Close</button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <strong style={{ color: '#666', fontSize: 12 }}>PGN</strong>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1976d2' }}>
            {selectedPGN.pgn}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <strong style={{ color: '#666', fontSize: 12 }}>Name</strong>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            {getPGNName(selectedPGN.pgn)}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <strong style={{ color: '#666', fontSize: 12 }}>Source Address</strong>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            {selectedPGN.sa}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <strong style={{ color: '#666', fontSize: 12 }}>Priority</strong>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            {selectedPGN.parameters.priority || '-'}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <strong style={{ color: '#666', fontSize: 12 }}>Timestamp</strong>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            {new Date(selectedPGN.timestamp * 1000).toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
        <strong style={{ fontSize: 14, marginBottom: 8, display: 'block' }}>SPN Values</strong>
        {selectedPGN.parameters.spnValues ? (
          <div style={{ fontSize: 13 }}>
            {Object.entries(selectedPGN.parameters.spnValues).map(([key, value]) => (
              <div key={key} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>{key}:</span>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#999', fontSize: 13 }}>No SPN values available</div>
        )}
      </div>

      {selectedPGN.parameters.engineSpeed && (
        <div style={{ marginBottom: 24 }}>
          <strong style={{ fontSize: 14, marginBottom: 8, display: 'block' }}>Engine Parameters</strong>
          {selectedPGN.parameters.engineSpeed && (
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4caf50', marginBottom: 8 }}>
              {selectedPGN.parameters.engineSpeed} rpm
            </div>
          )}
          {selectedPGN.parameters.coolantTemp && (
            <div style={{ fontSize: 18, color: '#ff9800' }}>
              {selectedPGN.parameters.coolantTemp} °C
            </div>
          )}
        </div>
      )}

      {selectedPGN.parameters.transmissionGear && (
        <div style={{ marginBottom: 24 }}>
          <strong style={{ fontSize: 14, marginBottom: 8, display: 'block' }}>Transmission</strong>
          <div style={{ fontSize: 16 }}>
            Gear: <strong>{selectedPGN.parameters.transmissionGear}</strong>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24, padding: 16, background: '#e3f2fd', borderRadius: 4, borderLeft: '4px solid #1976d2' }}>
        <strong style={{ fontSize: 14, marginBottom: 8, display: 'block' }}>Documentation</strong>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: '#333' }}>
          {getDocumentation(selectedPGN.pgn)}
        </div>
      </div>
    </div>
  );
};

export default PGNDetailsPanel;
