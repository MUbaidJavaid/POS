import { Target } from 'lucide-react';
import { useTransactionStore } from '@/store/transactionStore';
import { formatCurrency } from '@/utils/pos-utils';
import { Progress } from '@/components/ui/progress';

interface SalesTargetTrackerProps {
  dailyTarget?: number;
}

export default function SalesTargetTracker({ dailyTarget = 1000 }: SalesTargetTrackerProps) {
  const todaySales = useTransactionStore((s) => s.getTodaySales());
  const txCount = useTransactionStore((s) => s.getTodayTransactionCount());
  const progress = Math.min((todaySales / dailyTarget) * 100, 100);
  const hit = todaySales >= dailyTarget;

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className={`w-4 h-4 ${hit ? 'text-[hsl(var(--success))]' : 'text-primary'}`} />
        <span className="text-sm font-semibold text-foreground">Daily Sales Target</span>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-2xl font-bold font-mono text-foreground">{formatCurrency(todaySales)}</p>
          <p className="text-xs text-muted-foreground">of {formatCurrency(dailyTarget)} target</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold font-mono ${hit ? 'text-[hsl(var(--success))]' : 'text-primary'}`}>
            {progress.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground">{txCount} sales</p>
        </div>
      </div>

      <Progress
        value={progress}
        className={`h-2.5 ${hit ? '[&>div]:bg-[hsl(var(--success))]' : ''}`}
      />

      {hit && (
        <p className="text-xs text-[hsl(var(--success))] font-medium mt-2 text-center">
          🎉 Target achieved!
        </p>
      )}
    </div>
  );
}
