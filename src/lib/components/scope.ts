import { config } from '../config';
import { Signal } from '../utils/signals';
import { createSafeContext, parseStringToObject } from '../utils';
import { Parser } from '../utils/parser';
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
  private parser: Parser | null = null;
  private isDisconnected = false;
  private isForGenerated = false;

  connectedCallback() {
    this.isDisconnected = false;
    this.isForGenerated = this.hasAttribute('data-for-generated');

    const state = this.getAttribute('state') || '{}';
    const parsedState = this.parseState(state);
    this.setContext(parsedState);

    this.parser = new Parser(this);
    const context = createSafeContext(this.context);
    this.parser.replaceEventsWithReactiveListeners(context);
  }

  disconnectedCallback() {
    this.isDisconnected = true;

    // Cleanup parser
    this.parser?.cleanupEventListeners();
    this.parser = null;

    // Only cleanup signals if this is not a for-generated scope
    if (!this.isForGenerated) {
      this.cleanupSignals();
    }

    super.disconnectedCallback();
  }

  private parseState(state: string): Record<string, unknown> {
    try {
      return parseStringToObject(state);
    } catch (error) {
      console.error('ScopeComponent: Invalid JSON in state attribute', error);
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
    // Don't cleanup signals for for-generated scopes
    if (!this.isForGenerated) {
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
    // Clear all signal subscribers efficiently
    Object.values(this.context).forEach(signal => {
      if (signal instanceof Signal) {
        signal['_subscribers'].clear();
      }
    });
    this.context = {};
  }

  public markAsForGenerated() {
    this.setAttribute('data-for-generated', 'true');
    this.isForGenerated = true;
  }
}

// Define using the component name from config
customElements.define(config.components.scope, ScopeComponent);
