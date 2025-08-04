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

  static get observedAttributes() {
    return ['value'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'value' && oldValue !== newValue && !this.isDisconnected) {
      this.parseState(newValue || '{}');
    }
  }

  connectedCallback() {
    this.isDisconnected = false;
    this.isNested = this.hasAttribute(config.state.nested);

    if (this.isReady) {
      this.dispatchEvent(new StateReadyEvent(this));
      return;
    }
  }

  private parseState(state: string) {
    try {
      const parsedState = parseStringToObject(state);
      this.setState(parsedState);
    } catch (error) {
      console.error('Invalid State value', error);
    }
  }

  disconnectedCallback() {
    this.isDisconnected = true;
    this.cleanupSignals();
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

  public setAsReady() {
    this.isReady = true;
  }

  public isStateReady(): boolean {
    return this.isReady;
  }

  public setState(state: Record<string, unknown>) {
    if (isEmptyObject(state)) return;
    this.setSignals(state);
    this.setAsReady();
    this.dispatchEvent(new StateReadyEvent(this));
  }

  public setSignals(context: Record<string, unknown>) {
    if (!this.isNested) {
      this.cleanupSignals();
    }

    Object.entries(context).forEach(([key, value]) => {
      if (!this.isDisconnected) {
        this.signals[key] = value instanceof Signal ? value : new Signal(value);
      }
    });
  }

  private cleanupSignals() {
    Object.values(this.signals).forEach(signal => {
      if (signal instanceof Signal) {
        signal.unsubscribeAll();
      }
    });
    this.signals = Object.create(null) as Signals;
  }

  public markAsNested() {
    this.setAttribute(config.state.nested, 'true');
    this.isNested = true;
  }
}

customElements.define(config.components.state, StateComponent);
