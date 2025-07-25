import { Signal } from './signals';

// Cache for function creation to avoid repeated Function constructor calls
const functionCache = new Map<string, Function>();

export function executeCode(code: string, context: Record<string, unknown>) {
  try {
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);

    // Use cached function if available
    const cacheKey = `${code}:${contextKeys.join(',')}`;
    let executeFn = functionCache.get(cacheKey);

    if (!executeFn) {
      executeFn = new Function(...contextKeys, code);
      functionCache.set(cacheKey, executeFn);
    }

    executeFn.bind(null, ...contextValues)();
  } catch (error) {
    console.error('Error in code execution:', error);
    return null;
  }
}

export function evaluateExpression(
  expression: string,
  context: Record<string, unknown>
) {
  try {
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);

    // Use cached function if available
    const cacheKey = `return ${expression}:${contextKeys.join(',')}`;
    let evaluateFn = functionCache.get(cacheKey);

    if (!evaluateFn) {
      evaluateFn = new Function(...contextKeys, `return ${expression};`);
      functionCache.set(cacheKey, evaluateFn);
    }

    const result = evaluateFn.bind(null, ...contextValues)();
    return result instanceof Signal ? result.value : result;
  } catch (error) {
    console.error('Error in expression evaluation:', error);
    return null;
  }
}

export function createSafeContext(signals: Record<string, unknown>) {
  return { $state: createSignalProxy(signals) };
}

function createSignalProxy(signals: Record<string, Signal<unknown> | unknown>) {
  return new Proxy(signals, {
    get(target, prop: string | symbol) {
      if (typeof prop !== 'string') return prop;
      return target[prop];
    },
    set(target, prop: string, value: unknown) {
      const signal = target[prop];
      if (signal instanceof Signal) {
        signal.value = value;
      } else {
        target[prop] = value;
      }
      return true;
    },
  });
}

export function parseStringToObject(str: string) {
  const jsonStr = str.replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');
  return JSON.parse(jsonStr);
}

// Cleanup function to clear cache when needed
export function clearFunctionCache() {
  functionCache.clear();
}
