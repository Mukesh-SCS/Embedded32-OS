import React, { useState } from 'react';
import { sendCommand } from '../services/ws';

interface FaultType {
  spn: number;
  fmi: number;
  description: string;
}

const FAULT_TYPES: FaultType[] = [
  { spn: 102, fmi: 1, description: 'Turbocharger Speed Low' },
  { spn: 84, fmi: 0, description: 'Engine Speed High' },
  { spn: 190, fmi: 2, description: 'Engine Coolant Temperature Data Invalid' },
  { spn: 110, fmi: 1, description: 'Engine Fuel Pressure Low' },
  { spn: 100, fmi: 0, description: 'Engine Oil Pressure High' },
  { spn: 1000, fmi: 3, description: 'Transmission Fluid Temperature Low' },
  { spn: 1001, fmi: 0, description: 'Transmission Fluid Temperature High' },
  { spn: 1234, fmi: 1, description: 'Engine Exhaust Temperature High' },
  { spn: 5247, fmi: 2, description: 'Electronic Engine Control Unit Failure' },
  { spn: 5348, fmi: 0, description: 'CAN Data Bus Error' }
];

const ECUSimulatorControls: React.FC = () => {
  const [engineRunning, setEngineRunning] = useState(false);
  const [rpm, setRpm] = useState(800);
  const [selectedFault, setSelectedFault] = useState<FaultType>(FAULT_TYPES[0]);
  const [activeFaults, setActiveFaults] = useState<Set<number>>(new Set());

  const startEngine = () => {
    setEngineRunning(true);
    sendCommand({ type: 'command', target: 'engine', action: 'start' });
  };

  const stopEngine = () => {
    setEngineRunning(false);
    setRpm(0);
    sendCommand({ type: 'command', target: 'engine', action: 'stop' });
  };

  const injectFault = () => {
    sendCommand({ 
      type: 'j1939.dm1.inject', 
      spn: selectedFault.spn, 
      fmi: selectedFault.fmi,
      description: selectedFault.description
    });
    setActiveFaults(new Set(activeFaults).add(selectedFault.spn));
  };

  const clearFault = (spn: number) => {
    const newFaults = new Set(activeFaults);
    newFaults.delete(spn);
    setActiveFaults(newFaults);
    
    if (newFaults.size === 0) {
      sendCommand({ type: 'j1939.dm1.clear' });
    } else {
      sendCommand({ type: 'j1939.dm1.clear' });
      newFaults.forEach(activeSPN => {
        const fault = FAULT_TYPES.find(f => f.spn === activeSPN);
        if (fault) {
          sendCommand({ 
            type: 'j1939.dm1.inject', 
            spn: fault.spn, 
            fmi: fault.fmi,
            description: fault.description
          });
        }
      });
    }
  };

  const clearAllFaults = () => {
    setActiveFaults(new Set());
    sendCommand({ type: 'j1939.dm1.clear' });
  };

  const adjustRpm = (delta: number) => {
    const newRpm = Math.max(0, Math.min(3000, rpm + delta));
    setRpm(newRpm);
    sendCommand({ type: 'engine.rpm.adjust', amount: delta, targetRpm: newRpm });
  };

  const getFMIColor = (fmi: number) => {
    if (fmi === 0) return '#ef4444';
    if (fmi === 1) return '#f97316';
    if (fmi === 2) return '#eab308';
    if (fmi === 3) return '#0ea5e9';
    return '#9ca3af';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Engine Control Card */}
      <div className="card">
        <div className="card-header">
          <span>Engine ECU</span>
          <span className={`status-pill ${engineRunning ? 'ok' : 'danger'}`}>
            {engineRunning ? '🟢 Running' : '🔴 Stopped'}
          </span>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={startEngine} 
            disabled={engineRunning}
            className="btn btn-primary"
            style={{ opacity: engineRunning ? 0.5 : 1 }}
          >
            Start
          </button>
          <button 
            onClick={stopEngine} 
            disabled={!engineRunning}
            className="btn btn-outline"
            style={{ opacity: !engineRunning ? 0.5 : 1 }}
          >
            Stop
          </button>
        </div>
      </div>

      {/* RPM Card */}
      <div className="card">
        <div className="card-header">
          <span>Engine RPM</span>
        </div>
        <div className="card-body rpm-card">
          <div className="rpm-value">{rpm}</div>
          <div className="rpm-controls">
            <button 
              onClick={() => adjustRpm(-100)} 
              disabled={!engineRunning}
              className="btn btn-outline"
              style={{ opacity: !engineRunning ? 0.5 : 1 }}
            >
              ⬇️ -100
            </button>
            <button 
              onClick={() => adjustRpm(100)} 
              disabled={!engineRunning}
              className="btn btn-outline"
              style={{ opacity: !engineRunning ? 0.5 : 1 }}
            >
              ⬆️ +100
            </button>
          </div>
        </div>
      </div>

      {/* Fault Injection Card */}
      <div className="card" style={{ border: '2px solid #f97316' }}>
        <div className="card-header">
          <span>Fault Injection</span>
          {activeFaults.size > 0 && <span className="status-pill danger">⚠️ {activeFaults.size} Active</span>}
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={selectedFault.spn}
              onChange={(e) => {
                const fault = FAULT_TYPES.find(f => f.spn === parseInt(e.target.value));
                if (fault) setSelectedFault(fault);
              }}
              style={{
                flex: 1,
                padding: '4px 8px',
                border: '1px solid #f97316',
                borderRadius: 4,
                fontSize: 12,
                backgroundColor: '#fef3c7',
                color: '#333'
              }}
            >
              {FAULT_TYPES.map(fault => (
                <option key={fault.spn} value={fault.spn}>
                  SPN {fault.spn} - {fault.description}
                </option>
              ))}
            </select>
            <button 
              onClick={injectFault}
              className="btn btn-primary"
            >
              Inject
            </button>
          </div>

          {/* Active Faults */}
          {activeFaults.size > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: '#6b7280' }}>Active Faults:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {Array.from(activeFaults).map(spn => {
                  const fault = FAULT_TYPES.find(f => f.spn === spn);
                  return fault ? (
                    <div
                      key={spn}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        background: getFMIColor(fault.fmi),
                        color: fault.fmi === 2 ? '#000' : 'white',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      <span>SPN {spn}</span>
                      <button
                        onClick={() => clearFault(spn)}
                        style={{
                          background: 'rgba(0,0,0,0.2)',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                          padding: '0px 4px',
                          borderRadius: 2,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
              <button
                onClick={clearAllFaults}
                className="btn btn-outline"
                style={{ width: '100%' }}
              >
                🗑️ Clear All
              </button>
            </div>
          )}

          {activeFaults.size === 0 && (
            <div style={{ 
              padding: 8, 
              background: '#dcfce7', 
              borderRadius: 4,
              fontSize: 11,
              color: '#166534',
              textAlign: 'center',
              fontWeight: 600
            }}>
              ✅ System Healthy
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ECUSimulatorControls;

