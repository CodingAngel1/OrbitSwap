import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { StellarService } from '@/services';
import { POLLING_INTERVALS, MIN_SWAP_AMOUNT, MAX_SWAP_AMOUNT } from '@/constants';
import type { Asset, FormErrors, SwapQuote, TransactionStatus } from '@/types';

export function useAccountBalance() {
  const wallet = useAppStore((s) => s.wallet);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet.address || !wallet.connected) {
      setBalance('0');
      return;
    }

    let cancelled = false;

    const fetchBalance = async () => {
      setLoading(true);
      try {
        const bal = await StellarService.fetchNativeBalance(wallet.address!);
        if (!cancelled) {
          setBalance(bal);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch balance');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, POLLING_INTERVALS.BALANCE);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [wallet.address, wallet.connected]);

  return { balance, loading, error, refetch: () => {} };
}

export function useSwapQuote(
  inputAsset: Asset | null,
  outputAsset: Asset | null,
  inputAmount: string,
) {
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (
      !inputAsset ||
      !outputAsset ||
      !inputAmount ||
      parseFloat(inputAmount) <= 0
    ) {
      setQuote(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await StellarService.getSwapQuote(
          inputAsset,
          outputAsset,
          inputAmount,
        );
        setQuote(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get quote');
        setQuote(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputAsset, outputAsset, inputAmount]);

  return { quote, loading, error };
}

export function useSwapForm() {
  const wallet = useAppStore((s) => s.wallet);
  const [inputAsset, setInputAsset] = useState<Asset | null>(null);
  const [outputAsset, setOutputAsset] = useState<Asset | null>(null);
  const [inputAmount, setInputAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (balance?: string): boolean => {
    const newErrors: FormErrors = {};

    if (!wallet.connected) {
      newErrors.wallet = 'Please connect your wallet to swap tokens';
    }

    if (!inputAsset) {
      newErrors.inputAsset = 'Please select an input asset';
    }

    if (!outputAsset) {
      newErrors.outputAsset = 'Please select an output asset';
    }

    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      newErrors.inputAmount = 'Please enter a valid amount';
    } else if (parseFloat(inputAmount) < MIN_SWAP_AMOUNT) {
      newErrors.inputAmount = `Minimum swap amount is ${MIN_SWAP_AMOUNT}`;
    } else if (parseFloat(inputAmount) > MAX_SWAP_AMOUNT) {
      newErrors.inputAmount = `Maximum swap amount is ${MAX_SWAP_AMOUNT}`;
    }

    if (inputAsset && outputAsset && inputAsset.code === outputAsset.code) {
      newErrors.outputAsset = 'Input and output assets must be different';
    }

    if (balance && inputAmount && parseFloat(inputAmount) > parseFloat(balance)) {
      newErrors.balance = `Insufficient balance. You have ${balance} ${inputAsset?.code || ''}`;
    }

    if (wallet.network !== 'TESTNET') {
      newErrors.network = 'Please switch to Stellar Testnet';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const swapAssets = () => {
    const tempInput = inputAsset;
    setInputAsset(outputAsset);
    setOutputAsset(tempInput);
    setInputAmount('');
  };

  return {
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
  };
}

export function useTransactionTracker() {
  const addTransaction = useAppStore((s) => s.addTransaction);
  const updateTransaction = useAppStore((s) => s.updateTransaction);

  const trackTransaction = (
    hash: string,
    type: 'swap' | 'contract_call' | 'transfer',
    description: string,
  ) => {
    const tx = {
      hash,
      status: 'pending' as TransactionStatus,
      type,
      description,
      timestamp: Date.now(),
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
    };

    addTransaction(tx);

    const poll = async () => {
      for (let i = 0; i < 24; i++) {
        await new Promise((res) => setTimeout(res, 5000));

        try {
          const result = await StellarService.getTransactionStatus(hash);
          if (result.status !== 'pending') {
            updateTransaction(hash, {
              status: result.status === 'confirmed' ? 'confirmed' : 'failed',
            });
            return;
          }
        } catch {
          // Continue polling
        }
      }

      updateTransaction(hash, { status: 'timeout' });
    };

    poll();
  };

  return { trackTransaction };
}

export function useMarketData(assetCode: string, assetIssuer: string) {
  const setMarketInfo = useAppStore((s) => s.setMarketInfo);
  const marketInfo = useAppStore((s) => s.marketInfo);
  const key = `${assetCode}:${assetIssuer}`;

  useEffect(() => {
    if (!assetCode) return;

    const fetchData = async () => {
      try {
        const info = await StellarService.fetchMarketInfo(assetCode, assetIssuer);
        setMarketInfo(key, info);
      } catch {
        // Silently handle market data errors
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [assetCode, assetIssuer, key, setMarketInfo]);

  return marketInfo.get(key) || null;
}

export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  };

  return { copy, copied };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
