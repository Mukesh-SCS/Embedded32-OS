# Changelog

All notable changes to the Embedded32 platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
