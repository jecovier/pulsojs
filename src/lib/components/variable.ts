import { config } from '../config';
import { evaluateExpression } from '../utils';
import { BaseComponent } from './base-component';

class VariableComponent extends BaseComponent {
  private name: string;

  connectedCallback() {
    this.initializeAttributes();
    this.listenToUpdates();
    this.render();
  }

  private initializeAttributes() {
    this.name = this.getRequiredAttribute('name');
  }

  private listenToUpdates() {
    this.setupAttributeObserver('name', this.render.bind(this));
    this.subscribeToSignalDependencies(this.name, this.render.bind(this));
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

// Define using the component name from config
customElements.define(config.components.var, VariableComponent);
