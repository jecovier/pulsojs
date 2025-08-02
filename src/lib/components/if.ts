import { config } from '../config';
import { BaseComponent } from './baseComponent';

class IfComponent extends BaseComponent {
  constructor() {
    super();

    this.template = Array.from(
      document.createRange().createContextualFragment(this.innerHTML).children
    );
    this.innerHTML = '';
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  protected render() {
    const value = this.attributeService.get('value') ?? '';
    const result = !!this.interpreterService.evaluateExpression(value);

    if (result === this.previousValue) {
      return;
    }

    if (result) {
      this.template.forEach(node => {
        this.appendChild(node.cloneNode(true));
      });
    } else {
      this.innerHTML = '';
    }

    this.hidden = !result;
    this.previousValue = result;
  }
}

customElements.define(config.components.if, IfComponent);
