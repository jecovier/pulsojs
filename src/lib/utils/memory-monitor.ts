/**
 * Memory Monitor for WComp components
 * Helps detect memory leaks and provides debugging information
 */

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private componentCounts: Map<string, number> = new Map();
  private signalCounts: Map<string, number> = new Map();
  private eventListenerCounts: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * Track component creation
   */
  trackComponent(componentName: string) {
    const currentCount = this.componentCounts.get(componentName) || 0;
    this.componentCounts.set(componentName, currentCount + 1);
  }

  /**
   * Track component destruction
   */
  untrackComponent(componentName: string) {
    const currentCount = this.componentCounts.get(componentName) || 0;
    this.componentCounts.set(componentName, Math.max(0, currentCount - 1));
  }

  /**
   * Track signal creation
   */
  trackSignal(signalName: string) {
    const currentCount = this.signalCounts.get(signalName) || 0;
    this.signalCounts.set(signalName, currentCount + 1);
  }

  /**
   * Track signal destruction
   */
  untrackSignal(signalName: string) {
    const currentCount = this.signalCounts.get(signalName) || 0;
    this.signalCounts.set(signalName, Math.max(0, currentCount - 1));
  }

  /**
   * Track event listener creation
   */
  trackEventListener(elementTag: string) {
    const currentCount = this.eventListenerCounts.get(elementTag) || 0;
    this.eventListenerCounts.set(elementTag, currentCount + 1);
  }

  /**
   * Track event listener removal
   */
  untrackEventListener(elementTag: string) {
    const currentCount = this.eventListenerCounts.get(elementTag) || 0;
    this.eventListenerCounts.set(elementTag, Math.max(0, currentCount - 1));
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryStats() {
    return {
      components: Object.fromEntries(this.componentCounts),
      signals: Object.fromEntries(this.signalCounts),
      eventListeners: Object.fromEntries(this.eventListenerCounts),
      totalComponents: Array.from(this.componentCounts.values()).reduce(
        (a, b) => a + b,
        0
      ),
      totalSignals: Array.from(this.signalCounts.values()).reduce(
        (a, b) => a + b,
        0
      ),
      totalEventListeners: Array.from(this.eventListenerCounts.values()).reduce(
        (a, b) => a + b,
        0
      ),
    };
  }

  /**
   * Check for potential memory leaks
   */
  checkForMemoryLeaks() {
    const stats = this.getMemoryStats();
    const leaks: string[] = [];

    // Check for components that should be cleaned up
    this.componentCounts.forEach((count, componentName) => {
      if (count > 100) {
        leaks.push(`High component count for ${componentName}: ${count}`);
      }
    });

    // Check for signals that should be cleaned up
    this.signalCounts.forEach((count, signalName) => {
      if (count > 50) {
        leaks.push(`High signal count for ${signalName}: ${count}`);
      }
    });

    // Check for event listeners that should be cleaned up
    this.eventListenerCounts.forEach((count, elementTag) => {
      if (count > 200) {
        leaks.push(`High event listener count for ${elementTag}: ${count}`);
      }
    });

    return {
      hasLeaks: leaks.length > 0,
      leaks,
      stats,
    };
  }

  /**
   * Reset all counters (useful for testing)
   */
  reset() {
    this.componentCounts.clear();
    this.signalCounts.clear();
    this.eventListenerCounts.clear();
  }

  /**
   * Log memory statistics to console
   */
  logMemoryStats() {
    const stats = this.getMemoryStats();
    console.group('🔍 WComp Memory Monitor');
    console.table(stats.components);
    console.table(stats.signals);
    console.table(stats.eventListeners);
    console.log('📊 Totals:', {
      components: stats.totalComponents,
      signals: stats.totalSignals,
      eventListeners: stats.totalEventListeners,
    });
    console.groupEnd();
  }

  /**
   * Log memory leak check results
   */
  logMemoryLeakCheck() {
    const leakCheck = this.checkForMemoryLeaks();
    console.group('🚨 WComp Memory Leak Check');

    if (leakCheck.hasLeaks) {
      console.warn('⚠️ Potential memory leaks detected:');
      leakCheck.leaks.forEach(leak => console.warn(`  - ${leak}`));
    } else {
      console.log('✅ No memory leaks detected');
    }

    console.table(leakCheck.stats);
    console.groupEnd();
  }
}

// Export singleton instance
export const memoryMonitor = MemoryMonitor.getInstance();

// Add to global scope for debugging
if (typeof window !== 'undefined') {
  (window as any).wcompMemoryMonitor = memoryMonitor;
}
