import { Signal } from './utils/signal';
import { Components } from './config';
import { ContextComponent } from './components/context';
import { ready } from './utils';

declare global {
  interface Window {
    reactive: (value: unknown) => Signal<unknown>;
    effect: (
      callback: () => void,
      dependencies: Signal<unknown>[]
    ) => () => void;
    useContext: (
      id: string,
      callback: () => Promise<Record<string, unknown>>
    ) => Promise<void>;
  }
}

window.reactive = (value: unknown) => new Signal(value);

window.effect = (callback: () => void, dependencies: Signal<unknown>[]) => {
  callback();
  for (const dependency of dependencies) {
    dependency.subscribe(callback);
  }
  return () => {
    for (const dependency of dependencies) {
      dependency.unsubscribeAll();
    }
  };
};

window.useContext = async (
  id: string,
  callback: () => Promise<Record<string, unknown>>
) => {
  ready(async () => {
    const context = document.querySelector(
      `${Components.CONTEXT}#${id}`
    ) as ContextComponent;

    if (!context) {
      throw new Error(`Context ${id} not found`);
    }

    const newContext = await callback();
    context.setContext(newContext);
  });
};
