const MAX_CACHE_SIZE = 1000;
const SAFE_EXPRESSION_REGEX =
  /(?:^|[^\w$])(eval|Function|setTimeout|setInterval)\s*\(/;

type FunctionType = (...args: unknown[]) => unknown;

export class InterpreterService {
  private cache = new Map<string, FunctionType>();

  constructor(private baseContext: Record<string, unknown> = {}) {}

  executeCode(code: string, context: Record<string, unknown> = {}) {
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
        this.updateLRU(cacheKey, fn as FunctionType);
      } else {
        fn = new Function(
          ...contextKeys,
          '"use strict";\n' + code
        ) as FunctionType;
        this.setLRU(cacheKey, fn);
      }

      return (fn as FunctionType)(...contextVals);
    } catch (err) {
      throw new Error(
        `InterpreterService: execution error for ${cacheKey}: ${err}`
      );
    }
  }

  evaluateExpression(
    expression: string,
    context: Record<string, unknown> = {}
  ): unknown {
    return this.executeCode('return (' + expression + ');', context);
  }

  clearCache(): void {
    this.cache.clear();
  }

  // refresh the LRU cache by deleting the key and setting it again
  // so it will not be purged by the LRU cache
  private updateLRU(key: string, fn: FunctionType) {
    this.cache.delete(key);
    this.cache.set(key, fn);
  }

  private setLRU(key: string, fn: FunctionType) {
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

let interpreterService: InterpreterService;

export function getInterpreterService(): InterpreterService {
  if (!interpreterService) {
    interpreterService = new InterpreterService();
  }
  return interpreterService;
}
