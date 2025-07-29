export enum RESERVED_ATTRIBUTES {
  AS = 'data-as',
  IF = 'data-if',
  SHOW = 'data-show',
  FOREACH = 'data-foreach',
  VALUE = 'data-value',
  BIND = 'data-bind',
}

// Cached sets for better performance
const JS_KEYWORDS = new Set([
  'true',
  'false',
  'null',
  'undefined',
  'NaN',
  'Infinity',
]);
const JS_BUILTINS = new Set([
  'length',
  'toString',
  'valueOf',
  'constructor',
  'this',
  'state',
]);

export class AttributeService {
  private attributes: NamedNodeMap;

  constructor(attributes: NamedNodeMap) {
    this.attributes = attributes;
    this.bindValue();
  }

  public iterateReactiveAttributes(
    callback: (name: string, value: string) => void
  ) {
    Array.from(this.attributes).forEach(attr => {
      if (this.isExpression(attr.value.trim())) {
        callback(attr.name, this.get(attr.name)!);
      }
    });
  }

  public getStaticAttributes(): { name: string; value: string }[] {
    return Array.from(this.attributes)
      .filter(
        attr =>
          !this.isExpression(attr.value.trim()) &&
          !this.isReservedAttribute(attr.name)
      )
      .map(attr => ({ name: attr.name, value: attr.value.trim() }));
  }

  public getEventAttributes(): Map<string, string> {
    const eventAttributes = new Map<string, string>();
    this.iterateReactiveAttributes((name, value) => {
      if (name.startsWith('on')) {
        eventAttributes.set(name, value);
      }
    });
    return eventAttributes;
  }

  public getReactiveAttributes(): Map<string, string> {
    const normalAttributes = new Map<string, string>();
    this.iterateReactiveAttributes((name, value) => {
      if (name.startsWith('on') || this.isReservedAttribute(name)) {
        return;
      }

      normalAttributes.set(name, value);
    });
    return normalAttributes;
  }

  public get(name: string): string | null {
    const attr = this.attributes.getNamedItem(name);
    return attr ? attr.value.trim().replace(/^{|}$/g, '') : null;
  }

  public remove(name: string) {
    this.attributes.removeNamedItem(name);
  }

  private isReservedAttribute(name: string): boolean {
    return Object.values(RESERVED_ATTRIBUTES).includes(
      name as RESERVED_ATTRIBUTES
    );
  }

  private extractWords(expression: string): string[] {
    const matches = expression.match(/\b(?!\d+\b)\w+\b/g) || [];
    return matches.filter(
      match => !JS_KEYWORDS.has(match) && !JS_BUILTINS.has(match)
    );
  }

  public getDependencies(context: Record<string, unknown>): string[] {
    const dependencies = new Set<string>();
    const noFilteredDependencies: string[] = [];
    this.iterateReactiveAttributes((_name, value) => {
      const words = this.extractWords(value);
      const contextKeys = Object.keys(context);
      const contextDependencies = words.filter(key =>
        contextKeys.includes(key)
      );
      noFilteredDependencies.push(...contextDependencies);
    });

    noFilteredDependencies.forEach(dep => dependencies.add(dep));
    return Array.from(dependencies);
  }

  private isExpression(value: string): boolean {
    return value.startsWith('{') && value.endsWith('}');
  }

  private bindValue() {
    const bindAttribute = this.get(RESERVED_ATTRIBUTES.BIND);
    if (!bindAttribute) return;

    const valueAttr = document.createAttribute('value');
    valueAttr.value = `{${bindAttribute}}`;
    this.attributes.setNamedItem(valueAttr);

    const onInputAttr = document.createAttribute('oninput');
    onInputAttr.value = `{${bindAttribute} = $event.target.value}`;
    this.attributes.setNamedItem(onInputAttr);

    this.remove(RESERVED_ATTRIBUTES.BIND);
  }
}
