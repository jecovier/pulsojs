import './signals';
import './components/scope';
import './components/variable';
import './components/if';
import './components/for';
import { renderOptimizer } from './utils/render-optimizer';

// Import development tools (only in development)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  import('./utils/dev-tools');
  import('./utils/memory-monitor');
  import('./utils/for-debugger').then(() => {
    // Enable for debugger in development
    (window as any).forDebugger?.enable();
  });

  // Enable render optimizer debug mode in development
  renderOptimizer.enableDebugMode();

  // Expose render optimizer to window for debugging
  (window as any).renderOptimizer = renderOptimizer;

  console.log('🚀 WComp initialized with re-render optimization enabled');
  console.log('🔍 Use window.renderOptimizer to access performance tools');
}
