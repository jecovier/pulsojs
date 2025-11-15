type StateCallbackRef = (value: unknown) => Signal<unknown>;
type StateCallbackEffect = (
  callback: () => void,
  dependencies: Signal<unknown>[]
) => void;
export type StateCallback = ({
  ref,
  effect,
}: {
  ref: StateCallbackRef;
  effect: StateCallbackEffect;
}) => Promise<Record<string, unknown>>;

declare global {
  interface Window {
    ref: (value: unknown) => Signal<unknown>;
    createState: (stateId: string, callback: StateCallback) => Promise<void>;
  }
}

export {};
