import { Components, Events } from '../config';
import { parseStringToObject } from '../utils';
import { Signal } from '../utils/signal';

export class ContextReadyEvent extends CustomEvent<{ isReady: boolean }> {
  constructor(isReady: boolean) {
    super(Events.CONTEXT_READY, {
      detail: { isReady },
      bubbles: true,
      composed: true,
    });
  }
}

export class ContextComponent extends HTMLElement {
  private context: Record<string, unknown> = {};
  private isContextReady = false;

  static get observedAttributes() {
    return ['value'];
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'value') {
      try {
        this.setContext(this._stringToSignals(newValue || '{}'));
      } catch (error) {
        console.error('Invalid Context value', error);
      }
    }
  }

  private _stringToSignals(value: string): Record<string, Signal<unknown>> {
    const parsed = parseStringToObject(value || '{}');
    const signals: Record<string, Signal<unknown>> = {};

    Object.entries(parsed).forEach(([key, value]) => {
      signals[key] = value instanceof Signal ? value : new Signal(value);
    });
    return signals;
  }

  public setContext(context: Record<string, unknown>) {
    this.context = context;
    this.isContextReady = true;
    this.dispatchEvent(new ContextReadyEvent(this.isContextReady));
  }

  public isReady(): boolean {
    return this.isContextReady;
  }

  public getContext(): Record<string, unknown> {
    return this.context;
  }
}

customElements.define(Components.CONTEXT, ContextComponent);
