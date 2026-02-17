import React from 'react';
import type { TableWidgetContext } from './TableWidget.js';

interface TableRowProps {
  'data-index': number;
  context?: TableWidgetContext;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const TableRowComponent: React.FC<TableRowProps> = ({
  'data-index': index,
  context,
  children,
  ...props
}) => {
  const row = context?.rows[index];
  return (
    <tr
      {...props}
      className="group"
      data-testid={row ? `row-${row.rowId}` : undefined}
      style={{
        height: '40px',
        borderBottom: '1px solid var(--chakra-colors-gray-100)',
      }}
    >
      {children}
    </tr>
  );
};
