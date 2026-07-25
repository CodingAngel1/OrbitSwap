import { CONTRACT_ID, SOROBAN_RPC_URL } from '@/constants';
import type { ContractEvent, SwapRequest } from '@/types';
import {
  SorobanRpc,
  Contract,
  Address,
  scValToNative,
  nativeToScVal,
  TransactionBuilder,
  BASE_FEE,
  Networks,
} from '@stellar/stellar-sdk';

const { Server, assembleTransaction } = SorobanRpc;

export class ContractService {
  private static server: SorobanRpc.Server;
  private static contractId: string = CONTRACT_ID;
  private static eventListeners: Array<(event: ContractEvent) => void> = [];
  private static pollingInterval: ReturnType<typeof setInterval> | null = null;
  private static lastEventTimestamp = 0;

  static initialize(): void {
    this.server = new Server(SOROBAN_RPC_URL);
    this.contractId = CONTRACT_ID;
  }

  static getServer(): SorobanRpc.Server {
    if (!this.server) {
      this.initialize();
    }
    return this.server;
  }

  static getContractId(): string {
    return this.contractId;
  }

  static setContractId(id: string): void {
    this.contractId = id;
  }

  static async getSupportedAssets(signerPublicKey: string): Promise<
    Array<{
      code: string;
      issuer: string;
      balance: string;
    }>
  > {
    try {
      const server = this.getServer();
      const contract = new Contract(this.contractId);

      const result = await server.simulateTransaction(
        new TransactionBuilder(await server.getAccount(signerPublicKey), {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(contract.call('get_assets'))
          .setTimeout(30)
          .build(),
      );

      if (SorobanRpc.Api.isSimulationSuccess(result)) {
        const scVal = result.result?.retval;
        if (scVal) {
          const native = scValToNative(scVal);
          return Array.isArray(native) ? native : [];
        }
      }

      return [{ code: 'XLM', issuer: 'native', balance: '0' }];
    } catch {
      return [{ code: 'XLM', issuer: 'native', balance: '0' }];
    }
  }

  static async getSwapInfo(
    signerPublicKey: string,
    inputAsset: { code: string; issuer: string },
    outputAsset: { code: string; issuer: string },
    amount: string,
  ): Promise<{
    estimatedOutput: string;
    fee: string;
    rate: string;
  }> {
    try {
      const server = this.getServer();
      const contract = new Contract(this.contractId);
      const sourceAccount = await server.getAccount(signerPublicKey);

      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            'get_swap_estimate',
            nativeToScVal(inputAsset.code, { type: 'string' }),
            nativeToScVal(inputAsset.issuer, { type: 'string' }),
            nativeToScVal(outputAsset.code, { type: 'string' }),
            nativeToScVal(outputAsset.issuer, { type: 'string' }),
            nativeToScVal(amount, { type: 'string' }),
          ),
        )
        .setTimeout(30)
        .build();

      const simResult = await server.simulateTransaction(tx);

      if (SorobanRpc.Api.isSimulationSuccess(simResult) && simResult.result?.retval) {
        const data = scValToNative(simResult.result.retval) as {
          output: string;
          fee: string;
          rate: string;
        };
        return {
          estimatedOutput: data.output || '0',
          fee: data.fee || '0.00001',
          rate: data.rate || '0',
        };
      }

      return { estimatedOutput: '0', fee: '0.00001', rate: '0' };
    } catch {
      return { estimatedOutput: '0', fee: '0.00001', rate: '0' };
    }
  }

  static async submitSwap(
    signerPublicKey: string,
    swapRequest: SwapRequest,
    signTx: (xdr: string) => Promise<string>,
  ): Promise<{
    txHash: string;
    outputAmount: string;
  }> {
    const server = this.getServer();
    const contract = new Contract(this.contractId);
    const sourceAccount = await server.getAccount(signerPublicKey);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'swap',
          nativeToScVal(swapRequest.inputAsset.code, { type: 'string' }),
          nativeToScVal(swapRequest.inputAsset.issuer, { type: 'string' }),
          nativeToScVal(swapRequest.outputAsset.code, { type: 'string' }),
          nativeToScVal(swapRequest.outputAsset.issuer, { type: 'string' }),
          nativeToScVal(swapRequest.inputAmount, { type: 'string' }),
          nativeToScVal(swapRequest.minOutputAmount, { type: 'string' }),
          nativeToScVal(new Address(signerPublicKey).toScVal()),
        ),
      )
      .setTimeout(300)
      .build();

    const simResult = await server.simulateTransaction(tx);

    if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
      throw new Error(`Contract simulation failed: ${simResult.error || 'Unknown error'}`);
    }

    const assembledTx = assembleTransaction(tx, simResult).build();
    const signedXdr = await signTx(assembledTx.toXDR());
    const signedTransaction = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

    const sendResult = await server.sendTransaction(signedTransaction);

    if (sendResult.status === 'ERROR') {
      throw new Error(`Transaction submission failed: ${sendResult.errorResult}`);
    }

    return {
      txHash: sendResult.hash,
      outputAmount: swapRequest.minOutputAmount,
    };
  }

  static async getSwapStatus(txHash: string): Promise<{
    status: 'pending' | 'success' | 'error';
    result?: unknown;
  }> {
    const server = this.getServer();
    const txResult = await server.getTransaction(txHash);

    if (txResult.status === 'NOT_FOUND') {
      return { status: 'pending' };
    }

    if (txResult.status === 'SUCCESS') {
      return { status: 'success', result: txResult.resultMetaXdr };
    }

    return { status: 'error', result: txResult };
  }

  static startEventStreaming(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.lastEventTimestamp = Date.now();

    this.pollingInterval = setInterval(async () => {
      try {
        const server = this.getServer();
        const events = await server.getEvents({
          startLedger: Math.floor((this.lastEventTimestamp - 60000) / 5000),
          filters: [
            {
              type: 'contract',
              contractIds: [this.contractId],
            },
          ],
          limit: 20,
        });

        if (events.events && events.events.length > 0) {
          for (const event of events.events) {
            const eventTimestamp = parseInt(event.ledgerClosedAt || '0', 10) * 1000;
            if (eventTimestamp > this.lastEventTimestamp) {
              const contractEvent: ContractEvent = {
                id: event.id,
                type: event.type,
                data: event.value ? scValToNative(event.value) : {},
                timestamp: eventTimestamp,
                contractId: this.contractId,
              };
              this.notifyEventListeners(contractEvent);
            }
          }
        }
        this.lastEventTimestamp = Date.now();
      } catch {
        // Silently handle polling errors
      }
    }, 5000);
  }

  static stopEventStreaming(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  static subscribeToEvents(callback: (event: ContractEvent) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== callback);
    };
  }

  private static notifyEventListeners(event: ContractEvent): void {
    this.eventListeners.forEach((l) => l(event));
  }

  static async getContractBalance(signerPublicKey: string, assetCode: string): Promise<string> {
    try {
      const server = this.getServer();
      const contract = new Contract(this.contractId);
      const sourceAccount = await server.getAccount(signerPublicKey);

      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(contract.call('get_balance', nativeToScVal(assetCode, { type: 'string' })))
        .setTimeout(30)
        .build();

      const result = await server.simulateTransaction(tx);

      if (SorobanRpc.Api.isSimulationSuccess(result) && result.result?.retval) {
        const val = scValToNative(result.result.retval) as string;
        return val || '0';
      }

      return '0';
    } catch {
      return '0';
    }
  }
}
