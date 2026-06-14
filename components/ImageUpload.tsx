'use client';

import { useState, useEffect } from 'react';

type ImageUploadProps = {
  value?: string | null;
  label: string;
  onChange: (base64: string) => void;
};

export default function ImageUpload({ value, label, onChange }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    setPreview(value ?? null);
  }, [value]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-4">
        <input type="file" accept="image/*" onChange={handleFile} className="block w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700" />
        {preview ? <img src={preview} alt="Preview" className="h-16 w-16 rounded-2xl object-cover transition-transform duration-200 ease-out hover:scale-110" /> : null}
      </div>
    </div>
  );
}
