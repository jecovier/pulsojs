import { config } from '../config';
import { Signal } from '../utils/signal';
import { BaseComponent } from './baseComponent';

export class VarComponent extends BaseComponent {
  private varName: string = '';
  private expression: string = '';

  constructor() {
    super();
    this.varName = Array.from(this.attributes)[0]?.name;
    this.expression = '$state.' + this.varName;
  }

  protected subscribeToState() {
    const signal = this.state?.$state[this.varName];
    if (signal instanceof Signal) {
      this.unsubscribeFunctions.set(
        this.varName,
        signal.subscribe(this.render.bind(this))
      );
    }
  }

  protected render() {
    if (!this.varName) {
      console.error('VarComponent', 'No var name found');
      return;
    }

    const varValue = this.interpreterService.evaluateExpression(
      this.expression
    );
    this.textContent = varValue as string;
  }
}

customElements.define(config.components.var, VarComponent);
