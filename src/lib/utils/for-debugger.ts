/**
 * Debugger específico para problemas con el componente ForComponent
 */

export class ForDebugger {
  private static instance: ForDebugger;
  private debugMode: boolean = false;

  private constructor() {}

  static getInstance(): ForDebugger {
    if (!ForDebugger.instance) {
      ForDebugger.instance = new ForDebugger();
    }
    return ForDebugger.instance;
  }

  /**
   * Enable debug mode
   */
  enable() {
    this.debugMode = true;
    console.log('🔍 ForComponent Debugger enabled');
  }

  /**
   * Disable debug mode
   */
  disable() {
    this.debugMode = false;
    console.log('🔍 ForComponent Debugger disabled');
  }

  /**
   * Log for component state (simplified)
   */
  logForState(forComponent: any) {
    if (!this.debugMode) return;

    console.log('🔄 ForComponent:', {
      each: forComponent.eachValue,
      as: forComponent.asValue,
      scopes: forComponent.renderedScopes?.length || 0,
      initialized: forComponent.hasInitialized,
    });
  }

  /**
   * Log scope state (simplified)
   */
  logScopeState(scope: any) {
    if (!this.debugMode) return;

    console.log('📦 Scope:', {
      forGenerated: scope.hasAttribute('data-for-generated'),
      signals: Object.keys(scope.context || {}).length,
      hasParser: !!scope.parser,
    });
  }

  /**
   * Log array value changes (simplified)
   */
  logArrayChange(oldValue: any[], newValue: any[]) {
    if (!this.debugMode) return;

    const oldLength = oldValue?.length || 0;
    const newLength = newValue?.length || 0;

    if (oldLength !== newLength) {
      console.log(`📊 Array changed: ${oldLength} → ${newLength} items`);
    }
  }

  /**
   * Log render cycle (simplified)
   */
  logRenderCycle(forComponent: any, arrayValue: any[]) {
    if (!this.debugMode) return;

    console.log(`🎨 Rendering ${arrayValue?.length || 0} items`);
  }

  /**
   * Log scope creation (simplified)
   */
  logScopeCreation(scope: any, item: any, index: number) {
    if (!this.debugMode) return;

    console.log(`🏗️ Created scope #${index} for:`, item);
  }

  /**
   * Log scope cleanup (simplified)
   */
  logScopeCleanup(scopes: any[]) {
    if (!this.debugMode) return;

    if (scopes.length > 0) {
      console.log(`🧹 Cleaning up ${scopes.length} scopes`);
    }
  }

  /**
   * Check for common issues (simplified)
   */
  checkForIssues(forComponent: any) {
    if (!this.debugMode) return;

    const issues: string[] = [];

    if (!forComponent.template) issues.push('No template');
    if (!forComponent.eachValue) issues.push('No each value');
    if (!forComponent.asValue) issues.push('No as value');
    if (forComponent.renderedScopes?.length === 0)
      issues.push('No scopes rendered');

    if (issues.length > 0) {
      console.warn('⚠️ ForComponent issues:', issues.join(', '));
    } else {
      console.log('✅ ForComponent OK');
    }
  }

  /**
   * Monitor signal subscriptions (simplified)
   */
  monitorSignalSubscriptions(scope: any) {
    if (!this.debugMode) return;

    const signalCount = Object.keys(scope.context || {}).length;
    if (signalCount > 0) {
      console.log(`📡 Scope has ${signalCount} signals`);
    }
  }

  /**
   * Quick status check
   */
  quickStatus() {
    if (!this.debugMode) return;

    const forComponents = document.querySelectorAll('r-for');
    const scopes = document.querySelectorAll('r-scope[data-for-generated]');

    console.log('📊 Quick Status:', {
      forComponents: forComponents.length,
      forGeneratedScopes: scopes.length,
    });
  }
}

// Export singleton instance
export const forDebugger = ForDebugger.getInstance();

// Add to global scope for debugging
if (typeof window !== 'undefined') {
  (window as any).forDebugger = forDebugger;
}
