import {
  getInterpreterService,
  InterpreterService,
} from '../services/interpreter.service';
import { Signal } from '../utils/signal';

const EXPRESSION_REGEX = /^\s*\{([\s\S]+?)\}\s*$/; // { expression }
const JS_IDENTIFIER_REGEX = /[a-zA-Z_][a-zA-Z0-9_]*/g; // JS-like identifiers
const RESERVED_WORDS = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'enum',
  'await',
  'implements',
  'package',
  'protected',
  'static',
  'interface',
  'private',
  'public',
  'null',
  'true',
  'false',
  'eval',
  'Function',
  'setTimeout',
  'setInterval',
]);

export function parseStringToObject(str: string) {
  // First, convert unquoted keys to quoted keys
  let jsonStr = str.replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');

  // Then, convert single quotes to double quotes for string values
  jsonStr = jsonStr.replace(/'([^']*)'/g, '"$1"');

  return JSON.parse(jsonStr);
}

export function isEmptyObject(obj: Record<string, unknown>) {
  return Object.keys(obj).length === 0 || obj === null;
}

export const ready = (fn: () => void) =>
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true })
    : fn();

export const basenameFromUrl = (url: string) => {
  const { pathname } = new URL(url, location.href);
  const last = pathname
    .substring(pathname.lastIndexOf('/') + 1)
    .split(/[?#]/)[0];
  return last.replace(/\.[^.]+$/, '');
};

export const toTagName = (base: string) => {
  let tag = String(base || 'component')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-') // normalize
    .replace(/^-+|-+$/g, '') // trim dashes
    .replace(/--+/g, '-'); // collapse
  if (!tag.includes('-')) tag = `x-${tag}`;
  return tag;
};

export const isExpression = (expression: string): boolean => {
  return EXPRESSION_REGEX.test(expression);
};

export const isEventAttribute = (attributeName: string): boolean => {
  return attributeName.startsWith('on') && attributeName.length > 2;
};

export const unwrapExpr = (raw: string | null): string => {
  if (!raw) return '';

  const m = EXPRESSION_REGEX.exec(raw);

  return m ? m[1].trim() : '';
};

export const extractWords = (expression: string): string[] => {
  const results: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = JS_IDENTIFIER_REGEX.exec(expression))) {
    const id = m[0];
    if (!RESERVED_WORDS.has(id)) {
      results.push(id);
    }
  }
  return results;
};

export function getDependencies(
  value: string,
  context: Record<string, unknown> = {},
  interpreterService: InterpreterService = getInterpreterService()
): Signal<unknown>[] {
  if (!isExpression(value)) return [];

  const reactiveDependencies: Signal<unknown>[] = [];
  const words = extractWords(value);
  const uniqueWords = Array.from(new Set(words));

  uniqueWords.forEach(word => {
    try {
      const ref = interpreterService.evaluateExpression(word, context);

      if (!(ref instanceof Signal)) return;

      reactiveDependencies.push(ref);
    } catch {
      return;
    }
  });

  return reactiveDependencies;
}

export const isFormControl = (
  el: Element
): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement => {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  );
};
