import { StateCallback } from '../types';
import { StateComponent } from './components/state';
import { Signal } from './utils/signal';
import { config } from './config';
import { ready } from './utils';

window.createState = async (stateId: string, callback: StateCallback) => {
  ready(async () => {
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
  });
};
