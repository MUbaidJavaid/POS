import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_USERS = [
  { email: 'admin@swiftpos.com', password: 'admin123', name: 'Admin', role: 'Admin' },
  { email: 'cashier@swiftpos.com', password: 'cashier123', name: 'Cashier', role: 'Cashier' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Cashier' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      if (!form.name || !form.email || !form.password) {
        toast.error('Please fill all fields');
        return;
      }
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      localStorage.setItem('pos-user', JSON.stringify({ name: form.name, email: form.email, role: form.role }));
      localStorage.setItem('pos-auth', 'true');
      toast.success(`Account created! Welcome, ${form.name}`);
      navigate('/dashboard');
    } else {
      const user = DEMO_USERS.find(u => u.email === form.email && u.password === form.password);
      if (user) {
        localStorage.setItem('pos-user', JSON.stringify({ name: user.name, email: user.email, role: user.role }));
        localStorage.setItem('pos-auth', 'true');
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/dashboard');
      } else {
        // Allow any credentials for demo
        if (form.email && form.password) {
          localStorage.setItem('pos-user', JSON.stringify({ name: form.email.split('@')[0], email: form.email, role: 'Cashier' }));
          localStorage.setItem('pos-auth', 'true');
          toast.success('Logged in successfully!');
          navigate('/dashboard');
        } else {
          toast.error('Please enter email and password');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <ShoppingCart className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">SwiftPOS</h1>
          <p className="text-sm text-muted-foreground mt-1">Professional Point of Sale System</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-xl p-8">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isSignup ? 'Sign up to get started' : 'Sign in to your account'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your name"
                  className="pos-input w-full"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@swiftpos.com"
                className="pos-input w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="pos-input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="pos-input w-full"
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            )}

            <button type="submit" className="pos-btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
              {isSignup ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isSignup && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Demo Credentials</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">admin@swiftpos.com</span> / <span className="font-mono">admin123</span>
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">cashier@swiftpos.com</span> / <span className="font-mono">cashier123</span>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
