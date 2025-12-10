import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const FilterPanel: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const [pgn, setPgn] = useState(state.filters.pgn?.toString(16) || '');
  const [sa, setSa] = useState(state.filters.sa?.toString(16) || '');
  const [priority, setPriority] = useState(state.filters.priority?.toString() || '');

  const applyFilters = () => {
    dispatch({
      type: 'SET_FILTERS',
      filters: {
        pgn: pgn ? parseInt(pgn, 16) : undefined,
        sa: sa ? parseInt(sa, 16) : undefined,
        priority: priority ? Number(priority) : undefined,
      },
    });
  };

  const clearFilters = () => {
    setPgn('');
    setSa('');
    setPriority('');
    dispatch({
      type: 'SET_FILTERS',
      filters: {},
    });
  };

  return (
    <div className="filter-panel">
      <h2 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Filters</h2>
      <div>
        <label>
          PGN (hex):
          <input 
            value={pgn} 
            onChange={e => setPgn(e.target.value)} 
            placeholder="F004"
          />
        </label>
      </div>
      <div>
        <label>
          SA (hex):
          <input 
            value={sa} 
            onChange={e => setSa(e.target.value)} 
            placeholder="00"
          />
        </label>
      </div>
      <div>
        <label>
          Priority:
          <input 
            value={priority} 
            onChange={e => setPriority(e.target.value)} 
            placeholder="3"
          />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={applyFilters}>Apply</button>
        <button onClick={clearFilters} style={{ background: '#757575' }}>Clear</button>
      </div>
    </div>
  );
};

export default FilterPanel;
