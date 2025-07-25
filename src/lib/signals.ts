export class Signal<T> {
  private _value: T;
  private _subscribers: Set<() => void>;
  private _previousValue: T | undefined;

  constructor(initialValue: T) {
    this._value = initialValue;
    this._subscribers = new Set();
    this._previousValue = undefined;

    if (typeof initialValue === 'object' && initialValue !== null) {
      return this.generateProxy(initialValue);
    }

    return this;
  }

  private generateProxy(target: object) {
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target || typeof prop === 'symbol') {
          return Reflect.get(target, prop, receiver);
        }

        if (
          typeof target._value === 'object' &&
          target._value &&
          prop in target._value
        ) {
          return target._value[prop as keyof T];
        }

        return undefined;
      },
      set(target, prop, value, receiver) {
        if (prop in target || typeof prop === 'symbol') {
          return Reflect.set(target, prop, value, receiver);
        }

        if (typeof target._value === 'object' && target._value) {
          (target._value as any)[prop] = value;
          target._notify();
          return true;
        }

        return false;
      },
    });
  }

  [Symbol.toPrimitive](hint: string) {
    if (hint === 'string') return String(this.value);
    if (hint === 'number') return Number(this.value);
    return this.value;
  }

  [Symbol.iterator]() {
    if (!Array.isArray(this.value)) {
      console.error('Signal value is not an array');
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
    if (this.hasValueChanged(newValue)) {
      this._previousValue = this._value;
      this._value = newValue;
      this._notify();
    }
  }

  /**
   * Check if a new value is different from the current value
   * @param newValue - The new value to compare
   * @returns true if the value has changed, false otherwise
   */
  private hasValueChanged(newValue: T): boolean {
    // Handle null/undefined cases
    if (newValue === this._value) return false;
    if (newValue == null || this._value == null)
      return newValue !== this._value;

    // Handle primitive types with strict equality
    if (typeof newValue !== 'object' || typeof this._value !== 'object') {
      return newValue !== this._value;
    }

    // Handle arrays
    if (Array.isArray(newValue) && Array.isArray(this._value)) {
      if (newValue.length !== this._value.length) return true;
      return newValue.some((item, index) => item !== this._value[index]);
    }

    // Handle objects
    if (Array.isArray(newValue) || Array.isArray(this._value)) return true;

    const newKeys = Object.keys(newValue as object);
    const currentKeys = Object.keys(this._value as object);

    if (newKeys.length !== currentKeys.length) return true;

    return newKeys.some(
      key => (newValue as any)[key] !== (this._value as any)[key]
    );
  }

  /**
   * Get the previous value of the signal
   * @returns The previous value or undefined if no previous value exists
   */
  get previousValue(): T | undefined {
    return this._previousValue;
  }

  /**
   * Check if the signal has a previous value
   * @returns true if there's a previous value, false otherwise
   */
  get hasPreviousValue(): boolean {
    return this._previousValue !== undefined;
  }

  /**
   * Get the change history (current and previous values)
   * @returns Object with current and previous values
   */
  get changeHistory(): { current: T; previous: T | undefined } {
    return {
      current: this._value,
      previous: this._previousValue,
    };
  }

  subscribe(subscriber: () => void): void {
    this._subscribers.add(subscriber);
  }

  unsubscribe(subscriber: () => void): void {
    this._subscribers.delete(subscriber);
  }

  private _notify(): void {
    this._subscribers.forEach(subscriber => subscriber());
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
