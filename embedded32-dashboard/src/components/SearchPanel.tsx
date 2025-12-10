import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboardState';

const SearchPanel: React.FC = () => {
  const { state } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (!searchTerm) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = state.messages.filter(msg => {
      // Search by PGN
      if (msg.pgn.toLowerCase().includes(term)) return true;
      
      // Search by SA
      if (msg.sa.toLowerCase().includes(term)) return true;
      
      // Search by name
      if (msg.parameters.name?.toLowerCase().includes(term)) return true;
      
      // Search by SPN names
      if (msg.parameters.spnValues) {
        const spnStr = JSON.stringify(msg.parameters.spnValues).toLowerCase();
        if (spnStr.includes(term)) return true;
      }
      
      return false;
    });

    setSearchResults(results);
    setShowResults(true);
  };

  return (
    <div className="filter-panel">
      <h2 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Search PGN/SPN/ECU</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search PGN, SPN, ECU name..."
          style={{ flex: 1, minWidth: 200 }}
        />
        <button onClick={handleSearch}>Search</button>
        {showResults && (
          <button onClick={() => setShowResults(false)} style={{ background: '#757575' }}>
            Clear
          </button>
        )}
      </div>
      
      {showResults && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <strong>Results:</strong> {searchResults.length} messages found
          {searchResults.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 8 }}>
              {searchResults.slice(0, 10).map((msg, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: 8, 
                    background: '#f5f5f5', 
                    marginBottom: 4,
                    borderRadius: 4,
                    fontSize: 12
                  }}
                >
                  <div><strong>PGN:</strong> {msg.pgn} | <strong>Name:</strong> {msg.parameters.name || '-'}</div>
                  <div><strong>SA:</strong> {msg.sa} | <strong>Time:</strong> {new Date(msg.timestamp * 1000).toLocaleTimeString()}</div>
                </div>
              ))}
              {searchResults.length > 10 && (
                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                  ... and {searchResults.length - 10} more results
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
