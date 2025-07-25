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

  private extractDependencies(expression: string): string[] {
    // Extract all variable names from the expression
    // This handles simple variables like "name" and complex ones like "items.length"
    const matches = expression.match(/\b\w+(?:\.\w+)*\b/g) || [];
    return matches.filter(match => {
      // Filter out JavaScript keywords and built-in properties
      const jsKeywords = [
        'true',
        'false',
        'null',
        'undefined',
        'NaN',
        'Infinity',
      ];
      const jsBuiltins = ['length', 'toString', 'valueOf', 'constructor'];

      const parts = match.split('.');
      const baseVar = parts[0];

      return !jsKeywords.includes(baseVar) && !jsBuiltins.includes(baseVar);
    });
  }

  private listenToUpdates() {
    this.setupAttributeObserver('name', () => {
      // Force render when name attribute changes
      this.forceRender(() => this.render());
    });

    // Extract all dependencies from the expression
    const dependencies = this.extractDependencies(this.name);

    // Subscribe to all dependencies
    dependencies.forEach(dep => {
      this.subscribeToSignalDependencies(dep, () => {
        // Use forceRender for variable components to ensure they always update
        // when their dependencies change, since the expression might be complex
        this.forceRender(() => this.render());
      });
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
