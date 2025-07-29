import { config } from '../config';
import { Signal } from '../utils/signal';
import { parseStringToObject } from '../utils';

type Signals = Record<string, Signal<unknown>>;

export class StateComponent extends HTMLElement {
  private context: Signals = {};
  private isDisconnected = false;
  private isNested = false;

  connectedCallback() {
    this.isDisconnected = false;
    this.isNested = this.hasAttribute('data-state-nested');

    const state = this.getAttribute('value') || '{}';
    const parsedState = this.parseState(state);
    this.setSignals(parsedState);
  }

  disconnectedCallback() {
    this.isDisconnected = true;
    this.cleanupSignals();
  }

  private parseState(state: string): Record<string, unknown> {
    try {
      return parseStringToObject(state);
    } catch (error) {
      console.error('ScopeComponent: Invalid JSON in state attribute', error);
      return {};
    }
  }

  public getSignals(): Signals {
    return this.context;
  }

  public setSignals(context: Record<string, unknown>) {
    // Don't cleanup signals for nested states
    if (!this.isNested) {
      this.cleanupSignals();
    }

    // Process context entries
    Object.entries(context).forEach(([key, value]) => {
      if (value instanceof Signal) {
        this.context[key] = value;
      } else if (!this.isDisconnected) {
        this.context[key] = new Signal(value);
      }
    });
  }

  private cleanupSignals() {
    Object.values(this.context).forEach(signal => {
      if (signal instanceof Signal) {
        signal.unsubscribeAll();
      }
    });
    this.context = {};
  }

  public markAsNested() {
    this.setAttribute('data-state-nested', 'true');
    this.isNested = true;
  }
}

// Define using the component name from config
customElements.define(config.components.state, StateComponent);
