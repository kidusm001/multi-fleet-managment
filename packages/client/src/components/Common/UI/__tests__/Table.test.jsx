import React from 'react';
import { render, screen } from '@testing-library/react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../Table';

describe('Table Component', () => {
  it('should render table with headers and data', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>1</TableCell>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>2</TableCell>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should render empty table with headers only', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody />
      </Table>
    );
    
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Table className="custom-table">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    
    const table = container.querySelector('table');
    expect(table).toHaveClass('custom-table');
  });
});
