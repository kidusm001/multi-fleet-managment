import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Label } from '../Label';

describe('Label Component', () => {
  it('should render label text', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should associate with input using htmlFor', () => {
    render(
      <>
        <Label htmlFor="test-input">Username</Label>
        <input id="test-input" />
      </>
    );
    
    const label = screen.getByText('Username');
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('should apply custom className', () => {
    const { container } = render(<Label className="custom-label">Label</Label>);
    const label = container.querySelector('label');
    expect(label).toHaveClass('custom-label');
  });

  it('should render children correctly', () => {
    render(
      <Label>
        <span>Required</span> Field
      </Label>
    );
    
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText(/Field/)).toBeInTheDocument();
  });
});
