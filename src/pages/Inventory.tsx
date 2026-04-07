import { useMemo } from 'react';
import { useProductStore } from '@/store/productStore';
import { formatCurrency } from '@/utils/pos-utils';
import { AlertTriangle, Package, TrendingDown, Check } from 'lucide-react';

export default function InventoryPage() {
  const products = useProductStore((s) => s.products);

  const stats = useMemo(() => {
    const active = products.filter(p => p.isActive);
    const lowStock = active.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold);
    const outOfStock = active.filter(p => p.stock <= 0);
    const totalValue = active.reduce((s, p) => s + p.costPrice * p.stock, 0);
    return { total: active.length, lowStock, outOfStock, totalValue };
  }, [products]);

  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Products', value: stats.total, icon: Package, color: 'text-primary' },
          { label: 'Low Stock', value: stats.lowStock.length, icon: AlertTriangle, color: 'text-warning' },
          { label: 'Out of Stock', value: stats.outOfStock.length, icon: TrendingDown, color: 'text-destructive' },
          { label: 'Inventory Value', value: formatCurrency(stats.totalValue), icon: Check, color: 'text-success' },
        ].map((s, i) => (
          <div key={i} className="pos-card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats.lowStock.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" /> Low Stock Alerts
          </h2>
          <div className="pos-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Product</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Current Stock</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Threshold</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Reorder Qty</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStock.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-sm">{p.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="pos-badge pos-badge-warning">{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">{p.lowStockThreshold}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono">{p.lowStockThreshold * 2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.outOfStock.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-destructive" /> Out of Stock
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stats.outOfStock.map(p => (
              <div key={p.id} className="pos-card p-4 border-destructive/30">
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.sku}</p>
                <p className="text-sm font-bold text-destructive mt-1">Out of Stock</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
