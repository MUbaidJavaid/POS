import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '@/types/pos';

interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  voidTransaction: (id: string, reason: string) => void;
  getTransactionsByDate: (date: string) => Transaction[];
  getTodaySales: () => number;
  getTodayTransactionCount: () => number;
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],

      addTransaction: (tx) => {
        set({ transactions: [tx, ...get().transactions] });
      },

      voidTransaction: (id, _reason) => {
        set({
          transactions: get().transactions.map(t =>
            t.id === id ? { ...t, status: 'voided' as const } : t
          ),
        });
      },

      getTransactionsByDate: (date) => {
        return get().transactions.filter(t => t.date.startsWith(date));
      },

      getTodaySales: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().transactions
          .filter(t => t.date.startsWith(today) && t.status === 'completed')
          .reduce((sum, t) => sum + t.grandTotal, 0);
      },

      getTodayTransactionCount: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().transactions.filter(t => t.date.startsWith(today) && t.status === 'completed').length;
      },
    }),
    { name: 'pos-transactions' }
  )
);
