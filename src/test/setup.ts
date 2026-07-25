import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('@creit.tech/stellar-wallets-kit', () => {
  return {
    StellarWalletsKit: vi.fn().mockImplementation(() => ({
      setWallet: vi.fn(),
      getAddress: vi.fn().mockResolvedValue({ address: 'GABC1234567890' }),
      signTransaction: vi.fn().mockResolvedValue({ signedTxXdr: 'abc123' }),
      openModal: vi.fn(),
    })),
    WalletNetwork: {
      PUBLIC: 'PUBLIC',
      TESTNET: 'TESTNET',
    },
    allowAllModules: vi.fn().mockReturnValue([]),
    FREIGHTER_ID: 'freighter',
    XBULL_ID: 'xbull',
    ALBEDO_ID: 'albedo',
    RABET_ID: 'rabet',
    LOBSTR_ID: 'lobstr',
  };
});

vi.mock('@stellar/freighter-api', () => ({
  getAddress: vi.fn(),
  signTransaction: vi.fn(),
}));
