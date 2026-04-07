import { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Transaction } from '@/types/pos';
import { formatCurrency } from '@/utils/pos-utils';

interface ReceiptProps {
  transaction: Transaction;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ transaction, storeName = 'SwiftPOS Store', storeAddress = '123 Commerce St, Business District', storePhone = '+91 98765 43210' }, ref) => {
    return (
      <div ref={ref} className="receipt-print bg-white text-black p-6 w-[320px] mx-auto font-mono text-xs leading-relaxed">
        {/* Store Header */}
        <div className="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
          <h1 className="text-lg font-bold tracking-wide">{storeName}</h1>
          <p className="text-[10px] mt-1">{storeAddress}</p>
          <p className="text-[10px]">Tel: {storePhone}</p>
          <p className="text-[10px]">GSTIN: 27AADCS1234F1ZN</p>
        </div>

        {/* Invoice Info */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-0.5">
          <div className="flex justify-between">
            <span>Invoice:</span>
            <span className="font-semibold">{transaction.invoiceNo}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{format(new Date(transaction.date), 'dd/MM/yyyy hh:mm a')}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{transaction.cashierId}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment:</span>
            <span className="uppercase">{transaction.paymentMethod}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="flex justify-between font-bold mb-1 text-[10px] uppercase tracking-wider">
            <span className="flex-1">Item</span>
            <span className="w-8 text-center">Qty</span>
            <span className="w-16 text-right">Rate</span>
            <span className="w-16 text-right">Amt</span>
          </div>
          {transaction.items.map((item, idx) => (
            <div key={idx} className="mb-1">
              <div className="flex justify-between">
                <span className="flex-1 truncate pr-1">{item.name}</span>
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="w-16 text-right">{formatCurrency(item.unitPrice)}</span>
                <span className="w-16 text-right">{formatCurrency(item.total)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(transaction.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (GST):</span>
            <span>{formatCurrency(transaction.taxTotal)}</span>
          </div>
          {transaction.discountAmount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatCurrency(transaction.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold border-t border-black pt-1 mt-1">
            <span>TOTAL:</span>
            <span>{formatCurrency(transaction.grandTotal)}</span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-0.5 border-b border-dashed border-gray-400 pb-2 mb-3">
          <div className="flex justify-between">
            <span>Paid:</span>
            <span>{formatCurrency(transaction.amountPaid)}</span>
          </div>
          {transaction.changeAmount > 0 && (
            <div className="flex justify-between font-bold">
              <span>Change:</span>
              <span>{formatCurrency(transaction.changeAmount)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] space-y-1">
          <p className="font-semibold">Thank you for shopping with us!</p>
          <p>Items sold are non-refundable without receipt</p>
          <p>Keep this receipt for exchange/return within 7 days</p>
          <p className="mt-2">*** SwiftPOS - Powered by Technology ***</p>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';
export default Receipt;
