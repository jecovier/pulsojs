import { config } from '../config';
import { Parser } from '../parser';
import { evaluateExpression } from '../utils';
import { BaseComponent } from './base-component';

class IfComponent extends BaseComponent {
  private whenValue: string = '';
  private mainContent: HTMLElement | null = null;
  private elseContent: HTMLElement | null = null;
  private hasInitialized: boolean = false;

  connectedCallback() {
    this.initializeAttributes();
    this.initializeContent();
    this.listenToUpdates();
    this.render();
  }

  disconnectedCallback() {
    this.disconnectAttributeObservers();
    this.unsubscribeFromSignalDependencies(this.render.bind(this));
  }

  private initializeAttributes() {
    this.whenValue = this.getRequiredAttribute('when');
  }

  private initializeContent() {
    if (this.hasInitialized) return;

    const mainTemplate = this.querySelector(
      'template:not([id])'
    ) as HTMLTemplateElement;
    const elseTemplate = this.querySelector(
      'template[id="else"]'
    ) as HTMLTemplateElement;

    // Limpiar contenido existente
    this.innerHTML = '';

    // Crear contenedores para ambos contenidos
    this.mainContent = document.createElement('div');
    this.elseContent = document.createElement('div');

    // Copiar contenido del template principal
    if (mainTemplate) {
      const clone = mainTemplate.content.cloneNode(true);
      this.mainContent.appendChild(clone);
    }

    // Copiar contenido del template else
    if (elseTemplate) {
      const clone = elseTemplate.content.cloneNode(true);
      this.elseContent.appendChild(clone);
    }

    // Agregar ambos contenedores al componente
    this.appendChild(this.mainContent);
    this.appendChild(this.elseContent);

    // parse the content of the mainContent and elseContent
    const parser = new Parser(this);
    const context = this.getSafeContext();
    parser.replaceEventsWithReactiveListeners(context);

    this.hasInitialized = true;
  }

  private render(): void {
    if (!this.hasInitialized) {
      this.initializeContent();
    }

    if (!this.whenValue) {
      this.showContent(true);
      return;
    }

    try {
      const context = this.getSafeContext();
      const result = evaluateExpression(this.whenValue, context);
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
}

customElements.define(config.components.if, IfComponent);
