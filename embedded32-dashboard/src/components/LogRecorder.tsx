import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const LogRecorder: React.FC = () => {
  const { state } = useDashboard();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState<any[]>([]);

  const startRecording = () => {
    setIsRecording(true);
    setRecordedData([]);
    console.log('Started recording J1939 log');
  };

  const stopRecording = () => {
    setIsRecording(false);
    console.log('Stopped recording. Total messages:', recordedData.length);
  };

  const downloadLog = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `j1939_${timestamp}.json`;
    
    const logData = {
      metadata: {
        recordedAt: new Date().toISOString(),
        messageCount: state.messages.length,
        canFrameCount: state.canFrames.length,
        dm1FaultCount: state.dm1Faults.length,
      },
      messages: state.messages,
      canFrames: state.canFrames,
      dm1Faults: state.dm1Faults,
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('Downloaded log:', filename);
  };

  const exportCSV = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `j1939_${timestamp}.csv`;
    
    // Create CSV header
    let csv = 'Timestamp,Type,PGN,SA,Priority,Name,SPN Values\n';
    
    // Add data rows
    state.messages.forEach(msg => {
      const spnValues = msg.parameters.spnValues 
        ? JSON.stringify(msg.parameters.spnValues).replace(/"/g, '""')
        : '';
      csv += `${new Date(msg.timestamp * 1000).toISOString()},`;
      csv += `${msg.type},`;
      csv += `${msg.pgn},`;
      csv += `${msg.sa},`;
      csv += `${msg.parameters.priority || ''},`;
      csv += `${msg.parameters.name || ''},`;
      csv += `"${spnValues}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('Exported CSV:', filename);
  };

  return (
    <section className="row">
      <div className="recording-card card">
        <div className="card-header">
          <span>Recording Controls</span>
          {isRecording && <span className="status-pill warning">⏺ Recording</span>}
        </div>
        <div className="card-body" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="btn btn-primary"
            >
              ⏺ Start
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="btn"
              style={{
                background: '#f97316',
                color: 'white',
                animation: 'pulse 2s infinite'
              }}
            >
              ⏹ Stop
            </button>
          )}

          <div style={{ borderLeft: '1px solid #e5e7eb', height: 20 }} />

          <button
            onClick={downloadLog}
            disabled={state.messages.length === 0}
            className="btn btn-outline"
            style={{ opacity: state.messages.length === 0 ? 0.5 : 1 }}
          >
            💾 JSON
          </button>

          <button
            onClick={exportCSV}
            disabled={state.messages.length === 0}
            className="btn btn-outline"
            style={{ opacity: state.messages.length === 0 ? 0.5 : 1 }}
          >
            📊 CSV
          </button>

          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>
            {state.messages.length} msgs
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogRecorder;
