import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type J1939Message = {
  type: string;
  timestamp: number;
  pgn: string;
  sa: string;
  parameters: Record<string, any>;
};

export type CANFrame = {
  id: number;
  data: number[];
  timestamp: number;
};

export type Filters = {
  pgn?: number;
  sa?: number;
  priority?: number;
};

export type BusStats = {
  framesPerSec: number;
  busLoad: number;
};

export type DM1Fault = {
  spn: number;
  fmi: number;
  description: string;
  count: number;
  occurrence: number;
};

export type DashboardState = {
  connected: boolean;
  messages: J1939Message[];
  canFrames: CANFrame[];
  filters: Filters;
  busStats: BusStats;
  dm1Faults: DM1Fault[];
  isPaused: boolean;
  selectedPGN: J1939Message | null;
  searchQuery: string;
};

const initialState: DashboardState = {
  connected: false,
  messages: [],
  canFrames: [],
  filters: {},
  busStats: { framesPerSec: 0, busLoad: 0 },
  dm1Faults: [],
  isPaused: false,
  selectedPGN: null,
  searchQuery: '',
};

function dashboardReducer(state: DashboardState, action: any): DashboardState {
  console.log('[Reducer] Action:', action.type, action);
  
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.value };
    case 'ADD_J1939_MESSAGE':
      if (state.isPaused) return state;
      return { ...state, messages: [action.message, ...state.messages].slice(0, 1000) };
    case 'ADD_CAN_FRAME':
      if (state.isPaused) return state;
      return { ...state, canFrames: [action.frame, ...state.canFrames].slice(0, 1000) };
    case 'SET_FILTERS':
      return { ...state, filters: action.filters };
    case 'UPDATE_BUS_STATS':
      return { ...state, busStats: action.stats };
    case 'SET_DM1_FAULTS':
      console.log('[Reducer] Setting DM1 faults:', action.faults);
      return { ...state, dm1Faults: action.faults };
    case 'TOGGLE_PAUSE':
      return { ...state, isPaused: !state.isPaused };
    case 'SET_SELECTED_PGN':
      return { ...state, selectedPGN: action.pgn };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], canFrames: [] };
    default:
      return state;
  }
}

const DashboardContext = createContext<{
  state: DashboardState;
  dispatch: React.Dispatch<any>;
} | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
};

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
}
