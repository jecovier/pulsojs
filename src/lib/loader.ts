import { basenameFromUrl, ready, toTagName } from './utils';

const mapLinkedComponents = (links: Element[]) => {
  const componentsMap = new Map<string, string>();
  links.forEach(link => {
    const url = link.getAttribute('href') as string;
    const explicit =
      link.getAttribute('data-name') || link.getAttribute('name');
    const base = explicit || basenameFromUrl(url);
    const name = toTagName(base);
    componentsMap.set(name as string, url);
  });
  return componentsMap;
};

const loadComponent = async (url: string) => {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return html;
};

const getHtmlAndScripts = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const scripts = Array.from(doc.querySelectorAll('script'));
  scripts.forEach(script => script.remove());
  return {
    html: doc.body.innerHTML,
    scripts: scripts.map(script => script.textContent),
  };
};

const defineComponent = (name: string, html: string, scripts: string[]) => {
  if (customElements.get(name)) return;

  const compiledScripts = scripts
    .map((script, index) => {
      if (!script) return null;
      try {
        return new Function('element', 'html', `"use strict";\n${script}`) as (
          element: HTMLElement,
          html: string
        ) => unknown;
      } catch (err) {
        console.error(
          `[component-loader] Failed to compile inline script #${index} for <${name}>:`,
          err
        );
        return null;
      }
    })
    .filter(
      (fn): fn is (element: HTMLElement, html: string) => unknown =>
        typeof fn === 'function'
    );

  customElements.define(
    name,
    class extends HTMLElement {
      private initialized = false;
      private cleanups: Array<() => void> = [];

      static get observedAttributes() {
        return [];
      }

      connectedCallback() {
        if (this.initialized) return;
        this.render();
        this.initialized = true;
      }

      disconnectedCallback() {
        this.cleanups.forEach(cleanup => {
          try {
            cleanup();
          } catch (err) {
            console.error(
              `[component-loader] Cleanup error in <${name}>:`,
              err
            );
          }
        });
        this.cleanups = [];
        this.initialized = false;
      }

      private render() {
        this.innerHTML = html;
        this.runScripts();
      }

      private runScripts() {
        this.cleanups = [];
        compiledScripts.forEach(fn => {
          try {
            const result = fn(this, html);
            if (typeof result === 'function') {
              this.cleanups.push(() => result());
            }
          } catch (err) {
            console.error(
              `[component-loader] Error executing inline script in <${name}>:`,
              err
            );
          }
        });
      }
    }
  );
};

ready(async () => {
  const links = Array.from(
    document.head.querySelectorAll('link[rel="component"][href]')
  );

  if (!links.length) return;

  const componentsMap = mapLinkedComponents(links);
  componentsMap.forEach(async (url: string, name: string) => {
    try {
      const htmlContent = await loadComponent(url);

      const { html, scripts } = getHtmlAndScripts(htmlContent);
      defineComponent(name, html, scripts);
    } catch (err) {
      console.error(
        `[component-loader] Failed to load ${url} as <${name}>:`,
        err
      );
    }
  });
});
