import React, { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const PGNTable: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const [autoScroll, setAutoScroll] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);
  
  const filtered = state.messages.filter(msg => {
    const { pgn, sa, priority } = state.filters;
    if (pgn && msg.pgn !== `0x${pgn.toString(16).toUpperCase()}`) return false;
    if (sa && msg.sa !== `0x${sa.toString(16).toUpperCase()}`) return false;
    if (priority && msg.parameters.priority !== priority) return false;
    
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      const matchesPGN = msg.pgn.toLowerCase().includes(query);
      const matchesSA = msg.sa.toLowerCase().includes(query);
      const matchesName = msg.parameters.name?.toLowerCase().includes(query);
      const matchesSPN = JSON.stringify(msg.parameters.spnValues || {}).toLowerCase().includes(query);
      if (!matchesPGN && !matchesSA && !matchesName && !matchesSPN) return false;
    }
    
    return true;
  });

  useEffect(() => {
    if (autoScroll && tableRef.current) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight;
    }
  }, [filtered, autoScroll]);

  const getRowClassName = (pgn: string) => {
    switch (pgn.toUpperCase()) {
      case '0XF004': return 'pgn-eec1';
      case '0XF001': return 'pgn-etc1';
      case '0XFEF2': return 'pgn-fuel';
      case '0XFECA': return 'pgn-dm1';
      default: return '';
    }
  };

  const renderSPNValues = (params: any) => {
    if (!params.spnValues) return '-';
    return (
      <div className="spn-values">
        {params.spnValues.engineSpeed && <div>Speed: <strong>{params.spnValues.engineSpeed}R</strong></div>}
        {params.spnValues.coolantTemp && <div>Coolant: <strong>{params.spnValues.coolantTemp}°</strong></div>}
        {params.spnValues.fuelRate && <div>Fuel: <strong>{params.spnValues.fuelRate}L/h</strong></div>}
        {params.spnValues.transmissionGear && <div>Gear: <strong>{params.spnValues.transmissionGear}</strong></div>}
      </div>
    );
  };

  const handleRowClick = (msg: any) => {
    dispatch({ type: 'SET_SELECTED_PGN', pgn: msg });
  };

  const highlightText = (text: string) => {
    if (!state.searchQuery) return text;
    const query = state.searchQuery;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} style={{ background: '#ffeb3b', padding: '0 2px' }}>{part}</mark> : part
    );
  };

  const hasActiveFilters = state.filters.pgn || state.filters.sa || state.filters.priority;

  return (
    <div className="card">
      <div className="card-header">
        <span>Live PGN Table</span>
        <div className="table-tools">
          <input
            type="text"
            placeholder="Search..."
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', query: e.target.value })}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #d1d5db',
              fontSize: 12,
              width: 130
            }}
          />
          <label style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 12, whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto
          </label>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            className={`btn btn-small ${state.isPaused ? 'btn-outline' : 'btn-primary'}`}
          >
            {state.isPaused ? '▶' : '⏸'}
          </button>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div style={{ 
          background: '#e3f2fd', 
          padding: '6px 8px', 
          borderRadius: 4, 
          marginBottom: 8, 
          fontSize: 11, 
          color: '#1976d2' 
        }}>
          <strong>Filters:</strong>{' '}
          {state.filters.pgn && `PGN=0x${state.filters.pgn.toString(16).toUpperCase()} `}
          {state.filters.sa && `SA=0x${state.filters.sa.toString(16).toUpperCase()} `}
          {state.filters.priority && `Pri=${state.filters.priority}`}
        </div>
      )}
      
      <div className="card-body">
        <div className="pgn-table-wrapper" ref={tableRef}>
          <table className="pgn-table">
            <thead>
              <tr>
                <th>Prio</th>
                <th>PGN</th>
                <th>Name</th>
                <th>SA</th>
                <th>Time</th>
                <th>SPN Values</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((msg, idx) => (
                  <tr 
                    key={idx} 
                    className={getRowClassName(msg.pgn)}
                    onClick={() => handleRowClick(msg)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{msg.parameters.priority || '-'}</td>
                    <td>{highlightText(msg.pgn)}</td>
                    <td>{msg.parameters.name ? highlightText(msg.parameters.name) : '-'}</td>
                    <td>{highlightText(msg.sa)}</td>
                    <td>{new Date(msg.timestamp * 1000).toLocaleTimeString()}</td>
                    <td>{renderSPNValues(msg.parameters)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '16px 8px' }}>
                    No messages yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PGNTable;
