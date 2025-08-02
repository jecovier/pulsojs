import { AttributeService } from '../services/attribute.service';
import { InterpreterService } from '../services/interpreter.service';
import { State, StateService } from '../services/state.service';
import { Signal } from '../utils/signal';

export class BaseComponent extends HTMLElement {
  protected template: Element[] = [];
  protected attributeService: AttributeService;
  protected interpreterService: InterpreterService;
  protected stateService: StateService;
  protected state: State;
  protected previousValue: boolean | null = null;
  protected unsubscribeFunctions: Map<string, () => void> = new Map();

  constructor() {
    super();

    this.stateService = new StateService(this);
    this.attributeService = new AttributeService(this);
    this.state = this.stateService.getClosestState();
    this.interpreterService = new InterpreterService(this.state);
  }

  connectedCallback() {
    this.subscribeToState();
    this.render();
  }

  disconnectedCallback() {
    this.unsubscribeFromState();
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

  protected unsubscribeFromState() {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions.clear();
  }
}
