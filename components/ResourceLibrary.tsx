
import React, { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Edit2, Box, Droplets, Zap, Wind, Star, Tag, Cpu, X, Search, Filter, Globe, RefreshCcw, Wifi, WifiOff, Settings2, Puzzle, UploadCloud, FileJson, CheckCircle } from 'lucide-react';
import { Resource, ResourceCategory, ResourceType, MachineDefinition, MachineSlot, MetadataField, MetadataFieldType, Plugin } from '../types';
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

const ModalOverlay = ({ children, title, icon: Icon, onClose, maxWidth = "max-w-2xl" }: { children: React.ReactNode, title: string, icon: any, onClose: () => void, maxWidth?: string }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
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
  </div>
);

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ 
  resources, categories, machines,
  onAddResource, onUpdateResource, onDeleteResource,
  onAddCategory, onUpdateCategory, onDeleteCategory,
  onAddMachine, onUpdateMachine, onDeleteMachine
}) => {
  const { t } = useI18n();
  const { syncSettings, syncStatus, setSyncSettings, triggerSync, plugins, addPlugin, removePlugin } = useModpack();
  const { showNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'resources' | 'categories' | 'machines' | 'collaboration' | 'plugins'>('resources');
  const [activeModal, setActiveModal] = useState<null | 'resource' | 'category' | 'machine'>(null);

  const [resSearch, setResSearch] = useState('');
  const [resFilterCat, setResFilterCat] = useState('all');
  const [catSearch, setCatSearch] = useState('');
  const [macSearch, setMacSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [macMetadata, setMacMetadata] = useState<MetadataField[]>([]);

  const openResModal = (r?: Resource) => {
    if (r) {
      setEditingResourceId(r.id); setResName(r.name); setResId(r.id); setResType(r.type);
    } else {
      setEditingResourceId(null); setResName(''); setResId(''); setResType(categories[0]?.id || 'item');
    }
    setActiveModal('resource');
  };

  const openCatModal = (c?: ResourceCategory) => {
    if (c) {
      setEditingCategoryId(c.id); setCatName(c.name); setCatId(c.id); setCatIcon(c.iconType); setCatColor(c.color);
    } else {
      setEditingCategoryId(null); setCatName(''); setCatId(''); setCatIcon('box'); setCatColor('#3b82f6');
    }
    setActiveModal('category');
  };

  const openMacModal = (m?: MachineDefinition) => {
    if (m) {
      setEditingMachineId(m.id); setMacName(m.name); setMacId(m.id); setMacDesc(m.description); setMacInputs(m.inputs); setMacOutputs(m.outputs); setMacMetadata(m.metadataSchema || []);
    } else {
      setEditingMachineId(null); setMacName(''); setMacId(''); setMacDesc(''); setMacInputs([]); setMacOutputs([]); setMacMetadata([]);
    }
    setActiveModal('machine');
  };

  const closeModal = () => {
    setActiveModal(null); setEditingResourceId(null); setEditingCategoryId(null); setEditingMachineId(null);
  };

  const addSlot = (type: 'input' | 'output') => {
    const newSlot: MachineSlot = { type: categories[0]?.id || 'item', label: '', optional: false };
    if (type === 'input') setMacInputs([...macInputs, newSlot]); else setMacOutputs([...macOutputs, newSlot]);
  };

  const updateSlot = (type: 'input' | 'output', index: number, field: keyof MachineSlot, value: any) => {
    const setter = type === 'input' ? setMacInputs : setMacOutputs;
    setter(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeSlot = (type: 'input' | 'output', index: number) => {
    const setter = type === 'input' ? setMacInputs : setMacOutputs;
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const addMetadataField = () => {
    const newField: MetadataField = { key: '', label: '', type: 'string' };
    setMacMetadata([...macMetadata, newField]);
  };

  const updateMetadataField = (index: number, field: keyof MetadataField, value: any) => {
    setMacMetadata(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const removeMetadataField = (index: number) => {
    setMacMetadata(prev => prev.filter((_, i) => i !== index));
  };

  const handlePluginUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const script = ev.target?.result as string;
        addPlugin(script);
      } catch (err) {
        showNotification('error', 'Upload Failed', 'Failed to read script file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const filteredResources = useMemo(() => resources.filter(res => {
      const matchesSearch = (res.name || '').toLowerCase().includes(resSearch.toLowerCase()) || (res.id || '').toLowerCase().includes(resSearch.toLowerCase());
      const matchesCategory = resFilterCat === 'all' || res.type === resFilterCat;
      return matchesSearch && matchesCategory;
    }), [resources, resSearch, resFilterCat]);

  const filteredCategories = useMemo(() => categories.filter(c => (c.name || '').toLowerCase().includes(catSearch.toLowerCase()) || (c.id || '').toLowerCase().includes(catSearch.toLowerCase())), [categories, catSearch]);
  const filteredMachines = useMemo(() => machines.filter(m => (m.name || '').toLowerCase().includes(macSearch.toLowerCase()) || (m.id || '').toLowerCase().includes(macSearch.toLowerCase())), [machines, macSearch]);
  const safeUpperCase = (val: any) => (val ? String(val).toUpperCase() : '');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-8 shrink-0">
        {(['resources', 'categories', 'machines', 'plugins', 'collaboration'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab ? 'text-blue-600 dark:text-blue-500' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            {t(`management.tabs.${tab}`)}
            {activeTab === tab && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full shadow-[0_-2px_8px_rgba(59,130,246,0.4)]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
        {activeTab === 'resources' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
             <div className="flex gap-4 items-center bg-white dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-3.5 text-zinc-400 dark:text-zinc-600" />
                <input type="text" value={resSearch} onChange={(e) => setResSearch(e.target.value)} placeholder={t('sidebar.searchPlaceholder')} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-zinc-900 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500 outline-none h-[44px] font-medium" />
              </div>
              <div className="flex items-center gap-3">
                <select value={resFilterCat} onChange={(e) => setResFilterCat(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest outline-none h-[44px] cursor-pointer">
                  <option value="all">{safeUpperCase(t('sidebar.allCategories'))}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{safeUpperCase(c.name)}</option>)}
                </select>
                <button onClick={() => openResModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-[44px] rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/10 active:scale-95 transition-all">
                  <Plus size={16} /> {t('common.create')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredResources.map(res => (
                <div key={res.id} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-md">
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
                      {getIcon(categories.find(c => c.id === res.type)?.iconType || 'box', categories.find(c => c.id === res.type)?.color || '#94a3b8', 22)}
                    </div>
                    <div>
                      <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 tracking-wide uppercase">{res.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70 uppercase tracking-widest mt-0.5">ID: {res.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openResModal(res)} className="p-2.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteResource(res.id)} className="p-2.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
            <div className="flex gap-4 items-center bg-white dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-3.5 text-zinc-400 dark:text-zinc-600" />
                <input type="text" value={catSearch} onChange={(e) => setCatSearch(e.target.value)} placeholder={t('sidebar.searchPlaceholder')} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-zinc-900 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500 outline-none h-[44px] font-medium" />
              </div>
              <button onClick={() => openCatModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-[44px] rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/10 active:scale-95 transition-all">
                <Plus size={16} /> {t('common.create')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCategories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl group transition-all shadow-md">
                  <div className="flex items-center gap-5">
                    <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/20" style={{ backgroundColor: `${cat.color}15` }}>
                      {getIcon(cat.iconType, cat.color, 22)}
                    </div>
                    <div>
                      <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 tracking-wide uppercase">{cat.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70 uppercase tracking-widest mt-0.5">ID: {cat.id} • {cat.color}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openCatModal(cat)} className="p-2.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteCategory(cat.id)} className="p-2.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'machines' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto px-4">
            <div className="flex gap-4 items-center bg-white dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-3.5 text-zinc-400 dark:text-zinc-600" />
                <input type="text" value={macSearch} onChange={(e) => setMacSearch(e.target.value)} placeholder={t('sidebar.searchPlaceholder')} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-zinc-900 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500 outline-none h-[44px] font-medium" />
              </div>
              <button onClick={() => openMacModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-[44px] rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/10 active:scale-95 transition-all">
                <Plus size={16} /> {t('common.create')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredMachines.map(m => (
                <div key={m.id} className="flex flex-col p-8 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-lg relative overflow-hidden">
                  <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-6">
                          <div className="p-4 bg-blue-100 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 rounded-2xl border border-blue-200 dark:border-blue-600/20"><Cpu size={26} /></div>
                          <div>
                              <div className="text-base font-black text-zinc-800 dark:text-zinc-100 tracking-wide uppercase mb-1">{m.name}</div>
                              <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-widest font-bold">ID: {m.id}</div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openMacModal(m)} className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all shadow-sm"><Edit2 size={16} /></button>
                          <button onClick={() => onDeleteMachine(m.id)} className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all shadow-sm"><Trash2 size={16} /></button>
                      </div>
                  </div>
                  <div className="flex items-center gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" /><span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{m.inputs.length} {t('form.inputs')}</span></div>
                      <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" /><span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{m.outputs.length} {t('form.outputs')}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'plugins' && (
          <div className="space-y-10 animate-in fade-in duration-300 max-w-5xl mx-auto px-4">
             <div className="flex flex-col md:flex-row gap-8 items-stretch">
                <div className="flex-1 space-y-4">
                   <div className="flex items-center gap-3"><Puzzle size={24} className="text-blue-500" /><h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-widest">{t('management.pluginManager')}</h3></div>
                   <p className="text-sm text-zinc-500 font-medium leading-relaxed">{t('management.pluginWarning')}</p>
                </div>
                <div onClick={() => fileInputRef.current?.click()} className="w-full md:w-80 h-40 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-blue-500 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all cursor-pointer group shadow-sm">
                   <UploadCloud size={32} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
                   <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest px-6 text-center">{t('management.dropPlugin')} (.js)</span>
                   <input type="file" ref={fileInputRef} onChange={handlePluginUpload} accept=".js" className="hidden" />
                </div>
             </div>
             <div className="grid grid-cols-1 gap-4">
                {plugins.length > 0 ? plugins.map(p => (
                   <div key={p.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl group shadow-md transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800"><FileJson size={28} className="text-blue-500" /></div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3"><h4 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wide">{p.name}</h4><span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">V{p.version}</span></div>
                          <p className="text-xs text-zinc-500 font-medium">{p.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mt-6 md:mt-0 w-full md:w-auto">
                         <div className="flex flex-col items-end gap-1 px-4 border-r border-zinc-100 dark:border-zinc-800"><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">MACHINES</span><span className="text-sm font-black text-zinc-800 dark:text-zinc-300">{p.machines.length}</span></div>
                         <div className="flex flex-col items-end gap-1 px-4"><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">PROCESSORS</span><span className="text-sm font-black text-zinc-800 dark:text-zinc-300">{p.processors.length}</span></div>
                         <button onClick={() => removePlugin(p.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 ml-auto"><Trash2 size={14} /> {t('common.uninstall')}</button>
                      </div>
                   </div>
                )) : (
                   <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl opacity-30">
                      <Puzzle size={48} className="text-zinc-300 dark:text-zinc-800 mb-4" /><span className="text-xs font-black uppercase tracking-widest">{t('common.noResults')}</span>
                   </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'collaboration' && (
          <div className="animate-in fade-in duration-300 h-full flex items-center justify-center p-4">
             <div className="w-full max-w-xl bg-white dark:bg-zinc-900/40 p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-6">
                <div className="flex items-center gap-4"><div className="bg-blue-100 dark:bg-blue-600/10 p-3 rounded-2xl"><Globe size={24} className="text-blue-600 dark:text-blue-500" /></div><h3 className="text-lg font-black text-zinc-800 dark:text-white uppercase tracking-widest">{t('management.sync.title')}</h3></div>
                <div className={`flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800`}>
                  {syncStatus === 'success' ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-zinc-400 dark:text-zinc-600" />}
                  <span className={`text-[10px] font-black uppercase tracking-widest ${syncStatus === 'success' ? 'text-emerald-600' : 'text-zinc-400'}`}>{safeUpperCase(syncStatus)}</span>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner">
                  <div className="flex items-center gap-4"><div className={`w-3 h-3 rounded-full ${syncSettings.enabled ? 'bg-blue-500 animate-pulse' : 'bg-zinc-200 dark:bg-zinc-800'}`} /><span className="text-sm font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">{t('management.sync.enable')}</span></div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={syncSettings.enabled} onChange={(e) => setSyncSettings({...syncSettings, enabled: e.target.checked})} className="sr-only peer" />
                    <div className="w-12 h-6 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white shadow-sm"></div>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-2 tracking-widest">SERVER URL</label>
                  <input type="text" value={syncSettings.apiUrl} onChange={(e) => setSyncSettings({...syncSettings, apiUrl: e.target.value})} placeholder="wss://your-architect-server.com/api/v1/live" className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] shadow-sm font-bold" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-2 tracking-widest">{t('management.sync.username')}</label>
                    <input type="text" value={syncSettings.username} onChange={(e) => setSyncSettings({...syncSettings, username: e.target.value})} className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] shadow-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-2 tracking-widest">{t('management.sync.password')}</label>
                    <input type="password" value={syncSettings.password} onChange={(e) => setSyncSettings({...syncSettings, password: e.target.value})} className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] shadow-sm font-bold" />
                  </div>
                </div>
                <button onClick={() => triggerSync()} disabled={!syncSettings.enabled || syncStatus !== 'success'} className="w-full bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white px-6 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-2xl active:scale-[0.98] uppercase tracking-widest h-[56px]"><RefreshCcw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />FORCE SYNC</button>
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
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('management.displayName')}</label><input type="text" required value={resName} onChange={(e) => setResName(e.target.value)} placeholder="e.g. Iron Ingot" className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] font-bold" /></div>
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">ID</label><input type="text" value={resId} onChange={(e) => setResId(e.target.value)} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px]" /></div>
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('common.category')}</label>
              <div className="flex gap-4 items-end">
                <select value={resType} onChange={(e) => setResType(e.target.value)} className="flex-1 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] font-bold cursor-pointer">{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
                <button type="submit" className="px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-[0.98] h-[48px]">{editingResourceId ? t('common.update') : t('common.create')}</button>
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
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('common.name')}</label><input type="text" required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Items" className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] font-bold" /></div>
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">ID</label><input type="text" value={catId} onChange={(e) => setCatId(e.target.value)} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px]" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('management.iconStyle')}</label><div className="flex gap-1 p-1 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800 h-[48px]">{(['box', 'droplet', 'zap', 'wind', 'star'] as const).map(icon => (<button key={icon} type="button" onClick={() => setCatIcon(icon)} className={`flex-1 flex items-center justify-center rounded-lg transition-all ${catIcon === icon ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md' : 'text-zinc-400 dark:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>{getIcon(icon, catIcon === icon ? (window.document.documentElement.classList.contains('dark') ? 'white' : '#18181b') : 'currentColor', 16)}</button>))}</div></div>
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('management.color')}</label><div className="relative flex items-center h-[48px] gap-2"><input type="text" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="flex-1 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 h-full font-bold" /><div className="w-10 h-full flex items-center justify-center shrink-0 relative"><div className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm" style={{ backgroundColor: catColor }} /><input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div></div></div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-[0.98]">{editingCategoryId ? t('common.update') : t('common.create')}</button>
          </form>
        </ModalOverlay>
      )}

      {activeModal === 'machine' && (
        <ModalOverlay title={editingMachineId ? t('management.macEdit') : t('management.macTitle')} icon={Cpu} onClose={closeModal} maxWidth="max-w-6xl">
          <form onSubmit={(e) => {
            e.preventDefault();
            const machine = { id: macId || macName.toLowerCase().replace(/\s+/g, '_'), name: macName, description: macDesc, inputs: macInputs, outputs: macOutputs, metadataSchema: macMetadata };
            if (editingMachineId) onUpdateMachine(machine); else onAddMachine(machine);
            closeModal();
          }} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('management.displayName')}</label><input type="text" required value={macName} onChange={(e) => setMacName(e.target.value)} placeholder="e.g. Arc Furnace" className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] font-bold" /></div>
                <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">ID</label><input type="text" value={macId} onChange={(e) => setMacId(e.target.value)} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px]" /></div>
              </div>
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('common.description')}</label><textarea value={macDesc} onChange={(e) => setMacDesc(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none h-[400px] font-medium leading-relaxed shadow-inner" /></div>
            </div>
            <div className="space-y-8 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><label className="text-[11px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">{t('form.inputSlots')}</label><button type="button" onClick={() => addSlot('input')} className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 transition-all flex items-center gap-1"><Plus size={10} /> {safeUpperCase(t('form.addSlot'))}</button></div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {macInputs.length > 0 ? (macInputs.map((slot, idx) => (<div key={idx} className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 group hover:border-zinc-300 dark:hover:border-zinc-700/50 transition-all shadow-sm"><div className="flex items-center justify-between"><input type="text" value={slot.label} onChange={(e) => updateSlot('input', idx, 'label', e.target.value)} className="bg-transparent border-none text-xs text-zinc-800 dark:text-zinc-200 outline-none font-black uppercase tracking-wide flex-1" placeholder="Slot Label..." /><button type="button" onClick={() => removeSlot('input', idx)} className="text-zinc-400 hover:text-red-500 dark:text-zinc-600 transition-colors"><X size={14}/></button></div><div className="flex items-center gap-3"><select value={slot.type} onChange={(e) => updateSlot('input', idx, 'type', e.target.value)} className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 h-10 shadow-sm">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><label className="flex items-center gap-2 cursor-pointer group/label"><div className="relative flex items-center"><input type="checkbox" checked={slot.optional} onChange={(e) => updateSlot('input', idx, 'optional', e.target.checked)} className="sr-only peer" /><div className="w-4 h-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all"></div><X size={10} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 scale-0 peer-checked:scale-100 transition-all" /></div><span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter select-none">{t('form.optional')}</span></label></div></div>))) : (<div className="flex items-center justify-center h-[120px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl opacity-40"><span className="text-[10px] font-black text-zinc-300 dark:text-zinc-800 uppercase tracking-widest">{t('common.noResults')}</span></div>)}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><label className="text-[11px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest">{t('form.outputSlots')}</label><button type="button" onClick={() => addSlot('output')} className="text-[10px] font-black text-orange-600 dark:text-orange-500 hover:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 transition-all flex items-center gap-1"><Plus size={10} /> {safeUpperCase(t('form.addSlot'))}</button></div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {macOutputs.length > 0 ? (macOutputs.map((slot, idx) => (<div key={idx} className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 group hover:border-zinc-300 dark:hover:border-zinc-700/50 transition-all shadow-sm"><div className="flex items-center justify-between"><input type="text" value={slot.label} onChange={(e) => updateSlot('output', idx, 'label', e.target.value)} className="bg-transparent border-none text-xs text-zinc-800 dark:text-zinc-200 outline-none font-black uppercase tracking-wide flex-1" placeholder="Slot Label..." /><button type="button" onClick={() => removeSlot('output', idx)} className="text-zinc-400 hover:text-red-500 dark:text-zinc-600 transition-colors"><X size={14}/></button></div><div className="flex items-center gap-3"><select value={slot.type} onChange={(e) => updateSlot('output', idx, 'type', e.target.value)} className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 h-10 shadow-sm">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><label className="flex items-center gap-2 cursor-pointer group/label"><div className="relative flex items-center"><input type="checkbox" checked={slot.optional} onChange={(e) => updateSlot('output', idx, 'optional', e.target.checked)} className="sr-only peer" /><div className="w-4 h-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all"></div><X size={10} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 scale-0 peer-checked:scale-100 transition-all" /></div><span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter select-none">{t('form.optional')}</span></label></div></div>))) : (<div className="flex items-center justify-center h-[120px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl opacity-40"><span className="text-[10px] font-black text-zinc-300 dark:text-zinc-800 uppercase tracking-widest">{t('common.noResults')}</span></div>)}
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex-1">
                  <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Settings2 size={16} className="text-blue-500" /><label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">{t('management.metadataSchema')}</label></div><button type="button" onClick={addMetadataField} className="text-[10px] font-black text-blue-600 dark:text-blue-500 hover:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 transition-all flex items-center gap-1 shadow-sm"><Plus size={10} /> {t('management.addField')}</button></div>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {macMetadata.length > 0 ? (macMetadata.map((field, idx) => (<div key={idx} className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 group shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700"><div className="flex-1 space-y-2"><input type="text" value={field.label} onChange={(e) => updateMetadataField(idx, 'label', e.target.value)} placeholder={t('management.fieldLabel')} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold shadow-sm" /><input type="text" value={field.key} onChange={(e) => updateMetadataField(idx, 'key', e.target.value)} placeholder={t('management.fieldKey')} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-[10px] font-mono text-zinc-500 outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" /></div><div className="flex items-center gap-3"><select value={field.type} onChange={(e) => updateMetadataField(idx, 'type', e.target.value as MetadataFieldType)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase text-zinc-500 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer h-[38px] min-w-[100px] shadow-sm"><option value="string">String</option><option value="number">Number</option><option value="boolean">Boolean</option><option value="color">Color</option></select><button type="button" onClick={() => removeMetadataField(idx)} className="p-2 text-zinc-400 hover:text-red-500 dark:text-zinc-600 transition-colors"><Trash2 size={16}/></button></div></div>))) : (<div className="flex items-center justify-center h-[80px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl opacity-40"><span className="text-[10px] font-black text-zinc-300 dark:text-zinc-800 uppercase tracking-widest">{t('management.noFields')}</span></div>)}
                  </div>
              </div>
            </div>
            <div className="lg:col-span-2 mt-4 pt-6 border-t border-zinc-100 dark:border-zinc-800"><button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 active:scale-[0.98]">{editingMachineId ? t('common.update') : t('common.create')}</button></div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
};

export default ResourceLibrary;
