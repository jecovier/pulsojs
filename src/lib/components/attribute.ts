import { config } from '../config';
import { evaluateExpression } from '../utils';
import { BaseComponent } from './base-component';

class AttributeComponent extends BaseComponent {
  private name: string;
  private value: string;
  private allowEmpty: boolean;

  connectedCallback() {
    this.name = this.getRequiredAttribute('name');
    this.value = this.getRequiredAttribute('value');
    this.allowEmpty = this.getBooleanAttribute('allowEmpty');

    this.setupObservers();
    this.render();
  }

  private setupObservers() {
    const updateCallback = () => this.render();

    // Observe both name and value attributes
    this.setupAttributeObserver('name', updateCallback);
    this.setupAttributeObserver('value', updateCallback);

    // Subscribe to signal dependencies in the value expression
    this.subscribeToSignalDependencies(this.value, updateCallback);
  }

  private render() {
    const context = this.getSafeContext();
    const result = evaluateExpression(this.value, context);

    // Get parent element and set the attribute
    const parent = this.parentElement;
    if (parent) {
      if (result || this.allowEmpty) {
        parent.setAttribute(this.name, String(result));
      } else {
        parent.removeAttribute(this.name);
      }
    }
  }

  disconnectedCallback() {
    this.unsubscribeFromSignalDependencies(this.render.bind(this));
    this.disconnectAttributeObservers();

    // Clean up attribute from parent when component is removed
    const parent = this.parentElement;
    if (parent) {
      parent.removeAttribute(this.name);
    }
  }
}

customElements.define(config.components.attr, AttributeComponent);
