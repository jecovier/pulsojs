import { config } from '../config';
import { createSafeContext } from '../utils';
import type { ScopeComponent } from './scope';

export class BaseComponent extends HTMLElement {
  protected dependencies = new Set<string>();
  protected observers = new Map<string, MutationObserver>();
  protected eventListeners = new Map<
    HTMLElement,
    Map<string, Set<EventListener>>
  >();

  // Performance optimizations
  private previousValues = new Map<string, unknown>();
  private lastRenderTime = 0;
  private renderDebounceTimeout: number | null = null;
  private scopeParentCache: ScopeComponent | null = null;

  // Cached sets for better performance
  private static readonly JS_KEYWORDS = new Set([
    'true',
    'false',
    'null',
    'undefined',
    'NaN',
    'Infinity',
  ]);
  private static readonly JS_BUILTINS = new Set([
    'length',
    'toString',
    'valueOf',
    'constructor',
    'this',
    'state',
  ]);

  protected getRequiredAttribute(name: string): string {
    const value = this.getAttribute(name) || '';
    if (!value) {
      throw new Error(
        `${this.constructor.name}: '${name}' attribute is required`
      );
    }
    return value;
  }

  protected getBooleanAttribute(name: string): boolean {
    try {
      return Boolean(JSON.parse(this.getAttribute(name) || ''));
    } catch {
      return false;
    }
  }

  protected getScopeParent(): ScopeComponent {
    if (this.scopeParentCache) {
      return this.scopeParentCache;
    }

    const scopeParent = this.closest(config.components.scope);
    if (!scopeParent) {
      throw new Error(
        `${this.constructor.name}: must be inside a scope component (${config.components.scope})`
      );
    }

    this.scopeParentCache = scopeParent as ScopeComponent;
    return this.scopeParentCache;
  }

  protected getSafeContext(): Record<string, unknown> {
    return createSafeContext(this.getScopeParent().getSignals());
  }

  protected extractDependencies(expression: string): string[] {
    const matches = expression.match(/\b(?!\d+\b)\w+\b/g) || [];
    return matches.filter(
      match =>
        !BaseComponent.JS_KEYWORDS.has(match) &&
        !BaseComponent.JS_BUILTINS.has(match)
    );
  }

  protected subscribeToSignalDependencies(
    expression: string,
    callback: () => void
  ) {
    const dependencies = this.extractDependencies(expression);
    const scopeParent = this.getScopeParent();

    try {
      dependencies.forEach(dependency => {
        const signal = scopeParent.getSignal(dependency);
        if (signal) {
          signal.subscribe(callback);
          this.dependencies.add(dependency);
        }
      });
    } catch (error) {
      console.error('Error setting up signal observers:', error);
    }
  }

  protected unsubscribeFromSignalDependencies(callback: () => void) {
    const scopeParent = this.getScopeParent();

    try {
      this.dependencies.forEach(dependency => {
        const signal = scopeParent.getSignal(dependency);
        if (signal) {
          signal.unsubscribe(callback);
        }
      });
      this.dependencies.clear();
    } catch (error) {
      console.error('Error unsubscribing from signal dependencies:', error);
    }
  }

  protected setupAttributeObserver(
    attributeName: string,
    callback: () => void
  ) {
    if (this.observers.has(attributeName)) return;

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === attributeName
        ) {
          callback();
          break;
        }
      }
    });

    observer.observe(this, {
      attributes: true,
      attributeFilter: [attributeName],
    });
    this.observers.set(attributeName, observer);
  }

  protected disconnectAttributeObservers() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

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
  }

  protected removeTrackedEventListener(
    element: HTMLElement,
    event: string,
    listener: EventListener,
    options?: EventListenerOptions
  ) {
    const elementListeners = this.eventListeners.get(element);
    if (!elementListeners) return;

    const eventListeners = elementListeners.get(event);
    if (!eventListeners) return;

    eventListeners.delete(listener);
    element.removeEventListener(event, listener, options);

    if (eventListeners.size === 0) {
      elementListeners.delete(event);
    }

    if (elementListeners.size === 0) {
      this.eventListeners.delete(element);
    }
  }

  protected cleanupEventListeners() {
    this.eventListeners.forEach((elementListeners, element) => {
      elementListeners.forEach((eventListeners, event) => {
        eventListeners.forEach(listener => {
          element.removeEventListener(event, listener);
        });
        eventListeners.clear();
      });
      elementListeners.clear();
    });
    this.eventListeners.clear();
  }

  protected shouldUpdate(dependencies: string[]): boolean {
    const scopeParent = this.getScopeParent();

    for (const dep of dependencies) {
      const currentValue = this.getDependencyValue(dep, scopeParent);
      const previousValue = this.previousValues.get(dep);

      if (this.hasValueChanged(currentValue, previousValue)) {
        this.previousValues.set(dep, this.deepClone(currentValue));
        return true;
      }
    }

    return false;
  }

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

  private hasValueChanged(current: unknown, previous: unknown): boolean {
    if (current === previous) return false;
    if (current == null || previous == null) return current !== previous;
    if (typeof current !== 'object' || typeof previous !== 'object') {
      return current !== previous;
    }

    if (Array.isArray(current) && Array.isArray(previous)) {
      if (current.length !== previous.length) return true;
      for (let i = 0; i < current.length; i++) {
        if (this.hasValueChanged(current[i], previous[i])) return true;
      }
      return false;
    }

    if (Array.isArray(current) || Array.isArray(previous)) return true;

    const currentKeys = Object.keys(current as object);
    const previousKeys = Object.keys(previous as object);

    if (currentKeys.length !== previousKeys.length) return true;

    for (const key of currentKeys) {
      if (this.hasValueChanged((current as any)[key], (previous as any)[key])) {
        return true;
      }
    }
    return false;
  }

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

  protected debouncedRender(
    renderFunction: () => void,
    dependencies: string[],
    debounceMs: number = 16
  ): void {
    if (this.renderDebounceTimeout) {
      clearTimeout(this.renderDebounceTimeout);
    }

    if (!this.shouldUpdate(dependencies)) {
      return;
    }

    this.renderDebounceTimeout = setTimeout(() => {
      const now = performance.now();
      if (now - this.lastRenderTime < debounceMs) {
        return;
      }

      try {
        renderFunction();
        this.lastRenderTime = now;
      } catch (error) {
        console.error('Error during debounced render:', error);
      } finally {
        this.renderDebounceTimeout = null;
      }
    }, debounceMs);
  }

  protected forceRender(renderFunction: () => void): void {
    try {
      renderFunction();
      this.lastRenderTime = performance.now();
    } catch (error) {
      console.error('Error during forced render:', error);
    }
  }

  protected clearValueCache(): void {
    this.previousValues.clear();
    this.scopeParentCache = null;
  }

  disconnectedCallback() {
    this.unsubscribeFromSignalDependencies(() => {});
    this.disconnectAttributeObservers();
    this.cleanupEventListeners();

    if (this.renderDebounceTimeout) {
      clearTimeout(this.renderDebounceTimeout);
      this.renderDebounceTimeout = null;
    }

    this.dependencies.clear();
    this.observers.clear();
    this.eventListeners.clear();
    this.previousValues.clear();
    this.scopeParentCache = null;
  }
}
