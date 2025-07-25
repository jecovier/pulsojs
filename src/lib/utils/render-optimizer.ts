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

  private performanceThreshold = 16; // 60fps threshold

  private constructor() {}

  static getInstance(): RenderOptimizer {
    if (!RenderOptimizer.instance) {
      RenderOptimizer.instance = new RenderOptimizer();
    }
    return RenderOptimizer.instance;
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
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    this.renderStats.clear();
  }
}

// Export singleton instance
export const renderOptimizer = RenderOptimizer.getInstance();
