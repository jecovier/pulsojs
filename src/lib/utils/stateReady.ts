import { config } from '../config';
import type { StateComponent } from '../components/state';

/**
 * Waits for a state component to be ready
 * @param element The element to find the parent state from
 * @returns A promise that resolves when the state is ready
 */
export function waitForStateReady(
  element: HTMLElement
): Promise<StateComponent> {
  return new Promise((resolve, reject) => {
    // First check if state is already ready
    const existingState = element.closest(
      config.components.state
    ) as StateComponent;
    if (existingState && existingState.isStateReady()) {
      resolve(existingState);
      return;
    }

    // Listen for state-ready event
    const handleStateReady = (
      event: CustomEvent<{ state: StateComponent }>
    ) => {
      const stateElement = event.detail.state;
      if (element.closest(config.components.state) === stateElement) {
        element.removeEventListener(
          'state-ready',
          handleStateReady as EventListener
        );
        resolve(stateElement);
      }
    };

    element.addEventListener('state-ready', handleStateReady as EventListener, {
      once: true,
    });

    // Timeout after 5 seconds to prevent infinite waiting
    setTimeout(() => {
      element.removeEventListener(
        'state-ready',
        handleStateReady as EventListener
      );
      reject(new Error('Timeout waiting for state to be ready'));
    }, 5000);
  });
}

/**
 * Checks if an element has a ready state parent
 * @param element The element to check
 * @returns true if the element has a ready state parent
 */
export function hasReadyState(element: HTMLElement): boolean {
  try {
    const stateElement = element.closest(
      config.components.state
    ) as StateComponent;
    return stateElement ? stateElement.isStateReady() : false;
  } catch {
    return false;
  }
}
