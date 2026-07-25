import { useAppStore } from '@/store';
import type { TransactionStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function TransactionHistory() {
  const transactions = useAppStore((s) => s.transactions);

  if (transactions.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-stellar-500/10 flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-400">No transactions yet</p>
        <p className="text-xs text-gray-500 mt-1">Your swap history will appear here</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Transaction History
      </h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {transactions.map((tx) => (
          <div
            key={tx.hash}
            className="flex items-center gap-3 p-3 rounded-xl bg-orbit-darker/50 border border-orbit-border/50 hover:border-orbit-border transition-colors"
          >
            <div className="flex-shrink-0">
              {tx.type === 'swap' ? (
                <div className="w-8 h-8 rounded-full bg-stellar-500/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-stellar-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-orbit-purple/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-orbit-purple"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{tx.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <a
                  href={tx.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-stellar-400 transition-colors font-mono truncate"
                >
                  {tx.hash.slice(0, 12)}...
                </a>
              </div>
            </div>
            <StatusBadge status={tx.status as TransactionStatus} />
          </div>
        ))}
      </div>
    </div>
  );
}
