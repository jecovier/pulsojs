import { config } from '../config';
import { evaluateExpression } from '../utils';
import { Parser } from '../utils/parser';
import { BaseComponent } from './base-component';

class IfComponent extends BaseComponent {
  private whenValue: string = '';
  private mainContent: HTMLElement | null = null;
  private elseContent: HTMLElement | null = null;
  private parser: Parser | null = null;

  connectedCallback() {
    this.whenValue = this.getRequiredAttribute('when');
    this.initializeContent();
    this.listenToUpdates();
    this.render();
  }

  disconnectedCallback() {
    this.parser?.cleanupEventListeners();
    this.parser = null;
    this.cleanupContent();
    super.disconnectedCallback();
  }

  private initializeContent() {
    const mainTemplate = this.querySelector(
      'template:not([id])'
    ) as HTMLTemplateElement;
    const elseTemplate = this.querySelector(
      'template[id="else"]'
    ) as HTMLTemplateElement;

    this.innerHTML = '';

    // Create containers and populate them
    this.mainContent = document.createElement('div');
    this.elseContent = document.createElement('div');

    if (mainTemplate) {
      this.mainContent.appendChild(mainTemplate.content.cloneNode(true));
    }
    if (elseTemplate) {
      this.elseContent.appendChild(elseTemplate.content.cloneNode(true));
    }

    this.appendChild(this.mainContent);
    this.appendChild(this.elseContent);

    // Parse content for reactive listeners
    this.parser = new Parser(this);
    this.parser.replaceEventsWithReactiveListeners(this.getSafeContext());
  }

  private render(): void {
    if (!this.whenValue) {
      this.showContent(true);
      return;
    }

    try {
      const result = evaluateExpression(this.whenValue, this.getSafeContext());
      this.showContent(result);
    } catch (error) {
      console.error("Error evaluating 'when' condition:", error);
      this.showContent(false);
    }
  }

  private showContent(condition: boolean): void {
    if (this.mainContent) {
      this.mainContent.style.display = condition ? 'block' : 'none';
    }
    if (this.elseContent) {
      this.elseContent.style.display = condition ? 'none' : 'block';
    }
  }

  private listenToUpdates(): void {
    this.setupAttributeObserver('when', this.render.bind(this));
    this.subscribeToSignalDependencies(this.whenValue, this.render.bind(this));
  }

  private cleanupContent() {
    this.mainContent?.remove();
    this.elseContent?.remove();
    this.mainContent = null;
    this.elseContent = null;
  }
}

customElements.define(config.components.if, IfComponent);
