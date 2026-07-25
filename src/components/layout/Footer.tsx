export function Footer() {
  return (
    <footer className="border-t border-orbit-border/50 bg-orbit-dark/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orbit-purple to-orbit-cyan" />
            <span className="text-sm font-semibold text-gray-400">OrbitSwap</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              Stellar
            </a>
            <a
              href="https://soroban.stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              Soroban
            </a>
            <a
              href="https://stellar.expert/explorer/testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              Explorer
            </a>
          </div>

          <p className="text-sm text-gray-600">Built on Stellar · {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
