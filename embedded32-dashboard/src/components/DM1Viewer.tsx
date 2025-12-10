import React from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const DM1Viewer: React.FC = () => {
  const { state } = useDashboard();
  const faults = state.messages.filter(msg => msg.type === 'dm1');

  const getSeverityColor = (fmi: number) => {
    if (fmi === 0) return '#4caf50'; // Green
    if (fmi === 1) return '#ff9800'; // Yellow
    return '#f44336'; // Red
  };

  return (
    <div>
      <h2>DM1 Fault Codes</h2>
      {faults.length === 0 ? (
        <div style={{ padding: 12, color: '#666', fontSize: 13 }}>No active faults</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>SPN</th>
              <th>FMI</th>
              <th>Severity</th>
              <th>Description</th>
              <th>Count</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {faults.map((msg, idx) => (
              <tr key={idx} style={{ borderLeft: `4px solid ${getSeverityColor(msg.parameters.fmi)}` }}>
                <td>{msg.parameters.spn}</td>
                <td>{msg.parameters.fmi}</td>
                <td>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: 4, 
                    background: getSeverityColor(msg.parameters.fmi),
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 500
                  }}>
                    {msg.parameters.fmi === 0 ? 'Low' : msg.parameters.fmi === 1 ? 'Medium' : 'High'}
                  </span>
                </td>
                <td>{msg.parameters.description || '-'}</td>
                <td>{msg.parameters.count || 1}</td>
                <td>{new Date(msg.timestamp * 1000).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DM1Viewer;
