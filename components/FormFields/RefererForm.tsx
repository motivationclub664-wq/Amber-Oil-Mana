'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ImageUpload from '../ImageUpload';

type RefererFormValues = {
  name: string;
  date: string;
  offerRate: string;
  notes: string;
  relatedImage: string;
};

type RefererFormProps = {
  initialValues?: Partial<RefererFormValues>;
  submitLabel: string;
  onSubmit: (values: RefererFormValues) => void;
  onCancel: () => void;
};

export default function RefererForm({ initialValues, submitLabel, onSubmit, onCancel }: RefererFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<RefererFormValues>({
    defaultValues: {
      name: '',
      date: today,
      offerRate: '',
      notes: '',
      relatedImage: '',
      ...initialValues,
    },
  });

  const relatedImage = watch('relatedImage');

  useEffect(() => {
    reset({
      name: initialValues?.name ?? '',
      date: initialValues?.date ?? today,
      offerRate: initialValues?.offerRate ?? '',
      notes: initialValues?.notes ?? '',
      relatedImage: initialValues?.relatedImage ?? '',
    });
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Tên</span>
          <input type="text" {...register('name', { required: 'Tên bắt buộc' })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.name ? <p className="mt-1 text-sm text-rose-600">{errors.name.message}</p> : null}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Ngày</span>
          <input type="date" {...register('date', { required: 'Ngày bắt buộc' })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.date ? <p className="mt-1 text-sm text-rose-600">{errors.date.message}</p> : null}
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Tỷ lệ hoa hồng</span>
        <input type="number" step="0.01" {...register('offerRate')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Ghi chú</span>
        <textarea {...register('notes')} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
      </label>
      <ImageUpload label="Hình ảnh liên quan" value={relatedImage} onChange={(value) => setValue('relatedImage', value)} />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Hủy</button>
        <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">{submitLabel}</button>
      </div>
    </form>
  );
}
