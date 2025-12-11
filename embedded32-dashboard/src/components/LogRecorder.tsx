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
    <div style={{ 
      display: 'flex', 
      gap: 8, 
      alignItems: 'center',
      padding: '8px 12px',
      background: '#f5f5f5',
      borderRadius: 4,
      border: '1px solid #ddd'
    }}>
      <strong style={{ fontSize: 13, marginRight: 8 }}>Recording:</strong>
      
      {!isRecording ? (
        <button
          onClick={startRecording}
          style={{
            padding: '6px 16px',
            borderRadius: 4,
            border: 'none',
            background: '#f44336',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 13
          }}
        >
          ⏺ Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          style={{
            padding: '6px 16px',
            borderRadius: 4,
            border: 'none',
            background: '#ff9800',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 13,
            animation: 'pulse 2s infinite'
          }}
        >
          ⏹ Stop Recording
        </button>
      )}

      <div style={{ borderLeft: '1px solid #ddd', height: 24, margin: '0 8px' }} />

      <button
        onClick={downloadLog}
        disabled={state.messages.length === 0}
        style={{
          padding: '6px 16px',
          borderRadius: 4,
          border: 'none',
          background: state.messages.length === 0 ? '#ccc' : '#4caf50',
          color: 'white',
          cursor: state.messages.length === 0 ? 'not-allowed' : 'pointer',
          fontWeight: 500,
          fontSize: 13
        }}
      >
        💾 Download JSON
      </button>

      <button
        onClick={exportCSV}
        disabled={state.messages.length === 0}
        style={{
          padding: '6px 16px',
          borderRadius: 4,
          border: 'none',
          background: state.messages.length === 0 ? '#ccc' : '#2196f3',
          color: 'white',
          cursor: state.messages.length === 0 ? 'not-allowed' : 'pointer',
          fontWeight: 500,
          fontSize: 13
        }}
      >
        📊 Export CSV
      </button>

      <div style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
        {state.messages.length} messages
      </div>
    </div>
  );
};

export default LogRecorder;
