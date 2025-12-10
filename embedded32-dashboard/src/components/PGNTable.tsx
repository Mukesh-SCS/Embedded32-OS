import React, { useState, useRef, useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const PGNTable: React.FC = () => {
  const { state } = useDashboard();
  const [autoScroll, setAutoScroll] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);
  
  const filtered = state.messages.filter(msg => {
    const { pgn, sa, priority } = state.filters;
    if (pgn && msg.pgn !== `0x${pgn.toString(16).toUpperCase()}`) return false;
    if (sa && msg.sa !== `0x${sa.toString(16).toUpperCase()}`) return false;
    if (priority && msg.parameters.priority !== priority) return false;
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
        {params.engineSpeed && <div>Engine Speed: {params.engineSpeed} rpm</div>}
        {params.coolantTemp && <div>Coolant Temp: {params.coolantTemp} °C</div>}
        {params.fuelRate && <div>Fuel Rate: {params.fuelRate} L/h</div>}
        {params.transmissionGear && <div>Gear: {params.transmissionGear}</div>}
      </div>
    );
  };

  const hasActiveFilters = state.filters.pgn || state.filters.sa || state.filters.priority;

  return (
    <div>
      <h2>Live PGN Table</h2>
      
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
              <tr key={idx} className={getRowClassName(msg.pgn)}>
                <td>{msg.parameters.priority || '-'}</td>
                <td>{msg.pgn}</td>
                <td>{msg.parameters.name || '-'}</td>
                <td>{msg.sa}</td>
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
