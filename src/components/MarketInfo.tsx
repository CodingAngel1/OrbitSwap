import { useEffect, useState } from 'react';
import type { MarketInfo as MarketInfoType } from '@/types';
import { StellarService } from '@/services';
import { Skeleton } from '@/components/ui/Skeleton';
import { clsx } from 'clsx';

export function MarketInfo() {
  const [xlmInfo, setXlmInfo] = useState<MarketInfoType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const info = await StellarService.fetchMarketInfo('XLM', '');
        setXlmInfo(info);
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Market Info
      </h3>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : xlmInfo ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-orbit-darker/50 border border-orbit-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stellar-500/20 to-orbit-purple/20 flex items-center justify-center">
                <span className="text-xs font-bold text-stellar-400">XL</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">XLM</p>
                <p className="text-xs text-gray-500">Stellar Lumens</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white font-mono">
                ${xlmInfo.priceUSD.toFixed(4)}
              </p>
              <p
                className={clsx(
                  'text-xs font-medium',
                  xlmInfo.change24h >= 0 ? 'text-emerald-400' : 'text-red-400',
                )}
              >
                {xlmInfo.change24h >= 0 ? '+' : ''}
                {xlmInfo.change24h.toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-orbit-darker/50 border border-orbit-border/50">
              <p className="text-xs text-gray-500">24h Volume</p>
              <p className="text-sm font-semibold text-white font-mono">
                {xlmInfo.volume24h.toFixed(2)} XLM
              </p>
            </div>
            <div className="p-3 rounded-xl bg-orbit-darker/50 border border-orbit-border/50">
              <p className="text-xs text-gray-500">Liquidity</p>
              <p className="text-sm font-semibold text-white font-mono">
                {xlmInfo.liquidity.toFixed(2)} XLM
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">Market data unavailable</p>
      )}
    </div>
  );
}
