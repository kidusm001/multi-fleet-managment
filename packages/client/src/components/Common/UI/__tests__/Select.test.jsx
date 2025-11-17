import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../Select';

describe('Select Component', () => {
  it('renders select trigger', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByText('Select option')).toBeInTheDocument();
  });

  it('renders select with items', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Select')).toBeInTheDocument();
  });

  it('applies custom className to trigger', () => {
    const { container } = render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
      </Select>
    );

    const trigger = container.querySelector('.custom-trigger');
    expect(trigger).toBeInTheDocument();
  });
});
