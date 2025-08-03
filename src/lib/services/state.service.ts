import { config } from '../config';
import type { StateComponent } from '../components/state';
import { Signal } from '../utils/signal';

export type State = {
  $state: Record<string, unknown>;
};

export class StateService {
  private stateParentCache: StateComponent | null;

  constructor(private element: HTMLElement) {
    this.stateParentCache = null;
  }

  public getParentState(): StateComponent {
    if (this.stateParentCache) {
      return this.stateParentCache;
    }

    const stateParent = this.element.closest(config.components.state);
    if (!stateParent) {
      throw new Error(
        `${this.constructor.name}: must be inside a state component (${config.components.state})`
      );
    }

    this.stateParentCache = stateParent as StateComponent;
    return this.stateParentCache;
  }

  public getClosestState(): State {
    const parentState = this.getParentState();

    // Check if state is ready
    if (!parentState.isStateReady()) {
      throw new Error(
        `${this.constructor.name}: state is not ready yet. Wait for 'state-ready' event.`
      );
    }

    const signals = parentState.getSignals();
    const context = parentState.getContext();
    return {
      $state: this.createSignalProxy({
        ...signals,
        ...context,
      }),
    };
  }

  public isStateReady(): boolean {
    try {
      const parentState = this.getParentState();
      return parentState.isStateReady();
    } catch {
      return false;
    }
  }

  private createSignalProxy(
    signals: Record<string, Signal<unknown> | unknown>
  ) {
    return new Proxy(signals, {
      get(target, prop: string | symbol) {
        if (typeof prop !== 'string') return prop;
        return target[prop];
      },
      set(target, prop: string, value: unknown) {
        const signal = target[prop];
        if (signal instanceof Signal) {
          signal.value = value;
        } else {
          target[prop] = value;
        }
        return true;
      },
    });
  }
}
