import {
  ApiAttributes,
  Attributes,
  Components,
  ReservedAttributes,
} from '../config';
import {
  getDependencies,
  isEventAttribute,
  isExpression,
  isFormControl,
  unwrapExpr,
} from '../utils';
import { Component } from './component';

export class ElmComponent extends Component {
  private _attributesMap: Map<string, string> = new Map();
  private _targetElement: HTMLElement | null = null;
  private _renderScheduled = false;
  private _pendingRender = false;
  // Cache for processed bind expressions to avoid reprocessing
  private _bindExpressionCache = new Map<string, string>();

  constructor() {
    super();
    this._targetElement = this._getOnlyChild();
    this._attributesMap = this._getAttributesMap(this._targetElement);
    this._subscribeToReactiveAttributes(this._attributesMap);
    this._subscribeToEvents(this._targetElement, this._attributesMap);
  }

  disconnectedCallback(): void {
    // Clean up cache when component is disconnected
    this._bindExpressionCache.clear();
    super.disconnectedCallback();
  }

  protected render(): void {
    if (!this._attributesMap.size || !this._targetElement) {
      return;
    }

    // Batch DOM operations using requestAnimationFrame to avoid multiple reflows
    if (this._renderScheduled) {
      this._pendingRender = true;
      return;
    }

    this._renderScheduled = true;
    this._pendingRender = false;

    requestAnimationFrame(() => {
      this._renderScheduled = false;
      this._performRender();
      // If another render was requested while we were waiting, schedule it
      if (this._pendingRender) {
        this._pendingRender = false;
        this.render();
      }
    });
  }

  private _performRender(): void {
    if (!this._attributesMap.size || !this._targetElement) {
      return;
    }

    // Batch all DOM operations together
    this._setAttributesValues(this._targetElement, this._attributesMap);
    this._setTextContent(this._targetElement, this._attributesMap);
  }

  private _setTextContent(
    targetElement: HTMLElement,
    attributesMap: Map<string, string>
  ): void {
    if (!attributesMap.has(ReservedAttributes.TEXT)) {
      return;
    }

    const textValue = this.evaluateExpression(
      attributesMap.get(ReservedAttributes.TEXT) ?? ''
    );

    targetElement.textContent = String(textValue);
  }

  private _getAttributesMap(targetElement: HTMLElement): Map<string, string> {
    const attributes = targetElement.attributes;
    const attributesMap = new Map<string, string>();

    for (const attribute of attributes) {
      switch (attribute.name) {
        case ReservedAttributes.BIND:
          this._addBindAttribute(attributesMap, attribute);
          break;
        default:
          attributesMap.set(attribute.name, attribute.value);
          break;
      }
    }

    return attributesMap;
  }

  private _addBindAttribute(
    attributesMap: Map<string, string>,
    attribute: Attr
  ): void {
    if (!isExpression(attribute.value)) {
      attributesMap.set(Attributes.VALUE, attribute.value);
      return;
    }

    // Use cache key based on the unwrapped expression
    const exprKey = unwrapExpr(attribute.value);
    let onInputExpression = this._bindExpressionCache.get(exprKey);

    if (!onInputExpression) {
      // Process expression only once and cache the result
      onInputExpression = `{${exprKey}.value = ${ApiAttributes.EVENT}.target.value;}`;
      this._bindExpressionCache.set(exprKey, onInputExpression);
    }

    attributesMap.set(Attributes.VALUE, attribute.value);
    attributesMap.set(Attributes.ONINPUT, onInputExpression);
  }

  private _getOnlyChild(): HTMLElement {
    if (this.childElementCount === 0) {
      throw new Error('No child element found');
    }
    if (this.childElementCount > 1) {
      this.textContent = '❌ Only one child is allowed';
      throw new Error('Only one child element is allowed');
    }

    const child = this.firstElementChild as HTMLElement;
    if (!child) throw new Error('No child element found');

    if (child.tagName === 'TEMPLATE') {
      throw new Error('Template is not allowed as a child element');
    }

    return child;
  }

  private _setAttributesValues(
    element: HTMLElement,
    attributesMap: Map<string, string>
  ): void {
    // Pre-calculate all changes to batch DOM operations
    const changes: Array<{
      type: 'attribute' | 'remove' | 'value';
      key: string;
      value?: string;
    }> = [];

    // First pass: evaluate all expressions and collect changes
    for (const [key, value] of attributesMap) {
      if (
        isEventAttribute(key) ||
        !isExpression(value) ||
        key in ReservedAttributes
      ) {
        continue;
      }

      const result = this.evaluateExpression(value);

      if (key === Attributes.VALUE && isFormControl(element)) {
        changes.push({
          type: 'value',
          key,
          value: String(result),
        });
        continue;
      }

      if (result === undefined || result === null) {
        changes.push({
          type: 'remove',
          key,
        });
        continue;
      }

      changes.push({
        type: 'attribute',
        key,
        value: String(result),
      });
    }

    // Second pass: apply all changes in batch
    // This minimizes DOM reflows by grouping all operations together
    changes.forEach(change => {
      switch (change.type) {
        case 'value':
          if (isFormControl(element)) {
            (
              element as
                | HTMLInputElement
                | HTMLTextAreaElement
                | HTMLSelectElement
            ).value = change.value ?? '';
          }
          break;
        case 'remove':
          element.removeAttribute(change.key);
          break;
        case 'attribute':
          if (change.value !== undefined) {
            element.setAttribute(change.key, change.value);
          }
          break;
      }
    });
  }

  private _subscribeToReactiveAttributes(
    attributesMap: Map<string, string>
  ): void {
    const attributes = Array.from(attributesMap.entries()).filter(
      ([key, value]) => isExpression(value) && !isEventAttribute(key)
    );

    const allDependencies = attributes
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([_key, value]) =>
        getDependencies(value, this.context?.getContext() ?? {})
      )
      .flat();

    // Deduplicate dependencies using Set (works by object reference)
    // This prevents multiple subscriptions to the same Signal instance
    const uniqueDependencies = new Set(allDependencies);

    uniqueDependencies.forEach(dependency => {
      const unsubscribe = dependency.subscribe(this.render.bind(this));
      this.unSubscribers.add(unsubscribe);
    });
  }

  private _subscribeToEvents(
    targetElement: HTMLElement,
    attributesMap: Map<string, string>
  ): void {
    for (const [key, value] of attributesMap) {
      if (!isEventAttribute(key)) {
        continue;
      }

      const eventName = key.slice(2).toLowerCase();
      const handler: EventListener = (event: Event) => {
        const context = this.context?.getContext() ?? {};
        return this.interpreterService.executeCode(value, {
          ...context,
          [ApiAttributes.EVENT]: event,
        });
      };

      if (this.eventListeners.has(eventName)) {
        return;
      }

      targetElement.removeAttribute(key);
      targetElement.addEventListener(eventName, handler);
      this.eventListeners.set(eventName, handler);
    }
  }
}

customElements.define(Components.ELM, ElmComponent);
