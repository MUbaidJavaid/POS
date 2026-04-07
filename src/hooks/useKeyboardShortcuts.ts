import { useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Ctrl+N: New transaction (clear cart)
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        useCartStore.getState().clearCart();
        toast.info('Cart cleared — new transaction');
        return;
      }

      // Ctrl+S: Hold cart
      if (ctrl && e.key === 's') {
        e.preventDefault();
        const state = useCartStore.getState();
        if (state.items.length > 0) {
          state.holdCart();
          toast.success('Cart held for later');
        } else {
          toast.error('Cart is empty');
        }
        return;
      }

      // Ctrl+F: Focus search
      if (ctrl && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
        return;
      }

      // Ctrl+P: Print (let browser handle but toast)
      if (ctrl && e.key === 'p') {
        // Don't prevent — let browser print dialog open
        return;
      }

      // ESC: Close modals (handled by radix, but blur inputs)
      if (e.key === 'Escape' && isInput) {
        (e.target as HTMLElement).blur();
        return;
      }

      // F1: Show shortcuts help
      if (e.key === 'F1') {
        e.preventDefault();
        toast.info(
          'Shortcuts: Ctrl+N (New), Ctrl+S (Hold), Ctrl+F (Search), Ctrl+P (Print), ESC (Close)',
          { duration: 5000 }
        );
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
