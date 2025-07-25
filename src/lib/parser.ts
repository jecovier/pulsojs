import { config } from './config';
import { HTML_EVENTS } from './constants';
import { executeCode } from './utils';

export class Parser {
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

          element.addEventListener(eventName, () => {
            executeCode(eventContent, context);
          });

          element.removeAttribute(attr.name);
          // Adjust index since we removed an attribute
          i--;
        }
      }
    });
  }
}
