import { Home, FolderOpen, BarChart3, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Project overview'
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderOpen,
      description: 'Manage projects'
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

  return (
    <aside className="w-64 bg-card border-r border-border">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange?.(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors",
                activeView === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-70">{item.description}</div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}