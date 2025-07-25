# Mejoras Sugeridas para WComp

## Resumen del Proyecto

WComp es una biblioteca de componentes web reactivos que implementa un sistema de señales (signals) similar a frameworks modernos como SolidJS. El proyecto utiliza Web Components nativos con TypeScript y proporciona componentes como `r-scope`, `r-var`, `r-if`, y `r-for`.

## Mejoras Prioritarias

### 1. **Gestión de Memoria y Performance**

#### 1.1 Optimización de Cleanup

```typescript
// Problema actual: Cleanup manual en múltiples lugares
// Mejora: Implementar un sistema de cleanup automático
class BaseComponent extends HTMLElement {
  private cleanupRegistry = new Set<() => void>();

  protected registerCleanup(cleanupFn: () => void) {
    this.cleanupRegistry.add(cleanupFn);
  }

  disconnectedCallback() {
    this.cleanupRegistry.forEach(cleanup => cleanup());
    this.cleanupRegistry.clear();
  }
}
```

#### 1.2 Memoización de Expresiones

```typescript
// Implementar cache inteligente para evaluaciones de expresiones
class ExpressionCache {
  private cache = new Map<
    string,
    { result: unknown; dependencies: string[]; timestamp: number }
  >();
  private maxAge = 5000; // 5 segundos

  evaluate(expression: string, context: Record<string, unknown>) {
    const cacheKey = this.createCacheKey(expression, context);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached.result;
    }

    const result = evaluateExpression(expression, context);
    this.cache.set(cacheKey, {
      result,
      dependencies: Object.keys(context),
      timestamp: Date.now(),
    });

    return result;
  }
}
```

### 2. **Arquitectura y Estructura**

#### 2.1 Sistema de Plugins

```typescript
// Crear un sistema de plugins para extender funcionalidad
interface WCompPlugin {
  name: string;
  version: string;
  install(app: WCompApp): void;
}

class WCompApp {
  private plugins = new Map<string, WCompPlugin>();

  use(plugin: WCompPlugin) {
    this.plugins.set(plugin.name, plugin);
    plugin.install(this);
  }
}
```

#### 2.2 Gestión de Estado Global

```typescript
// Implementar un store global para estado compartido
class GlobalStore {
  private static instance: GlobalStore;
  private stores = new Map<string, Signal<unknown>>();

  static getInstance(): GlobalStore {
    if (!GlobalStore.instance) {
      GlobalStore.instance = new GlobalStore();
    }
    return GlobalStore.instance;
  }

  createStore<T>(name: string, initialValue: T): Signal<T> {
    const signal = new Signal(initialValue);
    this.stores.set(name, signal);
    return signal;
  }

  getStore<T>(name: string): Signal<T> | undefined {
    return this.stores.get(name) as Signal<T>;
  }
}
```

### 3. **Mejoras en Componentes**

#### 3.1 Componente Switch/Case

```typescript
// Agregar soporte para switch/case
class SwitchComponent extends BaseComponent {
  private value: string = '';
  private cases = new Map<string, HTMLElement>();
  private defaultCase: HTMLElement | null = null;

  connectedCallback() {
    this.value = this.getRequiredAttribute('value');
    this.initializeCases();
    this.render();
  }

  private initializeCases() {
    this.querySelectorAll('template[data-case]').forEach(template => {
      const caseValue = template.getAttribute('data-case');
      if (caseValue === 'default') {
        this.defaultCase = this.createCaseElement(template);
      } else {
        this.cases.set(caseValue!, this.createCaseElement(template));
      }
    });
  }
}
```

#### 3.2 Componente Computed

```typescript
// Agregar componente para valores computados
class ComputedComponent extends BaseComponent {
  private expression: string = '';
  private signal: Signal<unknown> | null = null;

  connectedCallback() {
    this.expression = this.getRequiredAttribute('expression');
    this.createComputedSignal();
  }

  private createComputedSignal() {
    const scopeParent = this.getScopeParent();
    const computedName = this.getAttribute('name') || 'computed';

    this.signal = new Signal(null);
    scopeParent.setContext({ [computedName]: this.signal });

    this.subscribeToSignalDependencies(this.expression, () => {
      const result = evaluateExpression(this.expression, this.getSafeContext());
      this.signal!.value = result;
    });
  }
}
```

### 4. **Mejoras en el Sistema de Señales**

#### 4.1 Señales Derivadas (Computed Signals)

```typescript
class ComputedSignal<T> extends Signal<T> {
  private computation: () => T;
  private dependencies: Signal<unknown>[] = [];

  constructor(computation: () => T) {
    super(computation());
    this.computation = computation;
    this.setupDependencies();
  }

  private setupDependencies() {
    Signal.currentSubscribers.push(this.update.bind(this));
    this.computation();
    Signal.currentSubscribers.pop();
  }

  private update() {
    this.value = this.computation();
  }
}
```

#### 4.2 Batch Updates

```typescript
class SignalBatch {
  private static batchDepth = 0;
  private static pendingUpdates = new Set<Signal<unknown>>();

  static start() {
    this.batchDepth++;
  }

  static end() {
    this.batchDepth--;
    if (this.batchDepth === 0) {
      this.flush();
    }
  }

  static add(signal: Signal<unknown>) {
    this.pendingUpdates.add(signal);
  }

  private static flush() {
    this.pendingUpdates.forEach(signal => signal['_notify']());
    this.pendingUpdates.clear();
  }
}
```

### 5. **Mejoras en el Parser**

#### 5.1 Soporte para Expresiones Complejas

```typescript
// Mejorar el parser para soportar expresiones más complejas
class AdvancedParser extends Parser {
  private expressionCache = new Map<string, Function>();

  parseExpression(expression: string, context: Record<string, unknown>) {
    // Soporte para operadores ternarios, funciones, etc.
    const sanitizedExpression = this.sanitizeExpression(expression);
    return this.evaluateWithCache(sanitizedExpression, context);
  }

  private sanitizeExpression(expression: string): string {
    // Implementar sanitización más robusta
    return expression.replace(/[<>]/g, '');
  }
}
```

#### 5.2 Soporte para Directivas Personalizadas

```typescript
// Sistema de directivas personalizadas
interface Directive {
  name: string;
  priority: number;
  bind(
    element: HTMLElement,
    value: string,
    context: Record<string, unknown>
  ): void;
  unbind(element: HTMLElement): void;
}

class DirectiveManager {
  private directives = new Map<string, Directive>();

  register(directive: Directive) {
    this.directives.set(directive.name, directive);
  }

  processElement(element: HTMLElement, context: Record<string, unknown>) {
    [...element.attributes]
      .filter(attr => attr.name.startsWith('r-'))
      .forEach(attr => {
        const directiveName = attr.name.slice(2);
        const directive = this.directives.get(directiveName);
        if (directive) {
          directive.bind(element, attr.value, context);
        }
      });
  }
}
```

### 6. **Mejoras en el Sistema de Eventos**

#### 6.1 Event Modifiers

```typescript
// Soporte para modificadores de eventos (como Vue)
class EventModifierParser {
  private static modifiers = {
    prevent: (event: Event) => event.preventDefault(),
    stop: (event: Event) => event.stopPropagation(),
    once: (event: Event) =>
      event.target?.removeEventListener(event.type, arguments.callee),
    self: (event: Event) =>
      event.target === event.currentTarget ? null : event.preventDefault(),
  };

  static parseEventString(eventString: string): {
    event: string;
    modifiers: string[];
  } {
    const parts = eventString.split('.');
    return {
      event: parts[0],
      modifiers: parts.slice(1),
    };
  }

  static createModifiedListener(
    originalListener: EventListener,
    modifiers: string[]
  ): EventListener {
    return (event: Event) => {
      modifiers.forEach(modifier => {
        const modifierFn =
          this.modifiers[modifier as keyof typeof this.modifiers];
        if (modifierFn) modifierFn(event);
      });
      originalListener(event);
    };
  }
}
```

### 7. **Mejoras en el Sistema de Testing**

#### 7.1 Testing Utilities

```typescript
// Utilidades para testing
class WCompTestUtils {
  static createTestScope(state: Record<string, unknown> = {}): ScopeComponent {
    const scope = document.createElement('r-scope') as ScopeComponent;
    scope.setAttribute('state', JSON.stringify(state));
    document.body.appendChild(scope);
    return scope;
  }

  static waitForRender(component: BaseComponent): Promise<void> {
    return new Promise(resolve => {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        resolve();
      });
      observer.observe(component, { childList: true, subtree: true });
    });
  }

  static cleanup() {
    document
      .querySelectorAll('r-scope, r-var, r-if, r-for')
      .forEach(el => el.remove());
  }
}
```

### 8. **Mejoras en el Build System**

#### 8.1 Tree Shaking Optimizado

```typescript
// Configuración de Vite para mejor tree shaking
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          core: ['src/lib/main.ts'],
          components: ['src/lib/components/'],
          utils: ['src/lib/utils/'],
        },
      },
    },
  },
};
```

#### 8.2 Bundle Analysis

```typescript
// Agregar análisis de bundle
// package.json
{
  "scripts": {
    "analyze": "vite-bundle-analyzer",
    "build:analyze": "npm run build && npm run analyze"
  }
}
```

### 9. **Mejoras en la Documentación**

#### 9.1 JSDoc Completo

```typescript
/**
 * Base class for all WComp components
 * @abstract
 * @extends HTMLElement
 */
export abstract class BaseComponent extends HTMLElement {
  /**
   * Set of signal dependencies for this component
   * @protected
   */
  protected dependencies = new Set<string>();

  /**
   * Evaluates an expression in the current context
   * @param expression - The expression to evaluate
   * @returns The result of the evaluation
   * @throws {Error} If the expression cannot be evaluated
   */
  protected evaluateExpression(expression: string): unknown {
    // Implementation
  }
}
```

#### 9.2 Ejemplos Interactivos

```html
<!-- Crear ejemplos en la documentación -->
<r-scope state="{ count: 0, items: ['a', 'b', 'c'] }">
  <button r-onclick="count++">Increment</button>
  <r-var name="count"></r-var>

  <r-for each="items" as="item">
    <div r-onclick="console.log(item)">{{ item }}</div>
  </r-for>
</r-scope>
```

### 10. **Mejoras en el Sistema de Errores**

#### 10.1 Error Boundaries

```typescript
class ErrorBoundary extends BaseComponent {
  private hasError = false;
  private errorMessage = '';

  connectedCallback() {
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    const originalRender = this.render.bind(this);
    this.render = () => {
      try {
        originalRender();
      } catch (error) {
        this.handleError(error);
      }
    };
  }

  private handleError(error: Error) {
    this.hasError = true;
    this.errorMessage = error.message;
    this.innerHTML = `<div class="error">Error: ${this.errorMessage}</div>`;
  }
}
```

#### 10.2 Logging Mejorado

```typescript
class Logger {
  private static instance: Logger;
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  debug(message: string, ...args: unknown[]) {
    if (this.logLevel === 'debug') {
      console.debug(`[WComp Debug] ${message}`, ...args);
    }
  }

  error(message: string, error?: Error) {
    console.error(`[WComp Error] ${message}`, error);
  }
}
```

## Prioridades de Implementación

### Alta Prioridad

1. **Gestión de memoria mejorada** - Evitar memory leaks
2. **Sistema de cleanup automático** - Simplificar el manejo de recursos
3. **Memoización de expresiones** - Mejorar performance
4. **Error boundaries** - Mejor experiencia de desarrollo

### Media Prioridad

1. **Señales derivadas** - Funcionalidad avanzada
2. **Sistema de plugins** - Extensibilidad
3. **Componente switch/case** - Más opciones de control de flujo
4. **Event modifiers** - Mejor UX para eventos

### Baja Prioridad

1. **Bundle analysis** - Optimización de build
2. **Testing utilities** - Mejor testing
3. **Documentación interactiva** - Mejor DX
4. **Logging avanzado** - Debugging

## Conclusión

Estas mejoras transformarían WComp en una biblioteca más robusta, performante y fácil de usar. La implementación debería seguir un enfoque incremental, priorizando las mejoras de memoria y performance primero, seguidas por las funcionalidades avanzadas y finalmente las mejoras de DX.
