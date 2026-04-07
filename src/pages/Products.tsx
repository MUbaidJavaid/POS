import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, Archive, Grid3X3, List,
  X, Package
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { formatCurrency } from '@/utils/pos-utils';
import type { Product } from '@/types/pos';
import { toast } from 'sonner';

export default function ProductsPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct, toggleActive, addCategory } = useProductStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCat = !categoryFilter || p.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, search, categoryFilter]);

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} total products</p>
        </div>
        <button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="pos-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="pos-input pl-9 w-full" placeholder="Search..." />
        </div>
        <select
          value={categoryFilter || ''}
          onChange={(e) => setCategoryFilter(e.target.value || null)}
          className="pos-input"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="pos-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Product</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">SKU</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Category</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Price</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Stock</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3 text-sm">{p.category}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono font-medium">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`pos-badge ${p.stock <= 0 ? 'pos-badge-danger' : p.stock <= p.lowStockThreshold ? 'pos-badge-warning' : 'pos-badge-success'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`pos-badge ${p.isActive ? 'pos-badge-success' : 'pos-badge-danger'}`}>
                      {p.isActive ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditingProduct(p); setShowForm(true); }} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" aria-label="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleActive(p.id)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" aria-label="Archive">
                        <Archive className="w-4 h-4" />
                      </button>
                      <button onClick={() => { deleteProduct(p.id); toast.success('Product deleted'); }} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" aria-label="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="pos-card p-4">
              <div className="w-full h-24 rounded-lg bg-muted flex items-center justify-center mb-3">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-sm truncate">{p.name}</h3>
              <p className="text-xs text-muted-foreground">{p.sku} · {p.category}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-primary">{formatCurrency(p.price)}</span>
                <span className={`pos-badge ${p.stock <= p.lowStockThreshold ? 'pos-badge-warning' : 'pos-badge-success'}`}>{p.stock}</span>
              </div>
              <div className="flex gap-1 mt-3">
                <button onClick={() => { setEditingProduct(p); setShowForm(true); }} className="flex-1 text-xs py-1.5 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">Edit</button>
                <button onClick={() => { deleteProduct(p.id); toast.success('Deleted'); }} className="text-xs py-1.5 px-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ProductFormModal
            product={editingProduct}
            categories={categories}
            onSave={(data) => {
              if (editingProduct) {
                updateProduct(editingProduct.id, data);
                toast.success('Product updated');
              } else {
                addProduct(data as any);
                toast.success('Product added');
              }
              setShowForm(false);
            }}
            onAddCategory={addCategory}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductFormModal({
  product,
  categories,
  onSave,
  onAddCategory,
  onClose,
}: {
  product: Product | null;
  categories: string[];
  onSave: (data: Partial<Product>) => void;
  onAddCategory: (cat: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [category, setCategory] = useState(product?.category || categories[0] || '');
  const [price, setPrice] = useState(String(product?.price || ''));
  const [costPrice, setCostPrice] = useState(String(product?.costPrice || ''));
  const [stock, setStock] = useState(String(product?.stock || ''));
  const [taxRate, setTaxRate] = useState(String(product?.taxRate || '18'));
  const [lowStockThreshold, setLowStockThreshold] = useState(String(product?.lowStockThreshold || '10'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast.error('Name and price are required');
      return;
    }
    onSave({
      name, sku, barcode, category,
      price: parseFloat(price),
      costPrice: parseFloat(costPrice) || 0,
      stock: parseInt(stock) || 0,
      taxRate: parseFloat(taxRate) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      images: [],
      isActive: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Product Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="pos-input w-full" required />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">SKU</label>
              <input value={sku} onChange={e => setSku(e.target.value)} className="pos-input w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Barcode</label>
              <input value={barcode} onChange={e => setBarcode(e.target.value)} className="pos-input w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="pos-input w-full">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tax Rate (%)</label>
              <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="pos-input w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Selling Price</label>
              <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="pos-input w-full" required />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cost Price</label>
              <input type="number" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} className="pos-input w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Stock</label>
              <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="pos-input w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Low Stock Alert</label>
              <input type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} className="pos-input w-full" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors font-medium text-sm">
              Cancel
            </button>
            <button type="submit" className="flex-1 pos-btn-primary py-2.5">
              {product ? 'Update' : 'Add Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
