import { useMemo } from 'react';
import { useTransactionStore } from '@/store/transactionStore';
import { useProductStore } from '@/store/productStore';
import { formatCurrency } from '@/utils/pos-utils';
import { DollarSign, ShoppingBag, TrendingUp, Package, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ReportsPage() {
  const transactions = useTransactionStore((s) => s.transactions);
  const products = useProductStore((s) => s.products);

  const stats = useMemo(() => {
    const completed = transactions.filter(t => t.status === 'completed');
    const totalRevenue = completed.reduce((s, t) => s + t.grandTotal, 0);
    const totalCost = completed.reduce((s, t) =>
      s + t.items.reduce((is, i) => {
        const product = products.find(p => p.id === i.productId);
        return is + (product?.costPrice || 0) * i.quantity;
      }, 0)
    , 0);
    const totalTax = completed.reduce((s, t) => s + t.taxTotal, 0);

    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    completed.forEach(t => t.items.forEach(i => {
      if (!productSales[i.productId]) productSales[i.productId] = { name: i.name, qty: 0, revenue: 0 };
      productSales[i.productId].qty += i.quantity;
      productSales[i.productId].revenue += i.total;
    }));
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return { totalRevenue, totalCost, profit: totalRevenue - totalCost - totalTax, totalTax, count: completed.length, topProducts };
  }, [transactions, products]);

  const exportCSV = () => {
    const completed = transactions.filter(t => t.status === 'completed');
    if (completed.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Invoice No', 'Date', 'Items', 'Subtotal', 'Tax', 'Discount', 'Grand Total', 'Payment Method', 'Status'];
    const rows = completed.map(t => [
      t.invoiceNo,
      format(new Date(t.date), 'yyyy-MM-dd HH:mm'),
      t.items.map(i => `${i.name} x${i.quantity}`).join('; '),
      t.subtotal.toFixed(2),
      t.taxTotal.toFixed(2),
      t.discountAmount.toFixed(2),
      t.grandTotal.toFixed(2),
      t.paymentMethod,
      t.status,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const exportPDF = () => {
    const completed = transactions.filter(t => t.status === 'completed');
    if (completed.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head>
        <title>Sales Report - ${format(new Date(), 'yyyy-MM-dd')}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
          .stats { display: flex; gap: 20px; margin-bottom: 30px; }
          .stat-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
          .stat-label { font-size: 12px; color: #6b7280; }
          .stat-value { font-size: 22px; font-weight: bold; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
          td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
          tr:hover { background: #f9fafb; }
          .text-right { text-align: right; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <h1>Sales Report</h1>
        <p class="subtitle">Generated on ${format(new Date(), 'MMMM dd, yyyy hh:mm a')} · SwiftPOS</p>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value">${formatCurrency(stats.totalRevenue)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Transactions</div>
            <div class="stat-value">${stats.count}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Profit</div>
            <div class="stat-value">${formatCurrency(stats.profit)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Tax Collected</div>
            <div class="stat-value">${formatCurrency(stats.totalTax)}</div>
          </div>
        </div>

        <h2 style="font-size:16px; margin-bottom:8px;">Transaction Details</h2>
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Items</th>
              <th class="text-right">Total</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            ${completed.map(t => `
              <tr>
                <td>${t.invoiceNo}</td>
                <td>${format(new Date(t.date), 'MMM dd, yyyy HH:mm')}</td>
                <td>${t.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</td>
                <td class="text-right" style="font-family:monospace;">${formatCurrency(t.grandTotal)}</td>
                <td style="text-transform:capitalize;">${t.paymentMethod}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>SwiftPOS · Confidential Sales Report</p>
        </div>

        <script>window.onload=function(){window.print();}<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('PDF report opened for printing');
  };

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <FileText className="w-4 h-4" /> PDF Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-primary' },
          { label: 'Transactions', value: stats.count, icon: ShoppingBag, color: 'text-[hsl(var(--info))]' },
          { label: 'Profit', value: formatCurrency(stats.profit), icon: TrendingUp, color: 'text-[hsl(var(--success))]' },
          { label: 'Tax Collected', value: formatCurrency(stats.totalTax), icon: Package, color: 'text-[hsl(var(--warning))]' },
        ].map((s, i) => (
          <div key={i} className="pos-card p-5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-muted flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold font-mono">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pos-card p-5">
        <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No sales data yet</p>
        ) : (
          <div className="space-y-3">
            {stats.topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.qty} units sold</p>
                </div>
                <span className="font-mono font-semibold text-sm">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
