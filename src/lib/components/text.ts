import { Components } from '../config';
import { Component } from './component';

class TextComponent extends Component {
  protected render(value: string | null): void {
    const result = this.evaluateExpression(value);

    if (result === null) {
      this.showDefaultContent();
      return;
    }

    this.textContent = String(result);
  }
}

customElements.define(Components.TEXT, TextComponent);
