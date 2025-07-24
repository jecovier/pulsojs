import { config } from "../config";
import { Signal } from "../signals";
import {
  parseStringToObject,
  replaceEventsWithReactiveListeners,
} from "../utils";
import { BaseComponent } from "./base-component";

export enum Type {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  OBJECT = "object",
  DATE = "date",
  ARRAY = "array",
}

type Signals = Record<string, Signal<unknown>>;

export class ScopeComponent extends BaseComponent {
  private signals: Signals = {};

  connectedCallback() {
    const state = this.getAttribute("state") || "{}";
    this.signals = this.stateToSignals(state);

    replaceEventsWithReactiveListeners(this, this.signals);
  }

  private stateToSignals(state: string): Signals {
    try {
      const parsedState = parseStringToObject(state || "{}");
      const signals: Signals = {};
      for (const key in parsedState) {
        signals[key] = new Signal(parsedState[key]);
      }
      return signals;
    } catch (error) {
      console.error(
        "ScopeComponent: state attribute is not a valid JSON",
        error
      );
      return {};
    }
  }

  public getSignal(name: string): Signal<unknown> {
    return this.signals[name];
  }

  public getSignals(): Signals {
    return this.signals;
  }
}

// Define using the component name from config
customElements.define(config.components.scope, ScopeComponent);
