import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { ProductCard } from '@/components/pos/ProductCard';
import CartPanel from '@/components/pos/CartPanel';
import SalesTargetTracker from '@/components/pos/SalesTargetTracker';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function POSPage() {
  useKeyboardShortcuts();
  const { products, categories } = useProductStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (!p.isActive) return false;
      const matchesSearch = !search || 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);
      const matchesCat = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, search, selectedCategory]);

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)]">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pos-input pl-9 w-full"
              data-search-input
            />
          </div>
          <Filter className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.03 } },
            }}
          >
            {filtered.map((product) => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="w-96 flex-shrink-0 flex flex-col gap-4">
        <SalesTargetTracker dailyTarget={1000} />
        <div className="flex-1 min-h-0">
          <CartPanel />
        </div>
      </div>
    </div>
  );
}
