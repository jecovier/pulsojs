import { Signal } from '../utils/signal';

const MAX_CACHE_SIZE = 1000;
const SAFE_EXPRESSION_REGEX =
  /(?:^|[^\w$])(eval|Function|setTimeout|setInterval)\s*\(/;

export class InterpreterService {
  private cache = new Map<string, Function>();

  constructor(private baseContext: Record<string, unknown> = {}) {}

  executeCode<R = unknown>(
    code: string,
    context: Record<string, unknown> = {}
  ): R {
    if (!this.isSafe(code)) {
      throw new Error('InterpreterService: code blocked by validator');
    }

    const fullContext = { ...this.baseContext, ...context };
    const contextKeys = Object.keys(fullContext);
    const contextVals = Object.values(fullContext);

    const cacheKey = code + '|' + contextKeys.join(',');

    try {
      let fn = this.cache.get(cacheKey);
      if (fn) {
        this.updateLRU(cacheKey, fn);
      } else {
        fn = new Function(...contextKeys, '"use strict";\n' + code);
        this.setLRU(cacheKey, fn);
      }

      const out = fn.bind(null, ...contextVals)();
      return out instanceof Signal ? out.value : (out as R);
    } catch (err) {
      throw new Error(
        `InterpreterService: execution error for ${cacheKey}: ${err}`
      );
    }
  }

  evaluateExpression<R = unknown>(
    expression: string,
    context: Record<string, unknown> = {}
  ): R {
    return this.executeCode<R>('return (' + expression + ');', context);
  }

  clearCache(): void {
    this.cache.clear();
  }

  // refresh the LRU cache by deleting the key and setting it again
  // so it will not be purged by the LRU cache
  private updateLRU(key: string, fn: Function) {
    this.cache.delete(key);
    this.cache.set(key, fn);
  }

  private setLRU(key: string, fn: Function) {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, fn);
  }

  private isSafe(s: string): boolean {
    return !SAFE_EXPRESSION_REGEX.test(s);
  }
}
