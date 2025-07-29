# IMPROVEMENTS.md

## Análisis de Mejoras y Optimizaciones para el Proyecto WComp

Este documento contiene todas las mejoras y optimizaciones identificadas en los archivos TypeScript del proyecto.

---

## 🚀 Optimizaciones de Rendimiento

### 1. **Signal Class (`src/lib/utils/signal.ts`)**

#### Problemas Identificados:

- **Memory Leaks**: El método `hasValueChanged` puede ser costoso para objetos grandes
- **Proxy Overhead**: Creación innecesaria de proxies para objetos simples
- **Subscription Management**: No hay límite en el número de suscriptores

#### Mejoras Propuestas:

```typescript
// Optimización 1: Cache para comparaciones de objetos
private _comparisonCache = new WeakMap<object, number>();

private hasValueChanged(newValue: T): boolean {
  if (newValue === this._value) return false;

  // Para objetos grandes, usar hash simple
  if (typeof newValue === 'object' && newValue !== null) {
    const newHash = this._getObjectHash(newValue);
    const oldHash = this._getObjectHash(this._value as object);
    return newHash !== oldHash;
  }

  return newValue !== this._value;
}

// Optimización 2: Límite de suscriptores
private static readonly MAX_SUBSCRIBERS = 1000;

subscribe(subscriber: () => void): void {
  if (this._subscribers.size >= Signal.MAX_SUBSCRIBERS) {
    console.warn('Signal: Maximum subscribers reached');
    return;
  }
  this._subscribers.add(subscriber);
}
```

### 2. **InterpreterService (`src/lib/services/interpreter.service.ts`)**

#### Problemas Identificados:

- **Function Cache**: El cache puede crecer indefinidamente
- **Memory Leaks**: No hay limpieza del cache
- **Security**: Uso de `new Function()` puede ser peligroso

#### Mejoras Propuestas:

```typescript
export class InterpreterService {
  private functionCache = new Map<string, Function>();
  private static readonly MAX_CACHE_SIZE = 1000;

  // Limpieza automática del cache
  private cleanupCache() {
    if (this.functionCache.size > InterpreterService.MAX_CACHE_SIZE) {
      const entries = Array.from(this.functionCache.entries());
      const toDelete = entries.slice(0, entries.length / 2);
      toDelete.forEach(([key]) => this.functionCache.delete(key));
    }
  }

  // Validación de código más segura
  private validateCode(code: string): boolean {
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
    ];
    return !dangerousPatterns.some(pattern => pattern.test(code));
  }
}
```

### 3. **AttributeService (`src/lib/services/attribute.service.ts`)**

#### Problemas Identificados:

- **Regex Performance**: Expresiones regulares compiladas en cada llamada
- **Array Iterations**: Múltiples iteraciones sobre los mismos datos

#### Mejoras Propuestas:

```typescript
export class AttributeService {
  // Cache de regex compiladas
  private static readonly EXPRESSION_REGEX = /^{.*}$/;
  private static readonly WORD_REGEX = /\b(?!\d+\b)\w+\b/g;

  // Optimización de iteraciones
  public getDependencies(context: Record<string, unknown>): string[] {
    const dependencies = new Set<string>();
    const contextKeys = new Set(Object.keys(context));

    Array.from(this.attributes).forEach(attr => {
      if (this.isExpression(attr.value.trim())) {
        const words = this.extractWords(attr.value);
        words.forEach(word => {
          if (contextKeys.has(word)) {
            dependencies.add(word);
          }
        });
      }
    });

    return Array.from(dependencies);
  }
}
```

---

## 🏗️ Mejoras Arquitectónicas

### 1. **Sistema de Eventos Personalizados**

#### Implementación del TODO: Custom Event para State

```typescript
// Nuevo servicio: EventService
export class EventService {
  private static instance: EventService;
  private eventTarget = new EventTarget();

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  emit(eventName: string, data?: any) {
    this.eventTarget.dispatchEvent(
      new CustomEvent(eventName, { detail: data })
    );
  }

  on(eventName: string, callback: (event: CustomEvent) => void) {
    this.eventTarget.addEventListener(eventName, callback as EventListener);
  }

  off(eventName: string, callback: (event: CustomEvent) => void) {
    this.eventTarget.removeEventListener(eventName, callback as EventListener);
  }
}

// Modificación en StateComponent
export class StateComponent extends HTMLElement {
  connectedCallback() {
    // ... código existente ...

    // Emitir evento cuando el state esté listo
    EventService.getInstance().emit('state:ready', {
      stateId: this.getAttribute('id'),
      signals: this.signals,
    });
  }
}

// Modificación en reactiveComponent
export class reactiveComponent extends HTMLElement {
  connectedCallback() {
    // Esperar a que el state esté listo
    EventService.getInstance().on('state:ready', event => {
      this.initializeComponent();
    });
  }

  private initializeComponent() {
    // ... lógica de inicialización ...
  }
}
```

### 2. **Hook System para State**

#### Implementación del TODO: Hook para State

```typescript
// Nuevo archivo: src/lib/hooks/useState.ts
export function useState<T>(
  stateId: string,
  key: string
): [T, (value: T) => void] {
  const stateElement = document.querySelector(
    `[data-state-id="${stateId}"]`
  ) as StateComponent;
  if (!stateElement) {
    throw new Error(`State with id "${stateId}" not found`);
  }

  const signals = stateElement.getSignals();
  const signal = signals[key] as Signal<T>;

  if (!signal) {
    throw new Error(`Signal "${key}" not found in state "${stateId}"`);
  }

  const setValue = (value: T) => {
    signal.value = value;
  };

  return [signal.value, setValue];
}

// Uso:
// const [name, setName] = useState('myState', 'name');
// setName('John');
```

### 3. **Sistema de Lifecycle Hooks**

```typescript
// Nuevo archivo: src/lib/hooks/lifecycle.ts
export interface LifecycleHooks {
  onMount?: () => void;
  onUnmount?: () => void;
  onUpdate?: () => void;
}

export class LifecycleManager {
  private hooks: LifecycleHooks;

  constructor(hooks: LifecycleHooks) {
    this.hooks = hooks;
  }

  mount() {
    this.hooks.onMount?.();
  }

  unmount() {
    this.hooks.onUnmount?.();
  }

  update() {
    this.hooks.onUpdate?.();
  }
}
```

---

## 🔧 Mejoras de Código

### 1. **TypeScript Strict Mode**

#### Configuración recomendada en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 2. **Error Handling Mejorado**

```typescript
// Nuevo archivo: src/lib/utils/error-handler.ts
export class ErrorHandler {
  static handle(error: Error, context: string) {
    console.error(`[${context}] Error:`, error);

    // En desarrollo, mostrar error en UI
    if (process.env.NODE_ENV === 'development') {
      this.showErrorInUI(error, context);
    }
  }

  private static showErrorInUI(error: Error, context: string) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'wcomp-error';
    errorDiv.innerHTML = `
      <h3>Error in ${context}</h3>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    `;
    document.body.appendChild(errorDiv);
  }
}
```

### 3. **Logging System**

```typescript
// Nuevo archivo: src/lib/utils/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static level = LogLevel.INFO;

  static setLevel(level: LogLevel) {
    Logger.level = level;
  }

  static debug(message: string, ...args: any[]) {
    if (Logger.level <= LogLevel.DEBUG) {
      console.debug(`[WComp DEBUG] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: any[]) {
    if (Logger.level <= LogLevel.INFO) {
      console.info(`[WComp INFO] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: any[]) {
    if (Logger.level <= LogLevel.WARN) {
      console.warn(`[WComp WARN] ${message}`, ...args);
    }
  }

  static error(message: string, ...args: any[]) {
    if (Logger.level <= LogLevel.ERROR) {
      console.error(`[WComp ERROR] ${message}`, ...args);
    }
  }
}
```

---

## 🎯 Optimizaciones Específicas

### 1. **Component.ts - Memory Management**

```typescript
export class reactiveComponent extends HTMLElement {
  // Usar WeakMap para evitar memory leaks
  private eventListeners = new WeakMap<
    HTMLElement,
    Map<string, EventListener>
  >();

  // Debounce para render
  private renderDebounced = this.debounce(this.render.bind(this), 16);

  private debounce(func: Function, wait: number) {
    let timeout: number;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}
```

### 2. **ForComponent - Virtual Scrolling**

```typescript
// Para listas grandes, implementar virtual scrolling
export class VirtualForComponent extends ForComponent {
  private itemHeight = 50;
  private visibleItems = 10;
  private scrollContainer: HTMLElement;

  private renderVirtual() {
    const scrollTop = this.scrollContainer.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + this.visibleItems,
      this.items.length
    );

    // Renderizar solo elementos visibles
    this.renderVisibleItems(startIndex, endIndex);
  }
}
```

### 3. **StateService - Caching Inteligente**

```typescript
export class StateService {
  private stateCache = new Map<string, StateComponent>();

  public getParentState(): StateComponent {
    const cacheKey = this.element.tagName + this.element.className;

    if (this.stateParentCache) {
      return this.stateParentCache;
    }

    // Buscar en cache primero
    if (this.stateCache.has(cacheKey)) {
      const cached = this.stateCache.get(cacheKey)!;
      if (cached.isConnected) {
        this.stateParentCache = cached;
        return cached;
      } else {
        this.stateCache.delete(cacheKey);
      }
    }

    const scopeParent = this.element.closest(config.components.state);
    if (!scopeParent) {
      throw new Error(`State component not found`);
    }

    this.stateParentCache = scopeParent as StateComponent;
    this.stateCache.set(cacheKey, this.stateParentCache);
    return this.stateParentCache;
  }
}
```

---

## 📊 Métricas y Monitoreo

### 1. **Performance Monitoring**

```typescript
// Nuevo archivo: src/lib/utils/performance.ts
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(duration);

      // Log si es lento
      if (duration > 16) {
        // 60fps threshold
        Logger.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  static getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    return {
      count: values.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }
}
```

### 2. **Memory Usage Tracking**

```typescript
// Nuevo archivo: src/lib/utils/memory.ts
export class MemoryTracker {
  static track() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      Logger.debug('Memory usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
      });
    }
  }
}
```

---

## 🧪 Testing y Debugging

### 1. **Debug Mode**

```typescript
// Modificación en config.ts
export const config = {
  debug: process.env.NODE_ENV === 'development',
  components: {
    component: 'x-component',
    state: 'x-state',
    var: 'x-var',
    for: 'x-for',
  },
  performance: {
    enableMetrics: true,
    logSlowOperations: true,
    trackMemory: true,
  },
};
```

### 2. **Component Inspector**

```typescript
// Nuevo archivo: src/lib/debug/inspector.ts
export class ComponentInspector {
  static inspect(element: HTMLElement) {
    if (!config.debug) return;

    const info = {
      tagName: element.tagName,
      attributes: Array.from(element.attributes).map(attr => ({
        name: attr.name,
        value: attr.value,
      })),
      children: element.children.length,
      signals:
        element instanceof StateComponent
          ? Object.keys(element.getSignals())
          : [],
    };

    console.log('Component Info:', info);
  }
}
```

---

## 📝 Resumen de Prioridades

### 🔴 Alta Prioridad (Crítico)

1. **Memory Leaks**: Implementar limpieza automática en Signal y InterpreterService
2. **Error Handling**: Sistema robusto de manejo de errores
3. **Custom Events**: Implementar el sistema de eventos para state loading

### 🟡 Media Prioridad (Importante)

1. **Performance Monitoring**: Métricas de rendimiento
2. **TypeScript Strict Mode**: Configuración más estricta
3. **Hook System**: Implementar useState hook

### 🟢 Baja Prioridad (Mejoras)

1. **Virtual Scrolling**: Para listas grandes
2. **Debug Tools**: Inspector de componentes
3. **Logging System**: Sistema de logs estructurado

---

## 🚀 Próximos Pasos

1. **Implementar Custom Events** para el sistema de state
2. **Agregar Memory Management** en Signal class
3. **Configurar TypeScript Strict Mode**
4. **Implementar Error Handling** robusto
5. **Crear sistema de Performance Monitoring**
6. **Desarrollar Hook System** para state management

---

_Documento generado automáticamente basado en análisis de código TypeScript_
