
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Box, Droplets, Zap, Wind, Star, Tag, Cpu, X, Search, Filter, Globe, RefreshCcw, Wifi, WifiOff } from 'lucide-react';
import { Resource, ResourceCategory, ResourceType, MachineDefinition, MachineSlot, Recipe } from '../types';
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

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ 
  resources, categories, machines,
  onAddResource, onUpdateResource, onDeleteResource,
  onAddCategory, onUpdateCategory, onDeleteCategory,
  onAddMachine, onUpdateMachine, onDeleteMachine
}) => {
  const { t } = useI18n();
  const { recipes, syncSettings, syncStatus, setSyncSettings, triggerSync } = useModpack();
  const { showNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'resources' | 'categories' | 'machines' | 'collaboration'>('resources');

  const [resSearch, setResSearch] = useState('');
  const [resFilterCat, setResFilterCat] = useState('all');

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

  const handleEditResource = (r: Resource) => {
    setEditingResourceId(r.id);
    setResName(r.name);
    setResId(r.id);
    setResType(r.type);
  };

  const handleEditCategory = (c: ResourceCategory) => {
    setEditingCategoryId(c.id);
    setCatName(c.name);
    setCatId(c.id);
    setCatIcon(c.iconType);
    setCatColor(c.color);
  };

  const handleEditMachine = (m: MachineDefinition) => {
    setEditingMachineId(m.id);
    setMacName(m.name);
    setMacId(m.id);
    setMacDesc(m.description);
    setMacInputs(m.inputs);
    setMacOutputs(m.outputs);
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

  return (
    <div className="space-y-6">
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {(['resources', 'categories', 'machines', 'collaboration'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-4 py-3 text-sm font-bold capitalize transition-colors relative ${
              activeTab === tab ? 'text-blue-600' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            {t(`management.tabs.${tab}`)}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
        ))}
      </div>

      <div className="space-y-6 animate-in fade-in duration-300">
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <form onSubmit={(e) => {
              e.preventDefault();
              const res = { id: resId || resName.toLowerCase().replace(/\s+/g, '_'), name: resName, type: resType, hidden: false };
              if (editingResourceId) onUpdateResource(res); else onAddResource(res);
              setEditingResourceId(null); setResName(''); setResId('');
            }} className="bg-white dark:bg-[#1a1a1c] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                {editingResourceId ? <Edit2 size={14} /> : <Plus size={14} />}
                {editingResourceId ? t('management.resEdit') : t('management.resTitle')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('management.displayName')}</label>
                  <input type="text" required value={resName} onChange={(e) => setResName(e.target.value)} placeholder="e.g. Iron Ingot" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">ID</label>
                  <input type="text" value={resId} onChange={(e) => setResId(e.target.value)} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700" />
                </div>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('common.category')}</label>
                  <select value={resType} onChange={(e) => setResType(e.target.value)} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none">
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-lg transition-all font-bold text-sm shadow-xl shrink-0 h-[42px]">
                  {editingResourceId ? t('common.update') : t('common.create')}
                </button>
              </div>
            </form>

            <div className="flex flex-col sm:flex-row gap-3 items-center bg-white dark:bg-[#1a1a1c] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="relative flex-1 w-full">
                <Search size={14} className="absolute left-3 top-3 text-zinc-400 dark:text-zinc-600" />
                <input 
                  type="text" 
                  value={resSearch} 
                  onChange={(e) => setResSearch(e.target.value)} 
                  placeholder={t('sidebar.searchPlaceholder')} 
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500 outline-none h-[38px] placeholder:text-zinc-300 dark:placeholder:text-zinc-700" 
                />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Filter size={14} className="text-zinc-400 dark:text-zinc-600" />
                <select 
                  value={resFilterCat} 
                  onChange={(e) => setResFilterCat(e.target.value)} 
                  className="bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-[11px] text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-tighter outline-none h-[38px]"
                >
                  <option value="all">{t('sidebar.allCategories').toUpperCase()}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {filteredResources.map(res => (
                <div key={res.id} className="flex items-center justify-between p-4 bg-white dark:bg-[#1a1a1c] border border-zinc-100 dark:border-zinc-800 rounded-xl group hover:border-blue-400 dark:hover:border-zinc-700 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                      {getIcon(categories.find(c => c.id === res.type)?.iconType || 'box', categories.find(c => c.id === res.type)?.color || '#94a3b8')}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{res.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70 uppercase tracking-tighter">ID: {res.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditResource(res)} className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteResource(res.id)} className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <form onSubmit={(e) => {
              e.preventDefault();
              const cat = { id: catId || catName.toLowerCase().replace(/\s+/g, '_'), name: catName, color: catColor, iconType: catIcon };
              if (editingCategoryId) onUpdateCategory(cat); else onAddCategory(cat);
              setEditingCategoryId(null); setCatName(''); setCatId('');
            }} className="bg-white dark:bg-[#1a1a1c] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Tag size={16} /> {editingCategoryId ? t('management.catEdit') : t('management.catTitle')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('common.name')}</label>
                  <input type="text" required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Mana" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">ID</label>
                  <input type="text" value={catId} onChange={(e) => setCatId(e.target.value)} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('management.iconStyle')}</label>
                  <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-[#27272a] rounded-lg border border-zinc-200 dark:border-zinc-800 h-[42px]">
                    {(['box', 'droplet', 'zap', 'wind', 'star'] as const).map(icon => (
                      <button key={icon} type="button" onClick={() => setCatIcon(icon)} className={`flex-1 flex items-center justify-center rounded-md transition-all ${catIcon === icon ? 'bg-zinc-800 dark:bg-[#3f3f46] text-white shadow-md' : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}>
                        {getIcon(icon, catIcon === icon ? 'white' : 'currentColor', 18)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('management.color')}</label>
                  <div className="relative flex items-center h-[42px]">
                    <div className="flex-1 relative flex items-center h-full">
                       <input type="text" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-sm font-mono text-zinc-900 dark:text-white h-full outline-none" />
                    </div>
                    <div className="w-12 h-full flex items-center justify-center ml-2 shrink-0 relative">
                       <div className="w-8 h-8 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800" style={{ backgroundColor: catColor }} />
                       <input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-black text-sm transition-all shadow-xl active:scale-[0.98]">
                {editingCategoryId ? t('common.update') : t('common.create')}
              </button>
            </form>

            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-4 bg-white dark:bg-[#1a1a1c] border border-zinc-100 dark:border-zinc-800 rounded-xl group transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/20" style={{ backgroundColor: `${cat.color}15` }}>
                      {getIcon(cat.iconType, cat.color)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{cat.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70 uppercase tracking-tighter">ID: {cat.id} • {cat.color}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditCategory(cat)} className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteCategory(cat.id)} className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'machines' && (
          <div className="space-y-6">
            <form onSubmit={(e) => {
              e.preventDefault();
              const machine = { id: macId || macName.toLowerCase().replace(/\s+/g, '_'), name: macName, description: macDesc, inputs: macInputs, outputs: macOutputs };
              if (editingMachineId) onUpdateMachine(machine); else onAddMachine(machine);
              setEditingMachineId(null); setMacName(''); setMacId(''); setMacDesc(''); setMacInputs([]); setMacOutputs([]);
            }} className="bg-white dark:bg-[#1a1a1c] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Cpu size={16} /> {editingMachineId ? t('management.macEdit') : t('management.macTitle')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('management.displayName')}</label>
                  <input type="text" required value={macName} onChange={(e) => setMacName(e.target.value)} placeholder="e.g. Arc Furnace" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">ID</label>
                  <input type="text" value={macId} onChange={(e) => setMacId(e.target.value)} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('common.description')}</label>
                <textarea value={macDesc} onChange={(e) => setMacDesc(e.target.value)} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none h-16" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="block text-[11px] text-emerald-600 dark:text-emerald-500 uppercase font-black tracking-widest">Input Slots</label>
                    <button type="button" onClick={() => addSlot('input')} className="text-[10px] font-black text-emerald-600 hover:text-emerald-500 flex items-center gap-1">+ ADD</button>
                  </div>
                  <div className="space-y-2">
                    {macInputs.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <input type="text" value={slot.label} onChange={(e) => updateSlot('input', idx, 'label', e.target.value)} className="flex-1 bg-transparent border-none text-xs text-zinc-700 dark:text-zinc-200 outline-none" placeholder="Label" />
                        <select value={slot.type} onChange={(e) => updateSlot('input', idx, 'type', e.target.value)} className="bg-transparent border-none text-[10px] font-bold uppercase text-zinc-500 outline-none">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="button" onClick={() => removeSlot('input', idx)} className="text-zinc-400 hover:text-red-500"><X size={14}/></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="block text-[11px] text-orange-600 dark:text-orange-500 uppercase font-black tracking-widest">Output Slots</label>
                    <button type="button" onClick={() => addSlot('output')} className="text-[10px] font-black text-orange-600 hover:text-orange-500 flex items-center gap-1">+ ADD</button>
                  </div>
                  <div className="space-y-2">
                    {macOutputs.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <input type="text" value={slot.label} onChange={(e) => updateSlot('output', idx, 'label', e.target.value)} className="flex-1 bg-transparent border-none text-xs text-zinc-700 dark:text-zinc-200 outline-none" placeholder="Label" />
                        <select value={slot.type} onChange={(e) => updateSlot('output', idx, 'type', e.target.value)} className="bg-transparent border-none text-[10px] font-bold uppercase text-zinc-500 outline-none">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="button" onClick={() => removeSlot('output', idx)} className="text-zinc-400 hover:text-red-500"><X size={14}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-black text-sm transition-all shadow-xl active:scale-[0.98]">
                {editingMachineId ? t('common.update') : t('common.create')}
              </button>
            </form>
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {machines.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-white dark:bg-[#1a1a1c] border border-zinc-100 dark:border-zinc-800 rounded-xl group transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{m.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70 uppercase tracking-tighter">ID: {m.id} • {m.inputs.length} IN / {m.outputs.length} OUT</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditMachine(m)} className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteMachine(m.id)} className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'collaboration' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1a1a1c] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-7 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                  <Globe size={18} className="text-blue-500" /> {t('management.sync.title')}
                </h3>
                <div className={`flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800`}>
                  {syncStatus === 'success' ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-zinc-400" />}
                  <span className={`text-[10px] font-black uppercase tracking-widest ${syncStatus === 'success' ? 'text-emerald-500' : 'text-zinc-500'}`}>{syncStatus.toUpperCase()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${syncSettings.enabled ? 'bg-blue-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{t('management.sync.enable')} (WebSocket)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={syncSettings.enabled} onChange={(e) => setSyncSettings({...syncSettings, enabled: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">ARCHITECT SERVER URL (WS/WSS)</label>
                  <input type="text" value={syncSettings.apiUrl} onChange={(e) => setSyncSettings({...syncSettings, apiUrl: e.target.value})} placeholder="wss://your-architect-server.com/api/v1/live" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('management.sync.username')}</label>
                    <input type="text" value={syncSettings.username} onChange={(e) => setSyncSettings({...syncSettings, username: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('management.sync.password')}</label>
                    <input type="password" value={syncSettings.password} onChange={(e) => setSyncSettings({...syncSettings, password: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <button onClick={() => triggerSync()} disabled={!syncSettings.enabled || syncStatus !== 'success'} className="w-full bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-600 text-white px-4 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg active:scale-[0.98] uppercase tracking-[0.1em]">
                  <RefreshCcw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                  {t('management.sync.trigger')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceLibrary;
