import { Signal } from '../utils/signal';

export class InterpreterService {
  private cache = new Map<string, Function>();

  constructor(
    private base: Record<string, unknown> = {},
    private readonly max = 1000
  ) {}

  executeCode<R = unknown>(
    code: string,
    add: Record<string, unknown> = {}
  ): R | null {
    if (!this.isSafe(code)) {
      console.error('InterpreterService: code blocked by validator');
      return null;
    }

    const context = { ...this.base, ...add };
    const contextKeys = Object.keys(context);
    const contextVals = Object.values(context);

    const cacheKey = code + '|' + contextKeys.join(',');

    try {
      let fn = this.cache.get(cacheKey);
      if (fn) {
        this.cache.delete(cacheKey);
        this.cache.set(cacheKey, fn);
      } else {
        fn = new Function(...contextKeys, '"use strict";\n' + code);
        this.setLRU(cacheKey, fn);
      }

      const out = fn.bind(null, ...contextVals)();
      return out instanceof Signal ? out.value : (out as R);
    } catch (err) {
      console.error('InterpreterService: execution error for', cacheKey, err);
      return null;
    }
  }

  evaluateExpression<R = unknown>(
    expression: string,
    add: Record<string, unknown> = {}
  ): R | null {
    return this.executeCode<R>('return (' + expression + ');', add);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private setLRU(key: string, fn: Function) {
    if (this.cache.size >= this.max) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, fn);
  }

  private isSafe(s: string): boolean {
    return !/(?:^|[^\w$])(eval|Function|setTimeout|setInterval)\s*\(/.test(s);
  }
}
