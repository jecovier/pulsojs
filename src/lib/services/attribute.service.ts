import { RESERVED_ATTRIBUTES } from '../config';

// Precompiled regex
const EXPR_RE = /^\s*\{([\s\S]+?)\}\s*$/; // { expression }
const IDENT_RE = /[$A-Za-z_][$\w]*/g; // JS-like identifiers

const RESERVED_SET = new Set<string>(Object.values(RESERVED_ATTRIBUTES));

/** Returns inner expression without braces, or null if not an expression. */
const unwrapExpr = (raw: string | null): string | null => {
  if (!raw) return null;
  const m = EXPR_RE.exec(raw);
  return m ? m[1].trim() : null;
};

export class AttributeService {
  constructor(private readonly el: HTMLElement) {
    this.bindValue();
  }

  /** Iterate only attributes whose value is an expression: { ... } */
  public iterateReactiveAttributes(
    callback: (name: string, expr: string) => void
  ) {
    for (const name of this.el.getAttributeNames()) {
      const expr = unwrapExpr(this.el.getAttribute(name));
      if (expr) callback(name, expr);
    }
  }

  /** Attributes that are not expressions and not reserved. */
  public getStaticAttributes(): { name: string; value: string }[] {
    const out: { name: string; value: string }[] = [];
    for (const name of this.el.getAttributeNames()) {
      if (RESERVED_SET.has(name)) continue;
      const raw = this.el.getAttribute(name);
      if (!unwrapExpr(raw) && raw != null)
        out.push({ name, value: raw.trim() });
    }
    return out;
  }

  /** Reactive attributes whose name starts with "on" (events). */
  public getEventAttributes(): Map<string, string> {
    const events = new Map<string, string>();
    this.iterateReactiveAttributes((name, expr) => {
      if (name.startsWith('on')) events.set(name, expr);
    });
    return events;
  }

  /** Reactive (non-event, non-reserved) attributes. */
  public getReactiveAttributes(): Map<string, string> {
    const attrs = new Map<string, string>();
    this.iterateReactiveAttributes((name, expr) => {
      if (!name.startsWith('on') && !RESERVED_SET.has(name))
        attrs.set(name, expr);
    });
    return attrs;
  }

  /** Returns the inner expression (without braces) for a given attribute, or null. */
  public get(name: string): string | null {
    return unwrapExpr(this.el.getAttribute(name)) ?? this.el.getAttribute(name);
  }

  public getRaw(name: string): string | null {
    return this.el.getAttribute(name);
  }

  public remove(name: string) {
    this.el.removeAttribute(name);
  }

  /** Extract candidate variable names (exclude keywords/builtins and property names after dots). */
  private extractWords(expression: string): string[] {
    const results: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = IDENT_RE.exec(expression))) {
      const id = m[0];
      results.push(id);
    }
    return results;
  }

  /** Collect unique dependencies present in the provided context. */
  public getDependencies(context: Record<string, unknown>): string[] {
    const ctxKeys = new Set(Object.keys(context));
    const deps = new Set<string>();
    this.iterateReactiveAttributes((_name, expr) => {
      for (const w of this.extractWords(expr)) if (ctxKeys.has(w)) deps.add(w);
    });
    return [...deps];
  }

  /** Handles x-bind style: converts [bind] into value + oninput two-way binding. */
  private bindValue() {
    const bindExpr = this.get(RESERVED_ATTRIBUTES.BIND);
    if (!bindExpr) return;

    this.el.setAttribute('value', `{${bindExpr}}`);
    this.el.setAttribute(
      'oninput',
      `{${bindExpr}.value = $event.target.value}`
    );
    this.el.removeAttribute(RESERVED_ATTRIBUTES.BIND);
  }
}
