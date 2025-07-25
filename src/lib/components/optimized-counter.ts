import { config } from '../config';
import { BaseComponent } from './base-component';
import { renderOptimizer } from '../utils/render-optimizer';

/**
 * Optimized Counter Component - Demonstrates re-render optimization
 *
 * This component shows how the re-render optimization works:
 * - Only re-renders when the count actually changes
 * - Uses debounced rendering to prevent excessive updates
 * - Tracks performance metrics
 * - Provides debugging information
 */
class OptimizedCounterComponent extends BaseComponent {
  private count: number = 0;
  private lastRenderedCount: number = 0;
  private updateInterval: number | null = null;
  private isRunning: boolean = false;

  connectedCallback() {
    this.initializeAttributes();
    this.setupEventListeners();
    this.render();
  }

  private initializeAttributes() {
    const initialCount = this.getAttribute('initial') || '0';
    this.count = parseInt(initialCount, 10) || 0;
  }

  private setupEventListeners() {
    // Add increment button
    const incrementBtn = document.createElement('button');
    incrementBtn.textContent = 'Increment';
    incrementBtn.addEventListener('click', () => this.increment());
    this.appendChild(incrementBtn);

    // Add decrement button
    const decrementBtn = document.createElement('button');
    decrementBtn.textContent = 'Decrement';
    decrementBtn.addEventListener('click', () => this.decrement());
    this.appendChild(decrementBtn);

    // Add auto-update toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Start Auto';
    toggleBtn.addEventListener('click', () => this.toggleAutoUpdate(toggleBtn));
    this.appendChild(toggleBtn);

    // Add performance info button
    const perfBtn = document.createElement('button');
    perfBtn.textContent = 'Show Stats';
    perfBtn.addEventListener('click', () => this.showPerformanceStats());
    this.appendChild(perfBtn);

    // Add display element
    const display = document.createElement('div');
    display.id = 'counter-display';
    display.style.fontSize = '24px';
    display.style.margin = '10px 0';
    this.appendChild(display);
  }

  private increment() {
    this.count++;
    this.debouncedRender(() => this.render(), ['count']);
  }

  private decrement() {
    this.count--;
    this.debouncedRender(() => this.render(), ['count']);
  }

  private toggleAutoUpdate(button: HTMLButtonElement) {
    if (this.isRunning) {
      this.stopAutoUpdate();
      button.textContent = 'Start Auto';
    } else {
      this.startAutoUpdate();
      button.textContent = 'Stop Auto';
    }
  }

  private startAutoUpdate() {
    this.isRunning = true;
    this.updateInterval = window.setInterval(() => {
      this.count++;
      // Use debounced render to prevent excessive updates
      this.debouncedRender(() => this.render(), ['count'], 100);
    }, 50); // Update every 50ms but render at most every 100ms
  }

  private stopAutoUpdate() {
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private render() {
    const display = this.querySelector('#counter-display') as HTMLElement;
    if (!display) return;

    // Only update DOM if the count has actually changed
    if (this.count !== this.lastRenderedCount) {
      display.textContent = `Count: ${this.count}`;
      this.lastRenderedCount = this.count;
    }
  }

  private showPerformanceStats() {
    const stats = renderOptimizer.getComponentStats(this.constructor.name);
    const summary = renderOptimizer.getPerformanceSummary();

    console.group('🔍 Optimized Counter Performance Stats');
    console.log('Component Stats:', stats);
    console.log('Performance Summary:', summary);
    console.log('Top Renderers:', renderOptimizer.getTopRenderers(5));
    console.log('Lowest Skip Rates:', renderOptimizer.getLowestSkipRates(5));
    console.groupEnd();
  }

  disconnectedCallback() {
    this.stopAutoUpdate();
    super.disconnectedCallback();
  }
}

// Define the component
customElements.define('r-optimized-counter', OptimizedCounterComponent);

// Export for use in other modules
export { OptimizedCounterComponent };
