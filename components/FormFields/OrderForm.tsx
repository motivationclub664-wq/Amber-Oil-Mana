"use client";

import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import ImageUpload from '../ImageUpload';

type OrderFormValues = {
  orderDate: string;
  purchaseDate: string;
  shipCost: string;
  surcharge: string;
  netProfit: string;
  netProfitMargin: string;
  referrerFee: string;
  total: string;
  discount: string;
  notes: string;
  relatedImage: string;
  customerId: string;
  productItems: { productName: string; quantity: string }[];
};

type OrderFormProduct = {
  name: string;
  quantity: number;
  sale_price?: number | null;
  net_price?: number | null;
};

type OrderFormCustomer = {
  id: number;
  name: string;
  referer_id?: number | null;
};

type OrderFormReferer = {
  id: number;
  offer_rate?: number | null;
};

type OrderFormProps = {
  initialValues?: Partial<OrderFormValues>;
  customers: OrderFormCustomer[];
  referers: OrderFormReferer[];
  products: OrderFormProduct[];
  submitLabel: string;
  onSubmit: (values: OrderFormValues) => void;
  onCancel: () => void;
};

export default function OrderForm({ initialValues, customers, referers = [], products = [], submitLabel, onSubmit, onCancel }: OrderFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultValues = {
    orderDate: today,
    purchaseDate: today,
    shipCost: '',
    surcharge: '',
    netProfit: '',
    netProfitMargin: '',
    referrerFee: '',
    total: '',
    discount: '',
    notes: '',
    relatedImage: '',
    customerId: '',
    productItems: [],
  };

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<OrderFormValues>({
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'productItems' });

  const relatedImage = watch('relatedImage');
  const productItems = watch('productItems') || [];
  const discount = watch('discount');
  const shipCost = watch('shipCost');
  const surcharge = watch('surcharge');
  const customerId = watch('customerId');

  useEffect(() => {
    reset({ ...defaultValues, ...initialValues });
  }, [initialValues, reset]);

  const parseInteger = (value?: string) => {
    const numberValue = Number(value ?? '');
    return Number.isInteger(numberValue) ? numberValue : 0;
  };

  const parseNumber = (value?: string) => {
    const numberValue = Number(value ?? '');
    return Number.isFinite(numberValue) ? numberValue : 0;
  };

  const selectedCustomer = customers.find((c) => String(c.id) === customerId);
  const selectedReferer = selectedCustomer ? referers.find((r) => r.id === selectedCustomer.referer_id) : null;
  const refererRate = selectedReferer?.offer_rate ?? 0;

  const computed = useMemo(() => {
    const discountValue = parseNumber(discount);
    const shipCostValue = parseInteger(shipCost);
    const surchargeValue = parseInteger(surcharge);

    let sumSale = 0;
    let sumCost = 0;

    for (const item of productItems) {
      const product = products.find((p) => p.name === item.productName);
      const quantity = parseInteger(item.quantity);
      if (!product || quantity <= 0) continue;
      sumSale += (product.sale_price ?? 0) * quantity;
      sumCost += (product.net_price ?? 0) * quantity;
    }

    const total = Math.round(sumSale * (100 - discountValue) / 100);
    const referrerFee = Math.round(total * refererRate / 100);
    const netProfit = Math.round(total - sumCost - shipCostValue - referrerFee + surchargeValue);
    const netProfitMargin = total ? Number((netProfit / total).toFixed(4)) : 0;

    return { total, referrerFee, netProfit, netProfitMargin };
  }, [productItems, products, discount, shipCost, surcharge, refererRate]);

  // Detect if user is modifying the form
  const initialFormState = useMemo(() => {
    if (!initialValues) return null;
    return JSON.stringify({
      productItems: initialValues.productItems ?? [],
      discount: initialValues.discount ?? '',
      shipCost: initialValues.shipCost ?? '',
      surcharge: initialValues.surcharge ?? '',
      customerId: initialValues.customerId ?? '',
    });
  }, [initialValues]);

  const currentFormState = JSON.stringify({
    productItems,
    discount,
    shipCost,
    surcharge,
    customerId,
  });

  const isUserModifying = initialFormState && currentFormState !== initialFormState;

  useEffect(() => {
    // Only recalculate if: 1) creating new order (no initialValues), or 2) user has modified the form
    if (!initialFormState || isUserModifying) {
      setValue('total', String(computed.total));
      setValue('referrerFee', String(computed.referrerFee));
      setValue('netProfit', String(computed.netProfit));
      setValue('netProfitMargin', String(computed.netProfitMargin));
    }
  }, [computed, initialFormState, isUserModifying, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Ngày đơn hàng</span>
          <input type="date" {...register('orderDate', { required: 'Ngày đơn hàng bắt buộc' })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
          {errors.orderDate && <p className="mt-1 text-sm text-rose-600">{errors.orderDate.message}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Ngày thanh toán</span>
          <input type="date" {...register('purchaseDate')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
        </label>
      </div>
      {/* Khách hàng */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">Khách hàng</span>
            <button type="button" onClick={() => window.open('/customers', '_blank')} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800">
              Thêm khách hàng
            </button>
          </div>
          <select {...register('customerId', { required: 'Khách hàng bắt buộc' })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900">
            <option value="">Chọn một khách hàng</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
          {errors.customerId && <p className="mt-1 text-sm text-rose-600">{errors.customerId.message}</p>}
        </label>
      </div>
      {/* Sản phẩm */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 text-sm font-semibold text-slate-700">Chọn Products</div>
        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-7">
                <select {...register(`productItems.${idx}.productName` as const, { required: 'Chọn sản phẩm' })} className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900">
                  <option value="">Chọn sản phẩm</option>
                  {products.filter(p => p.quantity > 0).map((p) => (
                    <option key={p.name} value={p.name} disabled={productItems.some((it, i) => i !== idx && it?.productName === p.name)}>
                      {p.name} ({p.quantity})
                    </option>
                  ))}
                </select>
                {errors.productItems && errors.productItems[idx]?.productName && <p className="mt-1 text-sm text-rose-600">{(errors.productItems[idx] as any).productName.message}</p>}
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="1"
                  min="1"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  {...register(`productItems.${idx}.quantity` as const, {
                    required: 'Số lượng bắt buộc',
                    min: { value: 1, message: 'Ít nhất 1' },
                    validate: {
                      integer: (val) => Number.isInteger(Number(val)) || 'Số lượng phải là số nguyên',
                      stock: (val) => {
                        const pn = productItems[idx]?.productName;
                        const p = products.find((pp) => pp.name === pn);
                        if (!p) return 'Chọn sản phẩm trước';
                        if (Number(val) > p.quantity) return `Tối đa ${p.quantity}`;
                        return true;
                      },
                    },
                  })}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900"
                />
                {errors.productItems && errors.productItems[idx]?.quantity && <p className="mt-1 text-sm text-rose-600">{(errors.productItems[idx] as any).quantity.message}</p>}
              </div>
              <div className="col-span-2 text-right">
                <button type="button" onClick={() => remove(idx)} className="text-sm text-rose-600">Xóa</button>
              </div>
            </div>
          ))}

          <div>
            <button type="button" onClick={() => append({ productName: '', quantity: '1' })} className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-800">Thêm sản phẩm</button>
          </div>
        </div>
      </div>
      {/* Total - Discount*/}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Total</span>
          <input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            pattern="[0-9]*"
            readOnly
            {...register('total', {
              validate: (value) => value === '' || Number.isInteger(Number(value)) || 'Total phải là số nguyên',
            })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Discount (%)</span>
          <input
            type="number"
            step="0.01"
            {...register('discount', {
              validate: (value) => value === '' || Number.isFinite(Number(value)) || 'Discount phải là số',
            })}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
      </div>
      {/* Ship cost  - Phụ phí - Lợi nhuận*/}
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Ship cost</span>
          <input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            pattern="[0-9]*"
            {...register('shipCost', {
              validate: (value) => value === '' || Number.isInteger(Number(value)) || 'Ship cost phải là số nguyên',
            })}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Phụ phí</span>
          <input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            pattern="[0-9]*"
            {...register('surcharge', {
              validate: (value) => value === '' || Number.isInteger(Number(value)) || 'Phụ phí phải là số nguyên',
            })}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Lợi nhuận</span>
          <input
            type="number"
            step="1"
            inputMode="numeric"
            pattern="[0-9]*"
            readOnly
            {...register('netProfit', {
              validate: (value) => value === '' || Number.isInteger(Number(value)) || 'Lợi nhuận phải là số nguyên',
            })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-900"
          />
        </label>
      </div>


      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Tỷ lệ lợi nhuận</span>
          <input
            type="number"
            step="0.01"
            readOnly
            {...register('netProfitMargin')}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Phí referrer</span>
          <input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            pattern="[0-9]*"
            readOnly
            {...register('referrerFee', {
              validate: (value) => value === '' || Number.isInteger(Number(value)) || 'Phí referrer phải là số nguyên',
            })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-900"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Ghi chú</span>
        <textarea {...register('notes')} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900" />
      </label>
      <div className="hidden">
        <input {...register('relatedImage')} />
      </div>
      <ImageUpload label="Hình ảnh đơn hàng" value={relatedImage} onChange={(value) => setValue('relatedImage', value)} />
      
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Hủy</button>
        <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">{submitLabel}</button>
      </div>
    </form>
  );
}
