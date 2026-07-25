import { STELLAR_NETWORK_PASSPHRASE } from '@/constants';
import type { Asset, MarketInfo, SwapQuote, SwapRequest, SwapResult } from '@/types';
import {
  Horizon,
  Keypair,
  Operation,
  Asset as StellarAsset,
  TransactionBuilder,
  BASE_FEE,
} from '@stellar/stellar-sdk';

export class StellarService {
  private static horizon = new Horizon.Server('https://horizon-testnet.stellar.org');

  static initialize(): void {
    this.horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
  }

  static async fetchAccountBalances(publicKey: string): Promise<
    Array<{
      asset: Asset;
      balance: string;
    }>
  > {
    try {
      const account = await this.horizon.loadAccount(publicKey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const balanceLines = account.balances as any[];

      const balances: Array<{ asset: Asset; balance: string }> = [];
      const seen = new Map<string, boolean>();

      for (const b of balanceLines) {
        if (b.asset_type === 'native') {
          balances.unshift({
            asset: { code: 'XLM', issuer: '', type: 'native' },
            balance: b.balance,
          });
          seen.set('XLM', true);
        } else {
          const code = b.asset_code as string;
          if (!seen.has(code)) {
            seen.set(code, true);
            balances.push({
              asset: {
                code,
                issuer: b.asset_issuer as string,
                type: b.asset_type as 'credit_alphanum4' | 'credit_alphanum12',
              },
              balance: b.balance,
            });
          }
        }
      }

      if (!seen.has('XLM')) {
        balances.unshift({
          asset: { code: 'XLM', issuer: '', type: 'native' },
          balance: '0',
        });
      }

      return balances;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 404) {
        return [{ asset: { code: 'XLM', issuer: '', type: 'native' }, balance: '0' }];
      }
      throw new Error(
        `Failed to fetch balances: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  static async fetchNativeBalance(publicKey: string): Promise<string> {
    const balances = await this.fetchAccountBalances(publicKey);
    const native = balances.find((b) => b.asset.type === 'native');
    return native?.balance || '0';
  }

  static async getSwapQuote(
    inputAsset: Asset,
    outputAsset: Asset,
    amount: string,
  ): Promise<SwapQuote> {
    try {
      const selling =
        inputAsset.type === 'native'
          ? StellarAsset.native()
          : new StellarAsset(inputAsset.code, inputAsset.issuer);

      const buying =
        outputAsset.type === 'native'
          ? StellarAsset.native()
          : new StellarAsset(outputAsset.code, outputAsset.issuer);

      const orderbook = await this.horizon.orderbook(selling, buying).call();

      const inputAmount = parseFloat(amount);
      let accumulatedOutput = 0;
      let remainingInput = inputAmount;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const asks = (orderbook.asks || []) as any[];

      for (const ask of asks) {
        if (remainingInput <= 0) break;
        const askAmount = parseFloat(ask.amount);
        const askPrice =
          parseFloat(ask.price) || parseFloat(ask.price_r?.n) / parseFloat(ask.price_r?.d) || 0;

        if (askAmount >= remainingInput) {
          accumulatedOutput += remainingInput * askPrice;
          remainingInput = 0;
        } else {
          accumulatedOutput += askAmount * askPrice;
          remainingInput -= askAmount;
        }
      }

      const estimatedOutput = accumulatedOutput.toFixed(7);
      const exchangeRate = inputAmount > 0 ? (accumulatedOutput / inputAmount).toFixed(7) : '0';

      return {
        inputAsset,
        outputAsset,
        inputAmount: amount,
        estimatedOutput,
        exchangeRate,
        priceImpact:
          remainingInput > 0 ? ((remainingInput / inputAmount) * 100).toFixed(2) : '0.00',
        networkFee: '0.00001',
        route: [inputAsset.code, outputAsset.code],
      };
    } catch (error: unknown) {
      throw new Error(
        `Failed to get swap quote: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  static async executeSwap(swapRequest: SwapRequest, sourceKeypair: Keypair): Promise<SwapResult> {
    try {
      const sourceAccount = await this.horizon.loadAccount(sourceKeypair.publicKey());

      const sellAsset =
        swapRequest.inputAsset.type === 'native'
          ? StellarAsset.native()
          : new StellarAsset(swapRequest.inputAsset.code, swapRequest.inputAsset.issuer);

      const buyAsset =
        swapRequest.outputAsset.type === 'native'
          ? StellarAsset.native()
          : new StellarAsset(swapRequest.outputAsset.code, swapRequest.outputAsset.issuer);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.pathPaymentStrictReceive({
            sendAsset: sellAsset,
            sendMax: swapRequest.inputAmount,
            destination: sourceKeypair.publicKey(),
            destAsset: buyAsset,
            destAmount: swapRequest.minOutputAmount,
          }),
        )
        .setTimeout(300)
        .build();

      transaction.sign(sourceKeypair);

      const result = await this.horizon.submitTransaction(transaction);

      return {
        transactionHash: result.hash,
        inputAmount: swapRequest.inputAmount,
        outputAmount: swapRequest.minOutputAmount,
        status: 'confirmed',
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      };
    } catch (error: unknown) {
      throw new Error(
        `Swap execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  static async getTransactionStatus(txHash: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    hash: string;
  }> {
    try {
      const tx = await this.horizon.transactions().transaction(txHash).call();
      return {
        status: tx.successful ? 'confirmed' : 'failed',
        hash: tx.hash,
      };
    } catch {
      return { status: 'pending', hash: txHash };
    }
  }

  static async fetchMarketInfo(assetCode: string, assetIssuer: string): Promise<MarketInfo> {
    try {
      const asset =
        assetCode === 'XLM' ? StellarAsset.native() : new StellarAsset(assetCode, assetIssuer);

      const trades = await this.horizon
        .trades()
        .forAssetPair(asset, StellarAsset.native())
        .limit(50)
        .order('desc')
        .call();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recentTrades = (trades.records || []) as any[];
      const volume24h = recentTrades.reduce(
        (sum: number, t: Record<string, unknown>) =>
          sum + parseFloat((t.base_amount as string) || '0'),
        0,
      );

      let lastPrice = 0;
      let firstPrice = 0;

      if (recentTrades.length > 0) {
        const first = recentTrades[0];
        const last = recentTrades[recentTrades.length - 1];
        lastPrice =
          parseFloat(first.price as string) ||
          parseFloat(first.price_r?.n as string) / parseFloat(first.price_r?.d as string) ||
          0;
        firstPrice =
          recentTrades.length > 1
            ? parseFloat(last.price as string) ||
              parseFloat(last.price_r?.n as string) / parseFloat(last.price_r?.d as string) ||
              0
            : lastPrice;
      }

      const change24h = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;

      return {
        assetCode,
        assetIssuer,
        priceUSD: lastPrice,
        volume24h,
        change24h,
        liquidity: volume24h * 2,
        lastUpdated: Date.now(),
      };
    } catch (error: unknown) {
      throw new Error(
        `Failed to fetch market info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
