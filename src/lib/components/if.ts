import { Components } from '../config';
import { isExpression } from '../utils';
import { Component } from './component';

class IfComponent extends Component {
  protected render(value: string | null): void {
    if (!value || !isExpression(value)) {
      this.textContent = '';
      console.error('IfComponent: value is not an expression');
      return;
    }

    const isDetached = this.hasAttribute('detached');
    const showContent = this.evaluateExpression(value);

    this.hidden = !showContent;

    if (isDetached) {
      if (!showContent) {
        this.textContent = '';
      } else {
        this.showDefaultContent();
      }
    }
  }
}

customElements.define(Components.IF, IfComponent);
