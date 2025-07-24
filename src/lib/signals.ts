export class Signal<T> {
  private _value: T;
  private _subscribers: Set<() => void>;

  constructor(initialValue: T) {
    this._value = initialValue;
    this._subscribers = new Set();

    if (typeof initialValue === "object" && initialValue !== null) {
      return this.generateProxy(initialValue);
    }

    return this;
  }

  private generateProxy(target: object) {
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target || typeof prop === "symbol") {
          return Reflect.get(target, prop, receiver);
        }

        if (
          typeof target._value === "object" &&
          target._value &&
          prop in target._value
        ) {
          return target._value[prop as keyof T];
        }

        return undefined;
      },
      set(target, prop, value, receiver) {
        if (prop in target || typeof prop === "symbol") {
          return Reflect.set(target, prop, value, receiver);
        }

        if (typeof target._value === "object" && target._value) {
          (target._value as any)[prop] = value;
          target._notify();
          return true;
        }

        return false;
      },
    });
  }

  [Symbol.toPrimitive](hint: string) {
    if (hint === "string") return String(this.value);
    if (hint === "number") return Number(this.value);
    return this.value;
  }

  [Symbol.iterator]() {
    if (!Array.isArray(this.value)) {
      console.error("Signal value is not an array");
      return [][Symbol.iterator]();
    }

    return this.value[Symbol.iterator]();
  }

  get value(): T {
    if (Signal.currentSubscribers.length > 0) {
      const currentSubscriber = Signal.currentSubscribers.at(-1);
      if (currentSubscriber) {
        this._subscribers.add(currentSubscriber);
      }
    }
    return this._value;
  }

  set value(newValue: T) {
    if (newValue !== this._value) {
      this._value = newValue;
      this._notify();
    }
  }

  subscribe(subscriber: () => void): void {
    this._subscribers.add(subscriber);
  }

  unsubscribe(subscriber: () => void): void {
    this._subscribers.delete(subscriber);
  }

  private _notify(): void {
    this._subscribers.forEach((subscriber) => subscriber());
  }

  static currentSubscribers: Array<() => void> = [];
}

// Función para crear valores computados reactivos
type Computed<T> = () => T;

export function createComputed<T>(fn: () => T): Computed<T> {
  const wrapper = () => {
    Signal.currentSubscribers.push(wrapper);
    wrapper._value = fn();
    Signal.currentSubscribers.pop();
  };

  wrapper._value = fn();
  return () => wrapper._value;
}
