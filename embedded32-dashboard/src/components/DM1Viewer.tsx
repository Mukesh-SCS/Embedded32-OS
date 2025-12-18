import React from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const DM1Viewer: React.FC = () => {
  const { state } = useDashboard();
  const faults = state.dm1Faults || [];

  const getSeverityColor = (fmi: number) => {
    if (fmi === 0) return '#ef4444';
    if (fmi === 1) return '#f97316';
    if (fmi === 2) return '#eab308';
    if (fmi === 3) return '#0ea5e9';
    return '#9ca3af';
  };

  const getSeverityLabel = (fmi: number) => {
    if (fmi === 0) return 'Critical';
    if (fmi === 1) return 'High';
    if (fmi === 2) return 'Medium';
    if (fmi === 3) return 'Low';
    return 'Unknown';
  };

  const getSeverityTagClass = (fmi: number) => {
    if (fmi === 0) return 'tag tag-critical';
    if (fmi === 1) return 'tag tag-high';
    if (fmi === 2) return 'tag tag-medium';
    if (fmi === 3) return 'tag tag-low';
    return 'tag';
  };

  return (
    <div className="card">
      <div className="card-header">
        <span>DM1 Fault Codes</span>
        {faults.length > 0 && <span className="status-pill danger">{faults.length} Active</span>}
      </div>
      <div className="card-body">
        {faults.length === 0 ? (
          <div className="empty-state">No active faults – system healthy</div>
        ) : (
          <div className="pgn-table-wrapper">
            <table className="pgn-table">
              <thead>
                <tr>
                  <th>SPN</th>
                  <th>FMI</th>
                  <th>Severity</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {faults.map((fault, idx) => (
                  <tr key={idx}>
                    <td><strong>{fault.spn}</strong></td>
                    <td>{fault.fmi}</td>
                    <td>
                      <span className={getSeverityTagClass(fault.fmi)}>
                        {getSeverityLabel(fault.fmi)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{fault.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DM1Viewer;
