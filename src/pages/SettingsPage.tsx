import { useProductStore } from '@/store/productStore';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

export default function SettingsPage() {
  const { categories, addCategory } = useProductStore();
  const [newCat, setNewCat] = useState('');

  return (
    <div className="animate-slide-up max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="pos-card p-5 mb-6">
        <h2 className="text-lg font-semibold mb-1">Store Information</h2>
        <p className="text-sm text-muted-foreground mb-4">Configure your store details</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Store Name</label>
            <input defaultValue="SwiftPOS Store" className="pos-input w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Currency</label>
            <select className="pos-input w-full">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pos-card p-5">
        <h2 className="text-lg font-semibold mb-3">Categories</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(c => (
            <span key={c} className="pos-badge bg-primary/10 text-primary">{c}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newCat} onChange={e => setNewCat(e.target.value)} className="pos-input flex-1" placeholder="New category..." />
          <button onClick={() => {
            if (newCat.trim()) {
              addCategory(newCat.trim());
              setNewCat('');
              toast.success('Category added');
            }
          }} className="pos-btn-primary flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
