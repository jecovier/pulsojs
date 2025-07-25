import { config } from '../config';
import { Parser } from '../parser';
import { Signal } from '../signals';
import { createSafeContext, parseStringToObject } from '../utils';
import { BaseComponent } from './base-component';

export enum Type {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  DATE = 'date',
  ARRAY = 'array',
}

type Signals = Record<string, Signal<unknown>>;

export class ScopeComponent extends BaseComponent {
  private context: Signals = {};

  connectedCallback() {
    const state = this.getAttribute('state') || '{}';
    const parsedState = this.stringToObject(state);
    this.setContext(parsedState);

    const parser = new Parser(this);
    const context = createSafeContext(this.context);
    parser.replaceEventsWithReactiveListeners(context);
  }

  private stringToObject(state: string): Record<string, unknown> {
    try {
      return parseStringToObject(state || '{}');
    } catch (error) {
      console.error(
        'ScopeComponent: state attribute is not a valid JSON',
        error
      );
      return {};
    }
  }

  public getSignal(name: string): Signal<unknown> {
    return this.context[name];
  }

  public getSignals(): Signals {
    return this.context;
  }

  public setContext(context: Record<string, unknown>) {
    for (const key in context) {
      const value = context[key];
      if (value instanceof Signal) {
        this.context[key] = value;
        continue;
      }

      this.context[key] = new Signal(value);
    }
  }
}

// Define using the component name from config
customElements.define(config.components.scope, ScopeComponent);
