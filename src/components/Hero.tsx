export function Hero() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-orbit-purple/5 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-orbit-purple/10 to-transparent blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stellar-500/10 border border-stellar-500/20 mb-6 animate-fade-in">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-stellar-300 font-medium">Stellar Testnet Live</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 animate-slide-up">
          Fast, Seamless Token Swaps
          <br />
          <span className="text-gradient">Powered by Stellar</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-8 animate-slide-up">
          Swap tokens instantly on the Stellar DEX. Connect your wallet, choose your assets,
          and execute trades with near-zero fees and lightning-fast settlement.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            3-5 second settlement
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-700" />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Near-zero fees
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-700" />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Multi-wallet support
          </div>
        </div>
      </div>
    </section>
  );
}
