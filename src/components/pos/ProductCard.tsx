import { motion } from 'framer-motion';
import { Package, Plus, Minus, X } from 'lucide-react';
import type { Product } from '@/types/pos';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/utils/pos-utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

  return (
    <motion.button
      whileHover={{ y: -2, boxShadow: '0 8px 25px -8px rgba(0,0,0,0.12)' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => !outOfStock && addItem(product)}
      disabled={outOfStock}
      className={`pos-card p-4 text-left w-full transition-all ${outOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="w-full h-24 rounded-lg bg-muted flex items-center justify-center mb-3 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Package className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="font-semibold text-sm text-card-foreground truncate">{product.name}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{product.sku}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-lg font-bold text-primary">{formatCurrency(product.price)}</span>
        <span className={`pos-badge ${outOfStock ? 'pos-badge-danger' : lowStock ? 'pos-badge-warning' : 'pos-badge-success'}`}>
          {outOfStock ? 'Out' : `${product.stock} left`}
        </span>
      </div>
    </motion.button>
  );
}

export function CartItemRow({ item }: { item: { product: Product; quantity: number; discount: number; discountType: 'percentage' | 'fixed' } }) {
  const { updateQuantity, removeItem } = useCartStore();
  const lineTotal = item.product.price * item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 py-3 border-b border-border last:border-0"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
        <p className="text-xs text-muted-foreground">{formatCurrency(item.product.price)} each</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
          className="w-7 h-7 rounded-md bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-8 text-center text-sm font-semibold font-mono">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
          className="w-7 h-7 rounded-md bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <span className="text-sm font-semibold w-20 text-right font-mono">{formatCurrency(lineTotal)}</span>

      <button
        onClick={() => removeItem(item.product.id)}
        className="w-7 h-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Remove item"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
