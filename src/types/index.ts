import type { SupportedWalletId } from '@/constants';

export type NetworkType = 'TESTNET' | 'PUBLIC';

export type TransactionStatus =
  | 'preparing'
  | 'awaiting_approval'
  | 'signing'
  | 'submitting'
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'rejected'
  | 'timeout';

export interface WalletState {
  address: string | null;
  network: NetworkType;
  connected: boolean;
  walletId: SupportedWalletId | null;
}

export interface Asset {
  code: string;
  issuer: string;
  type: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
  contractId?: string;
}

export interface SwapQuote {
  inputAsset: Asset;
  outputAsset: Asset;
  inputAmount: string;
  estimatedOutput: string;
  exchangeRate: string;
  priceImpact: string;
  networkFee: string;
  route: string[];
}

export interface SwapRequest {
  inputAsset: Asset;
  outputAsset: Asset;
  inputAmount: string;
  minOutputAmount: string;
  slippageBps: number;
}

export interface SwapResult {
  transactionHash: string;
  inputAmount: string;
  outputAmount: string;
  status: TransactionStatus;
  timestamp: number;
  explorerUrl: string;
}

export interface TransactionRecord {
  hash: string;
  status: TransactionStatus;
  type: 'swap' | 'contract_call' | 'transfer';
  description: string;
  timestamp: number;
  explorerUrl: string;
  details?: Record<string, unknown>;
}

export interface MarketInfo {
  assetCode: string;
  assetIssuer: string;
  priceUSD: number;
  volume24h: number;
  change24h: number;
  liquidity: number;
  lastUpdated: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  txHash?: string;
  explorerUrl?: string;
}

export interface WalletInfo {
  id: SupportedWalletId;
  name: string;
  icon: string;
  installed: boolean;
  url: string;
}

export interface WalletError {
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
}

export interface ContractEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
  contractId: string;
}

export interface ContractBalanceResponse {
  balances: Array<{
    asset: string;
    amount: string;
  }>;
}

export interface ContractSwapResponse {
  success: boolean;
  outputAmount: string;
  fee: string;
}

export interface FormErrors {
  inputAmount?: string;
  outputAsset?: string;
  inputAsset?: string;
  wallet?: string;
  balance?: string;
  network?: string;
}
