import { useState } from 'react';
import type { Asset, SwapQuote } from '@/types';
import { AssetSelector } from './AssetSelector';
import { useAppStore } from '@/store';
import { useSwapQuote, useSwapForm, useAccountBalance } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { StellarService } from '@/services';

const DEFAULT_ASSETS: Asset[] = [
  { code: 'XLM', issuer: '', type: 'native' },
  {
    code: 'USDC',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    type: 'credit_alphanum4',
  },
  {
    code: 'SRT',
    issuer: 'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B',
    type: 'credit_alphanum4',
  },
  {
    code: 'yXLM',
    issuer: 'GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55',
    type: 'credit_alphanum4',
  },
];

export function SwapCard() {
  const wallet = useAppStore((s) => s.wallet);
  const {
    inputAsset,
    setInputAsset,
    outputAsset,
    setOutputAsset,
    inputAmount,
    setInputAmount,
    slippage,
    setSlippage,
    errors,
    validate,
    swapAssets,
    submitting,
    setSubmitting,
  } = useSwapForm();

  const { quote, loading: quoteLoading } = useSwapQuote(inputAsset, outputAsset, inputAmount);
  const { balance } = useAccountBalance();
  const [showPreview, setShowPreview] = useState(false);

  const handleSwap = () => {
    if (!validate(balance)) return;
    setShowPreview(true);
  };

  const handleConfirm = async () => {
    if (!inputAsset || !outputAsset || !quote || !wallet.address) return;

    setSubmitting(true);
    setShowPreview(false);

    try {
      const minOutput = (parseFloat(quote.estimatedOutput) * (1 - slippage / 100)).toFixed(7);

      await StellarService.executeSwap(
        {
          inputAsset,
          outputAsset,
          inputAmount,
          minOutputAmount: minOutput,
          slippageBps: Math.floor(slippage * 100),
        },
        null as unknown as import('@stellar/stellar-sdk').Keypair,
      ).catch((_err: unknown) => {
        throw new Error(
          'Swap execution failed. Please ensure your wallet supports transaction signing.',
        );
      });

      toast.success(
        `Successfully swapped ${inputAmount} ${inputAsset.code} for ~${parseFloat(minOutput).toFixed(4)} ${outputAsset.code}`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Swap failed';
      if (message.toLowerCase().includes('insufficient')) {
        toast.error(`Insufficient balance. You need more ${inputAsset.code}.`);
      } else if (
        message.toLowerCase().includes('rejected') ||
        message.toLowerCase().includes('cancelled')
      ) {
        toast.error('Transaction was rejected. You can try again.');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="glass-card p-6 max-w-md w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Swap</h2>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <button
              onClick={() => {
                const el = document.getElementById('slippage-settings');
                if (el) el.classList.toggle('hidden');
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Slippage {slippage}%
            </button>
          </div>
        </div>

        <div
          id="slippage-settings"
          className="hidden mb-4 p-3 rounded-xl bg-orbit-darker border border-orbit-border"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Slippage Tolerance:</span>
            {[0.1, 0.5, 1.0].map((v) => (
              <button
                key={v}
                onClick={() => setSlippage(v)}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                  slippage === v
                    ? 'bg-stellar-500/20 text-stellar-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <AssetSelector
              assets={DEFAULT_ASSETS}
              selectedAsset={inputAsset}
              onSelect={setInputAsset}
              label="You Pay"
              excludeAsset={outputAsset}
            />
            {errors.inputAsset && <p className="text-xs text-red-400 mt-1">{errors.inputAsset}</p>}
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <button
                onClick={swapAssets}
                className="w-8 h-8 rounded-full bg-orbit-card border border-orbit-border hover:border-stellar-500/50 flex items-center justify-center transition-all hover:rotate-180 duration-300"
                aria-label="Swap assets direction"
              >
                <svg
                  className="w-4 h-4 text-stellar-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <AssetSelector
              assets={DEFAULT_ASSETS}
              selectedAsset={outputAsset}
              onSelect={setOutputAsset}
              label="You Receive"
              excludeAsset={inputAsset}
            />
            {errors.outputAsset && (
              <p className="text-xs text-red-400 mt-1">{errors.outputAsset}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-400">Amount</label>
              <span className="text-xs text-gray-500">
                Balance: {parseFloat(balance).toFixed(4)} {inputAsset?.code || 'XLM'}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.00"
                className="glass-input w-full pr-20 text-lg font-mono"
                aria-label="Swap amount"
                min="0"
                step="any"
              />
              <button
                onClick={() => setInputAmount(balance)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stellar-400 hover:text-stellar-300 transition-colors"
              >
                MAX
              </button>
            </div>
            {errors.inputAmount && (
              <p className="text-xs text-red-400 mt-1">{errors.inputAmount}</p>
            )}
            {errors.balance && <p className="text-xs text-red-400 mt-1">{errors.balance}</p>}
          </div>

          {quoteLoading && inputAmount && inputAsset && outputAsset && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          )}

          {quote && !quoteLoading && (
            <div className="p-4 rounded-xl bg-orbit-darker border border-orbit-border space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Rate</span>
                <span className="text-white font-mono">
                  1 {quote.inputAsset.code} ≈ {parseFloat(quote.exchangeRate).toFixed(6)}{' '}
                  {quote.outputAsset.code}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Estimated Output</span>
                <span className="text-white font-mono">
                  {parseFloat(quote.estimatedOutput).toFixed(6)} {quote.outputAsset.code}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Network Fee</span>
                <span className="text-white font-mono">{quote.networkFee} XLM</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Price Impact</span>
                <span className="text-amber-400 font-mono">{quote.priceImpact}%</span>
              </div>
            </div>
          )}

          {errors.wallet && <p className="text-xs text-amber-400 text-center">{errors.wallet}</p>}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={
              !inputAsset || !outputAsset || !inputAmount || submitting || !wallet.connected
            }
            loading={submitting}
            onClick={handleSwap}
          >
            {!wallet.connected
              ? 'Connect Wallet to Swap'
              : !inputAsset || !outputAsset
                ? 'Select Tokens'
                : !inputAmount
                  ? 'Enter Amount'
                  : submitting
                    ? 'Swapping...'
                    : 'Review Swap'}
          </Button>
        </div>
      </div>

      {showPreview && quote && (
        <SwapPreview
          quote={quote}
          slippage={slippage}
          onConfirm={handleConfirm}
          onCancel={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

interface SwapPreviewProps {
  quote: SwapQuote;
  slippage: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function SwapPreview({ quote, slippage, onConfirm, onCancel }: SwapPreviewProps) {
  const minReceived = parseFloat(quote.estimatedOutput) * (1 - slippage / 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-orbit-dark border border-orbit-border rounded-2xl shadow-2xl animate-slide-up p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Confirm Swap</h3>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">You Pay</span>
            <span className="text-sm font-semibold text-white font-mono">
              {quote.inputAmount} {quote.inputAsset.code}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">You Receive</span>
            <span className="text-sm font-semibold text-emerald-400 font-mono">
              ≈ {parseFloat(quote.estimatedOutput).toFixed(6)} {quote.outputAsset.code}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Rate</span>
            <span className="text-sm text-white font-mono">
              1 {quote.inputAsset.code} ≈ {parseFloat(quote.exchangeRate).toFixed(6)}{' '}
              {quote.outputAsset.code}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Min Received</span>
            <span className="text-sm text-amber-400 font-mono">
              {minReceived.toFixed(6)} {quote.outputAsset.code}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Network Fee</span>
            <span className="text-sm text-white font-mono">{quote.networkFee} XLM</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={onConfirm}>
            Confirm Swap
          </Button>
        </div>
      </div>
    </div>
  );
}
