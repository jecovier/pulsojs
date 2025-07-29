import { Signal } from '../utils/signal';

export class InterpreterService {
  private functionCache = new Map<string, Function>();
  private context: Record<string, unknown> = {};

  constructor(context: Record<string, unknown>) {
    this.context = context;
  }

  public executeCode(code: string) {
    try {
      const contextKeys = Object.keys(this.context);
      const contextValues = Object.values(this.context);

      const cacheKey = `${code}:${contextKeys.join(',')}`;
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
