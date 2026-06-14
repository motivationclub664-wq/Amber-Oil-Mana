'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import RefererForm from '../../components/FormFields/RefererForm';
import { formatDateForInput } from '../../lib/utils';

type Referer = {
  id: number;
  name: string;
  date: string;
  offer_rate?: number;
  notes?: string;
  related_image?: string;
};

export default function ReferersPage() {
  const [referers, setReferers] = useState<Referer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [selected, setSelected] = useState<Referer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReferers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/referers?${params.toString()}`);
      const result = await res.json();
      setReferers(Array.isArray(result) ? result : result.data);
      setTotalPages(result.totalPages ?? 1);
    } catch (error) {
      toast.error('Không tải được danh sách referer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferers();
  }, [page, searchTerm]);

  const openForm = async (type: 'create' | 'edit' | 'duplicate', referer?: Referer) => {
    setMode(type);
    setOpen(true);
    if (referer?.id) {
      try {
        const res = await fetch(`/api/referers?id=${referer.id}`);
        const detailedReferer = await res.json();
        setSelected(detailedReferer ?? referer);
      } catch {
        setSelected(referer);
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
        const res = await fetch('/api/referers', { method: 'POST', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error('Không tạo được');
        toast.success('Thêm mới thành công');
      } else if (mode === 'edit' && selected) {
        await fetch('/api/referers', { method: 'PUT', body: JSON.stringify({ ...values, id: selected.id }), headers: { 'Content-Type': 'application/json' } });
        toast.success('Cập nhật thành công');
      } else if (mode === 'duplicate' && selected) {
        const res = await fetch('/api/referers', { method: 'POST', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error('Không nhân đôi được');
        toast.success('Nhân đôi thành công');
      }
      closeForm();
      fetchReferers();
    } catch (error) {
      toast.error('Lỗi thao tác với referer');
    }
  };

  const handleDelete = async (referer: Referer) => {
    if (!confirm('Bạn có chắc muốn xóa referer này?')) return;
    try {
      await fetch(`/api/referers?id=${referer.id}`, { method: 'DELETE' });
      toast.success('Xóa thành công');
      fetchReferers();
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Referers</h2>
          <p className="text-sm text-slate-500">Quản lý người giới thiệu và hoa hồng.</p>
        </div>
        <button onClick={() => openForm('create')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Thêm Referer</button>
      </div>
      <DataTable
        columns={[
          { header: 'Tên', accessor: 'name' },
          { header: 'Ngày', accessor: 'date' },
          { header: 'Tỷ lệ', accessor: (row) => (row as Referer).offer_rate ?? '-' },
          { header: 'Ghi chú', accessor: 'notes' },
        ]}
        data={referers}
        loading={loading}
        searchTerm={searchTerm}
        onSearch={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={(row) => openForm('edit', row as Referer)}
        onDuplicate={(row) => openForm('duplicate', row as Referer)}
        onDelete={(row) => handleDelete(row as Referer)}
      />

      <Modal open={open} title={mode === 'create' ? 'Thêm Referer' : mode === 'edit' ? 'Chỉnh sửa Referer' : 'Nhân đôi Referer'} onClose={closeForm}>
        <RefererForm
          initialValues={selected ? {
            name: selected.name,
            date: formatDateForInput(selected.date),
            offerRate: String(selected.offer_rate ?? ''),
            notes: selected.notes ?? '',
            relatedImage: selected.related_image ?? '',
          } : undefined}
          submitLabel={mode === 'edit' ? 'Cập nhật' : mode === 'duplicate' ? 'Nhân đôi' : 'Lưu'}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </Modal>
    </div>
  );
}
