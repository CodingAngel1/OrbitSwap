import { useAppStore } from '@/store';
import { useAccountBalance, useClipboard } from '@/hooks';
import { useWallet } from '@/providers';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';

export function WalletPanel() {
  const wallet = useAppStore((s) => s.wallet);
  const { balance, loading } = useAccountBalance();
  const { disconnect } = useWallet();
  const { copy, copied } = useClipboard();

  if (!wallet.connected || !wallet.address) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-stellar-500/10 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-stellar-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-sm text-gray-400">Connect your wallet to view details</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Wallet</h3>
        <span className="badge-success text-xs">
          Connected
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Address</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-gray-300 truncate flex-1">
              {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
            </code>
            <button
              onClick={() => copy(wallet.address!)}
              className={clsx(
                'p-1.5 rounded-lg transition-colors',
                copied ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500 hover:text-white hover:bg-white/5',
              )}
              aria-label="Copy wallet address"
            >
              {copied ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Balance</p>
            {loading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <p className="text-sm font-semibold text-white font-mono">
                {parseFloat(balance).toFixed(4)} XLM
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Network</p>
            <p className="text-sm font-semibold text-white">{wallet.network}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-orbit-border">
          <span className="text-xs text-gray-500">{wallet.walletId}</span>
          <Button variant="ghost" size="sm" onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      </div>
    </div>
  );
}
