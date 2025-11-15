import { Attributes, Components, Events } from '../config';
import {
  getInterpreterService,
  InterpreterService,
} from '../services/interpreter.service';
import { getDependencies, isExpression, unwrapExpr } from '../utils';
import { Signal } from '../utils/signal';
import { ContextComponent } from './context';

export class Component extends HTMLElement {
  private defaultContent: Node[] = [];
  private isInitialized = false;
  protected unSubscribers = new Set<() => void>();
  protected context: ContextComponent | null = null;
  protected eventListeners: Map<string, EventListener> = new Map();

  constructor(
    protected readonly interpreterService: InterpreterService = getInterpreterService()
  ) {
    super();
    this.captureDefaultContent();
  }

  connectedCallback() {
    const attributeValue = this.getAttribute(Attributes.VALUE);

    this.context = this.getClosestContext();
    this.isInitialized = this.context?.isReady() ?? true;

    this.unsubscribeFromSignals();
    this.subscribeToSignals(attributeValue);
    this.update();
  }

  disconnectedCallback() {
    this.unsubscribeFromSignals();
    this.unsubscribeFromEvents();
  }

  static get observedAttributes() {
    return [Attributes.VALUE];
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null
  ) {
    if (name === Attributes.VALUE && this.isInitialized) {
      this.unsubscribeFromSignals();
      this.subscribeToSignals(newValue);
      this.render(newValue);
    }
  }

  private subscribeToSignals(newValue: string | null) {
    if (!newValue) return;

    const dependencies = getDependencies(
      newValue,
      this.context?.getContext() ?? {},
      this.interpreterService
    );

    dependencies.forEach(dependency => {
      const unsubscribe = dependency.subscribe(this.update.bind(this));
      this.unSubscribers.add(unsubscribe);
    });
  }

  private unsubscribeFromEvents() {
    this.eventListeners.forEach((handler, eventName) => {
      this.removeEventListener(eventName, handler);
    });
    this.eventListeners.clear();
  }

  private unsubscribeFromSignals() {
    this.unSubscribers.forEach(unsubscribe => unsubscribe());
    this.unSubscribers.clear();
  }

  private captureDefaultContent() {
    if (this.defaultContent.length > 0) return;
    this.defaultContent = Array.from(this.childNodes).map(node =>
      node.cloneNode(true)
    );
  }

  protected showDefaultContent() {
    if (this.defaultContent.length === 0) {
      this.textContent = '';
      return;
    }

    this.replaceChildren(
      ...this.defaultContent.map(node => node.cloneNode(true))
    );
  }

  protected copyDefaultContent() {
    return this.defaultContent.map(node => node.cloneNode(true));
  }

  private getClosestContext(): ContextComponent | null {
    const context = this.closest(Components.CONTEXT);

    if (!(context instanceof ContextComponent)) {
      return null;
    }

    if (!context.isReady()) {
      this.isInitialized = false;
      context.addEventListener(
        Events.CONTEXT_READY,
        this.connectedCallback.bind(this)
      );
    }

    return context;
  }

  protected update() {
    if (!this.isInitialized) return;
    this.render(this.getAttribute(Attributes.VALUE));
  }

  protected render(value: string | null): void {
    throw new Error(
      `render() method must be implemented by child class: ${value}`
    );
  }

  protected evaluateExpression(value: string | null): unknown {
    if (value === null) {
      return null;
    }

    if (!isExpression(value)) {
      return String(value);
    }

    const expr = unwrapExpr(value);
    const context = this.context?.getContext() ?? {};

    try {
      const result = this.interpreterService.evaluateExpression(expr, context);

      if (!result) {
        return null;
      }

      if (result instanceof Signal) {
        return result.value;
      }

      return result;
    } catch (error) {
      console.error('Error evaluating expression', expr, error);
      return null;
    }
  }
}
