import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '../Card';

describe('Card Component', () => {
  it('renders basic card', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders card with header', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
  });

  it('renders card with content', () => {
    render(
      <Card>
        <CardContent>
          <p>Main content</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('renders card with footer', () => {
    render(
      <Card>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Complete Card</CardTitle>
          <CardDescription>With all sections</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card body content</p>
        </CardContent>
        <CardFooter>
          <button>Submit</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Complete Card')).toBeInTheDocument();
    expect(screen.getByText('With all sections')).toBeInTheDocument();
    expect(screen.getByText('Card body content')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('applies custom className to card', () => {
    const { container } = render(<Card className="custom-card">Test</Card>);
    expect(container.firstChild).toHaveClass('custom-card');
  });
});
