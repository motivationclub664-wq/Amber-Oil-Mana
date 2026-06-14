'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ImageUpload from '../ImageUpload';

type ProductFormValues = {
  name: string;
  classicalName: string;
  netPrice: string;
  salePrice: string;
  quantity: string;
  notes: string;
  relatedImage: string;
};

type ProductFormProps = {
  initialValues?: Partial<ProductFormValues>;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
};

export default function ProductForm({ initialValues, submitLabel, onSubmit, onCancel }: ProductFormProps) {
  const defaultValues = {
    name: '',
    classicalName: '',
    netPrice: '',
    salePrice: '',
    quantity: '',
    notes: '',
    relatedImage: '',
  };

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
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
          <span className="text-sm font-medium text-slate-700">Tên</span>
          <input type="text" {...register('name', { required: 'Tên sản phẩm bắt buộc' })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name.message}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Tên thường gọi</span>
          <input type="text" {...register('classicalName')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Giá vốn</span>
          <input type="number" step="0.01" {...register('netPrice', { min: { value: 0, message: 'Giá vốn phải lớn hơn hoặc bằng 0' } })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.netPrice && <p className="mt-1 text-sm text-rose-600">{errors.netPrice.message}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Giá bán</span>
          <input type="number" step="0.01" {...register('salePrice', { min: { value: 0, message: 'Giá bán phải lớn hơn hoặc bằng 0' } })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.salePrice && <p className="mt-1 text-sm text-rose-600">{errors.salePrice.message}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Số lượng</span>
          <input type="number" {...register('quantity', { required: 'Số lượng bắt buộc', min: { value: 0, message: 'Số lượng phải lớn hơn hoặc bằng 0' }, max: { value: 999999, message: 'Số lượng quá lớn' } })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.quantity && <p className="mt-1 text-sm text-rose-600">{errors.quantity.message}</p>}
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Ghi chú</span>
        <textarea {...register('notes')} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
      </label>
      <ImageUpload label="Hình ảnh sản phẩm" value={relatedImage} onChange={(value) => setValue('relatedImage', value)} />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Hủy</button>
        <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">{submitLabel}</button>
      </div>
    </form>
  );
}
