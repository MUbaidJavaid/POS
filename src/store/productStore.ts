import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types/pos';
import initialProducts from '@/data/products.json';
import { generateId } from '@/utils/pos-utils';

interface ProductStore {
  products: Product[];
  categories: string[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleActive: (id: string) => void;
  deductStock: (id: string, qty: number) => void;
  addCategory: (category: string) => void;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: initialProducts as Product[],
      categories: ['Electronics', 'Food', 'Clothing', 'Stationery'],

      addProduct: (product) => {
        const now = new Date().toISOString();
        set({
          products: [...get().products, { ...product, id: generateId(), createdAt: now, updatedAt: now }],
        });
      },

      updateProduct: (id, updates) => {
        set({
          products: get().products.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        });
      },

      deleteProduct: (id) => {
        set({ products: get().products.filter(p => p.id !== id) });
      },

      toggleActive: (id) => {
        set({
          products: get().products.map(p =>
            p.id === id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p
          ),
        });
      },

      deductStock: (id, qty) => {
        set({
          products: get().products.map(p =>
            p.id === id ? { ...p, stock: Math.max(0, p.stock - qty), updatedAt: new Date().toISOString() } : p
          ),
        });
      },

      addCategory: (category) => {
        if (!get().categories.includes(category)) {
          set({ categories: [...get().categories, category] });
        }
      },
    }),
    { name: 'pos-products' }
  )
);
