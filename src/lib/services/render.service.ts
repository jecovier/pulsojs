import { ATTRIBUTES, RESERVED_ATTRIBUTES } from '../config';
import { AttributeService } from './attribute.service';
import { InterpreterService } from './interpreter.service';

export class RenderService {
  constructor(
    private attributeService: AttributeService,
    private interpreterService: InterpreterService
  ) {}

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

      if (key === ATTRIBUTES.VALUE) {
        const v = result == null ? '' : String(result);
        if (this.isFormControl(element)) element.value = v;
        element.setAttribute(ATTRIBUTES.VALUE, v);
        continue;
      }

      if (key === ATTRIBUTES.HIDDEN) {
        element.parentElement!.hidden = !!result;
      }

      if (result === false || result == null) element.removeAttribute(key);
      else element.setAttribute(key, String(result));
    }
  }

  private applyReservedDirectives(element: HTMLElement) {
    const textAttr = this.attributeService.get(RESERVED_ATTRIBUTES.TEXT);
    if (textAttr) {
      const textValue = this.interpreterService.evaluateExpression(textAttr);
      element.textContent = textValue == null ? '' : String(textValue);
    }
  }
}
