import { config } from '../config';
import { AttributeService } from '../services/attribute.service';
import { RenderService } from '../services/render.service';
import { BaseComponent } from './baseComponent';

export class ElementComponent extends BaseComponent {
  private eventListeners: Map<string, EventListener>;
  private attributesMap: Map<string, string>;
  private targetElement: HTMLElement;
  private renderService: RenderService;

  constructor() {
    super();

    this.attributesMap = new Map();
    this.eventListeners = new Map();
    this.targetElement = this.getFirstChild();
    this.attributeService = new AttributeService(this.targetElement);
    this.renderService = new RenderService(
      this.attributeService,
      this.interpreterService
    );
  }

  connectedCallback() {
    this.subscribeToState();
    this.connectEvents();
    this.connectAttributes();
    this.render();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.disconnectEvents();
    this.disconnectAttributes();
  }

  private connectAttributes() {
    this.attributeService.getReactiveAttributes().forEach((value, key) => {
      this.attributesMap.set(key, value);
      this.attributeService.remove(key);
    });
  }

  private disconnectAttributes() {
    this.attributesMap.clear();
  }

  private connectEvents() {
    const eventAttributes = this.attributeService.getEventAttributes();

    eventAttributes.forEach((value, key) => {
      const eventName = key.replace('on', '');

      this.eventListeners.set(eventName, (e: Event) => {
        this.handleEvent(e, value);
      });

      this.targetElement.addEventListener(
        eventName,
        this.eventListeners.get(eventName)!
      );

      this.attributeService.remove(key);
    });
  }

  private disconnectEvents() {
    const eventAttributes = this.attributeService.getEventAttributes();
    eventAttributes.forEach((_value, key) => {
      this.removeEventListener(key, this.eventListeners.get(key)!);
      this.eventListeners.delete(key);
    });
  }

  private handleEvent(event: Event, expression: string) {
    this.interpreterService.executeCode(expression, {
      $event: event,
    });
  }

  protected render() {
    this.renderService.render({
      element: this.targetElement,
      attributes: this.attributesMap,
    });
  }

  private getFirstChild() {
    if (this.children.length === 0) {
      throw new Error('No child element found');
    }

    if (this.children.length > 1) {
      throw new Error('Only one child element is allowed');
    }

    const child = this.children[0] as HTMLElement;

    if (child.tagName.toLowerCase() === 'template') {
      throw new Error('Template is not allowed as a child element');
    }

    return child;
  }
}

// Register the custom element
customElements.define(config.components.elm, ElementComponent);
