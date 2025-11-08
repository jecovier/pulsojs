import { config } from '../config';
import { AttributeService } from '../services/attribute.service';
import { InterpreterService } from '../services/interpreter.service';
import { StateService } from '../services/state.service';
import { Signal } from '../utils/signal';
import { StateComponent } from './state';

export class BaseComponent extends HTMLElement {
  protected attributeService: AttributeService;
  protected stateService: StateService;
  protected state!: Record<string, unknown>;
  protected interpreterService!: InterpreterService;
  protected unsubscribeFunctions: Map<string, () => void> = new Map();
  private cleanupStateReadyListener?: () => void;
  private isInitialized = false;

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

    const onStateReady = (event: Event) => {
      if (event.target !== state) {
        return;
      }

      this.cleanupStateReadyListener?.();
      this.cleanupStateReadyListener = undefined;
      this.initialize();
    };

    state.addEventListener(config.state.readyEvent, onStateReady);
    this.cleanupStateReadyListener = () =>
      state.removeEventListener(config.state.readyEvent, onStateReady);
  }

  disconnectedCallback() {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions.clear();
    this.cleanupStateReadyListener?.();
    this.cleanupStateReadyListener = undefined;
    this.isInitialized = false;
  }

  protected initialize() {
    if (!document.contains(this)) {
      return;
    }

    if (this.isInitialized) {
      return;
    }

    this.state = this.stateService.getClosestState();
    this.interpreterService = new InterpreterService(this.state);
    this.subscribeToState();
    this.render();
    this.isInitialized = true;
  }

  protected render(): void {
    throw new Error('render() method must be implemented by child class');
  }

  protected subscribeToState() {
    const dependencies = this.attributeService.getDependencies(this.state);
    dependencies.forEach(dependency => {
      const signal = this.state[dependency] as Signal<unknown>;
      if (signal instanceof Signal) {
        this.unsubscribeFunctions.set(
          dependency,
          signal.subscribe(this.render.bind(this))
        );
      }
    });
  }
}
