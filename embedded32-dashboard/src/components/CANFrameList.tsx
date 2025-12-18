import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const CANFrameList: React.FC = () => {
  const { state } = useDashboard();
  const [activeTab, setActiveTab] = useState<'dm1' | 'raw'>('dm1');
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
        <span>Diagnostics & Logs</span>
      </div>
      <div className="card-body">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'dm1' ? 'active' : ''}`}
            onClick={() => setActiveTab('dm1')}
          >
            DM1 Fault Codes ({faults.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw')}
          >
            Raw CAN Frames ({state.canFrames.length})
          </button>
        </div>

        {/* DM1 Tab */}
        <div className={`tab-content ${activeTab === 'dm1' ? 'active' : ''}`}>
          {faults.length === 0 ? (
            <div className="empty-state">No active fault codes</div>
          ) : (
            <div className="pgn-table-wrapper" style={{ maxHeight: 200 }}>
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
                      <td style={{ fontSize: 11 }}>{fault.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Raw CAN Frames Tab */}
        <div className={`tab-content ${activeTab === 'raw' ? 'active' : ''}`}>
          {state.canFrames.length === 0 ? (
            <div className="empty-state">No raw CAN frames received</div>
          ) : (
            <div className="pgn-table-wrapper" style={{ maxHeight: 200 }}>
              <table className="pgn-table">
                <thead>
                  <tr>
                    <th>CAN ID</th>
                    <th>Data</th>
                    <th>Len</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {state.canFrames.slice(0, 50).map((frame, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>
                        0x{frame.id.toString(16).toUpperCase().padStart(8, '0')}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 10 }}>
                        {frame.data.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
                      </td>
                      <td>{frame.data.length}</td>
                      <td style={{ fontSize: 10 }}>
                        {new Date(frame.timestamp * 1000).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CANFrameList;
