import { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { ContractService } from '@/services';
import { useAppStore } from '@/store';
import type { SwapRequest, ContractEvent } from '@/types';

interface ContractContextValue {
  getSupportedAssets: (
    signerPublicKey: string,
  ) => Promise<Array<{ code: string; issuer: string; balance: string }>>;
  getSwapEstimate: (
    signerPublicKey: string,
    inputAsset: { code: string; issuer: string },
    outputAsset: { code: string; issuer: string },
    amount: string,
  ) => Promise<{ estimatedOutput: string; fee: string; rate: string }>;
  submitSwap: (
    signerPublicKey: string,
    swapRequest: SwapRequest,
    signTx: (xdr: string) => Promise<string>,
  ) => Promise<{ txHash: string; outputAmount: string }>;
  getSwapStatus: (txHash: string) => Promise<{
    status: 'pending' | 'success' | 'error';
    result?: unknown;
  }>;
  contractId: string;
}

const ContractContext = createContext<ContractContextValue | null>(null);

export function ContractProvider({ children }: { children: ReactNode }) {
  const addContractEvent = useAppStore((s) => s.addContractEvent);
  const initializedRef = useRef(false);
  const [contractId] = useState(ContractService.getContractId());

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    ContractService.initialize();
    ContractService.startEventStreaming();

    const unsubscribe = ContractService.subscribeToEvents((event: ContractEvent) => {
      addContractEvent(event);
    });

    return () => {
      unsubscribe();
      ContractService.stopEventStreaming();
    };
  }, [addContractEvent]);

  const getSupportedAssets = useCallback(
    (signerPublicKey: string) => ContractService.getSupportedAssets(signerPublicKey),
    [],
  );

  const getSwapEstimate = useCallback(
    (
      signerPublicKey: string,
      inputAsset: { code: string; issuer: string },
      outputAsset: { code: string; issuer: string },
      amount: string,
    ) => ContractService.getSwapInfo(signerPublicKey, inputAsset, outputAsset, amount),
    [],
  );

  const submitSwap = useCallback(
    (signerPublicKey: string, swapRequest: SwapRequest, signTx: (xdr: string) => Promise<string>) =>
      ContractService.submitSwap(signerPublicKey, swapRequest, signTx),
    [],
  );

  const getSwapStatus = useCallback((txHash: string) => ContractService.getSwapStatus(txHash), []);

  return (
    <ContractContext.Provider
      value={{
        getSupportedAssets,
        getSwapEstimate,
        submitSwap,
        getSwapStatus,
        contractId,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useContract(): ContractContextValue {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
}
