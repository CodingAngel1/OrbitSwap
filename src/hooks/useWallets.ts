import { useMemo } from 'react';
import type { SupportedWalletId } from '@/constants';
import { SUPPORTED_WALLETS, WALLET_NAMES } from '@/constants';
import { WalletService } from '@/services';
import type { WalletInfo } from '@/types';

export function useWallets(): WalletInfo[] {
  return useMemo(
    () =>
      SUPPORTED_WALLETS.map((id: SupportedWalletId) => ({
        id,
        name: WALLET_NAMES[id],
        icon: `wallets/${id}.svg`,
        installed: WalletService.isWalletInstalled(id),
        url: WalletService.getWalletInstallUrl(id),
      })),
    [],
  );
}
