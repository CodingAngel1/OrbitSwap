import { TransactionHistory } from '@/components/TransactionHistory';

export function HistoryPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Transaction History</h1>
        <p className="text-gray-400">
          View all your transactions, track status, and verify on the Stellar Explorer.
        </p>
      </div>
      <TransactionHistory />
    </div>
  );
}
