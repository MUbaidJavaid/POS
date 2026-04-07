import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types/pos';
import { generateId } from '@/utils/pos-utils';

export interface HeldCart {
  id: string;
  items: CartItem[];
  customerId: string | null;
  timestamp: string;
  label: string;
}

interface CartStore {
  items: CartItem[];
  cartDiscount: number;
  cartDiscountType: 'percentage' | 'fixed';
  selectedCustomerId: string | null;
  heldCarts: HeldCart[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setItemDiscount: (productId: string, discount: number, type: 'percentage' | 'fixed') => void;
  setCartDiscount: (discount: number, type: 'percentage' | 'fixed') => void;
  setCustomer: (customerId: string | null) => void;
  clearCart: () => void;
  holdCart: (label?: string) => void;
  recallCart: (id: string) => void;
  deleteHeldCart: (id: string) => void;
  getSubtotal: () => number;
  getTaxTotal: () => number;
  getDiscountAmount: () => number;
  getGrandTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartDiscount: 0,
      cartDiscountType: 'percentage',
      selectedCustomerId: null,
      heldCarts: [],

      addItem: (product) => {
        const items = get().items;
        const existing = items.find(i => i.product.id === product.id);
        if (existing) {
          set({ items: items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
          set({ items: [...items, { product, quantity: 1, discount: 0, discountType: 'percentage' }] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.product.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({ items: get().items.map(i => i.product.id === productId ? { ...i, quantity } : i) });
      },

      setItemDiscount: (productId, discount, type) => {
        set({ items: get().items.map(i => i.product.id === productId ? { ...i, discount, discountType: type } : i) });
      },

      setCartDiscount: (discount, type) => {
        set({ cartDiscount: discount, cartDiscountType: type });
      },

      setCustomer: (customerId) => set({ selectedCustomerId: customerId }),

      clearCart: () => set({ items: [], cartDiscount: 0, cartDiscountType: 'percentage', selectedCustomerId: null }),

      holdCart: (label) => {
        const { items, selectedCustomerId, heldCarts } = get();
        if (items.length === 0) return;
        const held: HeldCart = {
          id: generateId(),
          items: [...items],
          customerId: selectedCustomerId,
          timestamp: new Date().toISOString(),
          label: label || `Cart #${heldCarts.length + 1}`,
        };
        set({
          heldCarts: [...heldCarts, held],
          items: [],
          cartDiscount: 0,
          cartDiscountType: 'percentage',
          selectedCustomerId: null,
        });
      },

      recallCart: (id) => {
        const { heldCarts } = get();
        const held = heldCarts.find(h => h.id === id);
        if (!held) return;
        set({
          items: held.items,
          selectedCustomerId: held.customerId,
          heldCarts: heldCarts.filter(h => h.id !== id),
        });
      },

      deleteHeldCart: (id) => {
        set({ heldCarts: get().heldCarts.filter(h => h.id !== id) });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const itemTotal = item.product.price * item.quantity;
          if (item.discountType === 'percentage') {
            return sum + itemTotal - (itemTotal * item.discount / 100);
          }
          return sum + itemTotal - item.discount;
        }, 0);
      },

      getTaxTotal: () => {
        return get().items.reduce((sum, item) => {
          const itemTotal = item.product.price * item.quantity;
          let discounted = itemTotal;
          if (item.discountType === 'percentage') {
            discounted = itemTotal - (itemTotal * item.discount / 100);
          } else {
            discounted = itemTotal - item.discount;
          }
          return sum + (discounted * item.product.taxRate / 100);
        }, 0);
      },

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const { cartDiscount, cartDiscountType } = get();
        if (cartDiscountType === 'percentage') {
          return subtotal * cartDiscount / 100;
        }
        return cartDiscount;
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTaxTotal();
        const discount = get().getDiscountAmount();
        return subtotal + tax - discount;
      },
    }),
    { name: 'pos-cart' }
  )
);
