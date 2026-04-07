import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Bell, Search, LogOut } from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { toast } from 'sonner';

export default function AppHeader() {
  const [time, setTime] = useState(new Date());
  const products = useProductStore((s) => s.products);
  const lowStockCount = products.filter(p => p.isActive && p.stock <= p.lowStockThreshold).length;
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('pos-user');
      return stored ? JSON.parse(stored) : { name: 'Admin', role: 'Manager' };
    } catch { return { name: 'Admin', role: 'Manager' }; }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products, SKU, barcode..."
            className="pos-input pl-9 w-72"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-semibold font-mono text-foreground">
            {format(time, 'hh:mm:ss a')}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(time, 'EEEE, MMM dd yyyy')}
          </p>
        </div>

        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Notifications">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {lowStockCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {lowStockCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            {user.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user.name || 'Admin'}</p>
            <p className="text-xs text-muted-foreground">{user.role || 'Manager'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
