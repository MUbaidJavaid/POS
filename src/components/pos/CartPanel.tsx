import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Banknote, QrCode, Smartphone, Trash2, Receipt, Printer,
  Pause, Play, X, SplitSquareHorizontal
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { useTransactionStore } from '@/store/transactionStore';
import { formatCurrency, generateInvoiceNo, generateId } from '@/utils/pos-utils';
import { CartItemRow } from './ProductCard';
import ReceiptComponent from './Receipt';
import type { Transaction } from '@/types/pos';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { format } from 'date-fns';

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'qr', label: 'QR Pay', icon: QrCode },
  { id: 'split', label: 'Split', icon: SplitSquareHorizontal },
];

export default function CartPanel() {
  const {
    items, clearCart, getSubtotal, getTaxTotal, getDiscountAmount, getGrandTotal,
    selectedCustomerId, holdCart, recallCart, deleteHeldCart, heldCarts
  } = useCartStore();
  const deductStock = useProductStore((s) => s.deductStock);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showHeldCarts, setShowHeldCarts] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const subtotal = getSubtotal();
  const taxTotal = getTaxTotal();
  const discountAmt = getDiscountAmount();
  const grandTotal = getGrandTotal();

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setAmountPaid(grandTotal.toFixed(2));
    setShowPayment(true);
  };

  const handleHoldCart = () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    holdCart();
    toast.success('Cart held for later');
  };

  const handlePrintReceipt = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '_blank', 'width=420,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receipt - ${lastTransaction?.invoiceNo || ''}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', 'Lucida Console', monospace; margin: 0; padding: 0; background: #fff; color: #000; }
        .receipt-print { padding: 20px; max-width: 320px; margin: 0 auto; font-size: 12px; line-height: 1.5; }
        .receipt-print h1 { font-size: 18px; margin: 0 0 4px; letter-spacing: 1px; }
        .receipt-print p { margin: 2px 0; }
        .receipt-print .flex { display: flex; justify-content: space-between; }
        .receipt-print .text-center { text-align: center; }
        .receipt-print .text-right { text-align: right; }
        .receipt-print .font-bold { font-weight: bold; }
        .receipt-print .font-semibold { font-weight: 600; }
        .receipt-print .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .receipt-print .border-b-2 { border-bottom: 2px dashed #999; padding-bottom: 8px; margin-bottom: 8px; }
        .receipt-print .border-b { border-bottom: 1px dashed #999; padding-bottom: 6px; margin-bottom: 6px; }
        .receipt-print .border-t { border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
        .receipt-print .text-lg { font-size: 16px; }
        .receipt-print .text-sm { font-size: 13px; }
        .receipt-print .text-xs { font-size: 10px; }
        .receipt-print .uppercase { text-transform: uppercase; }
        .receipt-print .tracking-wider { letter-spacing: 0.5px; }
        .receipt-print .mb-1 { margin-bottom: 4px; }
        .receipt-print .mt-1 { margin-top: 4px; }
        .receipt-print .mt-2 { margin-top: 8px; }
        .receipt-print .space-y-0\\.5 > * + * { margin-top: 2px; }
        .receipt-print .space-y-1 > * + * { margin-top: 4px; }
        .receipt-print .w-8 { width: 32px; }
        .receipt-print .w-16 { width: 64px; }
        .receipt-print .flex-1 { flex: 1; }
        .receipt-print .pr-1 { padding-right: 4px; }
        @media print {
          body { margin: 0; padding: 0; }
          @page { margin: 5mm; size: 80mm auto; }
        }
      </style></head><body>
      ${receiptRef.current.innerHTML}
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 300);
        };
      <\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const processPayment = () => {
    let paid = grandTotal;
    let method = paymentMethod;

    if (paymentMethod === 'cash') {
      paid = parseFloat(amountPaid) || 0;
      if (paid < grandTotal) {
        toast.error('Insufficient amount');
        return;
      }
    } else if (paymentMethod === 'split') {
      const cashPart = parseFloat(splitCash) || 0;
      const cardPart = parseFloat(splitCard) || 0;
      if (cashPart + cardPart < grandTotal) {
        toast.error(`Split total (${formatCurrency(cashPart + cardPart)}) is less than ${formatCurrency(grandTotal)}`);
        return;
      }
      paid = cashPart + cardPart;
      method = 'split';
    }

    const tx: Transaction = {
      id: generateId(),
      invoiceNo: generateInvoiceNo(),
      date: new Date().toISOString(),
      items: items.map(i => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: i.product.price,
        total: i.product.price * i.quantity,
        tax: (i.product.price * i.quantity * i.product.taxRate) / 100,
      })),
      subtotal,
      taxTotal,
      discountType: null,
      discountValue: 0,
      discountAmount: discountAmt,
      grandTotal,
      paymentMethod: method,
      amountPaid: paid,
      changeAmount: Math.max(0, paid - grandTotal),
      customerId: selectedCustomerId,
      cashierId: 'admin',
      status: 'completed',
    };

    items.forEach(i => deductStock(i.product.id, i.quantity));
    addTransaction(tx);
    clearCart();
    setShowPayment(false);
    setAmountPaid('');
    setSplitCash('');
    setSplitCard('');
    setLastTransaction(tx);
    setShowReceipt(true);
    toast.success(`Sale completed! Invoice: ${tx.invoiceNo}`, { duration: 4000 });
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-card rounded-xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Current Sale</h2>
          </div>
          <div className="flex items-center gap-2">
            {heldCarts.length > 0 && (
              <button
                onClick={() => setShowHeldCarts(true)}
                className="pos-badge bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Play className="w-3 h-3 mr-1" />
                {heldCarts.length} held
              </button>
            )}
            <span className="pos-badge bg-primary/10 text-primary">{items.length} items</span>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground py-12"
              >
                <Receipt className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No items in cart</p>
                <p className="text-xs mt-1">Click products to add them</p>
              </motion.div>
            ) : (
              items.map((item) => (
                <CartItemRow key={item.product.id} item={item} />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Totals */}
        <div className="border-t border-border px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-mono font-medium">{formatCurrency(taxTotal)}</span>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between text-sm text-[hsl(var(--success))]">
              <span>Discount</span>
              <span className="font-mono">-{formatCurrency(discountAmt)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
            <span>Total</span>
            <span className="font-mono text-primary">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-2">
          <AnimatePresence>
            {showPayment && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                        paymentMethod === pm.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <pm.icon className="w-4 h-4" />
                      {pm.label}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'cash' && (
                  <div className="mb-3">
                    <input
                      type="number"
                      placeholder="Amount paid"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="pos-input w-full text-center text-lg font-mono"
                      autoFocus
                    />
                    <div className="flex gap-1.5 mt-2">
                      {[
                        { label: 'Exact', val: grandTotal },
                        ...(grandTotal > 0 ? [
                          { label: formatCurrency(Math.ceil(grandTotal / 10) * 10), val: Math.ceil(grandTotal / 10) * 10 },
                          { label: formatCurrency(Math.ceil(grandTotal / 50) * 50), val: Math.ceil(grandTotal / 50) * 50 },
                          { label: formatCurrency(Math.ceil(grandTotal / 100) * 100), val: Math.ceil(grandTotal / 100) * 100 },
                        ].filter((v, i, arr) => arr.findIndex(a => a.val === v.val) === i && v.val !== grandTotal) : [])
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          onClick={() => setAmountPaid(btn.val.toFixed(2))}
                          className="flex-1 py-1.5 rounded-md border border-border text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                    {parseFloat(amountPaid) >= grandTotal && parseFloat(amountPaid) !== grandTotal && (
                      <p className="text-center text-sm text-[hsl(var(--success))] mt-2 font-mono">
                        Change: {formatCurrency(parseFloat(amountPaid) - grandTotal)}
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === 'split' && (
                  <div className="mb-3 space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Cash amount</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={splitCash}
                        onChange={(e) => setSplitCash(e.target.value)}
                        className="pos-input w-full text-center font-mono"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Card amount</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={splitCard}
                        onChange={(e) => setSplitCard(e.target.value)}
                        className="pos-input w-full text-center font-mono"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>Split total:</span>
                      <span className={`font-mono font-medium ${
                        (parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) >= grandTotal
                          ? 'text-[hsl(var(--success))]'
                          : 'text-destructive'
                      }`}>
                        {formatCurrency((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0))}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const half = (grandTotal / 2).toFixed(2);
                        setSplitCash(half);
                        setSplitCard(half);
                      }}
                      className="text-xs text-primary hover:underline w-full text-center"
                    >
                      Split 50/50
                    </button>
                  </div>
                )}

                <button onClick={processPayment} className="pos-btn-primary w-full py-3 text-base">
                  Complete Payment
                </button>
                <button
                  onClick={() => setShowPayment(false)}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!showPayment && (
            <div className="flex gap-2">
              <button
                onClick={() => clearCart()}
                className="py-2.5 px-3 rounded-lg border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all text-sm font-medium flex items-center justify-center"
                title="Clear cart"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleHoldCart}
                className="py-2.5 px-3 rounded-lg border border-border text-muted-foreground hover:bg-[hsl(var(--warning)/0.1)] hover:text-[hsl(var(--warning))] hover:border-[hsl(var(--warning)/0.3)] transition-all text-sm font-medium flex items-center justify-center"
                title="Hold cart for later"
              >
                <Pause className="w-4 h-4" />
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 pos-btn-primary py-2.5 text-base"
              >
                Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Held Carts Modal */}
      <Dialog open={showHeldCarts} onOpenChange={setShowHeldCarts}>
        <DialogContent className="max-w-md">
          <h3 className="text-lg font-semibold text-foreground mb-4">Held Carts</h3>
          {heldCarts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No held carts</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {heldCarts.map((held) => (
                <div key={held.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{held.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {held.items.length} items · {format(new Date(held.timestamp), 'hh:mm a')}
                    </p>
                    <p className="text-xs font-mono text-primary mt-0.5">
                      {formatCurrency(held.items.reduce((s, i) => s + i.product.price * i.quantity, 0))}
                    </p>
                  </div>
                  <button
                    onClick={() => { recallCart(held.id); setShowHeldCarts(false); toast.success('Cart recalled'); }}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    Recall
                  </button>
                  <button
                    onClick={() => deleteHeldCart(held.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-sm p-0 overflow-auto max-h-[90vh]">
          {lastTransaction && (
            <div>
              <ReceiptComponent ref={receiptRef} transaction={lastTransaction} />
              <div className="p-4 flex gap-2">
                <button onClick={handlePrintReceipt} className="pos-btn-primary flex-1 flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
                <button onClick={() => setShowReceipt(false)} className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium">
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
