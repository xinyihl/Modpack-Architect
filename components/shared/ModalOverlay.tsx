import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalOverlayProps {
  children: React.ReactNode;
  title: string;
  icon: any;
  onClose: () => void;
  maxWidth?: string;
}

export const ModalOverlay: React.FC<ModalOverlayProps> = ({ children, title, icon: Icon, onClose, maxWidth = "max-w-2xl" }) => {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <h3 className="text-sm font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-3 uppercase tracking-widest">
            <Icon size={18} className="text-zinc-400 dark:text-zinc-500" /> {title}
          </h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
