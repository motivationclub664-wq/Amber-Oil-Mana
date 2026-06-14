'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ProductForm from '../../components/FormFields/ProductForm';
import { formatNumber } from '../../lib/utils';

type Product = {
  name: string;
  classical_name?: string;
  net_price?: number;
  sale_price?: number;
  quantity?: number;
  notes?: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [selected, setSelected] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/products?${params.toString()}`);
      const result = await res.json();
      const data = Array.isArray(result) ? result : result.data;
      setProducts(data);
      setTotalPages(result.totalPages ?? 1);
    } catch {
      toast.error('Không tải được sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm]);

  const openForm = async (type: 'create' | 'edit' | 'duplicate', product?: Product) => {
    setMode(type);
    setOpen(true);
    if (product?.name) {
      try {
        const res = await fetch(`/api/products?name=${encodeURIComponent(product.name)}`);
        const detailedProduct = await res.json();
        setSelected(detailedProduct ?? product);
      } catch {
        setSelected(product);
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
      if (mode === 'create') {
        const res = await fetch('/api/products', { method: 'POST', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error();
        toast.success('Thêm sản phẩm thành công');
      } else if (mode === 'edit' && selected) {
        const res = await fetch('/api/products', { method: 'PUT', body: JSON.stringify({ ...values, name: selected.name }), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error();
        toast.success('Cập nhật thành công');
      } else if (mode === 'duplicate' && selected) {
        const res = await fetch('/api/products', { method: 'POST', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error();
        toast.success('Nhân đôi thành công');
      }
      closeForm();
      fetchProducts();
    } catch {
      toast.error('Lỗi thao tác với sản phẩm');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await fetch(`/api/products?name=${encodeURIComponent(product.name)}`, { method: 'DELETE' });
      toast.success('Xóa thành công');
      fetchProducts();
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Products</h2>
          <p className="text-sm text-slate-500">Quản lý sản phẩm và tồn kho.</p>
        </div>
        <button onClick={() => openForm('create')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Thêm Sản phẩm</button>
      </div>
      <DataTable
        columns={[
          { header: 'Tên', accessor: 'name' },
          { header: 'Tên thường gọi', accessor: 'classical_name' },
              { header: 'Giá vốn', accessor: (row) => formatNumber(row.net_price ?? null) },
          { header: 'Giá bán', accessor: (row) => formatNumber(row.sale_price ?? null) },
          { header: 'Số lượng', accessor: (row) => formatNumber(row.quantity ?? null) },
        ]}
        data={products}
        loading={loading}
        searchTerm={searchTerm}
        onSearch={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={(row) => openForm('edit', row as Product)}
        onDuplicate={(row) => openForm('duplicate', row as Product)}
        onDelete={(row) => handleDelete(row as Product)}
      />

      <Modal open={open} title={mode === 'create' ? 'Thêm Sản phẩm' : mode === 'edit' ? 'Chỉnh sửa Sản phẩm' : 'Nhân đôi Sản phẩm'} onClose={closeForm}>
        <ProductForm
          initialValues={selected ? {
            name: selected.name,
            classicalName: selected.classical_name ?? '',
            netPrice: selected.net_price ? String(selected.net_price) : '',
            salePrice: selected.sale_price ? String(selected.sale_price) : '',
            quantity: selected.quantity ? String(selected.quantity) : '',
            notes: selected.notes ?? '',
            relatedImage: (selected as any).related_image ?? '',
          } : undefined}
          submitLabel={mode === 'edit' ? 'Cập nhật' : mode === 'duplicate' ? 'Nhân đôi' : 'Lưu'}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </Modal>
    </div>
  );
}
