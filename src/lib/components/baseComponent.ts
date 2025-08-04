import { config } from '../config';
import { AttributeService } from '../services/attribute.service';
import { InterpreterService } from '../services/interpreter.service';
import { State, StateService } from '../services/state.service';
import { Signal } from '../utils/signal';
import { StateComponent } from './state';

export class BaseComponent extends HTMLElement {
  protected attributeService: AttributeService;
  protected stateService: StateService;
  protected state!: State;
  protected interpreterService!: InterpreterService;
  protected unsubscribeFunctions: Map<string, () => void> = new Map();

  constructor() {
    super();
    this.attributeService = new AttributeService(this);
    this.stateService = new StateService(this);
  }

  connectedCallback() {
    const state = this.closest(config.components.state) as StateComponent;
    if (state.isStateReady()) {
      this.initialize();
      return;
    }

    state.addEventListener(config.state.readyEvent, () => this.initialize());
  }

  disconnectedCallback() {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions.clear();
  }

  protected initialize() {
    if (!document.contains(this)) {
      return;
    }

    this.state = this.stateService.getClosestState();
    this.interpreterService = new InterpreterService(this.state);
    this.subscribeToState();
    this.render();
  }

  protected render(): void {
    throw new Error('render() method must be implemented by child class');
  }

  protected subscribeToState() {
    const dependencies = this.attributeService.getDependencies(
      this.state.$state
    );
    dependencies.forEach(dependency => {
      const signal = this.state.$state[dependency] as Signal<unknown>;
      if (signal) {
        this.unsubscribeFunctions.set(
          dependency,
          signal.subscribe(this.render.bind(this))
        );
      }
    });
  }
}
