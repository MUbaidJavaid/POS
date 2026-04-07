import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useTransactionStore } from '@/store/transactionStore';
import { formatCurrency } from '@/utils/pos-utils';
import { Receipt, Eye, XCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const { transactions, voidTransaction } = useTransactionStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return transactions;
    return transactions.filter(t =>
      t.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      t.paymentMethod.toLowerCase().includes(search.toLowerCase())
    );
  }, [transactions, search]);

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">{transactions.length} total transactions</p>
        </div>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="pos-input pl-9 w-full" placeholder="Search invoice #..." />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No transactions yet</p>
          <p className="text-xs mt-1">Complete a sale from the POS terminal</p>
        </div>
      ) : (
        <div className="pos-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Invoice</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Items</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Total</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Payment</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm font-medium">{tx.invoiceNo}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(tx.date), 'MMM dd, yyyy HH:mm')}</td>
                  <td className="px-4 py-3 text-right text-sm">{tx.items.length}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(tx.grandTotal)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="pos-badge bg-primary/10 text-primary capitalize">{tx.paymentMethod}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`pos-badge ${tx.status === 'completed' ? 'pos-badge-success' : tx.status === 'voided' ? 'pos-badge-danger' : 'pos-badge-warning'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {tx.status === 'completed' && (
                        <button
                          onClick={() => { voidTransaction(tx.id, 'Manual void'); toast.success('Transaction voided'); }}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Void"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
