
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Box, Droplets, Zap, Wind, Star, Tag, Cpu, X, Search, Filter, Globe, RefreshCcw, Wifi, WifiOff } from 'lucide-react';
import { Resource, ResourceCategory, ResourceType, MachineDefinition, MachineSlot } from '../types';
import { useI18n } from '../App';
import { useModpack } from '../context/ModpackContext';
import { useNotifications } from '../context/NotificationContext';

interface ResourceLibraryProps {
  resources: Resource[];
  categories: ResourceCategory[];
  machines: MachineDefinition[];
  onAddResource: (resource: Resource) => void;
  onUpdateResource: (resource: Resource) => void;
  onDeleteResource: (id: string) => void;
  onAddCategory: (category: ResourceCategory) => void;
  onUpdateCategory: (category: ResourceCategory) => void;
  onDeleteCategory: (id: string) => void;
  onAddMachine: (machine: MachineDefinition) => void;
  onUpdateMachine: (machine: MachineDefinition) => void;
  onDeleteMachine: (id: string) => void;
}

const ModalOverlay = ({ children, title, icon: Icon, onClose }: { children: React.ReactNode, title: string, icon: any, onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-2xl bg-white dark:bg-[#1a1a1c] border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
      <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#1a1a1c]">
        <h3 className="text-[13px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-3">
          <Icon size={16} /> {title}
        </h3>
        <button onClick={onClose} className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ 
  resources, categories, machines,
  onAddResource, onUpdateResource, onDeleteResource,
  onAddCategory, onUpdateCategory, onDeleteCategory,
  onAddMachine, onUpdateMachine, onDeleteMachine
}) => {
  const { t } = useI18n();
  const { syncSettings, syncStatus, setSyncSettings, triggerSync } = useModpack();
  const [activeTab, setActiveTab] = useState<'resources' | 'categories' | 'machines' | 'collaboration'>('resources');
  const [activeModal, setActiveModal] = useState<null | 'resource' | 'category' | 'machine'>(null);

  const [resSearch, setResSearch] = useState('');
  const [resFilterCat, setResFilterCat] = useState('all');
  const [catSearch, setCatSearch] = useState('');
  const [macSearch, setMacSearch] = useState('');

  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);

  const [resName, setResName] = useState('');
  const [resId, setResId] = useState('');
  const [resType, setResType] = useState<ResourceType>(categories[0]?.id || 'item');

  const [catName, setCatName] = useState('');
  const [catId, setCatId] = useState('');
  const [catIcon, setCatIcon] = useState<ResourceCategory['iconType']>('box');
  const [catColor, setCatColor] = useState('#3b82f6');

  const [macName, setMacName] = useState('');
  const [macId, setMacId] = useState('');
  const [macDesc, setMacDesc] = useState('');
  const [macInputs, setMacInputs] = useState<MachineSlot[]>([]);
  const [macOutputs, setMacOutputs] = useState<MachineSlot[]>([]);

  const openResModal = (r?: Resource) => {
    if (r) {
      setEditingResourceId(r.id);
      setResName(r.name);
      setResId(r.id);
      setResType(r.type);
    } else {
      setEditingResourceId(null);
      setResName('');
      setResId('');
      setResType(categories[0]?.id || 'item');
    }
    setActiveModal('resource');
  };

  const openCatModal = (c?: ResourceCategory) => {
    if (c) {
      setEditingCategoryId(c.id);
      setCatName(c.name);
      setCatId(c.id);
      setCatIcon(c.iconType);
      setCatColor(c.color);
    } else {
      setEditingCategoryId(null);
      setCatName('');
      setCatId('');
      setCatIcon('box');
      setCatColor('#3b82f6');
    }
    setActiveModal('category');
  };

  const openMacModal = (m?: MachineDefinition) => {
    if (m) {
      setEditingMachineId(m.id);
      setMacName(m.name);
      setMacId(m.id);
      setMacDesc(m.description);
      setMacInputs(m.inputs);
      setMacOutputs(m.outputs);
    } else {
      setEditingMachineId(null);
      setMacName('');
      setMacId('');
      setMacDesc('');
      setMacInputs([]);
      setMacOutputs([]);
    }
    setActiveModal('machine');
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingResourceId(null);
    setEditingCategoryId(null);
    setEditingMachineId(null);
  };

  const addSlot = (type: 'input' | 'output') => {
    const newSlot: MachineSlot = { type: categories[0]?.id || 'item', label: 'Slot' };
    if (type === 'input') setMacInputs([...macInputs, newSlot]);
    else setMacOutputs([...macOutputs, newSlot]);
  };

  const updateSlot = (type: 'input' | 'output', index: number, field: keyof MachineSlot, value: string) => {
    const setter = type === 'input' ? setMacInputs : setMacOutputs;
    setter(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeSlot = (type: 'input' | 'output', index: number) => {
    const setter = type === 'input' ? setMacInputs : setMacOutputs;
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const getIcon = (iconType: string, color: string, size = 18) => {
    const props = { size, style: { color } };
    switch (iconType) {
      case 'droplet': return <Droplets {...props} />;
      case 'zap': return <Zap {...props} />;
      case 'wind': return <Wind {...props} />;
      case 'star': return <Star {...props} />;
      default: return <Box {...props} />;
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      const matchesSearch = res.name.toLowerCase().includes(resSearch.toLowerCase()) || 
                           res.id.toLowerCase().includes(resSearch.toLowerCase());
      const matchesCategory = resFilterCat === 'all' || res.type === resFilterCat;
      return matchesSearch && matchesCategory;
    });
  }, [resources, resSearch, resFilterCat]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c.name.toLowerCase().includes(catSearch.toLowerCase()) || 
      c.id.toLowerCase().includes(catSearch.toLowerCase())
    );
  }, [categories, catSearch]);

  const filteredMachines = useMemo(() => {
    return machines.filter(m => 
      m.name.toLowerCase().includes(macSearch.toLowerCase()) || 
      m.id.toLowerCase().includes(macSearch.toLowerCase())
    );
  }, [machines, macSearch]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-8 shrink-0">
        {(['resources', 'categories', 'machines', 'collaboration'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab ? 'text-blue-600' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            {t(`management.tabs.${tab}`)}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
        {activeTab === 'resources' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
            <div className="flex gap-4 items-center bg-white dark:bg-[#1a1a1c] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-4 text-zinc-400 dark:text-zinc-600" />
                <input 
                  type="text" 
                  value={resSearch} 
                  onChange={(e) => setResSearch(e.target.value)} 
                  placeholder={t('sidebar.searchPlaceholder')} 
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px] placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-bold" 
                />
              </div>
              <div className="flex items-center gap-4">
                <Filter size={16} className="text-zinc-400 dark:text-zinc-600" />
                <select 
                  value={resFilterCat} 
                  onChange={(e) => setResFilterCat(e.target.value)} 
                  className="bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-700 dark:text-zinc-300 font-black uppercase tracking-widest outline-none h-[48px] font-bold"
                >
                  <option value="all">{t('sidebar.allCategories').toUpperCase()}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                </select>
                <button 
                  onClick={() => openResModal()}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-[48px] rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <Plus size={16} /> {t('common.create')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredResources.map(res => (
                <div key={res.id} className="flex items-center justify-between p-6 bg-white dark:bg-[#1a1a1c] border border-zinc-100 dark:border-zinc-800 rounded-2xl group hover:border-blue-400 dark:hover:border-zinc-700 transition-all shadow-md">
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                      {getIcon(categories.find(c => c.id === res.type)?.iconType || 'box', categories.find(c => c.id === res.type)?.color || '#94a3b8', 22)}
                    </div>
                    <div>
                      <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 tracking-wide uppercase">{res.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70 uppercase tracking-widest mt-0.5">ID: {res.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openResModal(res)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteResource(res.id)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
            <div className="flex gap-4 items-center bg-white dark:bg-[#1a1a1c] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-4 text-zinc-400 dark:text-zinc-600" />
                <input 
                  type="text" 
                  value={catSearch} 
                  onChange={(e) => setCatSearch(e.target.value)} 
                  placeholder={t('sidebar.searchPlaceholder')} 
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px] placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-bold" 
                />
              </div>
              <button 
                onClick={() => openCatModal()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-[48px] rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Plus size={16} /> {t('common.create')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCategories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-6 bg-white dark:bg-[#1a1a1c] border border-zinc-100 dark:border-zinc-800 rounded-2xl group transition-all shadow-md">
                  <div className="flex items-center gap-5">
                    <div className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/20" style={{ backgroundColor: `${cat.color}15` }}>
                      {getIcon(cat.iconType, cat.color, 22)}
                    </div>
                    <div>
                      <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 tracking-wide uppercase">{cat.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70 uppercase tracking-widest mt-0.5">ID: {cat.id} • {cat.color}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openCatModal(cat)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteCategory(cat.id)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'machines' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
            <div className="flex gap-4 items-center bg-white dark:bg-[#1a1a1c] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-4 text-zinc-400 dark:text-zinc-600" />
                <input 
                  type="text" 
                  value={macSearch} 
                  onChange={(e) => setMacSearch(e.target.value)} 
                  placeholder={t('sidebar.searchPlaceholder')} 
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px] placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-bold" 
                />
              </div>
              <button 
                onClick={() => openMacModal()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-[48px] rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Plus size={16} /> {t('common.create')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMachines.map(m => (
                <div key={m.id} className="flex flex-col p-6 bg-white dark:bg-[#1a1a1c] border border-zinc-100 dark:border-zinc-800 rounded-2xl group transition-all shadow-md">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
                              <Cpu size={22} />
                          </div>
                          <div>
                              <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 tracking-wide uppercase">{m.name}</div>
                              <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70 uppercase tracking-widest">ID: {m.id}</div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openMacModal(m)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-600 rounded-lg transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => onDeleteMachine(m.id)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-600 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-4 border-t border-zinc-100 dark:border-zinc-800/50 pt-3">
                      <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> {m.inputs.length} INPUTS</span>
                      <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> {m.outputs.length} OUTPUTS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'collaboration' && (
          <div className="animate-in fade-in duration-300 h-full flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white dark:bg-[#1a1a1c] p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600/10 p-3 rounded-2xl">
                        <Globe size={24} className="text-blue-500" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-widest">{t('management.sync.title')}</h3>
                </div>
                <div className={`flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800`}>
                  {syncStatus === 'success' ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-zinc-400" />}
                  <span className={`text-[10px] font-black uppercase tracking-widest ${syncStatus === 'success' ? 'text-emerald-500' : 'text-zinc-500'}`}>{syncStatus.toUpperCase()}</span>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${syncSettings.enabled ? 'bg-blue-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                    <span className="text-sm font-black text-zinc-700 dark:text-zinc-200 uppercase tracking-widest">{t('management.sync.enable')}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={syncSettings.enabled} onChange={(e) => setSyncSettings({...syncSettings, enabled: e.target.checked})} className="sr-only peer" />
                    <div className="w-12 h-7 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 shadow-sm"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-2 tracking-widest">SERVER URL</label>
                  <input type="text" value={syncSettings.apiUrl} onChange={(e) => setSyncSettings({...syncSettings, apiUrl: e.target.value})} placeholder="wss://your-architect-server.com/api/v1/live" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px] shadow-sm font-bold" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-2 tracking-widest">{t('management.sync.username')}</label>
                    <input type="text" value={syncSettings.username} onChange={(e) => setSyncSettings({...syncSettings, username: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px] shadow-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-2 tracking-widest">{t('management.sync.password')}</label>
                    <input type="password" value={syncSettings.password} onChange={(e) => setSyncSettings({...syncSettings, password: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px] shadow-sm font-bold" />
                  </div>
                </div>

                <button onClick={() => triggerSync()} disabled={!syncSettings.enabled || syncStatus !== 'success'} className="w-full bg-zinc-800 dark:bg-[#27272a] hover:bg-zinc-700 dark:hover:bg-[#3f3f46] text-white px-6 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-2xl active:scale-[0.98] uppercase tracking-widest h-[56px]">
                  <RefreshCcw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                  FORCE SYNC
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeModal === 'resource' && (
        <ModalOverlay title={editingResourceId ? t('management.resEdit') : t('management.resTitle')} icon={editingResourceId ? Edit2 : Plus} onClose={closeModal}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const res = { id: resId || resName.toLowerCase().replace(/\s+/g, '_'), name: resName, type: resType, hidden: false };
            if (editingResourceId) onUpdateResource(res); else onAddResource(res);
            closeModal();
          }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('management.displayName')}</label>
                <input type="text" required value={resName} onChange={(e) => setResName(e.target.value)} placeholder="e.g. Iron Ingot" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px] font-bold" />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">ID</label>
                <input type="text" value={resId} onChange={(e) => setResId(e.target.value)} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('common.category')}</label>
              <div className="flex gap-4 items-end">
                <select value={resType} onChange={(e) => setResType(e.target.value)} className="flex-1 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px] font-bold cursor-pointer">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <button type="submit" className="px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-[0.98] h-[48px]">
                  {editingResourceId ? t('common.update') : t('common.create')}
                </button>
              </div>
            </div>
          </form>
        </ModalOverlay>
      )}

      {activeModal === 'category' && (
        <ModalOverlay title={editingCategoryId ? t('management.catEdit') : t('management.catTitle')} icon={Tag} onClose={closeModal}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const cat = { id: catId || catName.toLowerCase().replace(/\s+/g, '_'), name: catName, color: catColor, iconType: catIcon };
            if (editingCategoryId) onUpdateCategory(cat); else onAddCategory(cat);
            closeModal();
          }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('common.name')}</label>
                <input type="text" required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Items" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px] font-bold" />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">ID</label>
                <input type="text" value={catId} onChange={(e) => setCatId(e.target.value)} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('management.iconStyle')}</label>
                <div className="flex gap-1 p-1 bg-zinc-50 dark:bg-[#09090b] rounded-xl border border-zinc-200 dark:border-zinc-800 h-[48px]">
                  {(['box', 'droplet', 'zap', 'wind', 'star'] as const).map(icon => (
                    <button key={icon} type="button" onClick={() => setCatIcon(icon)} className={`flex-1 flex items-center justify-center rounded-lg transition-all ${catIcon === icon ? 'bg-zinc-800 dark:bg-[#2d2d31] text-white shadow-md' : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                      {getIcon(icon, catIcon === icon ? 'white' : 'currentColor', 16)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('management.color')}</label>
                <div className="relative flex items-center h-[48px] gap-2">
                   <input type="text" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="flex-1 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-full font-bold" />
                   <div className="w-10 h-full flex items-center justify-center shrink-0 relative">
                      <div className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm" style={{ backgroundColor: catColor }} />
                      <input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   </div>
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-[0.98]">
              {editingCategoryId ? t('common.update') : t('common.create')}
            </button>
          </form>
        </ModalOverlay>
      )}

      {activeModal === 'machine' && (
        <ModalOverlay title={editingMachineId ? t('management.macEdit') : t('management.macTitle')} icon={Cpu} onClose={closeModal}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const machine = { id: macId || macName.toLowerCase().replace(/\s+/g, '_'), name: macName, description: macDesc, inputs: macInputs, outputs: macOutputs };
            if (editingMachineId) onUpdateMachine(machine); else onAddMachine(machine);
            closeModal();
          }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('management.displayName')}</label>
                <input type="text" required value={macName} onChange={(e) => setMacName(e.target.value)} placeholder="e.g. Arc Furnace" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px] font-bold" />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">ID</label>
                <input type="text" value={macId} onChange={(e) => setMacId(e.target.value)} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-[48px]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('common.description')}</label>
              <textarea value={macDesc} onChange={(e) => setMacDesc(e.target.value)} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none h-20 font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-1">
                    <label className="text-[11px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">INPUT SLOTS</label>
                    <button type="button" onClick={() => addSlot('input')} className="text-[10px] font-black text-emerald-600 hover:text-emerald-500 transition-colors bg-emerald-500/10 px-2 py-0.5 rounded">+ ADD</button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {macInputs.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                            <input type="text" value={slot.label} onChange={(e) => updateSlot('input', idx, 'label', e.target.value)} className="flex-1 bg-transparent border-none text-xs text-zinc-700 dark:text-zinc-200 outline-none font-bold" placeholder="Label" />
                            <select value={slot.type} onChange={(e) => updateSlot('input', idx, 'type', e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase text-zinc-500 outline-none cursor-pointer">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button type="button" onClick={() => removeSlot('input', idx)} className="text-zinc-400 hover:text-red-500"><X size={14}/></button>
                        </div>
                    ))}
                    {macInputs.length === 0 && <div className="text-center py-4 text-zinc-400 text-[10px] uppercase tracking-widest border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl opacity-50">Empty</div>}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-1">
                    <label className="text-[11px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest">OUTPUT SLOTS</label>
                    <button type="button" onClick={() => addSlot('output')} className="text-[10px] font-black text-orange-600 hover:text-orange-500 transition-colors bg-orange-500/10 px-2 py-0.5 rounded">+ ADD</button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {macOutputs.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                            <input type="text" value={slot.label} onChange={(e) => updateSlot('output', idx, 'label', e.target.value)} className="flex-1 bg-transparent border-none text-xs text-zinc-700 dark:text-zinc-200 outline-none font-bold" placeholder="Label" />
                            <select value={slot.type} onChange={(e) => updateSlot('output', idx, 'type', e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase text-zinc-500 outline-none cursor-pointer">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button type="button" onClick={() => removeSlot('output', idx)} className="text-zinc-400 hover:text-red-500"><X size={14}/></button>
                        </div>
                    ))}
                    {macOutputs.length === 0 && <div className="text-center py-4 text-zinc-400 text-[10px] uppercase tracking-widest border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl opacity-50">Empty</div>}
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-[0.98]">
              {editingMachineId ? t('common.update') : t('common.create')}
            </button>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
};

export default ResourceLibrary;
