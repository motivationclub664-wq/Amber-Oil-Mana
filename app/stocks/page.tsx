'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StockForm from '../../components/FormFields/StockForm';
import { formatDateForInput } from '../../lib/utils';

type Stock = {
  id: number;
  import_date: string;
  import_price?: number;
  quantity?: number;
  gift_quantity?: number;
  notes?: string;
  product_name?: string;
};

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [products, setProducts] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [selected, setSelected] = useState<Stock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (searchTerm) params.set('search', searchTerm);
      const [stockRes, productRes] = await Promise.all([fetch(`/api/stocks?${params.toString()}`), fetch('/api/products')]);
      const stockResult = await stockRes.json();
      setStocks(Array.isArray(stockResult) ? stockResult : stockResult.data);
      setTotalPages(stockResult.totalPages ?? 1);
      setProducts(await productRes.json());
    } catch {
      toast.error('Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchTerm]);

  const openForm = async (type: 'create' | 'edit' | 'duplicate', stock?: Stock) => {
    setMode(type);
    setOpen(true);
    if (stock?.id) {
      try {
        const res = await fetch(`/api/stocks?id=${stock.id}`);
        const detailedStock = await res.json();
        setSelected(detailedStock ?? stock);
      } catch {
        setSelected(stock);
      }
    } else {
      setSelected(null);
    }
  };

  const closeForm = () => {
    setOpen(false);
    setSelected(null);
  };

  const handleSubmit = async (values: any) => {
    try {
      let res: Response | null = null;
      if (mode === 'create') {
        res = await fetch('/api/stocks', { method: 'POST', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) {
          const result = await res.json().catch(() => null);
          throw new Error(result?.error || 'Lỗi khi thêm nhập kho');
        }
        toast.success('Thêm nhập kho thành công');
      } else if (mode === 'edit' && selected) {
        res = await fetch('/api/stocks', { method: 'PUT', body: JSON.stringify({ ...values, id: selected.id }), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) {
          const result = await res.json().catch(() => null);
          throw new Error(result?.error || 'Lỗi khi cập nhật nhập kho');
        }
        toast.success('Cập nhật thành công');
      } else if (mode === 'duplicate' && selected) {
        res = await fetch('/api/stocks', { method: 'POST', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) {
          const result = await res.json().catch(() => null);
          throw new Error(result?.error || 'Lỗi khi nhân đôi nhập kho');
        }
        toast.success('Nhân đôi thành công');
      }
      closeForm();
      fetchData();
    } catch (error) {
      toast.error((error as Error).message || 'Lỗi thao tác với kho');
    }
  };

  const handleDelete = async (stock: Stock) => {
    if (!confirm('Bạn có chắc muốn xóa dòng kho này?')) return;
    try {
      await fetch(`/api/stocks?id=${stock.id}`, { method: 'DELETE' });
      toast.success('Xóa thành công');
      fetchData();
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Stocks</h2>
          <p className="text-sm text-slate-500">Quản lý nhập kho và sản phẩm liên quan.</p>
        </div>
        <button onClick={() => openForm('create')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Thêm Nhập kho</button>
      </div>
      <DataTable
        columns={[
          { header: 'Ngày', accessor: 'import_date' },
          { header: 'Giá nhập', accessor: (row) => row.import_price ?? '-' },
          { header: 'Số lượng', accessor: (row) => row.quantity ?? '-' },
          { header: 'Sản phẩm', accessor: 'product_name' },
        ]}
        data={stocks}
        loading={loading}
        searchTerm={searchTerm}
        onSearch={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={(row) => openForm('edit', row as Stock)}
        onDuplicate={(row) => openForm('duplicate', row as Stock)}
        onDelete={(row) => handleDelete(row as Stock)}
      />

      <Modal open={open} title={mode === 'create' ? 'Thêm Nhập kho' : mode === 'edit' ? 'Chỉnh sửa Nhập kho' : 'Nhân đôi Nhập kho'} onClose={closeForm}>
        <StockForm
          initialValues={selected ? {
            importDate: formatDateForInput(selected.import_date),
            importPrice: selected.import_price ? String(selected.import_price) : '',
            quantity: selected.quantity ? String(selected.quantity) : '',
            giftQuantity: selected.gift_quantity ? String(selected.gift_quantity) : '',
            notes: selected.notes ?? '',
            productName: selected.product_name ?? '',
            relatedImage: (selected as any).related_image ?? '',
          } : undefined}
          products={products}
          submitLabel={mode === 'edit' ? 'Cập nhật' : mode === 'duplicate' ? 'Nhân đôi' : 'Lưu'}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </Modal>
    </div>
  );
}
