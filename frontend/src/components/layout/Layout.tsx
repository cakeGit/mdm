import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { HamburgerButton } from '@/components/ui/hamburger-button';
import { useSidebar } from '@/hooks/useSidebar';

interface LayoutProps {
  children: ReactNode;
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export function Layout({ children, activeView, onViewChange }: LayoutProps) {
  const { isOpen, isMobile, toggle, close } = useSidebar();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={onViewChange}
        isOpen={isOpen}
        isMobile={isMobile}
        onClose={close}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Mobile Header with Hamburger */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-border bg-card md:hidden">
            <HamburgerButton isOpen={isOpen} onClick={toggle} />
            <div className="flex items-center">
              <span className="text-gray-600 font-mono text-lg tracking-widest">mdm</span>
            </div>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        )}

        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}