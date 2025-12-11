import React from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const DM1Viewer: React.FC = () => {
  const { state } = useDashboard();
  const faults = state.dm1Faults || [];

  console.log('DM1Viewer rendering with faults:', faults);

  const getSeverityColor = (fmi: number) => {
    if (fmi === 0) return '#f44336'; // Red - High severity
    if (fmi === 1) return '#ff9800'; // Orange - Medium
    if (fmi === 3) return '#ffeb3b'; // Yellow - Low
    return '#9e9e9e'; // Gray - Unknown
  };

  const getSeverityLabel = (fmi: number) => {
    if (fmi === 0) return 'High';
    if (fmi === 1) return 'Medium';
    if (fmi === 3) return 'Low';
    return 'Unknown';
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
              <th>Occurrence</th>
            </tr>
          </thead>
          <tbody>
            {faults.map((fault, idx) => (
              <tr key={idx} style={{ borderLeft: `4px solid ${getSeverityColor(fault.fmi)}` }}>
                <td><strong>{fault.spn}</strong></td>
                <td>{fault.fmi}</td>
                <td>
                  <span className={`severity severity-${fault.fmi}`} style={{ 
                    padding: '2px 8px', 
                    borderRadius: 4, 
                    background: getSeverityColor(fault.fmi),
                    color: fault.fmi === 3 ? '#000' : 'white',
                    fontSize: 11,
                    fontWeight: 500,
                    display: 'inline-block'
                  }}>
                    {getSeverityLabel(fault.fmi)}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{fault.description || '-'}</td>
                <td>{fault.count || 1}</td>
                <td>{fault.occurrence || 1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DM1Viewer;
