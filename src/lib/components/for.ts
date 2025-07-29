import { config } from '../config';
import {
  AttributeService,
  RESERVED_ATTRIBUTES,
} from '../services/attribute.service';
import { InterpreterService } from '../services/interpreter.service';
import { RenderService } from '../services/render.service';
import { StateService } from '../services/state.service';
import { State } from '../services/state.service';
import { Signal } from '../utils/signal';
import { StateComponent } from './state';

class ForComponent extends HTMLElement {
  private interpreterService: InterpreterService;
  private attributeService: AttributeService;
  private stateService: StateService;
  private state: State;
  private renderService: RenderService;
  private template: HTMLTemplateElement | null;

  constructor() {
    super();
    this.attributeService = new AttributeService(this.attributes);
    this.stateService = new StateService(this);
    this.state = this.stateService.getClosestState();
    this.interpreterService = new InterpreterService(this.state);
    this.renderService = new RenderService(
      this.attributeService,
      this.interpreterService
    );
  }

  connectedCallback() {
    this.template = this.renderService.getTemplate(this);
    if (!this.template) {
      console.error('ForComponent: No template found');
      return;
    }

    this.subscribeToState(this.state);
    this.render();
  }

  disconnectedCallback() {
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
    const dependencies = this.attributeService.getDependencies(state.$state);
    dependencies.forEach(dependency => {
      const signal = state.$state[dependency] as Signal<unknown>;
      if (signal) {
        signal.unsubscribe(this.render.bind(this));
      }
    });
  }

  private render() {
    const foreachAttribute = this.attributeService.get(
      RESERVED_ATTRIBUTES.FOREACH
    );
    if (!foreachAttribute) {
      console.error('ForComponent: No foreach attribute found');
      return;
    }

    const foreachArray =
      this.interpreterService.evaluateExpression(foreachAttribute);
    if (!foreachArray) {
      console.error('ForComponent: No foreach array found');
      return;
    }

    if (!Array.isArray(foreachArray)) {
      console.error('ForComponent: ForEach array is not an array');
      return;
    }

    this.innerHTML = '';

    const asAttribute = this.attributeService.get(RESERVED_ATTRIBUTES.AS);
    const fragment = document.createDocumentFragment();

    foreachArray.forEach((item, index) => {
      const stateElement = document.createElement(
        config.components.state
      ) as StateComponent;
      stateElement.markAsNested();
      stateElement.setSignals({
        $item: item,
        $index: index,
        $length: foreachArray.length,
        $array: foreachArray,
        ...this.state.$state,
      });

      const templateContent = this.template?.content.cloneNode(true);
      if (templateContent) {
        stateElement.appendChild(templateContent);
      }

      fragment.appendChild(stateElement);
    });

    this.appendChild(fragment);
  }
}

customElements.define(config.components.for, ForComponent);
