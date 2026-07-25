import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { WalletState, WalletError } from '@/types';
import type { SupportedWalletId } from '@/constants';
import { WalletService } from '@/services';
import { useAppStore } from '@/store';

interface WalletContextValue {
  connect: (walletId: SupportedWalletId) => Promise<WalletState>;
  disconnect: () => Promise<void>;
  switchWallet: (walletId: SupportedWalletId) => Promise<WalletState>;
  isConnecting: boolean;
  error: WalletError | null;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<WalletError | null>(null);
  const setWallet = useAppStore((s) => s.setWallet);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    WalletService.initialize();

    WalletService.reconnect()
      .then((state) => {
        if (state) {
          setWallet(state);
        }
      })
      .catch(() => {
        // Reconnection failed silently
      });
  }, [setWallet]);

  const connect = useCallback(
    async (walletId: SupportedWalletId): Promise<WalletState> => {
      setIsConnecting(true);
      setError(null);

      try {
        const state = await WalletService.connect(walletId);
        setWallet(state);
        return state;
      } catch (err: unknown) {
        const walletError = err as WalletError;
        setError(walletError);
        throw walletError;
      } finally {
        setIsConnecting(false);
      }
    },
    [setWallet],
  );

  const disconnect = useCallback(async () => {
    setError(null);
    await WalletService.disconnect();
    setWallet({
      address: null,
      network: 'TESTNET',
      connected: false,
      walletId: null,
    });
  }, [setWallet]);

  const switchWallet = useCallback(
    async (walletId: SupportedWalletId): Promise<WalletState> => {
      setIsConnecting(true);
      setError(null);

      try {
        const state = await WalletService.switchWallet(walletId);
        setWallet(state);
        return state;
      } catch (err: unknown) {
        const walletError = err as WalletError;
        setError(walletError);
        throw walletError;
      } finally {
        setIsConnecting(false);
      }
    },
    [setWallet],
  );

  const clearError = useCallback(() => setError(null), []);

  return (
    <WalletContext.Provider
      value={{ connect, disconnect, switchWallet, isConnecting, error, clearError }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
