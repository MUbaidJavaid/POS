import { format } from 'date-fns';

export function formatCurrency(amount: number): string {
  return 'Rs. ' + new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generateInvoiceNo(): string {
  const date = format(new Date(), 'yyyy-MM-dd');
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `${date}-${seq}`;
}

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

export function calculateItemTax(price: number, quantity: number, taxRate: number): number {
  return (price * quantity * taxRate) / 100;
}

export function calculateItemTotal(price: number, quantity: number, discount: number, discountType: 'percentage' | 'fixed'): number {
  const subtotal = price * quantity;
  if (discountType === 'percentage') {
    return subtotal - (subtotal * discount / 100);
  }
  return subtotal - discount;
}
