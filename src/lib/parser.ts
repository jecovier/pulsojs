import { config } from './config';
import { HTML_EVENTS } from './constants';
import { executeCode } from './utils';
import { BaseComponent } from './components/base-component';
import { memoryMonitor } from './utils/memory-monitor';

export class Parser {
  private trackedListeners: Map<HTMLElement, Map<string, EventListener>> =
    new Map();

  constructor(private target: HTMLElement) {}

  parse() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.target.innerHTML, 'text/html');
    const elements = doc.querySelectorAll(config.components.scope);
    return elements;
  }

  private getQuerySelectorWithoutNestedScopeTags(selectors: string[]) {
    const scopeTags = [config.components.scope, config.components.for];
    const avoidScopeTags = (selector: string) =>
      scopeTags.map(tag => `:not(${tag} ${selector})`).join();

    return selectors
      .map(selector => {
        const avoidNestedScopeTags = avoidScopeTags(selector);
        return `${selector}${avoidNestedScopeTags}`;
      })
      .join(', ');
  }

  public replaceEventsWithReactiveListeners(context: Record<string, unknown>) {
    const eventsSelector = HTML_EVENTS.map(event => `[${event}]`);
    const querySelector =
      this.getQuerySelectorWithoutNestedScopeTags(eventsSelector);
    const eventListenerElements = this.target.querySelectorAll(querySelector);

    eventListenerElements.forEach(element => {
      const attributes = element.attributes;

      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];

        if (HTML_EVENTS.includes(attr.name)) {
          const eventName = attr.name.replace(/^on/, '').toLowerCase();
          const eventContent = attr.value.trim();

          const listener = () => {
            executeCode(eventContent, context);
          };

          // Track the listener for cleanup
          this.trackEventListener(element as HTMLElement, eventName, listener);

          element.addEventListener(eventName, listener);
          element.removeAttribute(attr.name);

          // Track event listener creation
          memoryMonitor.trackEventListener(element.tagName);

          // Adjust index since we removed an attribute
          i--;
        }
      }
    });
  }

  /**
   * Track event listener for cleanup
   */
  private trackEventListener(
    element: HTMLElement,
    event: string,
    listener: EventListener
  ) {
    if (!this.trackedListeners.has(element)) {
      this.trackedListeners.set(element, new Map());
    }

    const elementListeners = this.trackedListeners.get(element)!;
    elementListeners.set(event, listener);
  }

  /**
   * Cleanup all tracked event listeners
   */
  public cleanupEventListeners() {
    this.trackedListeners.forEach((elementListeners, element) => {
      elementListeners.forEach((listener, event) => {
        element.removeEventListener(event, listener);
        // Track event listener removal
        memoryMonitor.untrackEventListener(element.tagName);
      });
      elementListeners.clear();
    });
    this.trackedListeners.clear();
  }

  /**
   * Get all tracked event listeners for debugging
   */
  public getTrackedListeners() {
    return this.trackedListeners;
  }
}
