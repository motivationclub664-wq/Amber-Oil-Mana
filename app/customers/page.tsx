'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import CustomerForm from '../../components/FormFields/CustomerForm';
import { formatDateForInput } from '../../lib/utils';

type Customer = {
  id: number;
  name: string;
  date: string;
  phone?: string;
  zalo: string;
  address?: string;
  location?: string;
  type?: string;
  notes?: string;
  related_image1?: string;
  related_image2?: string;
  related_image3?: string;
  related_image4?: string;
  referer_id?: number;
};

type Referer = { id: number; name: string };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [referers, setReferers] = useState<Referer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [orderPopupOpen, setOrderPopupOpen] = useState(false);
  const [orderPopupCustomer, setOrderPopupCustomer] = useState<Customer | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (searchTerm) params.set('search', searchTerm);
      const [customerRes, refererRes] = await Promise.all([fetch(`/api/customers?${params.toString()}`), fetch('/api/referers')]);
      const customerResult = await customerRes.json();
      setCustomers(Array.isArray(customerResult) ? customerResult : customerResult.data);
      setTotalPages(customerResult.totalPages ?? 1);
      setReferers(await refererRes.json());
    } catch {
      toast.error('Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchTerm]);

  const openForm = async (type: 'create' | 'edit' | 'duplicate', customer?: Customer) => {
    setMode(type);
    setOpen(true);
    if (customer?.id) {
      try {
        const res = await fetch(`/api/customers?id=${customer.id}`);
        const detailedCustomer = await res.json();
        setSelected(detailedCustomer ?? customer);
      } catch {
        setSelected(customer);
      }
    } else {
      setSelected(null);
    }
  };

  const closeForm = () => {
    setOpen(false);
    setSelected(null);
  };

  const handleLenDon = (customer: Customer) => {
    setOrderPopupCustomer(customer);
    setOrderPopupOpen(true);
  };

  const closeOrderPopup = () => {
    setOrderPopupOpen(false);
    setOrderPopupCustomer(null);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (mode === 'create') {
        const res = await fetch('/api/customers', { method: 'POST', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error('Không thêm được');
        toast.success('Thêm khách hàng thành công');
      } else if (mode === 'edit' && selected) {
        const res = await fetch('/api/customers', { method: 'PUT', body: JSON.stringify({ ...values, id: selected.id }), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error('Không cập nhật được');
        toast.success('Cập nhật thành công');
      } else if (mode === 'duplicate' && selected) {
        const res = await fetch('/api/customers', { method: 'POST', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error('Không nhân đôi được');
        toast.success('Nhân đôi thành công');
      }
      closeForm();
      fetchData();
    } catch {
      toast.error('Lỗi thao tác với khách hàng');
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm('Bạn có chắc muốn xóa khách hàng này?')) return;
    try {
      await fetch(`/api/customers?id=${customer.id}`, { method: 'DELETE' });
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
          <h2 className="text-xl font-semibold text-slate-900">Customers</h2>
          <p className="text-sm text-slate-500">Quản lý khách hàng và thông tin liên hệ.</p>
        </div>
        <button onClick={() => openForm('create')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Thêm Khách hàng</button>
      </div>
      <DataTable
        columns={[
          { header: 'Tên', accessor: 'name' },
          { header: 'Phone', accessor: 'phone' },
          { header: 'Address', accessor: 'address' },
          { header: 'Ghi chú', accessor: 'notes' },
        ]}
        data={customers}
        loading={loading}
        searchTerm={searchTerm}
        onSearch={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={(row) => openForm('edit', row as Customer)}
        onDuplicate={(row) => openForm('duplicate', row as Customer)}
        onCustomAction={{ label: 'Lên Đơn', handler: (row) => handleLenDon(row as Customer) }}
        onDelete={(row) => handleDelete(row as Customer)}
      />

      <Modal open={open} title={mode === 'create' ? 'Thêm Khách hàng' : mode === 'edit' ? 'Chỉnh sửa Khách hàng' : 'Nhân đôi Khách hàng'} onClose={closeForm}>
        <CustomerForm
          initialValues={selected ? {
            name: selected.name,
            date: formatDateForInput(selected.date),
            phone: selected.phone ?? '',
            zalo: selected.zalo,
            address: selected.address ?? '',
            location: selected.location ?? '',
            type: selected.type ?? 'Other',
            notes: selected.notes ?? '',
            relatedImage1: (selected as any).related_image1 ?? '',
            relatedImage2: (selected as any).related_image2 ?? '',
            relatedImage3: (selected as any).related_image3 ?? '',
            relatedImage4: (selected as any).related_image4 ?? '',
            referer_id: selected.referer_id ? String(selected.referer_id) : '',
          } : undefined}
          referers={referers}
          submitLabel={mode === 'edit' ? 'Cập nhật' : mode === 'duplicate' ? 'Nhân đôi' : 'Lưu'}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </Modal>

      {/* Order Popup Modal */}
      <Modal open={orderPopupOpen} title="Lên Đơn" onClose={closeOrderPopup}>
        <div className="space-y-3">
          <div className="rounded-2xl bg-slate-50 p-4 space-y-2 font-mono text-sm">
            <p>Điện thoại {orderPopupCustomer?.phone || '-'}</p>
            <p>Tới {orderPopupCustomer?.name || '-'}</p>
            <p>Địa chỉ {orderPopupCustomer?.address || '-'}</p>
            <p>Hàng hóa Keo Sữa Xịt Tóc</p>
            <p>Giá trị 0đ</p>
            <p>Khối lượng 1000g</p>
            <p>Thu hộ 0đ</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const text = `Điện thoại ${orderPopupCustomer?.phone || '-'}\nTới ${orderPopupCustomer?.name || '-'}\nĐịa chỉ ${orderPopupCustomer?.address || '-'}\nHàng hóa Keo Sữa Xịt Tóc\nGiá trị 0đ\nKhối lượng 1000g\nThu hộ 0đ`;
              navigator.clipboard.writeText(text);
              toast.success('Đã sao chép nội dung');
            }}
            className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Sao chép
          </button>
        </div>
      </Modal>
    </div>
  );
}
