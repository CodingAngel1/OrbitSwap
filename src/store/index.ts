import { create } from 'zustand';
import type {
  WalletState,
  TransactionRecord,
  Notification,
  MarketInfo,
  SwapResult,
  ContractEvent,
} from '@/types';

interface AppState {
  wallet: WalletState;
  transactions: TransactionRecord[];
  notifications: Notification[];
  marketInfo: Map<string, MarketInfo>;
  recentSwaps: SwapResult[];
  contractEvents: ContractEvent[];

  setWallet: (wallet: WalletState) => void;
  addTransaction: (tx: TransactionRecord) => void;
  updateTransaction: (hash: string, updates: Partial<TransactionRecord>) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setMarketInfo: (key: string, info: MarketInfo) => void;
  addRecentSwap: (swap: SwapResult) => void;
  addContractEvent: (event: ContractEvent) => void;
}

export const useAppStore = create<AppState>((set) => ({
  wallet: {
    address: null,
    network: 'TESTNET',
    connected: false,
    walletId: null,
  },

  transactions: [],
  notifications: [],
  marketInfo: new Map(),
  recentSwaps: [],
  contractEvents: [],

  setWallet: (wallet) => set({ wallet }),

  addTransaction: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions].slice(0, 50),
    })),

  updateTransaction: (hash, updates) =>
    set((state) => ({
      transactions: state.transactions.map((t) => (t.hash === hash ? { ...t, ...updates } : t)),
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 100),
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  clearNotifications: () => set({ notifications: [] }),

  setMarketInfo: (key, info) =>
    set((state) => {
      const newMap = new Map(state.marketInfo);
      newMap.set(key, info);
      return { marketInfo: newMap };
    }),

  addRecentSwap: (swap) =>
    set((state) => ({
      recentSwaps: [swap, ...state.recentSwaps].slice(0, 20),
    })),

  addContractEvent: (event) =>
    set((state) => ({
      contractEvents: [event, ...state.contractEvents].slice(0, 50),
    })),
}));
