import { config } from '../config';
import type { StateComponent } from '../components/state';

export class StateService {
  private stateParentCache: StateComponent | null;

  constructor(private element: HTMLElement) {
    this.stateParentCache = null;
  }

  private getParentState(): StateComponent {
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

  public getClosestState(): Record<string, unknown> {
    const parentState = this.getParentState();

    // Check if state is ready
    if (!parentState.isStateReady()) {
      throw new Error(
        `${this.constructor.name}: state is not ready yet. Wait for 'state-ready' event.`
      );
    }

    return parentState.getContext();
  }
}
