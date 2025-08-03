import { config } from '../config';
import { Signal } from '../utils/signal';
import { isEmptyObject, parseStringToObject } from '../utils';

type Signals = Record<string, Signal<unknown>>;

// Custom event for state readiness
export class StateReadyEvent extends CustomEvent<{ state: StateComponent }> {
  constructor(state: StateComponent) {
    super(config.state.readyEvent, {
      detail: { state },
      bubbles: true,
      composed: true,
    });
  }
}

export class StateComponent extends HTMLElement {
  private signals: Signals = {};
  private context: Record<string, unknown> = {};
  private isDisconnected = false;
  private isNested = false;
  private isReady = false;

  connectedCallback() {
    this.isDisconnected = false;
    this.isNested = this.hasAttribute(config.state.nested);

    const state = this.getAttribute('value') || '{}';
    const parsedState = this.parseState(state);
    this.setState(parsedState);
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

  public setContext(context: Record<string, unknown>) {
    this.context = context;
  }

  public getContext(): Record<string, unknown> {
    return this.context;
  }

  public getSignals(): Signals {
    return this.signals;
  }

  public isStateReady(): boolean {
    return this.isReady;
  }

  public setState(state: Record<string, unknown>) {
    if (isEmptyObject(state)) {
      return;
    }

    this.setSignals(state);
    this.isReady = true;
    this.dispatchEvent(new StateReadyEvent(this));
  }

  public setSignals(context: Record<string, unknown>) {
    // Don't cleanup signals for nested states
    if (!this.isNested) {
      this.cleanupSignals();
    }

    // Process context entries
    Object.entries(context).forEach(([key, value]) => {
      if (value instanceof Signal) {
        this.signals[key] = value;
      } else if (!this.isDisconnected) {
        this.signals[key] = new Signal(value);
      }
    });
  }

  private cleanupSignals() {
    Object.values(this.signals).forEach(signal => {
      if (signal instanceof Signal) {
        signal.unsubscribeAll();
      }
    });
    this.signals = {};
  }

  public markAsNested() {
    this.setAttribute('data-state-nested', 'true');
    this.isNested = true;
  }
}

// Define using the component name from config
customElements.define(config.components.state, StateComponent);
