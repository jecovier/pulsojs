import { config } from '../config';
import { evaluateExpression } from '../utils';
import { BaseComponent } from './base-component';

class VariableComponent extends BaseComponent {
  private name: string;

  connectedCallback() {
    this.name = this.getRequiredAttribute('name');
    this.setupObservers();
    this.render();
  }

  private setupObservers() {
    // Single callback for both attribute and signal changes
    const updateCallback = () => this.render();

    this.setupAttributeObserver('name', updateCallback);
    this.subscribeToSignalDependencies(this.name, updateCallback);
  }

  private render() {
    const context = this.getSafeContext();
    const result = evaluateExpression(this.name, context);
    this.textContent = String(result);
  }

  disconnectedCallback() {
    this.unsubscribeFromSignalDependencies(this.render.bind(this));
    this.disconnectAttributeObservers();
  }
}

customElements.define(config.components.var, VariableComponent);
