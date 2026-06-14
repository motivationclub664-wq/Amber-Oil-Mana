'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type Column<T> = {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  width?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDuplicate?: (row: T) => void;
  onDelete?: (row: T) => void;
  searchTerm?: string;
  onSearch?: (value: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

export default function DataTable<T extends Record<string, unknown>>(props: DataTableProps<T>) {
  const { columns, data, loading, onAdd, onEdit, onDuplicate, onDelete, searchTerm, onSearch, page, totalPages, onPageChange } = props;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="text-lg font-semibold">Danh sách</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {onSearch ? (
            <input
              value={searchTerm ?? ''}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Tìm kiếm..."
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
            />
          ) : null}
          {onAdd ? (
            <button type="button" onClick={onAdd} className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
              Thêm mới
            </button>
          ) : null}
        </div>
      </div>
      <div className="overflow-x-auto">
        {/* Mobile stacked cards */}
        <div className="md:hidden space-y-3">
          {data.map((row, rowIndex) => (
            <div key={rowIndex} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="flex justify-between py-1">
                  <div className="text-sm text-slate-500">{column.header}</div>
                  <div className="text-sm font-medium text-slate-700">
                    {typeof column.accessor === 'function'
                      ? column.accessor(row as any)
                      : column.accessor === 'date' || column.accessor === 'import_date' || column.accessor === 'order_date' || column.accessor === 'purchase_date'
                        ? formatDate(String(row[column.accessor] ?? ''))
                        : String(row[column.accessor] ?? '-')}
                  </div>
                </div>
              ))}
              <div className="mt-2 flex flex-wrap gap-2">
                {onEdit ? <button type="button" onClick={() => onEdit(row)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">Sửa</button> : null}
                {onDuplicate ? <button type="button" onClick={() => onDuplicate(row)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">Nhân đôi</button> : null}
                {onDelete ? <button type="button" onClick={() => onDelete(row)} className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100">Xóa</button> : null}
              </div>
            </div>
          ))}
        </div>

        <table className="hidden md:table min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              {columns.map((column, index) => (
                <th key={index} className={`py-3 px-3 ${column.width ?? 'w-auto'}`}>
                  {column.header}
                </th>
              ))}
              <th className="py-3 px-3 w-44">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td className="py-8 px-3 text-center text-slate-500" colSpan={columns.length + 1}>Đang tải...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td className="py-8 px-3 text-center text-slate-500" colSpan={columns.length + 1}>Chưa có dữ liệu</td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <motion.tr key={rowIndex} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: rowIndex * 0.04 }} className="group hover:bg-slate-50">
                  {columns.map((column, index) => (
                    <td key={index} className="py-3 px-3 align-top text-slate-700">
                      {typeof column.accessor === 'function' ? column.accessor(row) : String(row[column.accessor] ?? '-')}
                    </td>
                  ))}
                  <td className="py-3 px-3 align-top text-slate-700">
                    <div className="flex flex-wrap gap-2">
                      {onEdit ? <button type="button" onClick={() => onEdit(row)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">Sửa</button> : null}
                      {onDuplicate ? <button type="button" onClick={() => onDuplicate(row)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">Nhân đôi</button> : null}
                      {onDelete ? <button type="button" onClick={() => onDelete(row)} className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100">Xóa</button> : null}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {typeof page === 'number' && typeof totalPages === 'number' && onPageChange ? (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm text-slate-600">
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            Trước
          </button>
          <span>Trang {page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            Sau
          </button>
        </div>
      ) : null}
    </div>
  );
}
