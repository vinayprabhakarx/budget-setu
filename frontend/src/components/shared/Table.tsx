import React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className = '', containerClassName = '', children, ...props }, ref) => (
    <div className={`w-full overflow-x-auto ${containerClassName}`}>
      <table
        ref={ref}
        className={`w-full text-left border-collapse ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = '', children, ...props }, ref) => (
  <thead
    ref={ref}
    className={`border-b border-border text-text-secondary text-body-sm font-semibold ${className}`}
    {...props}
  >
    {children}
  </thead>
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = '', children, ...props }, ref) => (
  <tbody
    ref={ref}
    className={`divide-y divide-border-muted ${className}`}
    {...props}
  >
    {children}
  </tbody>
));
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className = '', children, ...props }, ref) => (
  <tr
    ref={ref}
    className={`border-b border-border-muted hover:bg-bg-subtle/40 transition-colors ${className}`}
    {...props}
  >
    {children}
  </tr>
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className = '', children, ...props }, ref) => (
  <th
    ref={ref}
    className={`py-3.5 px-3 sm:px-4 text-left font-semibold align-middle text-text-secondary whitespace-nowrap ${className}`}
    {...props}
  >
    {children}
  </th>
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className = '', children, ...props }, ref) => (
  <td
    ref={ref}
    className={`py-3.5 px-3 sm:px-4 align-middle text-body-sm text-text-primary ${className}`}
    {...props}
  >
    {children}
  </td>
));
TableCell.displayName = 'TableCell';

export interface TableEmptyProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  colSpan: number;
  message?: React.ReactNode;
}

export const TableEmpty = React.forwardRef<HTMLTableCellElement, TableEmptyProps>(
  ({ colSpan, message = 'No data available', className = '', ...props }, ref) => (
    <tr>
      <td
        ref={ref}
        colSpan={colSpan}
        className={`py-12 px-6 text-center text-text-muted text-sm ${className}`}
        {...props}
      >
        {message}
      </td>
    </tr>
  )
);
TableEmpty.displayName = 'TableEmpty';
