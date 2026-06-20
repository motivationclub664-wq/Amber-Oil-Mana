<<<<<<< HEAD
'use client';

import { useState, useEffect } from 'react';

type ImageUploadProps = {
  value?: string | null;
  label: string;
  onChange: (base64: string) => void;
};

export default function ImageUpload({ value, label, onChange }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-4">
        <input type="file" accept="image/*" onChange={handleFile} className="block w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700" />
        {preview ? (
          <>
            <div 
              className="cursor-pointer"
              onClick={toggleFullscreen}
            >
              <img 
                src={preview} 
                alt="Preview" 
                className="h-16 w-16 rounded-2xl object-cover transition-transform duration-200 ease-out hover:scale-110"
              />
            </div>
            {isFullscreen && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={toggleFullscreen}
              >
                <img 
                  src={preview} 
                  alt="Fullscreen Preview" 
                  className="max-h-screen max-w-screen object-contain rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
=======
'use client';

import { useState, useEffect } from 'react';

type ImageUploadProps = {
  value?: string | null;
  label: string;
  onChange: (base64: string) => void;
};

export default function ImageUpload({ value, label, onChange }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-4">
        <input type="file" accept="image/*" onChange={handleFile} className="block w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700" />
        {preview ? (
          <>
            <div 
              className="cursor-pointer"
              onClick={toggleFullscreen}
            >
              <img 
                src={preview} 
                alt="Preview" 
                className="h-16 w-16 rounded-2xl object-cover transition-transform duration-200 ease-out hover:scale-110"
              />
            </div>
            {isFullscreen && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={toggleFullscreen}
              >
                <img 
                  src={preview} 
                  alt="Fullscreen Preview" 
                  className="max-h-screen max-w-screen object-contain rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
>>>>>>> 31dca55ee04290a6a1eb3786c2ceca396ab23f9b
