'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-3 py-2 text-slate-600 hover:bg-slate-200">Đóng</button>
        </div>
        <div className="mt-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
