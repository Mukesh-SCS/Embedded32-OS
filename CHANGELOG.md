# Changelog

All notable changes to the Embedded32 platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-12-10 - Dashboard & UI Phase Complete

### Added (Phase 3 - Web Dashboard & Real-Time Monitoring UI)

#### @embedded32/dashboard - Complete Web UI Package:
- **Professional React + Vite Web Dashboard**
  - Modern TypeScript + React 18 development
  - Vite build system with hot module replacement
  - Responsive CSS Grid layout with professional styling
  - Real-time WebSocket client (`src/services/ws.ts`)
  
#### Dashboard Components:
- **PGNTable.tsx** - Live J1939 message table
  - Color-coded message rows by PGN type (EEC1→Blue, ETC1→Orange, Fuel→Green, DM1→Red)
  - Formatted SPN values with proper units (RPM, °C, L/h, etc.)
  - Auto-scroll toggle with manual lock mode
  - Sticky table headers for better UX
  - Real-time filtering and search
  - Timestamp formatting (HH:MM:SS format)

- **EngineChart.tsx** - Real-time telemetry visualization
  - Smooth line charts using Recharts with "natural" interpolation
  - Engine Speed (RPM) and Coolant Temperature tracking
  - Throttled updates to 10fps for smooth performance
  - Responsive container sizing
  - Disabled animations for optimal rendering
  - Auto-scaling data window (last 50 points)

- **DM1Viewer.tsx** - Diagnostic fault code display
  - FMI-based severity color coding (Green=0, Orange=1, Red=2+)
  - SPN/FMI/Description/Count columns
  - Severity badges with labels
  - Color-bordered rows for instant identification
  - No active faults message

- **ConnectionManager.tsx** - WebSocket connection control
  - Connect/Disconnect buttons with state management
  - Configurable WebSocket URL input
  - Animated connection status indicator (green pulse / red)
  - LocalStorage persistence for URL
  - Disabled state handling

- **FilterPanel.tsx** - Advanced message filtering
  - Hex-based PGN filtering (e.g., F004)
  - Hex-based SA (Source Address) filtering
  - Decimal Priority filtering
  - Apply and Clear buttons
  - Input validation and parsing

- **SearchPanel.tsx** - Full-text PGN/SPN/ECU search
  - Real-time search across PGN numbers, SA addresses, ECU names
  - SPN value field search capability
  - Top 10 results display with expandable list
  - Result count indicator
  - Message metadata in search results (PGN, Name, SA, Timestamp)

- **BusLoadIndicator.tsx** - CAN bus performance monitoring
  - Real-time frames-per-second counter
  - Bus load percentage calculation (500kbps CAN baseline)
  - Color-coded load indicator bar (Green <50%, Orange 50-80%, Red >80%)
  - Updates every second
  - Estimated throughput visualization

- **CANFrameList.tsx** - Raw CAN frame debugging
  - Show/Hide toggle for performance
  - Monospace font for data bytes
  - Formatted CAN IDs (0x format)
  - Hex-formatted data bytes with spaces
  - Millisecond precision timestamps
  - Limited to 100 frames for performance

- **ECUSimulatorControls.tsx** - Interactive simulator control panel
  - Start/Stop Engine buttons with state management
  - Current RPM display and +/-100 adjustment buttons
  - DM1 Fault injection/clear toggle
  - Visual status indicators (🟢 Running / 🔴 Stopped)
  - Disabled state handling
  - Ready for WebSocket command integration

#### Dashboard Infrastructure:
- **useDashboardState.tsx** - Global React Context state management
  - Connection state tracking
  - Message and CAN frame storage
  - Filter configuration
  - Reducer-based state updates
  - Type-safe TypeScript interfaces

- **App.tsx** - Main dashboard layout
  - CSS Grid-based responsive layout
  - Header row with connection and search controls
  - Multi-section layout with proper spacing
  - All components integrated and wired

#### Styling & Theming:
- **App.css** - Professional dashboard styling
  - CSS Grid layout system (2-column responsive)
  - Card-based section styling with shadows
  - PGN color-coding with visual borders
  - Button and input field styling
  - Status indicator animations (pulse effect)
  - Responsive design for mobile/tablet
  - Hover effects and transitions
  - Typography and spacing standards

- **global.css** - Global styles and resets
  - Font stack with system fonts
  - Proper box-sizing and reset styles
  - Utility classes for common patterns

#### WebSocket Bridge (@embedded32/tools):
- **DashboardBridgeCommand.ts** - WebSocket server command
  - HTTP server with WebSocket support (`ws` library)
  - Mock J1939 data generation for testing
  - Real-time message forwarding capability
  - Configurable port (default 9000) and CAN interface
  - Dashboard client connection handling
  - Ready for runtime integration

- **CLI Integration** - Added dashboard command routing
  - `embedded32 dashboard bridge --port 9000 --iface vcan0`
  - Proper command argument parsing
  - Help text in CLI

#### Documentation:
- **DASHBOARD_README.md** - Comprehensive dashboard guide
  - Architecture overview with diagrams
  - Installation and setup instructions
  - Step-by-step running guide
  - Feature descriptions and screenshots
  - WebSocket message format specification
  - Development guide with project structure
  - Troubleshooting section
  - Future enhancements roadmap

- **DASHBOARD_QUICKSTART.md** - 5-minute setup guide
  - Quick start instructions for new users
  - Real-time data testing procedures
  - Architecture overview
  - Troubleshooting quick reference

- **DASHBOARD_IMPROVEMENTS.md** - Detailed improvement documentation
  - All 7 core improvements with before/after
  - 4 bonus features (Bus Load, Search, Simulator, Severity Colors)
  - Technical improvements and optimizations
  - Performance considerations
  - Comparison of before/after states

### Changed
- Updated main CHANGELOG with Phase 3 completion
- Enhanced monorepo documentation with dashboard guides

### Technical Improvements
- **Performance Optimizations:**
  - Throttled chart updates to 10fps maximum
  - Limited data point retention (last 50 for charts)
  - Conditional rendering (CAN frames hidden by default)
  - No animations for better responsiveness
  - Efficient message filtering with proper React hooks

- **Code Quality:**
  - TypeScript strict mode throughout
  - React hooks best practices (useState, useEffect, useContext, useReducer)
  - Proper component separation and reusability
  - Clean CSS architecture with utility classes
  - LocalStorage persistence patterns

- **User Experience:**
  - Professional CANalyzer-inspired design
  - Color-coded information for quick scanning
  - Real-time status indicators
  - Responsive design for all screen sizes
  - Keyboard support (Enter to search/filter)
  - Visual feedback for all interactions
  - No console errors or warnings

### Known Limitations
- Mock data sent from bridge (real CAN/J1939 integration in progress)
- ECU simulator controls ready for WebSocket integration
- Search limited to top 10 results (expandable in future)
- Bus load calculation assumes 500kbps CAN bus

### Next Steps
- Integrate real CAN/J1939 runtime with bridge
- Implement bidirectional WebSocket for ECU control
- Add session save/load functionality
- Add CSV/JSON data export
- Add DBC file import for custom PGN definitions
- Implement alert/notification system

---

## [0.2.0] - 2025-12-10 - Phase 2 Complete

### Added (Phase 2 - Transport Protocol & Diagnostics)

#### @embedded32/j1939 Enhancements:
- **Full Transport Protocol (TP) Implementation** (`src/tp/TransportProtocol.ts` - 353 lines)
  - BAM (Broadcast Announce Message) session management with multi-packet reassembly
  - RTS/CTS (Request-to-Send/Clear-to-Send) point-to-point flow control
  - Message parsing functions: `parseBAM()`, `parseCTS()`, `parseRTS()`, `parseEndOfMessage()`
  - Automatic session timeout cleanup with configurable thresholds
  - State machine support for RTS/CTS (waiting_cts → transferring → complete)
  - Support for up to 255 packets per message with auto-truncation
  - TP PGN constants: `PGN_TP_BAM`, `PGN_TP_CT`, `PGN_TP_CM`

- **Complete Diagnostics Manager** (`src/dm/DM1.ts` - 406 lines)
  - DM1 message processing (active diagnostic trouble codes)
  - DM2 message processing (previously active DTCs)
  - Lamp status extraction (MIL, Flash, Amber, Protect flags)
  - DTC parsing with SPN (Suspect Parameter Number) and FMI (Failure Mode Indicator) extraction
  - SPN lookup table with 15+ automotive parameters (Engine Speed, Coolant Temp, Fuel Rate, DEF Tank, etc.)
  - FMI meanings table with 21 failure mode descriptions
  - Per-device DTC tracking and summary generation
  - DTC formatting and human-readable descriptions
  - Query APIs: `getActiveDTCs()`, `getSummary()`, `processDM1()`, `processDM2()`

#### @embedded32/tools J1939 Monitoring Commands:
- **j1939-monitor.ts** (135 lines) - Real-time network monitoring
  - Live message rate (messages/sec) calculation
  - Active PGN and device address tracking
  - Configurable CAN interface, PGN filtering, duration control
  - JSON and pretty-print output formats
  - Graceful shutdown with SIGINT handling

- **j1939-decode.ts** (101 lines) - Message decoder command
  - Real-time J1939 message decoding
  - PGN name lookup and friendly formatting
  - Optional raw hex data display
  - Message counter and stop-on-limit functionality

- **j1939-send.ts** (128 lines) - J1939 message transmission
  - J1939 ID calculation from components
  - Hex payload parsing with validation
  - Configurable source/destination addresses and priority
  - Repeated transmission with interval control
  - Comprehensive input validation and error reporting

#### Examples and Documentation:
- **examples/j1939-basic.ts** (130 lines) - Basic J1939 operations
  - ID parsing and construction demonstration
  - PGN database lookup
  - Message decoding workflow
  - Mock CAN frame exchange

- **examples/j1939-diagnostics.ts** (145 lines) - Diagnostics processing
  - DM1/DM2 message handling
  - Lamp status and DTC extraction
  - Multi-device diagnostic tracking
  - Summary generation and reporting

- **examples/j1939-multipacket.ts** (175 lines) - Multi-packet messaging
  - BAM session creation and packet assembly
  - RTS/CTS flow control demonstration
  - Message parsing and reconstruction
  - Session lifecycle management

#### Comprehensive Test Suite (174+ tests, 650+ lines):
- **embedded32-j1939/tests/j1939-tp.test.ts** (59 test cases)
  - BAM session creation, packet addition, assembly completion
  - RTS/CTS flow control and state transitions
  - Message parsing (BAM, CTS, RTS, EndOfMessage)
  - Session timeout and cleanup operations
  - Edge cases: single-packet, max-packet, zero-length messages

- **embedded32-j1939/tests/j1939-dm.test.ts** (45+ test cases)
  - DM1/DM2 message processing and validation
  - DTC extraction and SPN/FMI parsing
  - Lamp status decoding with all bit combinations
  - DTC query and filtering operations
  - Diagnostic summary generation
  - Multiple device tracking and updates

- **embedded32-j1939/tests/j1939-gateway.test.ts** (40+ test cases)
  - CAN→J1939 message decoding
  - J1939→CAN message encoding
  - Two-way bridge functionality
  - Extended and standard CAN frame handling
  - Message filtering and ordering
  - Error handling and recovery

- **embedded32-j1939/tests/j1939-integration.test.ts** (30+ test cases)
  - Complete message workflows and workflows
  - Multi-device scenarios
  - SAE J1939 protocol compliance (PDU1/PDU2)
  - Error recovery mechanisms
  - Performance scenarios (1000+ msg/sec)
  - Large diagnostic database handling

#### Documentation:
- **J1939_QUICKSTART.md** - User guide with CLI references and code examples
- **J1939_ARCHITECTURE.md** - System design, data flows, state machines, performance metrics

#### Module Exports Updates:
- Updated `embedded32-j1939/src/index.ts` with new exports:
  - `J1939TransportProtocol`, `parseBAM`, `parseCTS`, `parseRTS`, `parseEndOfMessage`
  - `PGN_TP_BAM`, `PGN_TP_CT`, `PGN_TP_CM`
  - `DiagnosticsManager`, `PGN_DM1`, `PGN_DM2`
  - `DM1Message`, `DM2Message`, `DiagnosticTroubleCode`, `LampStatus`

### Changed
- Refactored `src/tp/TransportProtocol.ts` from skeleton to complete implementation (353 lines)
- Refactored `src/dm/DM1.ts` from skeleton to complete implementation (406 lines)
- Enhanced module exports for better API surface

### Security
- Input validation for J1939 messages (PGN range, data length checks)
- CAN frame validation in gateway binding
- Safe DTC parsing with bounds checking

## [0.1.0] - Initial Release (Phase 1)

### Added
- Initial project structure
- Core runtime skeleton (embedded32-core)
- CAN abstraction layer skeleton (embedded32-can)
- J1939 protocol stack skeleton (embedded32-j1939)
- Ethernet layer skeleton (embedded32-ethernet)
- Bridge component skeleton (embedded32-bridge)
- CLI tools skeleton (embedded32-tools)
- Dashboard skeleton (embedded32-dashboard)
- JavaScript SDK skeleton (embedded32-sdk-js)
- Python SDK skeleton (embedded32-sdk-python)
- C SDK skeleton (embedded32-sdk-c)
- Documentation structure
- Examples directory
- README files for all components
- Contributing guidelines
- Development roadmap
- **Comprehensive test suite for embedded32-core**:
  - 84 tests across 6 test suites (100% pass rate)
  - Logger tests: 11 tests covering log levels, history, and context support
  - MessageBus tests: 7 tests for pub/sub functionality
  - Scheduler tests: 11 tests for task scheduling and execution
  - ModuleRegistry tests: 8 tests for module lifecycle management
  - ConfigLoader tests: 23 tests for configuration file handling
  - Runtime tests: 24 tests for runtime orchestration and module integration
  - Jest and ts-jest configuration for TypeScript test support

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

## [0.2.0] - 2025-12-09

### Added
- **embedded32-core** full implementation:
  - Runtime class with module lifecycle management
  - Logger with log levels (debug, info, warn, error) and history tracking
  - MessageBus with publish/subscribe event system for inter-module communication
  - Scheduler for priority-based task management
  - ModuleRegistry for module registration and lifecycle control
  - ConfigLoader for JSON configuration file management with get/set utilities
  - Comprehensive TypeScript type definitions (Module, MessageHandler, Task, LogEntry, etc.)
  - Basic runtime example demonstrating motor and sensor modules with pub/sub messaging
- Monorepo workspace configuration with proper package dependencies
- .gitignore updates to exclude build artifacts, node_modules, and dist directories
- TypeScript compilation support with tsconfig configuration

### Changed
- Updated package.json to use @embedded32/core naming convention
- Fixed monorepo package.json dependencies to use workspace references
- Refactored module lifecycle methods for consistency

### Fixed
- Resolved TypeScript compilation errors
- Fixed import paths for proper ES module support
- Corrected package naming for npm compatibility

## [0.1.0] - 2025-12-09

### Added
- Initial project setup
- Platform architecture defined
- Module structure created

---

**Legend:**
- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security fixes
