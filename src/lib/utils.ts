import { config } from './config';
import { Signal } from './signals';

export function replaceVariablesWithReactiveComponent(
  html: HTMLElement,
  signals: Record<string, Signal<unknown>>
) {
  const variables = html.innerHTML.match(/\{\s*(\w+)\s*\}/g);
  if (!variables) {
    return;
  }
  variables.forEach(variable => {
    const variableName = variable.replace(/\{\s*(\w+)\s*\}/, '$1');
    const signal = signals[variableName];
    if (!signal) {
      console.error(`ScopeComponent: signal '${variableName}' not found`);
      return;
    }
    html.innerHTML = html.innerHTML.replace(
      variable,
      `<${config.components.var} name='${variableName}'>${signal.value}</${config.components.var}>`
    );
  });
}

export function executeCode(code: string, context: Record<string, unknown>) {
  try {
    const executeFn = new Function('context', `with (context) { ${code} }`);
    executeFn(context);
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
    const evaluateFn = new Function(
      'context',
      `with (context) { return ${expression}; }`
    );
    const result = evaluateFn(context);

    if (result instanceof Signal) {
      return result.value;
    }

    return result;
  } catch (error) {
    console.error('Error in expression evaluation:', error);
    return null;
  }
}

export function createSafeContext(signals: Record<string, unknown>) {
  return {
    $state: createSignalProxy(signals),
  };
}

function createSignalProxy(signals: Record<string, Signal<unknown> | unknown>) {
  return new Proxy(signals, {
    get(target, prop: string | symbol) {
      if (typeof prop !== 'string') return prop;

      return target[prop];
    },
    set(target, prop: string, value: unknown) {
      if (target[prop] instanceof Signal) {
        target[prop].value = value;
        return true;
      }

      target[prop] = value;
      return true;
    },
  });
}

export function parseStringToObject(str: string) {
  const jsonStr = str.replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');
  return JSON.parse(jsonStr);
}
