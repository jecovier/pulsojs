/**
 * Development Tools for WComp
 * Provides debugging and monitoring capabilities
 */

import { memoryMonitor } from './memory-monitor';

export class DevTools {
  private static instance: DevTools;
  private isEnabled: boolean = false;

  private constructor() {
    this.setupGlobalCommands();
  }

  static getInstance(): DevTools {
    if (!DevTools.instance) {
      DevTools.instance = new DevTools();
    }
    return DevTools.instance;
  }

  /**
   * Enable development tools
   */
  enable() {
    this.isEnabled = true;
    console.log('🔧 WComp DevTools enabled');
    this.logMemoryStats();
  }

  /**
   * Disable development tools
   */
  disable() {
    this.isEnabled = false;
    console.log('🔧 WComp DevTools disabled');
  }

  /**
   * Show component tree in console
   */
  showComponentTree() {
    const components = document.querySelectorAll('[class*="r-"]');
    const componentData = Array.from(components).map(comp => ({
      tagName: comp.tagName,
      attributes: Array.from(comp.attributes).map(
        attr => `${attr.name}="${attr.value}"`
      ),
      dependencies: (comp as any).dependencies?.size || 0,
      observers: (comp as any).observers?.size || 0,
      eventListeners: (comp as any).eventListeners?.size || 0,
    }));

    console.group('🌳 WComp Component Tree');
    console.table(componentData);
    console.log(`Total components: ${components.length}`);
    console.groupEnd();
  }

  /**
   * Show signal graph
   */
  showSignalGraph() {
    const scopes = document.querySelectorAll('r-scope');
    const signalData: any[] = [];

    scopes.forEach((scope, index) => {
      const signals = (scope as any).getSignals?.() || {};
      Object.entries(signals).forEach(([name, signal]: [string, any]) => {
        signalData.push({
          scope: index,
          signal: name,
          value: signal.value,
          subscribers: signal._subscribers?.size || 0,
        });
      });
    });

    console.group('📊 WComp Signal Graph');
    console.table(signalData);
    console.groupEnd();
  }

  /**
   * Log memory statistics
   */
  logMemoryStats() {
    memoryMonitor.logMemoryStats();
  }

  /**
   * Check for memory leaks
   */
  checkMemoryLeaks() {
    memoryMonitor.logMemoryLeakCheck();
  }

  /**
   * Reset all memory counters
   */
  resetMemoryCounters() {
    memoryMonitor.reset();
    console.log('🔄 Memory counters reset');
  }

  /**
   * Show all available commands
   */
  showHelp() {
    console.group('❓ WComp DevTools Help');
    console.log('Available commands:');
    console.log('  wcomp.showComponentTree() - Show component tree');
    console.log('  wcomp.showSignalGraph() - Show signal dependencies');
    console.log('  wcomp.logMemoryStats() - Show memory statistics');
    console.log('  wcomp.checkMemoryLeaks() - Check for memory leaks');
    console.log('  wcomp.resetMemoryCounters() - Reset memory counters');
    console.log('  wcomp.enable() - Enable dev tools');
    console.log('  wcomp.disable() - Disable dev tools');
    console.log('  wcomp.showHelp() - Show this help');
    console.groupEnd();
  }

  /**
   * Setup global commands for easy access
   */
  private setupGlobalCommands() {
    if (typeof window !== 'undefined') {
      (window as any).wcomp = {
        showComponentTree: () => this.showComponentTree(),
        showSignalGraph: () => this.showSignalGraph(),
        logMemoryStats: () => this.logMemoryStats(),
        checkMemoryLeaks: () => this.checkMemoryLeaks(),
        resetMemoryCounters: () => this.resetMemoryCounters(),
        enable: () => this.enable(),
        disable: () => this.disable(),
        showHelp: () => this.showHelp(),
      };
    }
  }

  /**
   * Auto-enable in development mode
   */
  autoEnable() {
    if (
      typeof window !== 'undefined' &&
      window.location.hostname === 'localhost'
    ) {
      this.enable();
    }
  }
}

// Export singleton instance
export const devTools = DevTools.getInstance();

// Auto-enable in development
if (typeof window !== 'undefined') {
  devTools.autoEnable();
}
