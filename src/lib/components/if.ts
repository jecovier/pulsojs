import { config } from "../config";
import { evaluateExpression } from "../utils";
import { BaseComponent } from "./base-component";

class IfComponent extends BaseComponent {
  private whenValue: string = "";

  connectedCallback() {
    this.initializeAttributes();
    this.listenToUpdates();
    this.render();
  }

  disconnectedCallback() {
    this.disconnectAttributeObservers();
    this.unsubscribeFromSignalDependencies(this.render.bind(this));
  }

  private initializeAttributes() {
    this.whenValue = this.getRequiredAttribute("when");
  }

  private render(): void {
    if (!this.whenValue) {
      this.showContent("*");
      this.hideContent('[slot="else"]');
      return;
    }

    try {
      const context = this.getSafeContext();
      const result = evaluateExpression(this.whenValue, context);

      if (result) {
        this.showContent("*");
        this.hideContent('[slot="else"]');
      } else {
        this.hideContent("*");
        this.showContent('[slot="else"]');
      }
    } catch (error) {
      console.error("Error evaluating 'when' condition:", error);
      this.hideContent("*");
      this.showContent('[slot="else"]');
    }
  }

  private showContent(selector: string): void {
    const content = this.querySelectorAll(selector);
    content.forEach((slot) => {
      (slot as HTMLElement).style.display = "block";
    });
  }

  private hideContent(selector: string): void {
    const content = this.querySelectorAll(selector);
    content.forEach((slot) => {
      (slot as HTMLElement).style.display = "none";
    });
  }

  private listenToUpdates(): void {
    this.setupAttributeObserver("when", this.render.bind(this));
    this.subscribeToSignalDependencies(this.whenValue, this.render.bind(this));
  }
}

customElements.define(config.components.if, IfComponent);
