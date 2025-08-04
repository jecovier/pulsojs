import { config } from '../config';
import { AttributeService } from '../services/attribute.service';
import { InterpreterService } from '../services/interpreter.service';
import { RenderService } from '../services/render.service';
import { BaseComponent } from './baseComponent';

export class ElementComponent extends BaseComponent {
  private eventListeners = new Map<string, EventListener>();
  private attributesMap = new Map<string, string>();
  private targetElement!: HTMLElement;
  private renderService!: RenderService;

  constructor() {
    super();
  }

  protected initialize() {
    this.state = this.stateService.getClosestState();
    this.interpreterService = new InterpreterService(this.state);

    this.targetElement = this.getFirstChild();
    this.attributeService = new AttributeService(this.targetElement);
    this.renderService = new RenderService(
      this.attributeService,
      this.interpreterService
    );

    this.subscribeToState();
    this.connectAttributes();
    this.connectEvents();
    this.render();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.disconnectEvents();
    this.disconnectAttributes();
  }

  private connectAttributes() {
    for (const [key, value] of this.attributeService.getReactiveAttributes()) {
      this.attributesMap.set(key, value);
      this.attributeService.remove(key);
    }
  }

  private disconnectAttributes() {
    this.attributesMap.clear();
  }

  private connectEvents() {
    for (const [key, value] of this.attributeService.getEventAttributes()) {
      if (!key.startsWith('on')) continue;
      const eventName = key.slice(2).toLowerCase();

      const handler: EventListener = (e: Event) => this.handleEvent(e, value);
      this.eventListeners.set(eventName, handler);
      this.targetElement.addEventListener(eventName, handler);
      this.attributeService.remove(key);
    }
  }

  private disconnectEvents() {
    for (const [eventName, handler] of this.eventListeners) {
      this.targetElement.removeEventListener(eventName, handler);
    }
    this.eventListeners.clear();
  }

  private handleEvent(event: Event, expression: string) {
    this.interpreterService.executeCode(expression, { $event: event });
  }

  protected render() {
    this.renderService.render({
      element: this.targetElement,
      attributes: this.attributesMap,
    });
  }

  private getFirstChild(): HTMLElement {
    if (this.childElementCount === 0) {
      throw new Error('No child element found');
    }
    if (this.childElementCount > 1) {
      throw new Error('Only one child element is allowed');
    }

    const child = this.firstElementChild as HTMLElement;
    if (!child) throw new Error('No child element found');

    if (child.tagName === 'TEMPLATE') {
      throw new Error('Template is not allowed as a child element');
    }

    return child;
  }
}

customElements.define(config.components.elm, ElementComponent);
