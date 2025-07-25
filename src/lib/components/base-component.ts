import { config } from '../config';
import { createSafeContext } from '../utils';
import { ScopeComponent } from './scope';
import { memoryMonitor } from '../utils/memory-monitor';
import { renderOptimizer } from '../utils/render-optimizer';

export class BaseComponent extends HTMLElement {
  protected dependencies: Set<string> = new Set();
  protected observers: Map<string, MutationObserver> = new Map();
  protected eventListeners: Map<HTMLElement, Map<string, Set<EventListener>>> =
    new Map();

  // Re-render optimization: track previous values to avoid unnecessary updates
  private previousValues = new Map<string, unknown>();
  private lastRenderTime = 0;
  private renderDebounceTimeout: number | null = null;

  constructor() {
    super();
    // Track component creation
    memoryMonitor.trackComponent(this.constructor.name);
  }

  protected shouldNotInitialize() {
    const isInsideFor = this.closest(config.components.for);
    const scopeParent = this.closest(config.components.scope);
    const isScopeOutsideFor = isInsideFor
      ? isInsideFor.closest(config.components.scope) !== scopeParent
      : false;

    return isScopeOutsideFor;
  }

  protected getRequiredAttribute(name: string): string {
    const value = this.getAttribute(name) || '';
    if (!value) {
      throw new Error(
        `${this.constructor.name}: '${name}' attribute is required`
      );
    }
    return value as string;
  }

  protected getScopeParent(): ScopeComponent {
    const scopeParent = this.closest(config.components.scope);

    if (!scopeParent) {
      throw new Error(
        `${this.constructor.name}: must be inside a scope component (${config.components.scope})`
      );
    }
    return scopeParent as ScopeComponent;
  }

  protected getSafeContext(): Record<string, unknown> {
    const scopeParent = this.getScopeParent();
    const signals = scopeParent.getSignals();

    return createSafeContext(signals);
  }

  protected extractDependencies(expression: string): string[] {
    // Extract all variable names from the expression
    // This handles simple variables like "name" and complex ones like "items.length"
    const matches = expression.match(/\b\w+\b/g) || [];
    return matches.filter(match => {
      // Filter out JavaScript keywords and built-in properties
      const jsKeywords = [
        'true',
        'false',
        'null',
        'undefined',
        'NaN',
        'Infinity',
      ];
      const jsBuiltins = ['length', 'toString', 'valueOf', 'constructor'];

      const parts = match.split('.');
      const baseVar = parts[0];

      if (baseVar === 'this' || baseVar === 'state') {
        return false;
      }

      // Return false if baseVar is a number
      if (!isNaN(Number(baseVar))) {
        return false;
      }

      return !jsKeywords.includes(baseVar) && !jsBuiltins.includes(baseVar);
    });
  }

  protected subscribeToSignalDependencies(
    expression: string,
    callback: () => void
  ) {
    const variableMatches = this.extractDependencies(expression);
    const scopeParent = this.getScopeParent();
    console.log('subscribeToSignalDependencies', variableMatches);

    try {
      if (variableMatches) {
        variableMatches.forEach(variableName => {
          const signal = scopeParent.getSignal(variableName);
          if (signal) {
            signal.subscribe(callback);
            this.dependencies.add(variableName);
            // Track signal subscription
            memoryMonitor.trackSignal(variableName);
          }
        });
      }
    } catch (error) {
      console.error('Error setting up signal observers:', error);
    }
  }

  protected unsubscribeFromSignalDependencies(callback: () => void) {
    const scopeParent = this.getScopeParent();

    try {
      if (this.dependencies.size > 0) {
        this.dependencies.forEach(variableName => {
          const signal = scopeParent.getSignal(variableName);
          if (signal) {
            signal.unsubscribe(callback);
            // Track signal unsubscription
            memoryMonitor.untrackSignal(variableName);
          }
        });
        this.dependencies.clear();
      }
    } catch (error) {
      console.error('Error unsubscribing from signal dependencies:', error);
    }
  }

  protected setupAttributeObserver(
    attributeName: string,
    callback: () => void
  ) {
    if (this.observers.has(attributeName)) {
      return;
    }

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === attributeName
        ) {
          callback();
        }
      });
    });

    observer.observe(this, {
      attributes: true,
      attributeFilter: [attributeName],
    });

    this.observers.set(attributeName, observer);
  }

  protected disconnectAttributeObservers() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }

  /**
   * Track event listeners for proper cleanup
   */
  protected addTrackedEventListener(
    element: HTMLElement,
    event: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ) {
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, new Map());
    }

    const elementListeners = this.eventListeners.get(element)!;
    if (!elementListeners.has(event)) {
      elementListeners.set(event, new Set());
    }

    elementListeners.get(event)!.add(listener);
    element.addEventListener(event, listener, options);

    // Track event listener creation
    memoryMonitor.trackEventListener(element.tagName);
  }

  /**
   * Remove tracked event listener
   */
  protected removeTrackedEventListener(
    element: HTMLElement,
    event: string,
    listener: EventListener,
    options?: EventListenerOptions
  ) {
    const elementListeners = this.eventListeners.get(element);
    if (elementListeners) {
      const eventListeners = elementListeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
        element.removeEventListener(event, listener, options);

        // Track event listener removal
        memoryMonitor.untrackEventListener(element.tagName);

        if (eventListeners.size === 0) {
          elementListeners.delete(event);
        }

        if (elementListeners.size === 0) {
          this.eventListeners.delete(element);
        }
      }
    }
  }

  /**
   * Cleanup all event listeners tracked by this component
   */
  protected cleanupEventListeners() {
    this.eventListeners.forEach((elementListeners, element) => {
      elementListeners.forEach((eventListeners, event) => {
        eventListeners.forEach(listener => {
          element.removeEventListener(event, listener);
          // Track event listener removal
          memoryMonitor.untrackEventListener(element.tagName);
        });
        eventListeners.clear();
      });
      elementListeners.clear();
    });
    this.eventListeners.clear();
  }

  /**
   * Check if the component should update based on dependency changes
   * @param dependencies - Array of dependency names to check
   * @returns true if any dependency has changed, false otherwise
   */
  protected shouldUpdate(dependencies: string[]): boolean {
    const scopeParent = this.getScopeParent();
    let hasChanged = false;

    dependencies.forEach(dep => {
      const currentValue = this.getDependencyValue(dep, scopeParent);
      const previousValue = this.previousValues.get(dep);

      // Use deep comparison for objects and arrays, reference equality for primitives
      const valueChanged = this.hasValueChanged(currentValue, previousValue);

      if (valueChanged) {
        this.previousValues.set(dep, this.deepClone(currentValue));
        hasChanged = true;
      }
    });

    return hasChanged;
  }

  /**
   * Get the current value of a dependency from the scope
   * @param dep - Dependency name
   * @param scopeParent - Parent scope component
   * @returns Current value of the dependency
   */
  private getDependencyValue(
    dep: string,
    scopeParent: ScopeComponent
  ): unknown {
    try {
      const signal = scopeParent.getSignal(dep);
      return signal ? signal.value : undefined;
    } catch (error) {
      console.warn(`Failed to get dependency value for ${dep}:`, error);
      return undefined;
    }
  }

  /**
   * Check if a value has changed using appropriate comparison
   * @param current - Current value
   * @param previous - Previous value
   * @returns true if values are different, false if they're the same
   */
  private hasValueChanged(current: unknown, previous: unknown): boolean {
    // Handle null/undefined cases
    if (current === previous) return false;
    if (current == null || previous == null) return current !== previous;

    // Handle primitive types with strict equality
    if (typeof current !== 'object' || typeof previous !== 'object') {
      return current !== previous;
    }

    // Handle arrays
    if (Array.isArray(current) && Array.isArray(previous)) {
      if (current.length !== previous.length) return true;
      return current.some((item, index) =>
        this.hasValueChanged(item, previous[index])
      );
    }

    // Handle objects
    if (Array.isArray(current) || Array.isArray(previous)) return true;

    const currentKeys = Object.keys(current as object);
    const previousKeys = Object.keys(previous as object);

    if (currentKeys.length !== previousKeys.length) return true;

    return currentKeys.some(key =>
      this.hasValueChanged((current as any)[key], (previous as any)[key])
    );
  }

  /**
   * Deep clone a value for comparison purposes
   * @param value - Value to clone
   * @returns Cloned value
   */
  private deepClone(value: unknown): unknown {
    if (value == null || typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(item => this.deepClone(item));
    }

    const cloned: Record<string, unknown> = {};
    for (const key in value as object) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        cloned[key] = this.deepClone((value as any)[key]);
      }
    }
    return cloned;
  }

  /**
   * Debounced render method to prevent excessive re-renders
   * @param renderFunction - Function to execute for rendering
   * @param dependencies - Dependencies to check for changes
   * @param debounceMs - Debounce delay in milliseconds (default: 16ms for ~60fps)
   */
  protected debouncedRender(
    renderFunction: () => void,
    dependencies: string[],
    debounceMs: number = 16
  ): void {
    // Clear existing timeout
    if (this.renderDebounceTimeout) {
      clearTimeout(this.renderDebounceTimeout);
    }

    // Check if we should update
    const shouldUpdate = this.shouldUpdate(dependencies);

    // Track render attempt
    renderOptimizer.trackRender(
      this.constructor.name,
      dependencies,
      shouldUpdate
    );

    if (!shouldUpdate) {
      return;
    }

    // Debounce the render
    this.renderDebounceTimeout = setTimeout(() => {
      const now = performance.now();

      // Prevent renders that are too close together
      if (now - this.lastRenderTime < debounceMs) {
        return;
      }

      const startTime = performance.now();
      try {
        renderFunction();
        this.lastRenderTime = now;

        // Track successful render with timing
        const renderTime = performance.now() - startTime;
        renderOptimizer.trackRender(
          this.constructor.name,
          dependencies,
          true,
          renderTime
        );
      } catch (error) {
        console.error('Error during debounced render:', error);
      } finally {
        this.renderDebounceTimeout = null;
      }
    }, debounceMs);
  }

  /**
   * Force a render regardless of dependency changes
   * Useful for external updates that don't go through signals
   */
  protected forceRender(renderFunction: () => void): void {
    const startTime = performance.now();
    try {
      renderFunction();
      this.lastRenderTime = performance.now();

      // Track forced render
      renderOptimizer.trackRender(
        this.constructor.name,
        [],
        true,
        performance.now() - startTime
      );
    } catch (error) {
      console.error('Error during forced render:', error);
    }
  }

  /**
   * Clear all cached previous values
   * Useful when component state is reset
   */
  protected clearValueCache(): void {
    this.previousValues.clear();
  }

  /**
   * Cleanup all resources when component is disconnected
   */
  disconnectedCallback() {
    // Cleanup signal dependencies
    this.unsubscribeFromSignalDependencies(() => {});

    // Cleanup attribute observers
    this.disconnectAttributeObservers();

    // Cleanup event listeners
    this.cleanupEventListeners();

    // Cleanup render debounce timeout
    if (this.renderDebounceTimeout) {
      clearTimeout(this.renderDebounceTimeout);
      this.renderDebounceTimeout = null;
    }

    // Clear all tracking maps and caches
    this.dependencies.clear();
    this.observers.clear();
    this.eventListeners.clear();
    this.previousValues.clear();

    // Track component destruction
    memoryMonitor.untrackComponent(this.constructor.name);
  }
}
