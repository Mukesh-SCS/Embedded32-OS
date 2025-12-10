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

export type DashboardState = {
  connected: boolean;
  messages: J1939Message[];
  canFrames: CANFrame[];
  filters: Filters;
};

const initialState: DashboardState = {
  connected: false,
  messages: [],
  canFrames: [],
  filters: {},
};

function dashboardReducer(state: DashboardState, action: any): DashboardState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.value };
    case 'ADD_J1939_MESSAGE':
      return { ...state, messages: [action.message, ...state.messages] };
    case 'ADD_CAN_FRAME':
      return { ...state, canFrames: [action.frame, ...state.canFrames] };
    case 'SET_FILTERS':
      return { ...state, filters: action.filters };
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
