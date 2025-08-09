import { StateCallback } from '../types';
import { StateComponent } from './components/state';
import { Signal } from './utils/signal';
import { waitForDOMContentToBeLoaded } from './utils';
import { config } from './config';

window.createState = async (stateId: string, callback: StateCallback) => {
  await waitForDOMContentToBeLoaded;

  const stateElement = document.querySelector(
    `${config.components.state}#${stateId}`
  ) as StateComponent;
  if (!stateElement) {
    throw new Error(`State ${stateId} not found`);
  }

  const state = await callback({
    ref: (value: unknown) => {
      return new Signal(value);
    },
    effect: (callback: () => void, dependencies: Signal<unknown>[]) => {
      for (const dependency of dependencies) {
        dependency.subscribe(callback);
      }
    },
  });

  stateElement.setState(state);
};
