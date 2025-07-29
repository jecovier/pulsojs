import { Signal } from '../utils/signal';

export class InterpreterService {
  private functionCache = new Map<string, Function>();
  private context: Record<string, unknown> = {};

  constructor(context: Record<string, unknown>) {
    this.context = context;
  }

  public executeCode(
    code: string,
    additionalContext: Record<string, unknown> = {}
  ) {
    const context = {
      ...this.context,
      ...additionalContext,
    };
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);
    const cacheKey = `${code}:${contextKeys.join(',')}`;

    try {
      let executeFn = this.functionCache.get(cacheKey);

      if (!executeFn) {
        executeFn = new Function(...contextKeys, code);
        this.functionCache.set(cacheKey, executeFn);
      }

      const result = executeFn.bind(null, ...contextValues)();

      if (result instanceof Signal) {
        return result.value;
      }

      return result;
    } catch (error) {
      console.error('Error in code execution:', error);
      return null;
    }
  }

  public evaluateExpression(expression: string) {
    const result = this.executeCode(`return ${expression};`);
    return result;
  }
}
