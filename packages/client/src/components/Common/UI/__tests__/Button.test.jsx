import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button Component', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply primary variant by default', () => {
    render(<Button>Button</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-[var(--primary)]');
  });

  it('should apply secondary variant', () => {
    render(<Button variant="secondary">Button</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-[var(--secondary)]');
  });

  it('should apply destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-red-500');
  });

  it('should apply different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button').className).toContain('h-9');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button').className).toContain('h-11');

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button').className).toContain('h-10 w-10');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.className).toContain('disabled:opacity-[var(--disabled-opacity)]');
  });

  it('should not trigger onClick when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Button</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef();
    render(<Button ref={ref}>Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
