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
    <div className="card">
      <div className="card-header">
        <span>Search</span>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            placeholder="PGN, SPN, ECU..."
            style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12 }}
          />
          <button onClick={handleSearch} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Search</button>
          {showResults && (
            <button onClick={() => setShowResults(false)} className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>
              Clear
            </button>
          )}
        </div>
        
        {showResults && (
          <div style={{ fontSize: 12 }}>
            <strong>{searchResults.length}</strong> results
            {searchResults.length > 0 && (
              <div style={{ maxHeight: 150, overflowY: 'auto', marginTop: 6, borderTop: '1px solid #e5e7eb', paddingTop: 6 }}>
                {searchResults.slice(0, 5).map((msg, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: 6, 
                      background: '#f9fafb', 
                      marginBottom: 4,
                      borderRadius: 3,
                      fontSize: 11,
                      borderLeft: '2px solid #2563eb'
                    }}
                  >
                    <div><strong>{msg.pgn}</strong> {msg.parameters.name || '-'}</div>
                    <div style={{ color: '#6b7280' }}>{msg.sa} @ {new Date(msg.timestamp * 1000).toLocaleTimeString()}</div>
                  </div>
                ))}
                {searchResults.length > 5 && (
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, textAlign: 'center' }}>
                    +{searchResults.length - 5} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
