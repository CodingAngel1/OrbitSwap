import { useAppStore } from '@/store';
import type { TransactionStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function RecentSwaps() {
  const recentSwaps = useAppStore((s) => s.recentSwaps);

  if (recentSwaps.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Recent Swaps
        </h3>
        <div className="text-center py-6">
          <div className="w-10 h-10 rounded-full bg-stellar-500/10 flex items-center justify-center mx-auto mb-2">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
          <p className="text-xs text-gray-500">No recent swaps</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Recent Swaps
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recentSwaps.map((swap, i) => (
          <div
            key={swap.transactionHash || i}
            className="flex items-center justify-between p-3 rounded-xl bg-orbit-darker/50 border border-orbit-border/50"
          >
            <div>
              <p className="text-sm text-white font-mono">
                {parseFloat(swap.inputAmount).toFixed(4)} →{' '}
                {parseFloat(swap.outputAmount).toFixed(4)}
              </p>
              <a
                href={swap.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-stellar-400 transition-colors"
              >
                View on Explorer ↗
              </a>
            </div>
            <StatusBadge status={swap.status as TransactionStatus} />
          </div>
        ))}
      </div>
    </div>
  );
}
