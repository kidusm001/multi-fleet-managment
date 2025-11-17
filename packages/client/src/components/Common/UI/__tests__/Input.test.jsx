import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Input } from '../Input';

describe('Input Component', () => {
  it('should render input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should handle value changes', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'test');
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test');
  });

  it('should apply custom className', () => {
    const { container } = render(<Input className="custom-input" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('custom-input');
  });

  it('should handle disabled state', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should support different input types', () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    
    rerender(<Input type="password" />);
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();
  });

  it('should handle required attribute', () => {
    render(<Input required />);
    expect(screen.getByRole('textbox')).toBeRequired();
  });
});
