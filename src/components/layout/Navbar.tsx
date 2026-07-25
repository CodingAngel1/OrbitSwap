import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useWallet } from '@/providers';
import { useMediaQuery } from '@/hooks';
import { WalletSelector } from '@/components/wallet/WalletSelector';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const wallet = useAppStore((s) => s.wallet);
  const { disconnect } = useWallet();
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const shortAddress = wallet.address
    ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`
    : '';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-orbit-dark/80 backdrop-blur-xl border-b border-orbit-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group" aria-label="OrbitSwap Home">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orbit-purple to-orbit-cyan flex items-center justify-center ring-2 ring-orbit-purple/20 group-hover:ring-orbit-purple/40 transition-all">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Orbit<span className="text-gradient">Swap</span>
              </span>
            </Link>

            {!isMobile && (
              <div className="flex items-center gap-1">
                <Link
                  to="/"
                  className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                >
                  Swap
                </Link>
                <Link
                  to="/history"
                  className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                >
                  History
                </Link>
                <a
                  href="https://stellar.expert/explorer/testnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                >
                  Explorer
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {wallet.connected && wallet.address ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-3 bg-orbit-card border border-orbit-border rounded-xl px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-mono text-gray-300">{shortAddress}</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-orbit-border/50 px-2 py-0.5 rounded-full">
                    {wallet.network}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWalletSelector(true)}
                  aria-label="Switch wallet"
                >
                  Switch
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnect}
                  aria-label="Disconnect wallet"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size={isMobile ? 'sm' : 'md'}
                onClick={() => setShowWalletSelector(true)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Connect Wallet
              </Button>
            )}

            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                aria-label="Toggle mobile menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {isMobile && mobileMenuOpen && (
          <div className="py-4 border-t border-orbit-border/50 animate-slide-down">
            <div className="flex flex-col gap-1">
              <Link
                to="/"
                className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                Swap
              </Link>
              <Link
                to="/history"
                className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                History
              </Link>
            </div>
          </div>
        )}
      </div>

      {showWalletSelector && (
        <WalletSelector isOpen={showWalletSelector} onClose={() => setShowWalletSelector(false)} />
      )}
    </nav>
  );
}
