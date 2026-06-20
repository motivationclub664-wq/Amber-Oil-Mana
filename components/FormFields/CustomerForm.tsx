<<<<<<< HEAD
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import ImageUpload from '../ImageUpload';

type CustomerFormValues = {
  name: string;
  date: string;
  phone: string;
  zalo: string;
  address: string;
  location: string;
  type: string;
  notes: string;
  relatedImage1: string;
  relatedImage2: string;
  relatedImage3: string;
  relatedImage4: string;
  referer_id: string;
};

type RefererOption = { id: number; name: string };

type CustomerFormProps = {
  initialValues?: Partial<CustomerFormValues>;
  referers: RefererOption[];
  submitLabel: string;
  onSubmit: (values: CustomerFormValues) => void;
  onCancel: () => void;
};

const customerTypes = ['Grab', 'Be', 'Tada', 'Ahamove', 'Lalamove', 'Wholesale Customer', 'Other'];

export default function CustomerForm({ initialValues, referers, submitLabel, onSubmit, onCancel }: CustomerFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultValues = {
    name: '',
    date: today,
    phone: '',
    zalo: '',
    address: '',
    location: '',
    type: 'Other',
    notes: '',
    relatedImage1: '',
    relatedImage2: '',
    relatedImage3: '',
    relatedImage4: '',
    referer_id: '',
  };

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CustomerFormValues>({
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const relatedImage1 = watch('relatedImage1');
  const relatedImage2 = watch('relatedImage2');
  const relatedImage3 = watch('relatedImage3');
  const relatedImage4 = watch('relatedImage4');
  const locationValue = watch('location');
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    reset({ ...defaultValues, ...initialValues });
  }, [initialValues, reset]);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setValue('location', `${latitude.toFixed(6)},${longitude.toFixed(6)}`);
        setLoadingLocation(false);
        toast.success('Lấy vị trí thành công');
      },
      () => {
        setLoadingLocation(false);
        toast.error('Không thể lấy vị trí thiết bị');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const openGoogleMaps = () => {
    if (!locationValue) {
      toast.error('Vui lòng nhập hoặc lấy vị trí trước');
      return;
    }

    const [lat, lng] = locationValue.split(',').map((value) => value.trim());
    if (!lat || !lng || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
      toast.error('Vị trí không hợp lệ');
      return;
    }

    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lng)}`, '_blank');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Tên</span>
          <input type="text" {...register('name', { required: 'Tên bắt buộc' })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name.message}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Ngày</span>
          <input type="date" {...register('date', { required: 'Ngày bắt buộc' })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.date && <p className="mt-1 text-sm text-rose-600">{errors.date.message}</p>}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Phone</span>
          <input type="text" {...register('phone')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Zalo (nhập số điện thoại)</span>
          <input type="text" {...register('zalo', { required: 'Zalo bắt buộc' })} placeholder="Ví dụ: 0912345678" className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.zalo && <p className="mt-1 text-sm text-rose-600">{errors.zalo.message}</p>}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Địa chỉ</span>
          <input type="text" {...register('address')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
        </label>
        <div className="block">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">Vị trí (lat,lng)</span>
            <div className="flex gap-2">
              <button type="button" onClick={fetchCurrentLocation} disabled={loadingLocation} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                {loadingLocation ? 'Đang lấy...' : 'Lấy vị trí'}
              </button>
              <button type="button" onClick={openGoogleMaps} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800">
                Mở Google Maps
              </button>
            </div>
          </div>
          <input type="text" {...register('location')} placeholder="10.123,106.456" className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Loại</span>
          <select {...register('type')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900">
            {customerTypes.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Người giới thiệu</span>
          <select {...register('referer_id')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900">
            <option value="">Không có</option>
            {referers.map((referer) => (
              <option key={referer.id} value={referer.id}>{referer.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Ghi chú</span>
        <textarea {...register('notes')} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUpload label="Hình 1" value={relatedImage1} onChange={(value) => setValue('relatedImage1', value)} />
        <ImageUpload label="Hình 2" value={relatedImage2} onChange={(value) => setValue('relatedImage2', value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUpload label="Hình 3" value={relatedImage3} onChange={(value) => setValue('relatedImage3', value)} />
        <ImageUpload label="Hình 4" value={relatedImage4} onChange={(value) => setValue('relatedImage4', value)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Hủy</button>
        <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">{submitLabel}</button>
      </div>
    </form>
  );
}
=======
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import ImageUpload from '../ImageUpload';

type CustomerFormValues = {
  name: string;
  date: string;
  phone: string;
  zalo: string;
  address: string;
  location: string;
  type: string;
  notes: string;
  relatedImage1: string;
  relatedImage2: string;
  relatedImage3: string;
  relatedImage4: string;
  referer_id: string;
};

type RefererOption = { id: number; name: string };

type CustomerFormProps = {
  initialValues?: Partial<CustomerFormValues>;
  referers: RefererOption[];
  submitLabel: string;
  onSubmit: (values: CustomerFormValues) => void;
  onCancel: () => void;
};

const customerTypes = ['Grab', 'Be', 'Tada', 'Ahamove', 'Lalamove', 'Wholesale Customer', 'Other'];

export default function CustomerForm({ initialValues, referers, submitLabel, onSubmit, onCancel }: CustomerFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultValues = {
    name: '',
    date: today,
    phone: '',
    zalo: '',
    address: '',
    location: '',
    type: 'Other',
    notes: '',
    relatedImage1: '',
    relatedImage2: '',
    relatedImage3: '',
    relatedImage4: '',
    referer_id: '',
  };

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CustomerFormValues>({
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const relatedImage1 = watch('relatedImage1');
  const relatedImage2 = watch('relatedImage2');
  const relatedImage3 = watch('relatedImage3');
  const relatedImage4 = watch('relatedImage4');
  const locationValue = watch('location');
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    reset({ ...defaultValues, ...initialValues });
  }, [initialValues, reset]);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setValue('location', `${latitude.toFixed(6)},${longitude.toFixed(6)}`);
        setLoadingLocation(false);
        toast.success('Lấy vị trí thành công');
      },
      () => {
        setLoadingLocation(false);
        toast.error('Không thể lấy vị trí thiết bị');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const openGoogleMaps = () => {
    if (!locationValue) {
      toast.error('Vui lòng nhập hoặc lấy vị trí trước');
      return;
    }

    const [lat, lng] = locationValue.split(',').map((value) => value.trim());
    if (!lat || !lng || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
      toast.error('Vị trí không hợp lệ');
      return;
    }

    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lng)}`, '_blank');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Tên</span>
          <input type="text" {...register('name', { required: 'Tên bắt buộc' })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name.message}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Ngày</span>
          <input type="date" {...register('date', { required: 'Ngày bắt buộc' })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.date && <p className="mt-1 text-sm text-rose-600">{errors.date.message}</p>}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Phone</span>
          <input type="text" {...register('phone')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Zalo (nhập số điện thoại)</span>
          <input type="text" {...register('zalo', { required: 'Zalo bắt buộc' })} placeholder="Ví dụ: 0912345678" className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.zalo && <p className="mt-1 text-sm text-rose-600">{errors.zalo.message}</p>}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Địa chỉ</span>
          <input type="text" {...register('address')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
        </label>
        <div className="block">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">Vị trí (lat,lng)</span>
            <div className="flex gap-2">
              <button type="button" onClick={fetchCurrentLocation} disabled={loadingLocation} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                {loadingLocation ? 'Đang lấy...' : 'Lấy vị trí'}
              </button>
              <button type="button" onClick={openGoogleMaps} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800">
                Mở Google Maps
              </button>
            </div>
          </div>
          <input type="text" {...register('location')} placeholder="10.123,106.456" className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Loại</span>
          <select {...register('type')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900">
            {customerTypes.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Người giới thiệu</span>
          <select {...register('referer_id')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900">
            <option value="">Không có</option>
            {referers.map((referer) => (
              <option key={referer.id} value={referer.id}>{referer.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Ghi chú</span>
        <textarea {...register('notes')} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUpload label="Hình 1" value={relatedImage1} onChange={(value) => setValue('relatedImage1', value)} />
        <ImageUpload label="Hình 2" value={relatedImage2} onChange={(value) => setValue('relatedImage2', value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUpload label="Hình 3" value={relatedImage3} onChange={(value) => setValue('relatedImage3', value)} />
        <ImageUpload label="Hình 4" value={relatedImage4} onChange={(value) => setValue('relatedImage4', value)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Hủy</button>
        <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">{submitLabel}</button>
      </div>
    </form>
  );
}
>>>>>>> 31dca55ee04290a6a1eb3786c2ceca396ab23f9b
