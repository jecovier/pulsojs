type Subscriber = () => void;

export class Signal<T> extends EventTarget {
  private _value: T;
  private _prev?: T;
  private _subs = new Set<Subscriber>();
  private _scheduled = false;

  constructor(initial: T) {
    super();
    this._value = initial;

    return initial && typeof initial === 'object' ? this._createProxy() : this;
  }

  private _createProxy(): Signal<T> {
    return new Proxy(this, {
      get: (target, prop, receiver) =>
        prop in target || typeof prop === 'symbol'
          ? Reflect.get(target, prop, receiver)
          : (target._value as any)?.[prop],
      set: (target, prop, value, receiver) => {
        if (prop in target || typeof prop === 'symbol')
          return Reflect.set(target, prop, value, receiver);
        if (typeof target._value === 'object' && target._value) {
          (target._value as any)[prop] = value;
          target._notify();
          return true;
        }
        return false;
      },
    });
  }

  get value(): T {
    return this._value;
  }

  set value(nv: T) {
    if (Object.is(nv, this._value)) return;
    this._prev = this._value;
    this._value = nv;
    this._notify();
  }

  get previousValue(): T | undefined {
    return this._prev;
  }

  peek(): T {
    return this._value;
  }

  subscribe(fn: Subscriber, opts?: { signal?: AbortSignal }): () => void {
    this._subs.add(fn);
    if (opts?.signal) {
      const off = () => this._subs.delete(fn);
      opts.signal.aborted
        ? off()
        : opts.signal.addEventListener('abort', off, { once: true });
    }
    return () => this._subs.delete(fn);
  }

  unsubscribeAll(): void {
    this._subs.clear();
  }

  [Symbol.iterator]() {
    const v = this.value as any;
    return Array.isArray(v) ? v[Symbol.iterator]() : [][Symbol.iterator]();
  }

  private _notify(): void {
    if (this._scheduled || this._subs.size === 0) return;
    this._scheduled = true;
    queueMicrotask(() => {
      this._scheduled = false;
      this._subs.forEach(s => s());
      this.dispatchEvent(new Event('change'));
    });
  }

  [Symbol.toPrimitive](hint: string) {
    const v = this.value as any;
    return hint === 'string' ? String(v) : hint === 'number' ? Number(v) : v;
  }
}
