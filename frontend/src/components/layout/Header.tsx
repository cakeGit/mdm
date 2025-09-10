import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">MDM</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">ModDevManager</h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-sm text-muted-foreground">
          Welcome, {user?.username}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </header>
  );
}