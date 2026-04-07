export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  taxRate: number;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  date: string;
  items: TransactionItem[];
  subtotal: number;
  taxTotal: number;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: string;
  amountPaid: number;
  changeAmount: number;
  customerId: string | null;
  cashierId: string;
  status: 'completed' | 'voided' | 'held';
}

export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  tax: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  loyaltyPoints: number;
  createdAt: string;
}
