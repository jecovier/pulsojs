import { config, RESERVED_ATTRIBUTES } from '../config';
import { StateComponent } from './state';
import { BaseComponent } from './baseComponent';

class ForComponent extends BaseComponent {
  constructor() {
    super();

    this.template = Array.from(
      document.createRange().createContextualFragment(this.innerHTML).children
    );
    this.innerHTML = '';
  }

  protected render() {
    const foreachAttribute = this.attributeService.get(
      RESERVED_ATTRIBUTES.FOREACH
    );
    if (!foreachAttribute) {
      console.error('ForComponent: No foreach attribute found');
      return;
    }

    const foreachArray =
      this.interpreterService.evaluateExpression(foreachAttribute);
    if (!foreachArray) {
      console.error('ForComponent: No foreach array found');
      return;
    }

    if (!Array.isArray(foreachArray)) {
      console.error('ForComponent: ForEach array is not an array');
      return;
    }

    this.shadowRoot?.replaceChildren();

    const asAttribute = this.attributeService.getRaw(RESERVED_ATTRIBUTES.AS);
    const fragment = document.createDocumentFragment();

    foreachArray.forEach((item, index) => {
      const stateElement = document.createElement(
        config.components.state
      ) as StateComponent;
      stateElement.markAsNested();
      stateElement.setSignals(this.state.$state);
      stateElement.setContext({
        $item: item,
        $index: index,
        $length: foreachArray.length,
        $array: foreachArray,
        ...(asAttribute ? { [asAttribute]: item } : {}),
      });

      this.template.forEach(node => {
        stateElement.appendChild(node.cloneNode(true));
      });

      fragment.appendChild(stateElement);
    });

    this.appendChild(fragment);
  }
}

customElements.define(config.components.for, ForComponent);
