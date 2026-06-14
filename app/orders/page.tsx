'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import OrderForm from '../../components/FormFields/OrderForm';
import { formatDateForInput, formatNumber } from '../../lib/utils';

type Order = {
  id: number;
  order_date: string;
  purchase_date?: string;
  ship_cost?: number;
  net_profit?: number;
  net_profit_margin?: number;
  referrer_fee?: number;
  notes?: string;
  customer_id?: number;
  productItems?: { productName: string; quantity: number }[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [referers, setReferers] = useState<{ id: number; offer_rate?: number }[]>([]);
  const [products, setProducts] = useState<{ name: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [selected, setSelected] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (searchTerm) params.set('search', searchTerm);
      const [orderRes, customerRes, refererRes, productRes] = await Promise.all([fetch(`/api/orders?${params.toString()}`), fetch('/api/customers'), fetch('/api/referers'), fetch('/api/products')]);
      const orderResult = await orderRes.json();
      setOrders(Array.isArray(orderResult) ? orderResult : orderResult.data);
      setTotalPages(orderResult.totalPages ?? 1);
      setCustomers(await customerRes.json());
      setReferers(await refererRes.json());
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

  const openForm = async (type: 'create' | 'edit' | 'duplicate', order?: Order) => {
    setMode(type);
    setOpen(true);
    if (order?.id) {
      try {
        const res = await fetch(`/api/orders?id=${order.id}`);
        const detailedOrder = await res.json();
        setSelected(detailedOrder ?? order);
      } catch {
        setSelected(order);
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
      if (mode === 'create' || mode === 'duplicate') {
        const res = await fetch('/api/orders', { method: 'POST', body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error();
        toast.success(mode === 'create' ? 'Thêm đơn hàng thành công' : 'Nhân đôi đơn hàng thành công');
      } else if (mode === 'edit' && selected) {
        const res = await fetch('/api/orders', { method: 'PUT', body: JSON.stringify({ ...values, id: selected.id }), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error();
        toast.success('Cập nhật thành công');
      }
      closeForm();
      fetchData();
    } catch {
      toast.error('Lỗi thao tác với đơn hàng');
    }
  };

  const handleDelete = async (order: Order) => {
    if (!confirm('Bạn có chắc muốn xóa đơn hàng này?')) return;
    try {
      await fetch(`/api/orders?id=${order.id}`, { method: 'DELETE' });
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
          <h2 className="text-xl font-semibold text-slate-900">Orders</h2>
          <p className="text-sm text-slate-500">Quản lý đơn hàng và doanh thu.</p>
        </div>
        <button onClick={() => openForm('create')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Thêm Đơn hàng</button>
      </div>
      <DataTable
        columns={[
          { header: 'ID', accessor: 'id' },
          { header: 'Ngày', accessor: 'order_date' },
          { header: 'Lợi nhuận', accessor: (row) => formatNumber((row as Order).net_profit ?? null) },
          { header: 'Khách hàng', accessor: (row) => {
            const customer = customers.find((c) => c.id === (row as Order).customer_id);
            return customer?.name ?? '-';
          } },
          { header: 'Products', accessor: (row) => {
            const items = (row as Order).productItems;
            return Array.isArray(items) && items.length ? items.map(i => `${i.productName} x${i.quantity}`).join(', ') : '-';
          } },
        ]}
        data={orders}
        loading={loading}
        searchTerm={searchTerm}
        onSearch={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={(row) => openForm('edit', row as Order)}
        onDuplicate={(row) => openForm('duplicate', row as Order)}
        onDelete={(row) => handleDelete(row as Order)}
      />

      <Modal open={open} title={mode === 'create' ? 'Thêm Đơn hàng' : mode === 'edit' ? 'Chỉnh sửa Đơn hàng' : 'Nhân đôi Đơn hàng'} onClose={closeForm}>
        <OrderForm
          initialValues={selected ? {
            orderDate: formatDateForInput(selected.order_date),
            purchaseDate: formatDateForInput(selected.purchase_date),
            shipCost: selected.ship_cost ? String(selected.ship_cost) : '',
            netProfit: selected.net_profit ? String(selected.net_profit) : '',
            netProfitMargin: selected.net_profit_margin ? String(selected.net_profit_margin) : '',
            referrerFee: selected.referrer_fee ? String(selected.referrer_fee) : '',
            notes: selected.notes ?? '',
            customerId: selected.customer_id ? String(selected.customer_id) : '',
            productItems: (selected.productItems ?? []).map((p) => ({ productName: p.productName, quantity: String(p.quantity) })),
          } : undefined}
          customers={customers}
          referers={referers}
          products={products}
          submitLabel={mode === 'edit' ? 'Cập nhật' : mode === 'duplicate' ? 'Nhân đôi' : 'Lưu'}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </Modal>
    </div>
  );
}
