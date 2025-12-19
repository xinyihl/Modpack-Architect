import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Resource, ResourceCategory, ResourceType } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { getResourceIcon } from './IconHelper';
import { ModalOverlay } from '../shared/ModalOverlay';

interface ResourceManagerProps {
  resources: Resource[];
  categories: ResourceCategory[];
  onAddResource: (resource: Resource) => void;
  onUpdateResource: (resource: Resource) => void;
  onDeleteResource: (id: string) => void;
}

export const ResourceManager: React.FC<ResourceManagerProps> = ({ 
  resources, categories, onAddResource, onUpdateResource, onDeleteResource 
}) => {
  const { t } = useI18n();
  const [resSearch, setResSearch] = useState('');
  const [resFilterCat, setResFilterCat] = useState('all');
  const [activeModal, setActiveModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const [resName, setResName] = useState('');
  const [resId, setResId] = useState('');
  const [resType, setResType] = useState<ResourceType>(categories[0]?.id || 'item');

  const openModal = (r?: Resource) => {
    if (r) {
      setEditingResource(r); setResName(r.name); setResId(r.id); setResType(r.type);
    } else {
      setEditingResource(null); setResName(''); setResId(''); setResType(categories[0]?.id || 'item');
    }
    setActiveModal(true);
  };

  const filteredResources = useMemo(() => resources.filter(res => {
    const matchesSearch = (res.name || '').toLowerCase().includes(resSearch.toLowerCase()) || (res.id || '').toLowerCase().includes(resSearch.toLowerCase());
    const matchesCategory = resFilterCat === 'all' || res.type === resFilterCat;
    return matchesSearch && matchesCategory;
  }), [resources, resSearch, resFilterCat]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      <div className="flex gap-4 items-center bg-white dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-3.5 text-zinc-400 dark:text-zinc-600" />
          <input type="text" value={resSearch} onChange={(e) => setResSearch(e.target.value)} placeholder={t('sidebar.searchPlaceholder')} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-zinc-900 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500 outline-none h-[44px] font-medium" />
        </div>
        <div className="flex items-center gap-3">
          <select value={resFilterCat} onChange={(e) => setResFilterCat(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest outline-none h-[44px] cursor-pointer">
            <option value="all">{(t('sidebar.allCategories') || '').toUpperCase()}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
          </select>
          <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-[44px] rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/10 active:scale-95 transition-all">
            <Plus size={16} /> {t('common.create')}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredResources.map(res => (
          <div key={res.id} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-md">
            <div className="flex items-center gap-5">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
                {getResourceIcon(categories.find(c => c.id === res.type)?.iconType || 'box', categories.find(c => c.id === res.type)?.color || '#94a3b8', 22)}
              </div>
              <div>
                <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 tracking-wide uppercase">{res.name}</div>
                <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70 uppercase tracking-widest mt-0.5">ID: {res.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openModal(res)} className="p-2.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"><Edit2 size={16} /></button>
              <button onClick={() => onDeleteResource(res.id)} className="p-2.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-all"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {activeModal && (
        <ModalOverlay title={editingResource ? t('management.resEdit') : t('management.resTitle')} icon={editingResource ? Edit2 : Plus} onClose={() => setActiveModal(false)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const res = { id: resId || resName.toLowerCase().replace(/\s+/g, '_'), name: resName, type: resType, hidden: false };
            if (editingResource) onUpdateResource(res); else onAddResource(res);
            setActiveModal(false);
          }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('management.displayName')}</label><input type="text" required value={resName} onChange={(e) => setResName(e.target.value)} placeholder="e.g. Iron Ingot" className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] font-bold" /></div>
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">ID</label><input type="text" value={resId} onChange={(e) => setResId(e.target.value)} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px]" /></div>
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('common.category')}</label>
              <div className="flex gap-4 items-end">
                <select value={resType} onChange={(e) => setResType(e.target.value)} className="flex-1 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] font-bold cursor-pointer">{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
                <button type="submit" className="px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-[0.98] h-[48px]">{editingResource ? t('common.update') : t('common.create')}</button>
              </div>
            </div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
};
