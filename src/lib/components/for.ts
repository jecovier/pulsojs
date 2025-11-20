import { ApiAttributes, Components, ReservedAttributes } from '../config';
import { Component } from './component';
import { ContextComponent } from './context';

type KeyMap = { element: HTMLElement; item: unknown };

class ForComponent extends Component {
  private keyMap = new Map<string, KeyMap>();

  protected render(value: string | null): void {
    const foreachArray = this.evaluateExpression(value);

    if (!Array.isArray(foreachArray)) {
      console.log('foreachArray', value);
      console.error('ForComponent: foreachArray is not an array');
      return;
    }

    const keyAttribute = this.getAttribute(ReservedAttributes.KEY);
    const asAttribute =
      this.getAttribute(ReservedAttributes.AS) ?? ApiAttributes.ITEM;

    this._removeChildrenNotInArray(foreachArray, keyAttribute);
    this._addNewChildrenInArray(foreachArray, asAttribute, keyAttribute);
    this._updateChildrenInArray(foreachArray, asAttribute, keyAttribute);
  }

  private getItemKey(
    item: unknown,
    index: number,
    keyAttribute: string | null
  ): string {
    if (keyAttribute && typeof item === 'object' && item !== null) {
      const key = (item as Record<string, unknown>)[keyAttribute];
      // Ensure key is a valid string or number
      if (key !== null && key !== undefined) {
        return String(key);
      }
    }
    return String(index);
  }

  private _removeChildrenNotInArray(
    foreachArray: unknown[],
    keyAttribute: string | null
  ): void {
    const keysToRemove = Array.from(this.keyMap.keys()).filter(
      key =>
        !foreachArray.some(
          (item, index) => this.getItemKey(item, index, keyAttribute) === key
        )
    );

    keysToRemove.forEach(key => {
      const { element } = this.keyMap.get(key) as KeyMap;
      if (element) {
        element.remove();
      }
      this.keyMap.delete(key);
    });
  }

  private _addNewChildrenInArray(
    foreachArray: unknown[],
    asAttribute: string,
    keyAttribute: string | null
  ): void {
    foreachArray.forEach((item, index) => {
      const key = this.getItemKey(item, index, keyAttribute);

      if (this.keyMap.has(key)) {
        return;
      }

      const element = this.createItemElement(
        item,
        index,
        key,
        asAttribute,
        foreachArray
      );
      this.keyMap.set(key, { element, item });
      this.appendChild(element);
    });
  }

  private _updateChildrenInArray(
    foreachArray: unknown[],
    asAttribute: string,
    keyAttribute: string | null
  ): void {
    foreachArray.forEach((currentItem, index) => {
      const key = this.getItemKey(currentItem, index, keyAttribute);

      if (!this.keyMap.has(key)) {
        return;
      }

      const { element, item } = this.keyMap.get(key) as KeyMap;

      if (this.stableHash(item) === this.stableHash(currentItem)) {
        return;
      }

      this._updateItemElement(
        element,
        currentItem,
        index,
        key,
        asAttribute,
        foreachArray
      );
    });
  }

  private stableHash(item: unknown): string {
    return JSON.stringify(item);
  }

  private _updateItemElement(
    element: HTMLElement,
    item: unknown,
    index: number,
    key: string,
    asAttribute: string,
    foreachArray: unknown[]
  ): void {
    const newElement = this.createItemElement(
      item,
      index,
      key,
      asAttribute,
      foreachArray
    );
    element.replaceWith(newElement);
    this.keyMap.set(key, { element: newElement, item });
  }
  private createItemElement(
    item: unknown,
    index: number,
    key: string,
    asAttribute: string,
    foreachArray: unknown[]
  ): ContextComponent {
    const contextElement = document.createElement(
      Components.CONTEXT
    ) as ContextComponent;

    contextElement.setContext({
      [asAttribute]: item,
      [ApiAttributes.KEY]: key,
      [ApiAttributes.ITEM]: item,
      [ApiAttributes.INDEX]: index,
      [ApiAttributes.LENGTH]: foreachArray.length,
      [ApiAttributes.ARRAY]: foreachArray,
    });

    contextElement.append(...this.copyDefaultContent());
    contextElement.setAttribute('data-key', key);

    return contextElement;
  }
}

customElements.define(Components.FOR, ForComponent);
