import {
  Keypair,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  SorobanRpc,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
  Contract,
} from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WASM_PATH = path.resolve(__dirname, '..', 'contracts', 'orbitswap', 'target', 'wasm32-unknown-unknown', 'release', 'orbitswap.wasm');
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const OUTPUT_PATH = path.resolve(__dirname, '..', 'public', 'screenshots', 'deployed-contract.txt');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fundAccount(publicKey) {
  console.log(`Funding ${publicKey.slice(0, 8)}... via Friendbot...`);
  const resp = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Friendbot failed: ${resp.status} - ${text}`);
  }
  console.log('Funded!');
}

async function waitForAccount(server, publicKey, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await server.getAccount(publicKey);
      return;
    } catch {
      await sleep(2000);
    }
  }
  throw new Error('Account not found after waiting');
}

async function main() {
  console.log('=== OrbitSwap Contract Deployment ===\n');

  // Read WASM
  console.log('Reading WASM...');
  const wasmBuffer = fs.readFileSync(WASM_PATH);
  console.log(`WASM size: ${wasmBuffer.length} bytes\n`);

  // Create keypair and fund
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  console.log(`Deployer: ${publicKey}`);
  await fundAccount(publicKey);

  // Initialize server
  const server = new SorobanRpc.Server(SOROBAN_RPC_URL);
  await waitForAccount(server, publicKey);
  console.log('Account active.\n');

  // Step 1: Upload WASM
  console.log('Step 1: Uploading WASM to testnet...');
  const sourceAccount = await server.getAccount(publicKey);

  const uploadTx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeUploadContractWasm(wasmBuffer),
      }),
    )
    .setTimeout(300)
    .build();

  console.log('Simulating upload...');
  let simResult = await server.simulateTransaction(uploadTx);

  if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
    console.error('Upload simulation failed:', simResult);
    process.exit(1);
  }

  // Extract the uploaded WASM hash from simulation
  const wasmHash = simResult.result?.retval
    ? scValToNative(simResult.result.retval)
    : null;
  console.log(`WASM uploaded. Hash: ${wasmHash}`);

  // Assemble, sign, submit
  const uploadAssembled = SorobanRpc.assembleTransaction(uploadTx, simResult).build();
  uploadAssembled.sign(keypair);
  const uploadResult = await server.sendTransaction(uploadAssembled);

  if (uploadResult.status === 'ERROR') {
    console.error('Upload failed:', uploadResult.errorResult);
    process.exit(1);
  }
  console.log(`Upload tx: ${uploadResult.hash}`);
  console.log(`  https://stellar.expert/explorer/testnet/tx/${uploadResult.hash}\n`);

  // Wait for upload to confirm
  await sleep(5000);

  // Step 2: Create contract instance
  console.log('Step 2: Creating contract instance...');
  const account2 = await server.getAccount(publicKey);

  // Build the create contract operation
  const wasmHashBuffer = Buffer.from(wasmHash, 'hex');

  const createTx = new TransactionBuilder(account2, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeCreateContract(
          xdr.ContractIdPreimage.contractIdPreimageFromAddress(
            xdr.ContractIdPreimageFromAddress.contractIdPreimageFromAddress(
              new Address(publicKey).toScAddress(),
            ),
          ),
          xdr.ContractExecutable.contractExecutableWasm(wasmHashBuffer),
        ),
      }),
    )
    .setTimeout(300)
    .build();

  console.log('Simulating create...');
  simResult = await server.simulateTransaction(createTx);

  if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
    console.error('Create simulation failed:', JSON.stringify(simResult, null, 2));
    process.exit(1);
  }

  const createAssembled = SorobanRpc.assembleTransaction(createTx, simResult).build();
  createAssembled.sign(keypair);

  const createResult = await server.sendTransaction(createAssembled);

  if (createResult.status === 'ERROR') {
    console.error('Create failed:', createResult.errorResult);
    process.exit(1);
  }

  // Extract contract ID from simulation result
  const contractId = simResult.result?.retval
    ? scValToNative(simResult.result.retval)
    : null;
  console.log(`Contract created!`);
  console.log(`Contract ID: ${contractId}`);
  console.log(`Create tx: ${createResult.hash}`);
  console.log(`  https://stellar.expert/explorer/testnet/tx/${createResult.hash}\n`);

  // Step 3: Initialize the contract
  console.log('Step 3: Initializing contract (calling init)...');
  await sleep(5000);

  const account3 = await server.getAccount(publicKey);
  const contract = new Contract(contractId);
  const initTx = new TransactionBuilder(account3, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'init',
        nativeToScVal(new Address(publicKey).toScVal()),
      ),
    )
    .setTimeout(300)
    .build();

  console.log('Simulating init...');
  simResult = await server.simulateTransaction(initTx);

  if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
    console.error('Init simulation failed:', JSON.stringify(simResult, null, 2));
    process.exit(1);
  }

  const initAssembled = SorobanRpc.assembleTransaction(initTx, simResult).build();
  initAssembled.sign(keypair);

  const initResult = await server.sendTransaction(initAssembled);

  if (initResult.status === 'ERROR') {
    console.error('Init failed:', initResult.errorResult);
    process.exit(1);
  }

  console.log('Contract initialized!');
  console.log(`Init tx: ${initResult.hash}`);
  console.log(`  https://stellar.expert/explorer/testnet/tx/${initResult.hash}\n`);

  // Write results
  const output = [
    '=== OrbitSwap Contract Deployment ===',
    `Contract ID: ${contractId}`,
    `Deployer: ${publicKey}`,
    `WASM Hash: ${wasmHash}`,
    `Upload Tx: https://stellar.expert/explorer/testnet/tx/${uploadResult.hash}`,
    `Create Tx: https://stellar.expert/explorer/testnet/tx/${createResult.hash}`,
    `Init Tx (contract call): https://stellar.expert/explorer/testnet/tx/${initResult.hash}`,
    `Init Tx Hash: ${initResult.hash}`,
  ].join('\n');

  fs.writeFileSync(OUTPUT_PATH, output);
  console.log(output);
  console.log(`\nSaved to: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
