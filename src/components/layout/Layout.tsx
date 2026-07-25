import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-orbit-dark flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
