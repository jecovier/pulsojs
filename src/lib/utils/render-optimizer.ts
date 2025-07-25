/**
 * Render Optimizer - Utility class for monitoring and optimizing re-renders
 */
export class RenderOptimizer {
  private static instance: RenderOptimizer;
  private renderStats = new Map<
    string,
    {
      totalRenders: number;
      skippedRenders: number;
      lastRenderTime: number;
      averageRenderTime: number;
      dependencies: Set<string>;
    }
  >();

  private isDebugMode = false;
  private performanceThreshold = 16; // 60fps threshold

  private constructor() {}

  static getInstance(): RenderOptimizer {
    if (!RenderOptimizer.instance) {
      RenderOptimizer.instance = new RenderOptimizer();
    }
    return RenderOptimizer.instance;
  }

  /**
   * Enable debug mode for detailed logging
   */
  enableDebugMode(): void {
    this.isDebugMode = true;
    console.log('🔍 Render Optimizer: Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.isDebugMode = false;
    console.log('🔍 Render Optimizer: Debug mode disabled');
  }

  /**
   * Track a render attempt for a component
   * @param componentName - Name of the component
   * @param dependencies - Dependencies that triggered the render
   * @param shouldRender - Whether the render was actually executed
   * @param renderTime - Time taken for the render (if executed)
   */
  trackRender(
    componentName: string,
    dependencies: string[],
    shouldRender: boolean,
    renderTime?: number
  ): void {
    if (!this.renderStats.has(componentName)) {
      this.renderStats.set(componentName, {
        totalRenders: 0,
        skippedRenders: 0,
        lastRenderTime: 0,
        averageRenderTime: 0,
        dependencies: new Set(),
      });
    }

    const stats = this.renderStats.get(componentName)!;
    stats.totalRenders++;

    // Track dependencies
    dependencies.forEach(dep => stats.dependencies.add(dep));

    if (shouldRender) {
      if (renderTime !== undefined) {
        stats.lastRenderTime = renderTime;
        // Update average render time
        const totalTime =
          stats.averageRenderTime *
            (stats.totalRenders - stats.skippedRenders - 1) +
          renderTime;
        const renderCount = stats.totalRenders - stats.skippedRenders;
        stats.averageRenderTime =
          renderCount > 0 ? totalTime / renderCount : renderTime;
      }
    } else {
      stats.skippedRenders++;
    }

    if (this.isDebugMode) {
      this.logRenderInfo(componentName, dependencies, shouldRender, renderTime);
    }
  }

  /**
   * Log render information in debug mode
   */
  private logRenderInfo(
    componentName: string,
    dependencies: string[],
    shouldRender: boolean,
    renderTime?: number
  ): void {
    const status = shouldRender ? '✅ RENDERED' : '⏭️ SKIPPED';
    const timeInfo =
      renderTime !== undefined ? ` (${renderTime.toFixed(2)}ms)` : '';

    console.log(
      `🔍 ${status} ${componentName}${timeInfo}`,
      dependencies.length > 0 ? `[${dependencies.join(', ')}]` : '[no deps]'
    );
  }

  /**
   * Get render statistics for a specific component
   * @param componentName - Name of the component
   * @returns Render statistics or null if not found
   */
  getComponentStats(componentName: string) {
    return this.renderStats.get(componentName) || null;
  }

  /**
   * Get all render statistics
   * @returns Map of all component render statistics
   */
  getAllStats(): Map<string, any> {
    return new Map(this.renderStats);
  }

  /**
   * Get performance summary
   * @returns Summary of render performance
   */
  getPerformanceSummary(): {
    totalComponents: number;
    totalRenders: number;
    totalSkipped: number;
    averageRenderTime: number;
    performanceIssues: string[];
  } {
    let totalRenders = 0;
    let totalSkipped = 0;
    let totalRenderTime = 0;
    let renderCount = 0;
    const performanceIssues: string[] = [];

    this.renderStats.forEach((stats, componentName) => {
      totalRenders += stats.totalRenders;
      totalSkipped += stats.skippedRenders;
      totalRenderTime +=
        stats.averageRenderTime * (stats.totalRenders - stats.skippedRenders);
      renderCount += stats.totalRenders - stats.skippedRenders;

      // Check for performance issues
      if (stats.averageRenderTime > this.performanceThreshold) {
        performanceIssues.push(
          `${componentName}: Average render time ${stats.averageRenderTime.toFixed(
            2
          )}ms exceeds threshold`
        );
      }

      const skipRate =
        stats.totalRenders > 0
          ? (stats.skippedRenders / stats.totalRenders) * 100
          : 0;
      if (skipRate < 20) {
        performanceIssues.push(
          `${componentName}: Low skip rate (${skipRate.toFixed(
            1
          )}%), consider optimizing dependencies`
        );
      }
    });

    return {
      totalComponents: this.renderStats.size,
      totalRenders,
      totalSkipped,
      averageRenderTime: renderCount > 0 ? totalRenderTime / renderCount : 0,
      performanceIssues,
    };
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    this.renderStats.clear();
    if (this.isDebugMode) {
      console.log('🔍 Render Optimizer: Statistics reset');
    }
  }

  /**
   * Export statistics as JSON
   * @returns JSON string of all statistics
   */
  exportStats(): string {
    const exportData: Record<string, any> = {};

    this.renderStats.forEach((stats, componentName) => {
      exportData[componentName] = {
        ...stats,
        dependencies: Array.from(stats.dependencies),
        skipRate:
          stats.totalRenders > 0
            ? (stats.skippedRenders / stats.totalRenders) * 100
            : 0,
      };
    });

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Set performance threshold for warnings
   * @param threshold - Threshold in milliseconds
   */
  setPerformanceThreshold(threshold: number): void {
    this.performanceThreshold = threshold;
    if (this.isDebugMode) {
      console.log(
        `🔍 Render Optimizer: Performance threshold set to ${threshold}ms`
      );
    }
  }

  /**
   * Get components with the most renders
   * @param limit - Number of components to return
   * @returns Array of component names sorted by render count
   */
  getTopRenderers(
    limit: number = 10
  ): Array<{ name: string; renders: number }> {
    return Array.from(this.renderStats.entries())
      .map(([name, stats]) => ({ name, renders: stats.totalRenders }))
      .sort((a, b) => b.renders - a.renders)
      .slice(0, limit);
  }

  /**
   * Get components with the lowest skip rates
   * @param limit - Number of components to return
   * @returns Array of component names sorted by skip rate (ascending)
   */
  getLowestSkipRates(
    limit: number = 10
  ): Array<{ name: string; skipRate: number }> {
    return Array.from(this.renderStats.entries())
      .map(([name, stats]) => ({
        name,
        skipRate:
          stats.totalRenders > 0
            ? (stats.skippedRenders / stats.totalRenders) * 100
            : 0,
      }))
      .sort((a, b) => a.skipRate - b.skipRate)
      .slice(0, limit);
  }
}

// Export singleton instance
export const renderOptimizer = RenderOptimizer.getInstance();
