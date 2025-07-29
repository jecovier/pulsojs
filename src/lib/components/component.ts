import { config } from '../config';
import { AttributeService } from '../services/attribute.service';
import { InterpreterService } from '../services/interpreter.service';
import { RenderService } from '../services/render.service';
import { State, StateService } from '../services/state.service';
import { Signal } from '../utils/signal';

export class reactiveComponent extends HTMLElement {
  private attributeService: AttributeService;
  private dependencies: string[] = [];
  private eventListeners: Map<string, EventListener>;
  private attributesMap: Map<string, string>;
  private interpreterService: InterpreterService;
  private state: State;
  private stateService: StateService;
  private targetElement: HTMLElement;
  private renderService: RenderService;

  constructor() {
    super();

    this.attributesMap = new Map();
    this.attributeService = new AttributeService(this.attributes);
    this.stateService = new StateService(this);
    this.eventListeners = new Map();
  }

  connectedCallback() {
    this.state = this.stateService.getClosestState();
    this.interpreterService = new InterpreterService(this.state);
    this.renderService = new RenderService(
      this.attributeService,
      this.interpreterService
    );
    this.targetElement = this.renderService.getTargetElement(this);

    this.connectEvents(this.targetElement);
    this.subscribeToState(this.state);
    this.connectAttributes();
    this.render();
  }

  disconnectedCallback() {
    this.disconnectEvents();
    this.disconnectAttributes();
    this.unsubscribeFromState(this.state);
  }

  private subscribeToState(state: State) {
    const dependencies = this.attributeService.getDependencies(state.$state);
    dependencies.forEach(dependency => {
      const signal = state.$state[dependency] as Signal<unknown>;
      if (signal) {
        signal.subscribe(this.render.bind(this));
      }
    });
  }

  private unsubscribeFromState(state: State) {
    this.dependencies.forEach(dependency => {
      const signal = state.$state[dependency] as Signal<unknown>;
      if (signal) {
        signal.unsubscribe(this.render.bind(this));
      }
    });
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

  private connectEvents(targetElement: HTMLElement) {
    const eventAttributes = this.attributeService.getEventAttributes();

    eventAttributes.forEach((value, key) => {
      const eventName = key.replace('on', '');

      this.eventListeners.set(eventName, (e: Event) => {
        this.handleEvent(e, value);
      });

      targetElement.addEventListener(
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
}

// Register the custom element
customElements.define(config.components.component, reactiveComponent);
