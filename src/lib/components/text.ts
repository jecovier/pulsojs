import { ATTRIBUTES, config } from '../config';
import { BaseComponent } from './baseComponent';

export class TextComponent extends BaseComponent {
  protected render() {
    const valueAttribute = this.attributeService.get(ATTRIBUTES.VALUE);
    if (!valueAttribute) {
      console.error('TextComponent', 'No value attribute found');
      return;
    }

    const textValue =
      this.interpreterService.evaluateExpression(valueAttribute);
    this.textContent = textValue as string;
  }
}

customElements.define(config.components.text, TextComponent);
