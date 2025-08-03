import { config } from '../config';
import { BaseComponent } from './baseComponent';

class IfComponent extends BaseComponent {
  private previousValue: boolean;
  private html: string;

  constructor() {
    super();

    this.html = this.innerHTML;
    this.innerHTML = '';
    this.previousValue = !!this.getAttribute('hidden');
  }

  protected render() {
    const value = this.attributeService.get('value') ?? '';
    const result = !!this.interpreterService.evaluateExpression(value);

    if (result === this.previousValue) {
      return;
    }

    if (result) {
      this.innerHTML = this.html;
    } else {
      this.innerHTML = '';
    }

    this.hidden = !result;
    this.previousValue = result;
  }
}

customElements.define(config.components.if, IfComponent);
