import { RESERVED_ATTRIBUTES } from '../config';
import { AttributeService } from './attribute.service';
import { InterpreterService } from './interpreter.service';

export class RenderService {
  constructor(
    private attributeService: AttributeService,
    private interpreterService: InterpreterService
  ) {}

  public static generateTemplate(shadow: ShadowRoot) {
    const template = document.createElement('slot');
    shadow.appendChild(template);
    return template;
  }

  public render({
    element,
    attributes,
  }: {
    element: HTMLElement;
    attributes: Map<string, string>;
  }) {
    this.updateAttributes(element, attributes);
    this.applyReservedDirectives(element);
  }

  private isFormControl(
    el: Element
  ): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
    return (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    );
  }

  private updateAttributes(
    element: HTMLElement,
    attributes: Map<string, string>
  ) {
    for (const [key, expr] of attributes) {
      const result = this.interpreterService.evaluateExpression(expr);

      if (key === 'value') {
        const v = result == null ? '' : String(result);
        if (this.isFormControl(element)) element.value = v;
        element.setAttribute('value', v);
        continue;
      }

      if (key === 'hidden') {
        element.parentElement!.hidden = !!result;
      }

      if (result === false || result == null) element.removeAttribute(key);
      else element.setAttribute(key, String(result));
    }
  }

  private applyReservedDirectives(element: HTMLElement) {
    const valueAttr = this.attributeService.get(RESERVED_ATTRIBUTES.VALUE);
    if (valueAttr) {
      const v = this.interpreterService.evaluateExpression(valueAttr);
      element.textContent = v == null ? '' : String(v);
    }
  }
}
