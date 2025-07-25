import { config } from '../config';
import { createSafeContext } from '../utils';
import { ScopeComponent } from './scope';
import { memoryMonitor } from '../utils/memory-monitor';

export class BaseComponent extends HTMLElement {
  protected dependencies: Set<string> = new Set();
  protected observers: Map<string, MutationObserver> = new Map();
  protected eventListeners: Map<HTMLElement, Map<string, Set<EventListener>>> =
    new Map();

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

  protected subscribeToSignalDependencies(
    expression: string,
    callback: () => void
  ) {
    const variableMatches = expression.match(/\b\w+\b/g);
    const scopeParent = this.getScopeParent();

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
   * Cleanup all resources when component is disconnected
   */
  disconnectedCallback() {
    // Cleanup signal dependencies
    this.unsubscribeFromSignalDependencies(() => {});

    // Cleanup attribute observers
    this.disconnectAttributeObservers();

    // Cleanup event listeners
    this.cleanupEventListeners();

    // Clear all tracking maps
    this.dependencies.clear();
    this.observers.clear();
    this.eventListeners.clear();

    // Track component destruction
    memoryMonitor.untrackComponent(this.constructor.name);
  }
}
