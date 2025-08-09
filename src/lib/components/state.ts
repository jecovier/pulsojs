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

    if (this.isStateReady()) {
      this.dispatchEvent(new StateReadyEvent(this));
      return;
    }
  }

  private parseState(state: string) {
    try {
      const parsedState = parseStringToObject(state);
      this.setState(this.objectToSignals(parsedState));
    } catch (error) {
      console.error('Invalid State value', error);
    }
  }

  disconnectedCallback() {
    this.isDisconnected = true;
    this.cleanupContext();
  }

  public setContext(context: Record<string, unknown>) {
    this.context = context;
  }

  public getContext(): Record<string, unknown> {
    return this.context;
  }

  public isStateReady(): boolean {
    return this.isReady;
  }

  public setState(state: Record<string, unknown>) {
    if (this.isDisconnected || isEmptyObject(state)) return;
    if (!this.isNested) this.cleanupContext();

    this.setContext(state);
    this.isReady = true;
    this.dispatchEvent(new StateReadyEvent(this));
  }

  public objectToSignals(object: Record<string, unknown>) {
    const signals: Signals = {};
    Object.entries(object).forEach(([key, value]) => {
      if (!this.isDisconnected) {
        signals[key] = value instanceof Signal ? value : new Signal(value);
      }
    });
    return signals;
  }

  private cleanupContext() {
    Object.values(this.context).forEach(item => {
      if (item instanceof Signal) {
        item.unsubscribeAll();
      }
    });
    this.context = Object.create(null) as Record<string, unknown>;
  }

  public markAsNested() {
    this.setAttribute(config.state.nested, 'true');
    this.isNested = true;
  }
}

customElements.define(config.components.state, StateComponent);
