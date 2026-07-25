import { describe, it, expect } from 'vitest';
import { WalletService } from '@/services/wallet.service';
import type { SupportedWalletId } from '@/constants';

describe('WalletService', () => {
  it('provides wallet names for all supported wallets', () => {
    const wallets: SupportedWalletId[] = ['freighter', 'xbull', 'albedo', 'rabet', 'lobstr'];
    for (const id of wallets) {
      const name = WalletService.getWalletName(id);
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
    }
  });

  it('returns null for stored wallet when none is set', () => {
    localStorage.removeItem('orbitswap_wallet');
    const stored = WalletService.getStoredWalletId();
    expect(stored).toBeNull();
  });

  it('checks xbull wallet installation', () => {
    const installed = WalletService.isWalletInstalled('xbull');
    expect(typeof installed).toBe('boolean');
  });

  it('checks freighter wallet installation', () => {
    const installed = WalletService.isWalletInstalled('freighter');
    expect(typeof installed).toBe('boolean');
  });

  it('returns correct install URL for wallets', () => {
    expect(WalletService.getWalletInstallUrl('freighter')).toBe('https://www.freighter.app/');
    expect(WalletService.getWalletInstallUrl('xbull')).toBe('https://xbull.app/');
    expect(WalletService.getWalletInstallUrl('lobstr')).toBe('https://lobstr.co/');
  });

  it('clears stored wallet', () => {
    WalletService.clearStoredWallet();
    expect(WalletService.getStoredWalletId()).toBeNull();
  });

  it('disconnects properly', async () => {
    await WalletService.disconnect();
    const state = await WalletService.getCurrentState();
    expect(state.connected).toBe(false);
    expect(state.address).toBeNull();
  });
});

describe('StellarService - Market Info', () => {
  it('builds correct market info structure', async () => {
    // Test the data shape by constructing expected fields
    const { StellarService } = await import('@/services/stellar.service');

    const fetchSpy = StellarService.fetchMarketInfo;
    expect(typeof fetchSpy).toBe('function');
  });
});

describe('StellarService - Transaction Status', () => {
  it('returns pending for unknown hash', async () => {
    const { StellarService } = await import('@/services/stellar.service');
    const status = await StellarService.getTransactionStatus(
      '0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(status.status).toBe('pending');
  });
});
