import { Hero } from '@/components/Hero';
import { SwapCard } from '@/components/swap';
import { WalletPanel } from '@/components/wallet';
import { MarketInfo } from '@/components/MarketInfo';
import { RecentSwaps } from '@/components/RecentSwaps';
import { NotificationsPanel } from '@/components/NotificationsPanel';

export function HomePage() {
  return (
    <div>
      <Hero />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SwapCard />
          </div>

          <div className="space-y-6">
            <WalletPanel />
            <MarketInfo />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <RecentSwaps />
          <NotificationsPanel />
        </div>
      </section>
    </div>
  );
}
