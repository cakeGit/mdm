import { Home, FolderOpen, BarChart3, Timer, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface SidebarProps {
  activeView?: string;
  onViewChange?: (view: string) => void;
  isOpen?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeView, onViewChange, isOpen = true, isMobile = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Project overview'
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: BarChart3,
      description: 'View statistics'
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: Timer,
      description: 'Work history'
    }
  ];

  const handleMenuItemClick = (itemId: string) => {
    onViewChange?.(itemId);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Focus trap for mobile sidebar
  const focusTrapRef = useFocusTrap({
    isActive: isMobile && isOpen,
    onEscape: onClose,
  });

  return (
    <aside 
      ref={focusTrapRef}
      className={cn(
        "bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out",
        // Desktop styles - always visible
        "md:w-64 md:relative md:translate-x-0 md:block",
        // Mobile styles - overlay with slide animation
        isMobile ? [
          "absolute top-0 left-0 h-full w-64 z-50",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        ] : "w-64",
        // Hide completely on mobile when closed
        isMobile && !isOpen && "pointer-events-none"
      )}
    >
      {/* Header content */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gray-100 px-4 py-2 rounded-lg">
            <span className="text-gray-600 font-mono text-lg tracking-widest">mdm</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Welcome, {user?.username}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item.id)}
              className={cn(
                "w-full flex items-center space-x-4 px-4 py-3 rounded-lg text-left transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-102"
              )}
            >
              <Icon className={cn(
                "h-6 w-6 transition-all duration-200",
                isActive ? "scale-110" : "group-hover:scale-105"
              )} />
              <div className="flex-1">
                <div className="font-semibold text-sm">{item.label}</div>
                <div className="text-xs opacity-80">{item.description}</div>
              </div>
              {isActive && (
                <div className="w-1 h-6 bg-primary-foreground rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}