import { config } from '../config';
import { HTML_EVENTS } from '../constants';
import { executeCode } from '.';

export class Parser {
  private trackedListeners = new Map<HTMLElement, Map<string, EventListener>>();

  constructor(private target: HTMLElement) {}

  parse() {
    const doc = new DOMParser().parseFromString(
      this.target.innerHTML,
      'text/html'
    );
    return doc.querySelectorAll(config.components.scope);
  }

  private getQuerySelectorWithoutNestedScopeTags(selectors: string[]) {
    const scopeTags = [config.components.scope, config.components.for];
    const avoidScopeTags = (selector: string) =>
      scopeTags.map(tag => `:not(${tag} ${selector})`).join();

    return selectors
      .map(selector => `${selector}${avoidScopeTags(selector)}`)
      .join(', ');
  }

  public replaceEventsWithReactiveListeners(context: Record<string, unknown>) {
    const querySelector = this.getQuerySelectorWithoutNestedScopeTags(
      HTML_EVENTS.map(event => `[${event}]`)
    );

    this.target.querySelectorAll(querySelector).forEach(element => {
      [...element.attributes]
        .filter(attr => HTML_EVENTS.includes(attr.name))
        .forEach(attr => {
          const eventName = attr.name.replace(/^on/, '').toLowerCase();
          const listener = () => executeCode(attr.value.trim(), context);

          this.trackEventListener(element as HTMLElement, eventName, listener);
          element.addEventListener(eventName, listener);
          element.removeAttribute(attr.name);
        });
    });
  }

  private trackEventListener(
    element: HTMLElement,
    event: string,
    listener: EventListener
  ) {
    if (!this.trackedListeners.has(element)) {
      this.trackedListeners.set(element, new Map());
    }
    this.trackedListeners.get(element)!.set(event, listener);
  }

  public cleanupEventListeners() {
    this.trackedListeners.forEach((elementListeners, element) => {
      elementListeners.forEach((listener, event) => {
        element.removeEventListener(event, listener);
      });
      elementListeners.clear();
    });
    this.trackedListeners.clear();
  }

  public getTrackedListeners() {
    return this.trackedListeners;
  }
}
