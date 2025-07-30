import { config } from '../config';
import { AttributeService } from '../services/attribute.service';
import { InterpreterService } from '../services/interpreter.service';
import { RenderService } from '../services/render.service';
import { State, StateService } from '../services/state.service';
import { Signal } from '../utils/signal';

export class ElementComponent extends HTMLElement {
  private attributeService: AttributeService;
  private eventListeners: Map<string, EventListener>;
  private attributesMap: Map<string, string>;
  private interpreterService: InterpreterService;
  private state: State;
  private stateService: StateService;
  private targetElement: HTMLElement;
  private renderService: RenderService;
  private unsubscribeFunctions: Map<string, () => void> = new Map();

  constructor() {
    super();

    this.attributesMap = new Map();
    this.eventListeners = new Map();
    this.stateService = new StateService(this);
    this.state = this.stateService.getClosestState();
    this.interpreterService = new InterpreterService(this.state);
    this.targetElement = this.getFirstChild();
    this.attributeService = new AttributeService(this.targetElement);
    this.renderService = new RenderService(
      this.attributeService,
      this.interpreterService
    );
  }

  connectedCallback() {
    this.connectEvents();
    this.subscribeToState();
    this.connectAttributes();
    this.render();
  }

  disconnectedCallback() {
    this.disconnectEvents();
    this.disconnectAttributes();
    this.unsubscribeFromState();
  }

  private subscribeToState() {
    const dependencies = this.attributeService.getDependencies(
      this.state.$state
    );
    dependencies.forEach(dependency => {
      const signal = this.state.$state[dependency] as Signal<unknown>;
      if (signal) {
        const unsubscribe = signal.subscribe(this.render.bind(this));
        this.unsubscribeFunctions.set(dependency, unsubscribe);
      }
    });
  }

  private unsubscribeFromState() {
    this.unsubscribeFunctions.forEach(unsubscribe => {
      unsubscribe();
    });
    this.unsubscribeFunctions.clear();
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

  private render() {
    this.renderService.render({
      element: this.targetElement,
      attributes: this.attributesMap,
    });
  }

  private getFirstChild() {
    if (this.children.length === 0) {
      this.innerHTML = '⛔ No child element found ⛔';
      throw new Error('No child element found');
    }

    if (this.children.length > 1) {
      this.innerHTML = '⛔ Only one child element is allowed ⛔';
      throw new Error('Only one child element is allowed');
    }

    const child = this.children[0] as HTMLElement;

    if (child.tagName.toLowerCase() === 'template') {
      this.innerHTML = '⛔ Template is not allowed as a child element ⛔';
      throw new Error('Template is not allowed as a child element');
    }

    return child;
  }
}

// Register the custom element
customElements.define(config.components.elm, ElementComponent);
