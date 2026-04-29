'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: string;
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data found',
  onRowClick,
  rowClassName,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-400">
        Loading...
      </div>
    );
  }

  if (isEmpty || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-900/50">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-3 text-left font-medium text-slate-300"
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-slate-700 hover:bg-slate-800/50 transition',
                onRowClick && 'cursor-pointer',
                rowClassName
              )}
            >
              {columns.map((column) => (
                <td key={String(column.key)} className="px-6 py-3 text-slate-200">
                  {column.render
                    ? column.render(row[column.key as keyof T], row)
                    : row[column.key as keyof T]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
