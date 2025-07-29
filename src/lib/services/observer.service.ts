export class ObserverService {
  private observers: Map<string, MutationObserver> = new Map();

  constructor(private element: HTMLElement) {}

  public connect(attributeName: string, callback: () => void) {
    if (this.observers.has(attributeName)) return;

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === attributeName
        ) {
          callback();
          break;
        }
      }
    });

    observer.observe(this.element, {
      attributes: true,
      attributeFilter: [attributeName],
    });
    this.observers.set(attributeName, observer);
  }

  public disconnectAll() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}
