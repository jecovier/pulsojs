export class Signal<T> {
  private _value: T;
  private _subscribers = new Set<() => void>();
  private _previousValue: T | undefined;
  private _proxy: Signal<T> | null = null;

  constructor(initialValue: T) {
    this._value = initialValue;
    this._previousValue = undefined;

    // Only create proxy for objects
    if (typeof initialValue === 'object' && initialValue !== null) {
      this._proxy = this.createProxy();
      return this._proxy;
    }

    return this;
  }

  private createProxy(): Signal<T> {
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop in target || typeof prop === 'symbol') {
          return Reflect.get(target, prop, receiver);
        }

        const value = target._value;
        if (typeof value === 'object' && value && prop in value) {
          return (value as any)[prop];
        }

        return undefined;
      },
      set: (target, prop, value, receiver) => {
        if (prop in target || typeof prop === 'symbol') {
          return Reflect.set(target, prop, value, receiver);
        }

        const currentValue = target._value;
        if (typeof currentValue === 'object' && currentValue) {
          (currentValue as any)[prop] = value;
          target._notify();
          return true;
        }

        return false;
      },
    });
  }

  [Symbol.toPrimitive](hint: string) {
    switch (hint) {
      case 'string':
        return String(this.value);
      case 'number':
        return Number(this.value);
      default:
        return this.value;
    }
  }

  [Symbol.iterator]() {
    if (!Array.isArray(this.value)) {
      console.error('Signal value is not an array');
      return [][Symbol.iterator]();
    }
    return this.value[Symbol.iterator]();
  }

  get value(): T {
    // Auto-subscribe if there's an active subscriber context
    const currentSubscriber = Signal.currentSubscribers.at(-1);
    if (currentSubscriber) {
      this._subscribers.add(currentSubscriber);
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

  private hasValueChanged(newValue: T): boolean {
    if (newValue === this._value) return false;
    if (newValue == null || this._value == null)
      return newValue !== this._value;
    if (typeof newValue !== 'object' || typeof this._value !== 'object') {
      return newValue !== this._value;
    }

    // Handle arrays
    if (Array.isArray(newValue) && Array.isArray(this._value)) {
      if (newValue.length !== this._value.length) return true;
      return newValue.some((item, index) => item !== this._value[index]);
    }

    if (Array.isArray(newValue) || Array.isArray(this._value)) return true;

    // Handle objects
    const newKeys = Object.keys(newValue as object);
    const currentKeys = Object.keys(this._value as object);

    if (newKeys.length !== currentKeys.length) return true;

    return newKeys.some(
      key => (newValue as any)[key] !== (this._value as any)[key]
    );
  }

  get previousValue(): T | undefined {
    return this._previousValue;
  }

  get hasPreviousValue(): boolean {
    return this._previousValue !== undefined;
  }

  get changeHistory(): { current: T; previous: T | undefined } {
    return { current: this._value, previous: this._previousValue };
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
