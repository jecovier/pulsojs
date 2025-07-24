import { config } from "../config";
import { createSafeContext } from "../utils";
import { ScopeComponent } from "./scope";

export class BaseComponent extends HTMLElement {
  protected dependencies: Set<string> = new Set();
  protected observers: Map<string, MutationObserver> = new Map();

  protected getRequiredAttribute(name: string): string {
    const value = this.getAttribute(name) || "";
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
        variableMatches.forEach((variableName) => {
          const signal = scopeParent.getSignal(variableName);
          if (signal) {
            signal.subscribe(callback);
            this.dependencies.add(variableName);
          }
        });
      }
    } catch (error) {
      console.error("Error setting up signal observers:", error);
    }
  }

  protected unsubscribeFromSignalDependencies(callback: () => void) {
    const scopeParent = this.getScopeParent();

    try {
      if (this.dependencies.size > 0) {
        this.dependencies.forEach((variableName) => {
          const signal = scopeParent.getSignal(variableName);
          if (signal) {
            signal.unsubscribe(callback);
          }
        });
        this.dependencies.clear();
      }
    } catch (error) {
      console.error("Error unsubscribing from signal dependencies:", error);
    }
  }

  protected setupAttributeObserver(
    attributeName: string,
    callback: () => void
  ) {
    if (this.observers.has(attributeName)) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
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
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}
