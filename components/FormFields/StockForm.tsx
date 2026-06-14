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
  const defaultValues = {
    importDate: '',
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
    const today = new Date().toISOString().slice(0, 10);
    reset({ ...defaultValues, importDate: initialValues?.importDate ?? today, ...initialValues });
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
          <input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            pattern="[0-9]*"
            {...register('importPrice', {
              min: { value: 0, message: 'Giá nhập phải là số nguyên không âm' },
              validate: (value) => value === '' || Number.isInteger(Number(value)) || 'Giá nhập phải là số nguyên',
            })}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900"
          />
          {errors.importPrice && <p className="mt-1 text-sm text-rose-600">{errors.importPrice.message}</p>}
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Số lượng</span>
          <input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            pattern="[0-9]*"
            {...register('quantity', {
              min: { value: 0, message: 'Số lượng phải lớn hơn hoặc bằng 0' },
              validate: (value) => value === '' || Number.isInteger(Number(value)) || 'Số lượng phải là số nguyên',
            })}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900"
          />
          {errors.quantity && <p className="mt-1 text-sm text-rose-600">{errors.quantity.message}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Số lượng tặng</span>
          <input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            pattern="[0-9]*"
            {...register('giftQuantity', {
              min: { value: 0, message: 'Số lượng tặng phải lớn hơn hoặc bằng 0' },
              validate: (value) => value === '' || Number.isInteger(Number(value)) || 'Số lượng tặng phải là số nguyên',
            })}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900"
          />
          {errors.giftQuantity && <p className="mt-1 text-sm text-rose-600">{errors.giftQuantity.message}</p>}
        </label>
      </div>
      <label className="block">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-700">Sản phẩm</span>
          <button type="button" onClick={() => window.open('/products', '_blank')} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800">
            Thêm sản phẩm
          </button>
        </div>
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
