import { BaseComponent } from './base-component';
import { config } from '../config';
import { evaluateExpression } from '../utils';
import { ScopeComponent } from './scope';

export class ForComponent extends BaseComponent {
  private eachValue: string = '';
  private asValue: string = '';
  private template: HTMLTemplateElement | null = null;
  private hasInitialized: boolean = false;

  constructor() {
    super();
  }

  connectedCallback() {
    this.initializeAttributes();
    this.initializeTemplate();
    this.listenToUpdates();
    this.render();
  }

  disconnectedCallback() {
    this.disconnectAttributeObservers();
    this.unsubscribeFromSignalDependencies(() => {
      this.render();
    });
  }

  private initializeAttributes() {
    try {
      this.eachValue = this.getRequiredAttribute('each');
      this.asValue = this.getRequiredAttribute('as');
    } catch (error) {
      console.error('ForComponent initialization error:', error);
    }
  }

  private initializeTemplate() {
    if (this.hasInitialized) return;

    // Find the default template (template without id)
    this.template = this.querySelector(
      'template:not([id])'
    ) as HTMLTemplateElement;

    if (!this.template) {
      console.error('ForComponent: No default template found');
      return;
    }

    // Clear existing content
    this.innerHTML = '';

    this.hasInitialized = true;
  }

  private listenToUpdates() {
    this.setupAttributeObserver('each', () => {
      this.eachValue = this.getAttribute('each') || '';
      this.render();
    });

    this.setupAttributeObserver('as', () => {
      this.asValue = this.getAttribute('as') || '';
      this.render();
    });

    this.subscribeToSignalDependencies(this.eachValue, () => {
      this.render();
    });
  }

  private render() {
    if (!this.hasInitialized) {
      this.initializeTemplate();
    }

    if (!this.eachValue || !this.asValue) {
      return;
    }

    const context = this.getSafeContext();
    const arrayValue = evaluateExpression(this.eachValue, context);

    if (!arrayValue) {
      console.error(
        `ForComponent: Could not evaluate expression '${this.eachValue}'`
      );
      return;
    }

    if (!Array.isArray(arrayValue)) {
      console.error(`ForComponent: Signal value must be an array`);
      return;
    }

    this.innerHTML = '';

    arrayValue.forEach((item, index) => {
      const clone = this.template?.content.cloneNode(true);
      if (!clone) return;

      // Create r-scope wrapper
      const scopeElement = document.createElement(config.components.scope);
      (scopeElement as ScopeComponent).setContext({
        ...(context.$state as Record<string, unknown>),
        [this.asValue]: item,
        $index: index,
        $item: item,
        $length: arrayValue.length,
      });

      // Move the cloned content into the scope
      const fragment = document.createDocumentFragment();
      while (clone.firstChild) {
        fragment.appendChild(clone.firstChild);
      }
      scopeElement.appendChild(fragment);

      this.appendChild(scopeElement);
    });
  }
}

// Register the custom element
customElements.define(config.components.for, ForComponent);
