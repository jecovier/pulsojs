import { RESERVED_ATTRIBUTES } from '../config';
import { AttributeService } from './attribute.service';
import { InterpreterService } from './interpreter.service';

export class RenderService {
  private template: HTMLElement | null;

  constructor(
    private attributeService: AttributeService,
    private interpreterService: InterpreterService
  ) {}

  public getTargetElement(element: HTMLElement) {
    const asElementAttribute = this.attributeService.getRaw(
      RESERVED_ATTRIBUTES.AS
    );
    const requiredTemplate = this.verifyIfRequiresTemplate();
    this.template = this.getTemplate(element);

    if (requiredTemplate && !this.template) {
      this.template = this.wrapElementContent(element, 'template');
    }

    if (!asElementAttribute) return element;

    const target = this.template || element;
    const wrapper = this.wrapElementContent(target, asElementAttribute);
    this.moveStaticAttributesTo(wrapper);
    return wrapper;
  }

  public getTemplate(element: HTMLElement) {
    return element.querySelector(
      ':scope > template:not([id])'
    ) as HTMLTemplateElement | null;
  }

  public wrapElementContent(element: HTMLElement, tag: string): HTMLElement {
    const wrapper = document.createElement(tag);
    wrapper.innerHTML = element.innerHTML;
    element.innerHTML = '';
    element.appendChild(wrapper);
    return wrapper;
  }

  public moveStaticAttributesTo(element: HTMLElement) {
    const staticAttributes = this.attributeService.getStaticAttributes();
    staticAttributes.forEach(({ name, value }) => {
      this.attributeService.remove(name);
      element.setAttribute(name, value);
    });
  }

  public render({
    element,
    attributes,
  }: {
    element: HTMLElement;
    attributes: Map<string, string>;
  }) {
    const shouldRender = this.verifyIfShouldRender();

    if (!shouldRender) {
      element.innerHTML = '';
      return;
    }

    if (shouldRender && this.template && !element.innerHTML) {
      this.renderTemplate(element, this.template);
    }

    this.updateAttributes(element, attributes);
    this.showElement(element);
    this.setValue(element);
  }

  private renderTemplate(element: HTMLElement, template: HTMLElement) {
    element.innerHTML = template?.innerHTML || '';
  }

  private verifyIfRequiresTemplate() {
    return !!this.attributeService.get(RESERVED_ATTRIBUTES.IF);
  }

  private verifyIfShouldRender() {
    const ifAttribute = this.attributeService.get(RESERVED_ATTRIBUTES.IF);
    if (!ifAttribute) return true;

    return this.interpreterService.evaluateExpression(ifAttribute);
  }

  private updateAttributes(
    element: HTMLElement,
    attributes: Map<string, string>
  ) {
    attributes.forEach((value, key) => {
      const result = this.interpreterService.evaluateExpression(value);
      element.setAttribute(key, result as string);

      if (key === 'value') {
        (element as HTMLInputElement).value = result as string;
      }
    });
  }

  private showElement(element: HTMLElement) {
    const showAttribute = this.attributeService.get(RESERVED_ATTRIBUTES.SHOW);
    if (!showAttribute) return;
    const result = this.interpreterService.evaluateExpression(showAttribute);
    element.style.display = result ? 'block' : 'none';
  }

  private setValue(element: HTMLElement) {
    const valueAttribute = this.attributeService.get(RESERVED_ATTRIBUTES.VALUE);
    if (!valueAttribute) return;

    const result = this.interpreterService.evaluateExpression(valueAttribute);
    element.innerHTML = result as string;
  }
}
