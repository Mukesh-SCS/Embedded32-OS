/**
 * Warning suppression module - must be imported first
 * Suppresses non-critical warnings from dependencies on Windows
 */

if (process.platform === 'win32') {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const msg = args[0];
    if (typeof msg === 'string' && msg.includes('epoll is built for Linux')) {
      return; // Suppress this specific warning - epoll is a Linux-only dependency
    }
    originalWarn.apply(console, args);
  };
}

export {};
