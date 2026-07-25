import {
  Keypair,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset,
  Horizon,
} from '@stellar/stellar-sdk';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'screenshots');

const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('=== Stellar Testnet Transaction ===\n');

  // 1. Create a testnet keypair
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  console.log(`Account: ${publicKey}\n`);

  // 2. Fund via Friendbot
  console.log('Funding via Friendbot...');
  const response = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Friendbot failed: ${response.status} - ${text}`);
  }
  console.log('Account funded!\n');

  // 3. Wait for account to exist
  console.log('Waiting for account on network...');
  const server = new Horizon.Server(HORIZON_URL);
  for (let i = 0; i < 30; i++) {
    try {
      await server.loadAccount(publicKey);
      break;
    } catch {
      await sleep(2000);
    }
  }
  console.log('Account active.\n');

  // 4. Create a second account and fund it too
  const destKeypair = Keypair.random();
  const destPublicKey = destKeypair.publicKey();
  console.log(`Destination: ${destPublicKey}`);
  console.log('Funding destination via Friendbot...');
  const destResponse = await fetch(`${FRIENDBOT_URL}?addr=${destPublicKey}`);
  if (!destResponse.ok) throw new Error('Failed to fund destination');
  console.log('Destination funded!\n');

  // 5. Build a payment transaction
  const account = await server.loadAccount(publicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: destPublicKey,
        asset: Asset.native(),
        amount: '100',
      }),
    )
    .setTimeout(300)
    .build();

  // 6. Sign and submit
  tx.sign(keypair);
  console.log('Submitting payment transaction...');
  const result = await server.submitTransaction(tx);
  const txHash = result.hash;
  
  console.log('\n✅ Transaction confirmed!');
  console.log('========================================');
  console.log(' SUBMISSION CHECKLIST INFO');
  console.log('========================================');
  console.log(` Transaction Hash: ${txHash}`);
  console.log(` Stellar Expert:   https://stellar.expert/explorer/testnet/tx/${txHash}`);
  console.log(` Source Account:   ${publicKey}`);
  console.log(` Destination:      ${destPublicKey}`);
  console.log(` Amount:           100 XLM`);
  console.log(` Network:          Testnet`);
  console.log(` Ledger:           ${result.ledger}`);
  console.log('========================================\n');

  // Save to file
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, 'tx-hash.txt');
  fs.writeFileSync(
    outputPath,
    `Transaction Hash: ${txHash}\nExplorer: https://stellar.expert/explorer/testnet/tx/${txHash}\nSource: ${publicKey}\nDestination: ${destPublicKey}\nAmount: 100 XLM\nLedger: ${result.ledger}\n`,
  );
  console.log(`Saved to: ${outputPath}`);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
