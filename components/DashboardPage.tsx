'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '../lib/utils';
import StatsCard from './StatsCard';
import RevenueChart from './charts/RevenueChart';

type DashboardData = {
  totalNetProfit: number;
  newCustomers: number;
  returningCustomers: number;
  totalOrders: number;
  lowStockProducts: { name: string; quantity: number }[];
  topProducts: { name: string; order_count: number }[];
  revenueHistory: { date: string; value: number }[];
  recentOrders: { id: number; order_date: string; net_profit: number; customer_name: string | null }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">Đang tải dashboard...</div>;
  }

  if (!data) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">Không thể tải dữ liệu dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Lợi nhuận ròng" value={formatCurrency(data.totalNetProfit)} subtitle="Trong tháng" />
        <StatsCard title="Khách hàng mới" value={String(data.newCustomers)} subtitle="Tháng này" />
        <StatsCard title="Khách hàng quay lại" value={String(data.returningCustomers)} subtitle="Tháng này" />
        <StatsCard title="Tổng đơn hàng" value={String(data.totalOrders)} subtitle="Tháng này" />
      </div>
      <RevenueChart data={data.revenueHistory} />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-4 text-lg font-semibold text-slate-900">Top sản phẩm bán chạy</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 px-3">Sản phẩm</th>
                  <th className="py-3 px-3">Số đơn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.topProducts.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50">
                    <td className="py-3 px-3">{item.name}</td>
                    <td className="py-3 px-3 font-semibold">{item.order_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-4 text-lg font-semibold text-slate-900">Sản phẩm sắp hết kho</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 px-3">Sản phẩm</th>
                  <th className="py-3 px-3">Số lượng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.lowStockProducts.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50">
                    <td className="py-3 px-3">{item.name}</td>
                    <td className="py-3 px-3 font-semibold text-amber-700">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Đơn hàng mới nhất</h3>
            <p className="text-sm text-slate-500">Các đơn hàng gần đây và lợi nhuận.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Ngày</th>
                <th className="py-3 px-3">Khách hàng</th>
                <th className="py-3 px-3">Lợi nhuận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-semibold">{order.id}</td>
                  <td className="py-3 px-3">{order.order_date}</td>
                  <td className="py-3 px-3">{order.customer_name ?? '-'}</td>
                  <td className="py-3 px-3">{formatCurrency(Number(order.net_profit ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
