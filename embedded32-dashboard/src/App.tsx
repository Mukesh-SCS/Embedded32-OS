import React from 'react';
import ConnectionManager from './components/ConnectionManager';
import FilterPanel from './components/FilterPanel';
import SearchPanel from './components/SearchPanel';
import BusLoadIndicator from './components/BusLoadIndicator';
import PGNTable from './components/PGNTable';
import EngineChart from './components/EngineChart';
import DM1Viewer from './components/DM1Viewer';
import CANFrameList from './components/CANFrameList';
import ECUSimulatorControls from './components/ECUSimulatorControls';
import { DashboardProvider } from './hooks/useDashboardState';
import './styles/global.css';
import './styles/App.css';

const App: React.FC = () => (
  <DashboardProvider>
    <div className="app-container">
      <div className="header-row">
        <ConnectionManager />
        <div style={{ display: 'flex', gap: 16, flex: 1 }}>
          <FilterPanel />
          <SearchPanel />
        </div>
      </div>
      
      <div className="section" style={{ gridColumn: 'span 2' }}>
        <BusLoadIndicator />
      </div>
      
      <div className="section">
        <PGNTable />
      </div>
      
      <div className="section">
        <EngineChart />
      </div>
      
      <div className="section" style={{ gridColumn: 'span 2' }}>
        <ECUSimulatorControls />
      </div>
      
      <div className="section" style={{ gridColumn: 'span 2' }}>
        <DM1Viewer />
      </div>
      
      <div className="section" style={{ gridColumn: 'span 2' }}>
        <CANFrameList />
      </div>
    </div>
  </DashboardProvider>
);

export default App;
