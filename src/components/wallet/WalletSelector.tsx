import { useEffect } from 'react';
import { useWallet } from '@/providers';
import { useWallets } from '@/hooks/useWallets';
import type { SupportedWalletId } from '@/constants';
import { clsx } from 'clsx';

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletSelector({ isOpen, onClose }: WalletSelectorProps) {
  const { connect, isConnecting, error, clearError } = useWallet();
  const wallets = useWallets();

  useEffect(() => {
    if (!isOpen) {
      clearError();
    }
  }, [isOpen, clearError]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConnect = async (walletId: SupportedWalletId) => {
    try {
      await connect(walletId);
      onClose();
    } catch {
      // Error handled by provider
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Connect Wallet"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-orbit-dark border border-orbit-border rounded-2xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-orbit-border">
          <h2 className="text-lg font-semibold text-white">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close wallet selector"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-400">{error.message}</p>
                  {error.details && <p className="text-xs text-red-400/70 mt-1">{error.details}</p>}
                  {error.code === 'WALLET_NOT_INSTALLED' && error.recoverable && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-gray-400">
                        Please install the wallet extension and try again.
                      </p>
                      <button
                        onClick={() => {
                          const wallet = wallets.find(
                            (w) =>
                              w.name.toLowerCase() ===
                              error.message.toLowerCase().replace('wallet not found', '').trim(),
                          );
                          if (wallet) window.open(wallet.url, '_blank');
                        }}
                        className="text-xs text-stellar-400 hover:text-stellar-300 transition-colors"
                      >
                        Install wallet →
                      </button>
                    </div>
                  )}
                  {error.recoverable && (
                    <button
                      onClick={clearError}
                      className="text-xs text-gray-400 hover:text-white mt-2 transition-colors"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleConnect(wallet.id)}
              disabled={isConnecting || !wallet.installed}
              className={clsx(
                'w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200',
                'hover:bg-white/5 border border-transparent hover:border-orbit-border',
                !wallet.installed && 'opacity-50 cursor-not-allowed',
              )}
              aria-label={`Connect with ${wallet.name}`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stellar-500/20 to-orbit-purple/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-stellar-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">{wallet.name}</p>
                <p className="text-xs text-gray-500">
                  {wallet.installed ? 'Ready to connect' : 'Not installed'}
                </p>
              </div>
              {!wallet.installed && (
                <a
                  href={wallet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stellar-400 hover:text-stellar-300 transition-colors px-2 py-1 rounded-lg hover:bg-stellar-500/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  Install
                </a>
              )}
              <svg
                className={clsx(
                  'w-4 h-4 text-gray-500 transition-transform',
                  isConnecting && 'hidden',
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              {isConnecting && (
                <svg
                  className="animate-spin h-4 w-4 text-stellar-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-orbit-border">
          <p className="text-xs text-gray-500 text-center">
            By connecting a wallet, you agree to the Stellar network terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
