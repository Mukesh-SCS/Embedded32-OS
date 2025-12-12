import React, { Suspense, lazy } from 'react';
import ConnectionManager from './components/ConnectionManager';
import FilterPanel from './components/FilterPanel';
import SearchPanel from './components/SearchPanel';
import BusLoadIndicator from './components/BusLoadIndicator';
import PGNTable from './components/PGNTable';
const EngineChart = lazy(() => import('./components/EngineChart'));
import DM1Viewer from './components/DM1Viewer';
import CANFrameList from './components/CANFrameList';
import ECUSimulatorControls from './components/ECUSimulatorControls';
import PGNDetailsPanel from './components/PGNDetailsPanel';
import LogRecorder from './components/LogRecorder';
import ErrorBoundary from './components/ErrorBoundary';
import { DashboardProvider } from './hooks/useDashboardState';
import './styles/global.css';
import './styles/App.css';

const EngineChartFallback: React.FC = () => (
  <div className="card">
    <div className="card-header">
      <span>Engine Telemetry</span>
    </div>
    <div className="card-body" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
      Loading chart...
    </div>
  </div>
);

const App: React.FC = () => (
  <ErrorBoundary>
    <DashboardProvider>
      <div className="dashboard">
        <div className="dashboard-inner">
          <div className="app-container">
            {/* Row 1: Top bar (status & search) */}
            <section className="row row-top">
              <div className="col-top-left">
                <ConnectionManager />
                <BusLoadIndicator />
              </div>
              <div className="col-top-right">
                <FilterPanel />
                <SearchPanel />
              </div>
            </section>

            {/* Recording Controls */}
            <LogRecorder />

            {/* Row 2: Main work area (two columns) */}
            <section className="row row-main">
              <div className="col col-main-left">
                <PGNTable />
              </div>

              <div className="col col-main-right">
                <Suspense fallback={<EngineChartFallback />}>
                  <EngineChart />
                </Suspense>
                <ECUSimulatorControls />
              </div>
            </section>

            {/* Row 3: Diagnostics & logs */}
            <section className="row row-bottom">
              <div className="col col-bottom-left">
                <DM1Viewer />
              </div>
              <div className="col col-bottom-right">
                <CANFrameList />
              </div>
            </section>
          </div>
        </div>

        <PGNDetailsPanel />
      </div>
    </DashboardProvider>
  </ErrorBoundary>
);

export default App;
