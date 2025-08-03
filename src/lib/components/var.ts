import { config } from '../config';
import { InterpreterService } from '../services/interpreter.service';
import { State, StateService } from '../services/state.service';
import { isEmptyObject } from '../utils';
import { Signal } from '../utils/signal';

export class VarComponent extends HTMLElement {
  private stateService: StateService;
  private state: State | null = null;
  private interpreterService: InterpreterService | null = null;
  private varName: string = '';
  private expression: string = '';
  private unsubscribeFunction?: () => void;
  private isInitialized = false;

  constructor() {
    super();
    this.varName = Array.from(this.attributes)[0]?.name;
    this.expression = '$state.' + this.varName;
    this.stateService = new StateService(this);
  }

  connectedCallback() {
    try {
      this.state = this.stateService.getClosestState();
      if (!isEmptyObject(this.state.$state)) {
        this.initializeComponent();
        return;
      }
    } catch (error) {
      const stateElement = this.closest(config.components.state);
      stateElement?.addEventListener(
        config.state.readyEvent,
        this.handleStateReady.bind(this) as EventListener
      );
    }
  }

  private handleStateReady() {
    if (!this.isInitialized) {
      this.initializeComponent();
    }
  }

  private initializeComponent() {
    this.isInitialized = true;
    this.state = this.stateService.getClosestState();
    this.interpreterService = new InterpreterService(this.state);
    this.subscribeToStateChanges();
    this.render();
  }

  disconnectedCallback() {
    if (this.unsubscribeFunction) {
      this.unsubscribeFunction();
    }
  }

  private subscribeToStateChanges() {
    const signal = this.state?.$state[this.varName];
    if (signal instanceof Signal) {
      this.unsubscribeFunction = signal.subscribe(this.render.bind(this));
    }
  }

  private render() {
    if (!this.varName) {
      console.error('VarComponent', 'No var name found');
    }

    const varValue = this.interpreterService?.evaluateExpression(
      this.expression
    );
    this.textContent = varValue as string;
  }
}

customElements.define(config.components.var, VarComponent);
