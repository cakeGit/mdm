import { render, screen, fireEvent } from '@testing-library/react';
import { HamburgerButton } from '@/components/ui/hamburger-button';

describe('HamburgerButton', () => {
  it('should render with correct aria-label when closed', () => {
    const mockOnClick = jest.fn();
    
    render(
      <HamburgerButton 
        isOpen={false} 
        onClick={mockOnClick} 
      />
    );

    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should render with correct aria-label when open', () => {
    const mockOnClick = jest.fn();
    
    render(
      <HamburgerButton 
        isOpen={true} 
        onClick={mockOnClick} 
      />
    );

    const button = screen.getByRole('button', { name: 'Close menu' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('should call onClick when clicked', () => {
    const mockOnClick = jest.fn();
    
    render(
      <HamburgerButton 
        isOpen={false} 
        onClick={mockOnClick} 
      />
    );

    const button = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const mockOnClick = jest.fn();
    
    render(
      <HamburgerButton 
        isOpen={false} 
        onClick={mockOnClick}
        className="custom-class"
      />
    );

    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button).toHaveClass('custom-class');
  });
});