import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Tag } from 'lucide-react';
import { ResourceCategory } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { getResourceIcon } from './IconHelper';
import { ModalOverlay } from '../shared/ModalOverlay';

interface CategoryManagerProps {
  categories: ResourceCategory[];
  onAddCategory: (cat: ResourceCategory) => void;
  onUpdateCategory: (cat: ResourceCategory) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  categories, onAddCategory, onUpdateCategory, onDeleteCategory 
}) => {
  const { t } = useI18n();
  const [catSearch, setCatSearch] = useState('');
  const [activeModal, setActiveModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ResourceCategory | null>(null);

  const [catName, setCatName] = useState('');
  const [catId, setCatId] = useState('');
  const [catIcon, setCatIcon] = useState<ResourceCategory['iconType']>('box');
  const [catColor, setCatColor] = useState('#3b82f6');

  const openModal = (c?: ResourceCategory) => {
    if (c) {
      setEditingCategory(c); setCatName(c.name); setCatId(c.id); setCatIcon(c.iconType); setCatColor(c.color);
    } else {
      setEditingCategory(null); setCatName(''); setCatId(''); setCatIcon('box'); setCatColor('#3b82f6');
    }
    setActiveModal(true);
  };

  const filteredCategories = useMemo(() => categories.filter(c => (c.name || '').toLowerCase().includes(catSearch.toLowerCase()) || (c.id || '').toLowerCase().includes(catSearch.toLowerCase())), [categories, catSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      <div className="flex gap-4 items-center bg-white dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-3.5 text-zinc-400 dark:text-zinc-600" />
          <input type="text" value={catSearch} onChange={(e) => setCatSearch(e.target.value)} placeholder={t('sidebar.searchPlaceholder')} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-zinc-900 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500 outline-none h-[44px] font-medium" />
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-[44px] rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/10 active:scale-95 transition-all">
          <Plus size={16} /> {t('common.create')}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredCategories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl group transition-all shadow-md">
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/20" style={{ backgroundColor: `${cat.color}15` }}>
                {getResourceIcon(cat.iconType, cat.color, 22)}
              </div>
              <div>
                <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 tracking-wide uppercase">{cat.name}</div>
                <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70 uppercase tracking-widest mt-0.5">ID: {cat.id} • {cat.color}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openModal(cat)} className="p-2.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"><Edit2 size={16} /></button>
              <button onClick={() => onDeleteCategory(cat.id)} className="p-2.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-all"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {activeModal && (
        <ModalOverlay title={editingCategory ? t('management.catEdit') : t('management.catTitle')} icon={Tag} onClose={() => setActiveModal(false)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const cat = { id: catId || catName.toLowerCase().replace(/\s+/g, '_'), name: catName, color: catColor, iconType: catIcon };
            if (editingCategory) onUpdateCategory(cat); else onAddCategory(cat);
            setActiveModal(false);
          }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('common.name')}</label><input type="text" required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Items" className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] font-bold" /></div>
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">ID</label><input type="text" value={catId} onChange={(e) => setCatId(e.target.value)} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px]" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('management.iconStyle')}</label><div className="flex gap-1 p-1 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800 h-[48px]">{(['box', 'droplet', 'zap', 'wind', 'star'] as const).map(icon => (<button key={icon} type="button" onClick={() => setCatIcon(icon)} className={`flex-1 flex items-center justify-center rounded-lg transition-all ${catIcon === icon ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md' : 'text-zinc-400 dark:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>{getResourceIcon(icon, catIcon === icon ? (window.document.documentElement.classList.contains('dark') ? 'white' : '#18181b') : 'currentColor', 16)}</button>))}</div></div>
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('management.color')}</label><div className="relative flex items-center h-[48px] gap-2"><input type="text" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="flex-1 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 h-full font-bold" /><div className="w-10 h-full flex items-center justify-center shrink-0 relative"><div className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm" style={{ backgroundColor: catColor }} /><input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div></div></div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-[0.98]">{editingCategory ? t('common.update') : t('common.create')}</button>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
};
