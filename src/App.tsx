import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from '@/providers/WalletProvider';
import { ContractProvider } from '@/providers/ContractProvider';
import { Layout } from '@/components/layout';
import { HomePage, HistoryPage } from '@/pages';
import { ToastProvider } from '@/components/ui/Toast';

export function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <ContractProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </Layout>
          <ToastProvider />
        </ContractProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}
