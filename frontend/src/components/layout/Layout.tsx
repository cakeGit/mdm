import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export function Layout({ children, activeView, onViewChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeView={activeView} onViewChange={onViewChange} />
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}