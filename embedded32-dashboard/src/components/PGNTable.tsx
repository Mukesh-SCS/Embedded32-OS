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
    
    // Apply search query
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
        {params.engineSpeed && <div>Engine Speed: <strong>{params.engineSpeed} rpm</strong></div>}
        {params.coolantTemp && <div>Coolant Temp: <strong>{params.coolantTemp} °C</strong></div>}
        {params.fuelRate && <div>Fuel Rate: <strong>{params.fuelRate} L/h</strong></div>}
        {params.transmissionGear && <div>Gear: <strong>{params.transmissionGear}</strong></div>}
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Live PGN Table</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search PGN, SA, Name..."
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', query: e.target.value })}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              border: '1px solid #ddd',
              fontSize: 13,
              width: 200
            }}
          />
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              border: 'none',
              background: state.isPaused ? '#4caf50' : '#ff9800',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 13
            }}
          >
            {state.isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="filter-indicators">
          <strong>Active Filters:</strong>{' '}
          {state.filters.pgn && `PGN=0x${state.filters.pgn.toString(16).toUpperCase()} `}
          {state.filters.sa && `SA=0x${state.filters.sa.toString(16).toUpperCase()} `}
          {state.filters.priority && `Priority=${state.filters.priority}`}
        </div>
      )}
      
      <div className="auto-scroll-toggle">
        <input
          type="checkbox"
          id="auto-scroll"
          checked={autoScroll}
          onChange={(e) => setAutoScroll(e.target.checked)}
        />
        <label htmlFor="auto-scroll">Auto-scroll</label>
      </div>
      
      <div className="pgn-table-container" ref={tableRef}>
        <table>
          <thead>
            <tr>
              <th>Priority</th>
              <th>PGN</th>
              <th>Name</th>
              <th>SA</th>
              <th>Timestamp</th>
              <th>SPN Values</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((msg, idx) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PGNTable;
