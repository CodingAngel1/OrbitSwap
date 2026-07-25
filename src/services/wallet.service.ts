import type { SupportedWalletId } from '@/constants';
import { STELLAR_NETWORK, WALLET_NAMES } from '@/constants';
import type { WalletError, WalletState } from '@/types';

import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
  XBULL_ID,
  ALBEDO_ID,
  RABET_ID,
  LOBSTR_ID,
} from '@creit.tech/stellar-wallets-kit';

const WALLET_ID_MAP: Record<SupportedWalletId, string> = {
  freighter: FREIGHTER_ID,
  xbull: XBULL_ID,
  albedo: ALBEDO_ID,
  rabet: RABET_ID,
  lobstr: LOBSTR_ID,
};



const STORAGE_KEY = 'orbitswap_wallet';

export class WalletService {
  private static kit: StellarWalletsKit;
  private static listeners: Array<(state: WalletState) => void> = [];

  static initialize(): void {
    this.kit = new StellarWalletsKit({
      network: STELLAR_NETWORK === 'PUBLIC' ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET,
      selectedWalletId: this.getStoredWalletId() ? WALLET_ID_MAP[this.getStoredWalletId()!] : FREIGHTER_ID,
      modules: allowAllModules(),
    });
  }

  static getKit(): StellarWalletsKit {
    if (!this.kit) {
      this.initialize();
    }
    return this.kit;
  }

  static getWalletName(id: SupportedWalletId): string {
    return WALLET_NAMES[id];
  }

  static getStoredWalletId(): SupportedWalletId | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.walletId || null;
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }

  private static storeWallet(walletId: SupportedWalletId, address: string): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ walletId, address }));
  }

  static clearStoredWallet(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static async connect(walletId: SupportedWalletId): Promise<WalletState> {
    try {
      const kit = this.getKit();
      kit.setWallet(WALLET_ID_MAP[walletId]);

      const addressResult = await kit.getAddress();
      const address = typeof addressResult === 'string' ? addressResult : addressResult.address;

      this.storeWallet(walletId, address);

      const state: WalletState = {
        address,
        network: STELLAR_NETWORK,
        connected: true,
        walletId,
      };

      this.notifyListeners(state);
      return state;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message.includes('not installed') || message.includes('not found')) {
        throw this.createError(
          'WALLET_NOT_INSTALLED',
          'Wallet not found',
          `Please install ${WALLET_NAMES[walletId]} to continue.`,
          true,
        );
      }

      if (
        message.includes('rejected') ||
        message.includes('cancelled') ||
        message.includes('denied')
      ) {
        throw this.createError(
          'WALLET_REJECTED',
          'Request rejected',
          'You cancelled the wallet connection request.',
          true,
        );
      }

      throw this.createError('WALLET_CONNECT_FAILED', 'Connection failed', message, true);
    }
  }

  static async disconnect(): Promise<void> {
    this.clearStoredWallet();
    const state: WalletState = {
      address: null,
      network: STELLAR_NETWORK,
      connected: false,
      walletId: null,
    };
    this.notifyListeners(state);
  }

  static async reconnect(): Promise<WalletState | null> {
    const storedWalletId = this.getStoredWalletId();
    if (!storedWalletId) return null;

    try {
      return await this.connect(storedWalletId);
    } catch {
      this.clearStoredWallet();
      return null;
    }
  }

  static async switchWallet(walletId: SupportedWalletId): Promise<WalletState> {
    await this.disconnect();
    return this.connect(walletId);
  }

  static async getCurrentState(): Promise<WalletState> {
    const storedWalletId = this.getStoredWalletId();

    if (!storedWalletId) {
      return {
        address: null,
        network: STELLAR_NETWORK,
        connected: false,
        walletId: null,
      };
    }

    try {
      const kit = this.getKit();
      kit.setWallet(WALLET_ID_MAP[storedWalletId]);
      const addressResult = await kit.getAddress();
      const address = typeof addressResult === 'string' ? addressResult : addressResult.address;

      return {
        address,
        network: STELLAR_NETWORK,
        connected: true,
        walletId: storedWalletId,
      };
    } catch {
      return {
        address: null,
        network: STELLAR_NETWORK,
        connected: false,
        walletId: storedWalletId,
      };
    }
  }

  static async getAddress(): Promise<string> {
    const kit = this.getKit();
    const addressResult = await kit.getAddress();
    return typeof addressResult === 'string' ? addressResult : addressResult.address;
  }

  static async signTransaction(xdr: string): Promise<string> {
    try {
      const kit = this.getKit();
      const result = await kit.signTransaction(xdr);
      return result.signedTxXdr;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (
        message.includes('rejected') ||
        message.includes('cancelled') ||
        message.includes('denied')
      ) {
        throw this.createError(
          'WALLET_REJECTED',
          'Request rejected',
          'You cancelled the transaction signing.',
          true,
        );
      }
      throw this.createError('SIGN_FAILED', 'Signing failed', message, false);
    }
  }

  static subscribe(callback: (state: WalletState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private static notifyListeners(state: WalletState): void {
    this.listeners.forEach((l) => l(state));
  }

  static isWalletInstalled(walletId: SupportedWalletId): boolean {
    if (walletId === 'freighter') {
      return typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).freighter;
    }
    if (walletId === 'xbull') {
      return typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).xBullSDK;
    }
    if (walletId === 'albedo') {
      return typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).albedo;
    }
    if (walletId === 'rabet') {
      return typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).rabet;
    }
    if (walletId === 'lobstr') {
      return true;
    }
    return false;
  }

  static getWalletInstallUrl(walletId: SupportedWalletId): string {
    const urls: Record<SupportedWalletId, string> = {
      freighter: 'https://www.freighter.app/',
      xbull: 'https://xbull.app/',
      albedo: 'https://albedo.link/',
      rabet: 'https://rabet.io/',
      lobstr: 'https://lobstr.co/',
    };
    return urls[walletId];
  }

  private static createError(
    code: string,
    message: string,
    details: string,
    recoverable: boolean,
  ): WalletError {
    return { code, message, details, recoverable };
  }
}
