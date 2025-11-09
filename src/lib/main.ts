import './components/state';
import './components/elm';
import './components/text';
import './components/for';
import './components/if';
import './components/echo';
import './loader';
import './api';
import { Signal } from './utils/signal';

declare global {
  interface Window {
    createSignal: (initial: unknown) => Signal<unknown>;
  }
}
