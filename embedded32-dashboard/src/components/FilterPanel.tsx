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
    <div className="card filter-panel">
      <div className="card-header">
        <span>Filters</span>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 3, color: '#666' }}>PGN</label>
          <input 
            value={pgn} 
            onChange={e => setPgn(e.target.value)} 
            placeholder="F004"
            style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 3, color: '#666' }}>SA</label>
          <input 
            value={sa} 
            onChange={e => setSa(e.target.value)} 
            placeholder="00"
            style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 3, color: '#666' }}>Priority</label>
          <input 
            value={priority} 
            onChange={e => setPriority(e.target.value)} 
            placeholder="3"
            style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={applyFilters} className="btn btn-primary">Apply</button>
          <button onClick={clearFilters} className="btn btn-outline">Clear</button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
