import './signals';
import './components/scope';
import './components/variable';
import './components/if';
import './components/for';

// Import development tools (only in development)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  import('./utils/dev-tools');
  import('./utils/memory-monitor');
  import('./utils/for-debugger').then(() => {
    // Enable for debugger in development
    (window as any).forDebugger?.enable();
  });
}
