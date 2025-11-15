import { ApiAttributes, Components, ReservedAttributes } from '../config';
import { Component } from './component';
import { ContextComponent } from './context';

class ForComponent extends Component {
  // Map to store existing elements by their key for efficient diffing
  private existingElements = new Map<string | number, ContextComponent>();

  protected render(value: string | null): void {
    const foreachArray = this.evaluateExpression(value);

    if (!Array.isArray(foreachArray)) {
      throw new Error('ForComponent: foreachArray is not an array');
    }

    const keyAttribute = this.getAttribute(ReservedAttributes.KEY);
    const asAttribute =
      this.getAttribute(ReservedAttributes.AS) ?? ApiAttributes.ITEM;

    // Build map of new keys and their corresponding items
    const newKeysMap = new Map<
      string | number,
      { item: unknown; index: number }
    >();
    foreachArray.forEach((item, index) => {
      const key = this.getItemKey(item, index, keyAttribute);
      newKeysMap.set(key, { item, index });
    });

    // Remove elements that are no longer in the array
    for (const [key, element] of this.existingElements.entries()) {
      if (!newKeysMap.has(key)) {
        element.remove();
        this.existingElements.delete(key);
      }
    }

    // Create or update elements and build new order
    const newOrder: ContextComponent[] = [];
    const processedKeys = new Set<string | number>();

    foreachArray.forEach((item, index) => {
      const key = this.getItemKey(item, index, keyAttribute);
      processedKeys.add(key);

      let element = this.existingElements.get(key);

      if (element && element.parentNode === this) {
        // Element exists and is already in the DOM, just update its context
        this.updateItemElement(element, item, index, asAttribute, foreachArray);
      } else {
        // Create new element
        element = this.createItemElement(
          item,
          index,
          keyAttribute,
          asAttribute,
          foreachArray
        );
        this.existingElements.set(key, element);
      }

      newOrder.push(element);
    });

    // Reorder elements efficiently by comparing current order with new order
    const currentChildren = Array.from(this.children) as ContextComponent[];
    let needsReorder = false;

    if (currentChildren.length !== newOrder.length) {
      needsReorder = true;
    } else {
      for (let i = 0; i < currentChildren.length; i++) {
        if (currentChildren[i] !== newOrder[i]) {
          needsReorder = true;
          break;
        }
      }
    }

    if (needsReorder) {
      // Use DocumentFragment for efficient batch DOM operations
      const fragment = document.createDocumentFragment();
      newOrder.forEach(element => fragment.append(element));
      this.replaceChildren(fragment);
    }

    // Clean up any orphaned elements from the map
    for (const [key, element] of this.existingElements.entries()) {
      if (!processedKeys.has(key) || element.parentNode !== this) {
        this.existingElements.delete(key);
      }
    }
  }

  private getItemKey(
    item: unknown,
    index: number,
    keyAttribute: string | null
  ): string | number {
    if (keyAttribute && typeof item === 'object' && item !== null) {
      const key = (item as Record<string, unknown>)[keyAttribute];
      // Ensure key is a valid string or number
      if (key !== null && key !== undefined) {
        return String(key);
      }
    }
    return index;
  }

  private updateItemElement(
    element: ContextComponent,
    item: unknown,
    index: number,
    asAttribute: string,
    foreachArray: unknown[]
  ): void {
    const key = element.getAttribute('data-key');
    element.setContext({
      [asAttribute]: item,
      [ApiAttributes.KEY]: key,
      [ApiAttributes.ITEM]: item,
      [ApiAttributes.INDEX]: index,
      [ApiAttributes.LENGTH]: foreachArray.length,
      [ApiAttributes.ARRAY]: foreachArray,
    });
  }

  private createItemElement(
    item: unknown,
    index: number,
    keyAttribute: string | null,
    asAttribute: string,
    foreachArray: unknown[]
  ): ContextComponent {
    const key = this.getItemKey(item, index, keyAttribute);

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
    contextElement.setAttribute('data-key', String(key));

    return contextElement;
  }

  disconnectedCallback(): void {
    // Clean up when component is disconnected
    this.existingElements.clear();
    super.disconnectedCallback();
  }
}

customElements.define(Components.FOR, ForComponent);
