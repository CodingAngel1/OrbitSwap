import { useState, useRef, useEffect } from 'react';
import type { Asset } from '@/types';
import { clsx } from 'clsx';

interface AssetSelectorProps {
  assets: Asset[];
  selectedAsset: Asset | null;
  onSelect: (asset: Asset) => void;
  label: string;
  excludeAsset?: Asset | null;
}

export function AssetSelector({
  assets,
  selectedAsset,
  onSelect,
  label,
  excludeAsset,
}: AssetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAssets = assets.filter((a) => {
    if (excludeAsset && a.code === excludeAsset.code) return false;
    if (!search) return true;
    return a.code.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200',
          'bg-orbit-darker border border-orbit-border hover:border-stellar-500/50',
          'focus:outline-none focus:ring-2 focus:ring-stellar-500/50',
          isOpen && 'border-stellar-500/50 ring-2 ring-stellar-500/20',
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Select ${label.toLowerCase()} asset`}
      >
        {selectedAsset ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-stellar-500/20 to-orbit-purple/20 flex items-center justify-center">
              <span className="text-xs font-bold text-stellar-400">
                {selectedAsset.code.slice(0, 2)}
              </span>
            </div>
            <span className="text-sm font-semibold text-white">{selectedAsset.code}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Select token</span>
        )}
        <svg
          className={clsx('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-orbit-darker border border-orbit-border rounded-xl shadow-2xl animate-slide-up overflow-hidden">
          <div className="p-2 border-b border-orbit-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tokens..."
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 px-3 py-2 focus:outline-none"
              autoFocus
            />
          </div>
          <ul className="max-h-48 overflow-y-auto p-1" role="listbox">
            {filteredAssets.length === 0 ? (
              <li className="px-3 py-4 text-sm text-gray-500 text-center">No tokens found</li>
            ) : (
              filteredAssets.map((asset) => (
                <li key={`${asset.code}-${asset.issuer}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(asset);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      selectedAsset?.code === asset.code
                        ? 'bg-stellar-500/10 text-white'
                        : 'text-gray-300 hover:bg-white/5',
                    )}
                    role="option"
                    aria-selected={selectedAsset?.code === asset.code}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-stellar-500/20 to-orbit-purple/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-stellar-400">
                        {asset.code.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{asset.code}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">
                        {asset.type === 'native' ? 'Stellar Native' : asset.issuer.slice(0, 10) + '...'}
                      </p>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
