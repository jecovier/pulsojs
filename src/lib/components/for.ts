import { BaseComponent } from "./base-component";
import { config } from "../config";
import { evaluateExpression } from "../utils";

export class ForComponent extends BaseComponent {
  private eachValue: string = "";
  private asValue: string = "";
  private template: HTMLTemplateElement | null = null;

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
      this.eachValue = this.getRequiredAttribute("each");
      this.asValue = this.getRequiredAttribute("as");
    } catch (error) {
      console.error("ForComponent initialization error:", error);
    }
  }

  private initializeTemplate() {
    this.template = document.createElement("template");
    this.template.innerHTML = this.innerHTML;
    this.innerHTML = "";
  }

  private listenToUpdates() {
    this.setupAttributeObserver("each", () => {
      this.eachValue = this.getAttribute("each") || "";
      this.render();
    });

    this.setupAttributeObserver("as", () => {
      this.asValue = this.getAttribute("as") || "";
      this.render();
    });

    this.subscribeToSignalDependencies(this.eachValue, () => {
      this.render();
    });
  }

  private render() {
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

    this.innerHTML = "";

    arrayValue.forEach((item) => {
      const clone = this.template?.content.cloneNode(true);
      if (clone) {
        this.appendChild(clone);
      }
    });
  }
}

// Register the custom element
customElements.define(config.components.for, ForComponent);
