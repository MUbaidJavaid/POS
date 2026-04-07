import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, X, Star } from 'lucide-react';
import { formatCurrency } from '@/utils/pos-utils';
import { toast } from 'sonner';
import customersData from '@/data/customers.json';
import type { Customer } from '@/types/pos';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(customersData as Customer[]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const addCustomer = (data: Omit<Customer, 'id' | 'loyaltyPoints' | 'createdAt'>) => {
    setCustomers(prev => [...prev, {
      ...data,
      id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
    }]);
    toast.success('Customer added');
    setShowForm(false);
  };

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers.length} customers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="pos-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="pos-input pl-9 w-full" placeholder="Search customers..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="pos-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-warning">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-bold">{c.loyaltyPoints}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p>{c.phone}</p>
              <p>{c.address}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <CustomerFormModal onSave={addCustomer} onClose={() => setShowForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerFormModal({ onSave, onClose }: { onSave: (data: any) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Add Customer</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, email, phone, address }); }} className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="pos-input w-full" required />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="pos-input w-full" required />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="pos-input w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
            <input value={address} onChange={e => setAddress(e.target.value)} className="pos-input w-full" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors font-medium text-sm">Cancel</button>
            <button type="submit" className="flex-1 pos-btn-primary py-2.5">Add Customer</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
