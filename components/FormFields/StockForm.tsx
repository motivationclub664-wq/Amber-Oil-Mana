'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ImageUpload from '../ImageUpload';

type StockFormValues = {
  importDate: string;
  importPrice: string;
  quantity: string;
  giftQuantity: string;
  notes: string;
  relatedImage: string;
  productName: string;
};

type StockFormProps = {
  initialValues?: Partial<StockFormValues>;
  products: { name: string }[];
  submitLabel: string;
  onSubmit: (values: StockFormValues) => void;
  onCancel: () => void;
};

export default function StockForm({ initialValues, products, submitLabel, onSubmit, onCancel }: StockFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultValues = {
    importDate: today,
    importPrice: '',
    quantity: '',
    giftQuantity: '',
    notes: '',
    relatedImage: '',
    productName: '',
  };

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<StockFormValues>({
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const relatedImage = watch('relatedImage');

  useEffect(() => {
    reset({ ...defaultValues, ...initialValues });
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Ngày nhập</span>
          <input type="date" {...register('importDate', { required: 'Ngày nhập bắt buộc' })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.importDate && <p className="mt-1 text-sm text-rose-600">{errors.importDate.message}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Giá nhập</span>
          <input type="number" step="0.01" {...register('importPrice')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Số lượng</span>
          <input type="number" {...register('quantity')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Số lượng tặng</span>
          <input type="number" {...register('giftQuantity')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Sản phẩm</span>
        <select {...register('productName', { required: 'Sản phẩm bắt buộc' })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900">
          <option value="">Chọn sản phẩm</option>
          {products.map((product) => (
            <option key={product.name} value={product.name}>{product.name}</option>
          ))}
        </select>
        {errors.productName && <p className="mt-1 text-sm text-rose-600">{errors.productName.message}</p>}
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Ghi chú</span>
        <textarea {...register('notes')} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
      </label>
      <ImageUpload label="Hình ảnh nhập kho" value={relatedImage} onChange={(value) => setValue('relatedImage', value)} />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Hủy</button>
        <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">{submitLabel}</button>
      </div>
    </form>
  );
}
