import { config } from '../config';
import { InterpreterService } from '../services/interpreter.service';
import { State, StateService } from '../services/state.service';
import { Signal } from '../utils/signal';

export class VarComponent extends HTMLElement {
  private stateService: StateService;
  private state: State;
  private interpreterService: InterpreterService;
  private varName: string = '';
  private expression: string = '';

  constructor() {
    super();
    this.varName = Array.from(this.attributes)[0]?.name;
    this.expression = '$state.' + this.varName;
    this.stateService = new StateService(this);
  }

  connectedCallback() {
    this.state = this.stateService.getClosestState();
    this.interpreterService = new InterpreterService(this.state);

    this.subscribeToStateChanges();
    this.render();
  }

  disconnectedCallback() {
    const signal = this.state.$state[this.varName] as Signal<unknown>;
    if (signal) {
      signal.unsubscribe(this.render.bind(this));
    }
  }

  private subscribeToStateChanges() {
    const signal = this.state.$state[this.varName] as Signal<unknown>;
    if (signal) {
      signal.subscribe(this.render.bind(this));
    }
  }

  private render() {
    if (!this.varName) {
      console.error('VarComponent', 'No var name found');
    }

    const varValue = this.interpreterService.evaluateExpression(
      this.expression
    );
    this.innerHTML = varValue as string;
  }
}

customElements.define(config.components.var, VarComponent);
