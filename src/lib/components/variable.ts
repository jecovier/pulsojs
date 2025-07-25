import { config } from '../config';
import { evaluateExpression } from '../utils';
import { BaseComponent } from './base-component';

class VariableComponent extends BaseComponent {
  private name: string;
  private lastRenderedValue: unknown = null;
  private lastExpression: string = '';

  connectedCallback() {
    this.initializeAttributes();
    this.listenToUpdates();
    this.render();
  }

  private initializeAttributes() {
    this.name = this.getRequiredAttribute('name');
  }

  private listenToUpdates() {
    this.setupAttributeObserver('name', () => {
      // Force render when name attribute changes
      this.forceRender(() => this.render());
    });

    // Also subscribe to the full expression as a fallback
    this.subscribeToSignalDependencies(this.name, () => {
      this.forceRender(() => this.render());
    });
  }

  private render() {
    const context = this.getSafeContext();
    const result = evaluateExpression(this.name, context);

    // Only update DOM if the value has actually changed
    if (result !== this.lastRenderedValue) {
      this.textContent = String(result);
      this.lastRenderedValue = result;
    }
  }

  disconnectedCallback() {
    this.unsubscribeFromSignalDependencies(this.render.bind(this));
    this.disconnectAttributeObservers();

    // Clear cached value
    this.lastRenderedValue = null;
  }
}

// Define using the component name from config
customElements.define(config.components.var, VariableComponent);
