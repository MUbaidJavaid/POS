import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee, ShoppingBag, TrendingUp, Package, ArrowUpRight,
  ArrowDownRight, Users, Clock, AlertTriangle
} from 'lucide-react';
import { useTransactionStore } from '@/store/transactionStore';
import { useProductStore } from '@/store/productStore';
import { formatCurrency } from '@/utils/pos-utils';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Area, AreaChart
} from 'recharts';

const CHART_COLORS = [
  'hsl(174, 100%, 30%)', 'hsl(38, 92%, 50%)', 'hsl(145, 63%, 42%)',
  'hsl(199, 89%, 48%)', 'hsl(0, 72%, 51%)', 'hsl(270, 60%, 55%)'
];

export default function DashboardPage() {
  const transactions = useTransactionStore((s) => s.transactions);
  const products = useProductStore((s) => s.products);

  const stats = useMemo(() => {
    const completed = transactions.filter(t => t.status === 'completed');
    const today = startOfDay(new Date());
    const todayTx = completed.filter(t => isAfter(new Date(t.date), today));
    const yesterdayStart = startOfDay(subDays(new Date(), 1));
    const yesterdayTx = completed.filter(t => {
      const d = new Date(t.date);
      return isAfter(d, yesterdayStart) && !isAfter(d, today);
    });

    const todayRevenue = todayTx.reduce((s, t) => s + t.grandTotal, 0);
    const yesterdayRevenue = yesterdayTx.reduce((s, t) => s + t.grandTotal, 0);
    const revenueChange = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : todayRevenue > 0 ? 100 : 0;

    const totalRevenue = completed.reduce((s, t) => s + t.grandTotal, 0);
    const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;

    // Last 7 days chart
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(date);
      const dayEnd = startOfDay(subDays(date, -1));
      const dayTx = completed.filter(t => {
        const d = new Date(t.date);
        return isAfter(d, dayStart) && !isAfter(d, dayEnd);
      });
      return {
        day: format(date, 'EEE'),
        date: format(date, 'MMM dd'),
        revenue: dayTx.reduce((s, t) => s + t.grandTotal, 0),
        orders: dayTx.length,
      };
    });

    // Category breakdown
    const catMap: Record<string, number> = {};
    completed.forEach(t => t.items.forEach(i => {
      const p = products.find(pr => pr.id === i.productId);
      const cat = p?.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + i.total;
    }));
    const categoryData = Object.entries(catMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);

    // Top products
    const prodMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    completed.forEach(t => t.items.forEach(i => {
      if (!prodMap[i.productId]) prodMap[i.productId] = { name: i.name, qty: 0, revenue: 0 };
      prodMap[i.productId].qty += i.quantity;
      prodMap[i.productId].revenue += i.total;
    }));
    const topProducts = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Low stock
    const lowStock = products.filter(p => p.isActive && p.stock <= p.lowStockThreshold);

    // Payment method breakdown
    const paymentMap: Record<string, number> = {};
    completed.forEach(t => {
      paymentMap[t.paymentMethod] = (paymentMap[t.paymentMethod] || 0) + 1;
    });

    return {
      todayRevenue, revenueChange, todayOrders: todayTx.length,
      totalRevenue, avgOrderValue, totalOrders: completed.length,
      last7Days, categoryData, topProducts, lowStock, paymentMap,
    };
  }, [transactions, products]);

  const kpis = [
    {
      label: "Today's Revenue", value: formatCurrency(stats.todayRevenue),
      icon: IndianRupee, change: stats.revenueChange, color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      label: "Today's Orders", value: stats.todayOrders.toString(),
      icon: ShoppingBag, color: 'text-[hsl(var(--info))]',
      bg: 'bg-[hsl(var(--info)/0.1)]'
    },
    {
      label: 'Avg Order Value', value: formatCurrency(stats.avgOrderValue),
      icon: TrendingUp, color: 'text-[hsl(var(--success))]',
      bg: 'bg-[hsl(var(--success)/0.1)]'
    },
    {
      label: 'Total Revenue', value: formatCurrency(stats.totalRevenue),
      icon: Package, color: 'text-[hsl(var(--warning))]',
      bg: 'bg-[hsl(var(--warning)/0.1)]'
    },
  ];

  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM dd yyyy')}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="pos-card p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className="text-2xl font-bold font-mono mt-1">{kpi.value}</p>
                {kpi.change !== undefined && (
                  <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.change >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                    {kpi.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(kpi.change).toFixed(1)}% vs yesterday
                  </div>
                )}
              </div>
              <div className={`w-11 h-11 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pos-card p-5 lg:col-span-2"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4">Revenue (Last 7 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.last7Days}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174, 100%, 30%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(174, 100%, 30%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(0,0%,100%)', border: '1px solid hsl(210,15%,89%)', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(174, 100%, 30%)" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pos-card p-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4">Sales by Category</h2>
          {stats.categoryData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.categoryData} cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} dataKey="value">
                      {stats.categoryData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {stats.categoryData.slice(0, 4).map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="font-mono font-medium">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pos-card p-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4">Top Selling Products</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No sales data</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((p, i) => {
                const maxRev = stats.topProducts[0]?.revenue || 1;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                      <span className="text-sm font-mono font-semibold">{formatCurrency(p.revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(p.revenue / maxRev) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.qty} units sold</p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pos-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
            <h2 className="text-sm font-semibold text-foreground">Low Stock Alerts</h2>
            {stats.lowStock.length > 0 && (
              <span className="pos-badge-warning ml-auto">{stats.lowStock.length}</span>
            )}
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">All stock levels healthy ✅</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold font-mono ${p.stock === 0 ? 'text-destructive' : 'text-[hsl(var(--warning))]'}`}>
                      {p.stock}
                    </span>
                    <p className="text-[10px] text-muted-foreground">/ {p.lowStockThreshold} min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="pos-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
        </div>
        {transactions.filter(t => t.status === 'completed').length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No transactions yet — make your first sale!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">Invoice</th>
                  <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                  <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">Items</th>
                  <th className="text-right py-2 text-xs font-semibold text-muted-foreground uppercase">Total</th>
                  <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">Payment</th>
                  <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.filter(t => t.status === 'completed').slice(0, 8).map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 font-mono text-xs">{tx.invoiceNo}</td>
                    <td className="py-2.5 text-muted-foreground text-xs">{format(new Date(tx.date), 'MMM dd, hh:mm a')}</td>
                    <td className="py-2.5 text-xs">{tx.items.length} items</td>
                    <td className="py-2.5 text-right font-mono font-semibold">{formatCurrency(tx.grandTotal)}</td>
                    <td className="py-2.5">
                      <span className="pos-badge bg-muted text-muted-foreground capitalize">{tx.paymentMethod}</span>
                    </td>
                    <td className="py-2.5">
                      <span className="pos-badge-success">Completed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
