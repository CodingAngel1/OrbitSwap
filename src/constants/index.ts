import { Networks } from '@stellar/stellar-sdk';

export const APP_NAME = 'OrbitSwap';
export const APP_DESCRIPTION = 'Fast, seamless token swaps powered by Stellar';
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000';

export const STELLAR_NETWORK = (import.meta.env.VITE_STELLAR_NETWORK || 'TESTNET') as
  'TESTNET' | 'PUBLIC';
export const STELLAR_NETWORK_PASSPHRASE =
  STELLAR_NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET;

export const HORIZON_URL =
  import.meta.env.VITE_HORIZON_URL ||
  (STELLAR_NETWORK === 'PUBLIC'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org');

export const SOROBAN_RPC_URL =
  import.meta.env.VITE_SOROBAN_RPC_URL ||
  (STELLAR_NETWORK === 'PUBLIC'
    ? 'https://soroban.stellar.org'
    : 'https://soroban-testnet.stellar.org');

export const CONTRACT_ID =
  import.meta.env.VITE_CONTRACT_ID || 'CCQXDJI3PJPGLZNZN7OGQG4CKODJQKXOKBAXNPCLBJYRR5A4EUREZADT';

export const STELLAR_EXPERT_URL =
  STELLAR_NETWORK === 'PUBLIC'
    ? 'https://stellar.expert/explorer/public'
    : 'https://stellar.expert/explorer/testnet';

export const SUPPORTED_WALLETS = ['xbull', 'freighter', 'albedo', 'rabet', 'lobstr'] as const;

export type SupportedWalletId = (typeof SUPPORTED_WALLETS)[number];

export const WALLET_NAMES: Record<SupportedWalletId, string> = {
  xbull: 'xBull',
  freighter: 'Freighter',
  albedo: 'Albedo',
  rabet: 'Rabet',
  lobstr: 'LOBSTR',
};

export const POLLING_INTERVALS = {
  BALANCE: 15000,
  MARKET: 30000,
  TRANSACTION: 5000,
  CONTRACT: 10000,
} as const;

export const TRANSACTION_TIMEOUT_MS = 120000;

export const TOAST_DURATION = 5000;

export const MAX_SWAP_AMOUNT = 1000000;
export const MIN_SWAP_AMOUNT = 0.0000001;
