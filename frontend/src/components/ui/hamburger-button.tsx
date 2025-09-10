import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export function HamburgerButton({ isOpen, onClick, className }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center p-2 rounded-md text-muted-foreground",
        "hover:text-foreground hover:bg-accent transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <div className="relative w-6 h-6">
        <Menu 
          className={cn(
            "w-6 h-6 absolute transition-all duration-300 ease-in-out",
            isOpen ? "opacity-0 rotate-180 scale-0" : "opacity-100 rotate-0 scale-100"
          )} 
        />
        <X 
          className={cn(
            "w-6 h-6 absolute transition-all duration-300 ease-in-out",
            isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-180 scale-0"
          )} 
        />
      </div>
    </button>
  );
}