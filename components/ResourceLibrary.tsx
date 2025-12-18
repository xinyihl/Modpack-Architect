
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Box, Droplets, Zap, Wind, Star, Tag, Cpu, X, Settings2, Search, Filter, Share2, Globe, RefreshCcw, Wifi, WifiOff, Hash, Layers } from 'lucide-react';
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

  const handleDeleteResource = (id: string) => {
    const res = resources.find(r => r.id === id);
    const dependentRecipe = recipes.find(r => 
      r.inputs.some(i => i.resourceId === id) || 
      r.outputs.some(o => o.resourceId === id)
    );

    if (dependentRecipe) {
      showNotification('error', '无法删除资源', `资源 "${res?.name}" 正在被配方 "${dependentRecipe.name}" 使用。`);
      return;
    }

    if (confirm(t('common.confirmDelete'))) {
      onDeleteResource(id);
      showNotification('success', '删除成功', `资源 "${res?.name}" 已从库中移除。`);
    }
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    const dependentResource = resources.find(r => r.type === id);

    if (dependentResource) {
      showNotification('error', '无法删除分类', `资源 "${dependentResource.name}" 属于分类 "${cat?.name}"。`);
      return;
    }

    if (confirm(t('common.confirmDelete'))) {
      onDeleteCategory(id);
      showNotification('success', '删除成功', `分类 "${cat?.name}" 已移除。`);
    }
  };

  const handleDeleteMachine = (id: string) => {
    const machine = machines.find(m => m.id === id);
    const dependentRecipe = recipes.find(r => r.machineId === id);

    if (dependentRecipe) {
      showNotification('error', '无法删除机器', `机器 "${machine?.name}" 正在被配方 "${dependentRecipe.name}" 使用。`);
      return;
    }

    if (confirm(t('common.confirmDelete'))) {
      onDeleteMachine(id);
      showNotification('success', '删除成功', `机器 "${machine?.name}" 已从库中移除。`);
    }
  };

  const startEditResource = (r: Resource) => {
    setEditingResourceId(r.id);
    setResName(r.name);
    setResId(r.id);
    setResType(r.type);
  };
  const cancelEditResource = () => { setEditingResourceId(null); setResName(''); setResId(''); };

  const startEditCategory = (c: ResourceCategory) => {
    setEditingCategoryId(c.id);
    setCatName(c.name);
    setCatId(c.id);
    setCatIcon(c.iconType);
    setCatColor(c.color);
  };
  const cancelEditCategory = () => { setEditingCategoryId(null); setCatName(''); setCatId(''); };

  const startEditMachine = (m: MachineDefinition) => {
    setEditingMachineId(m.id);
    setMacName(m.name);
    setMacId(m.id);
    setMacDesc(m.description);
    setMacInputs(m.inputs);
    setMacOutputs(m.outputs);
  };
  const cancelEditMachine = () => { 
    setEditingMachineId(null); 
    setMacName(''); 
    setMacId(''); 
    setMacDesc(''); 
    setMacInputs([]); 
    setMacOutputs([]); 
  };

  const handleSubmitResource = (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = resId.trim() || resName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const res: Resource = { id: finalId, name: resName.trim(), type: resType, hidden: resType === 'energy' };
    if (editingResourceId) onUpdateResource(res);
    else onAddResource(res);
    cancelEditResource();
    showNotification('success', '保存成功', `资源 "${res.name}" 已更新。`);
  };

  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = catId.trim() || catName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cat: ResourceCategory = { id: finalId, name: catName.trim(), color: catColor, iconType: catIcon };
    if (editingCategoryId) onUpdateCategory(cat);
    else onAddCategory(cat);
    cancelEditCategory();
    showNotification('success', '保存成功', `分类 "${cat.name}" 已更新。`);
  };

  const handleSubmitMachine = (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = macId.trim() || macName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const machine: MachineDefinition = {
      id: finalId,
      name: macName.trim(),
      description: macDesc.trim(),
      inputs: macInputs,
      outputs: macOutputs
    };
    if (editingMachineId) onUpdateMachine(machine);
    else onAddMachine(machine);
    cancelEditMachine();
    showNotification('success', '保存成功', `机器 "${machine.name}" 已更新。`);
  };

  const addSlot = (target: 'input' | 'output') => {
    const newSlot: MachineSlot = { type: categories[0]?.id || 'item', label: 'Slot' };
    if (target === 'input') setMacInputs([...macInputs, newSlot]);
    else setMacOutputs([...macOutputs, newSlot]);
  };

  const updateSlot = (target: 'input' | 'output', index: number, field: keyof MachineSlot, value: any) => {
    const setter = target === 'input' ? setMacInputs : setMacOutputs;
    setter(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeSlot = (target: 'input' | 'output', index: number) => {
    const setter = target === 'input' ? setMacInputs : setMacOutputs;
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const getIcon = (iconType: string, color: string) => {
    const props = { size: 14, style: { color } };
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
              activeTab === tab 
                ? 'text-blue-600' 
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            {t(`management.tabs.${tab}`)}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
        ))}
      </div>

      {activeTab === 'resources' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <form onSubmit={handleSubmitResource} className="bg-white dark:bg-zinc-900/40 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-5 shadow-sm">
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-2">
                {editingResourceId ? <Edit2 size={14} /> : <Plus size={14} />} 
                {editingResourceId ? t('management.resEdit') : t('management.resTitle')}
              </span>
              {editingResourceId && <button type="button" onClick={cancelEditResource} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X size={14}/></button>}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">{t('management.displayName')}</label>
                <input type="text" required value={resName} onChange={(e) => setResName(e.target.value)} placeholder="e.g. Iron Ingot" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">{t('management.internalId')}</label>
                <input type="text" value={resId} disabled={!!editingResourceId} onChange={(e) => setResId(e.target.value.toLowerCase().replace(/[^a-z0-9:_/]/g, '_'))} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-500 dark:text-zinc-400 disabled:opacity-50" />
              </div>
            </div>
            <div className="flex gap-4 items-end pt-2">
              <div className="flex-1 space-y-1.5">
                <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">{t('common.category')}</label>
                <select value={resType} onChange={(e) => setResType(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-blue-500">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-2 rounded-lg transition-all font-bold text-sm shadow-lg active:scale-95 shrink-0">
                {editingResourceId ? t('common.update') : t('common.register')}
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 items-center bg-zinc-100/50 dark:bg-zinc-900/30 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800/50 shadow-inner">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3 top-3 text-zinc-400 dark:text-zinc-600" />
              <input 
                type="text" 
                value={resSearch}
                onChange={(e) => setResSearch(e.target.value)}
                placeholder={t('sidebar.searchPlaceholder')}
                className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Filter size={12} className="text-zinc-400 dark:text-zinc-600" />
              <select 
                value={resFilterCat}
                onChange={(e) => setResFilterCat(e.target.value)}
                className="bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2 text-[10px] text-zinc-500 dark:text-zinc-400 focus:ring-1 focus:ring-blue-500 outline-none font-bold uppercase tracking-tighter"
              >
                <option value="all">{t('sidebar.allCategories').toUpperCase()}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredResources.map((res) => {
              const cat = categories.find(c => c.id === res.type);
              return (
                <div key={res.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 rounded-xl group hover:border-blue-400 dark:hover:border-zinc-700 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg">{getIcon(cat?.iconType || 'box', cat?.color || '#52525b')}</div>
                    <div>
                      <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{res.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70">ID: {res.id} • {cat?.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEditResource(res)} className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteResource(res.id)} className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <form onSubmit={handleSubmitCategory} className="bg-white dark:bg-[#1a1a1c] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Tag size={16} /> 
              {editingCategoryId ? t('management.catEdit') : t('management.catTitle')}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('common.name')}</label>
                <input 
                  type="text" 
                  required 
                  value={catName} 
                  onChange={(e) => setCatName(e.target.value)} 
                  placeholder="e.g. Mana" 
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">ID</label>
                <input 
                  type="text" 
                  value={catId} 
                  disabled={!!editingCategoryId} 
                  onChange={(e) => setCatId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'))} 
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-500 dark:text-zinc-400 disabled:opacity-50 outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('management.iconStyle')}</label>
                <div className="flex gap-2 p-1.5 bg-zinc-50 dark:bg-[#27272a] rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {(['box', 'droplet', 'zap', 'wind', 'star'] as const).map(icon => (
                    <button 
                      key={icon} 
                      type="button" 
                      onClick={() => setCatIcon(icon)} 
                      className={`flex-1 flex items-center justify-center p-3 rounded-md transition-all ${
                        catIcon === icon 
                          ? 'bg-zinc-800 dark:bg-[#3f3f46] text-white shadow-md' 
                          : 'text-zinc-400 dark:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {icon === 'box' && <Box size={18} />}
                      {icon === 'droplet' && <Droplets size={18} />}
                      {icon === 'zap' && <Zap size={18} />}
                      {icon === 'wind' && <Wind size={18} />}
                      {icon === 'star' && <Star size={18} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('management.color')}</label>
                <div className="relative flex items-center gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={catColor} 
                      onChange={(e) => setCatColor(e.target.value)} 
                      className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div className="relative w-12 h-10 shrink-0">
                    <div 
                      className="absolute inset-0 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm"
                      style={{ backgroundColor: catColor }}
                    />
                    <input 
                      type="color" 
                      value={catColor} 
                      onChange={(e) => setCatColor(e.target.value)} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-black text-sm transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest mt-2">
              {editingCategoryId ? t('common.update') : t('common.create')}
            </button>
          </form>

          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-xl group transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/20" style={{ backgroundColor: `${cat.color}15` }}>
                    {getIcon(cat.iconType, cat.color)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{cat.name}</div>
                    <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70 uppercase tracking-tighter">ID: {cat.id} • {cat.color}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditCategory(cat)} className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'machines' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <form onSubmit={handleSubmitMachine} className="bg-white dark:bg-[#1a1a1c] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center justify-between">
               <span className="flex items-center gap-2">
                  <Cpu size={16} /> 
                  {editingMachineId ? t('management.macEdit') : t('management.macTitle')}
               </span>
               {editingMachineId && <button type="button" onClick={cancelEditMachine} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X size={14}/></button>}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('management.displayName')}</label>
                <input type="text" required value={macName} onChange={(e) => setMacName(e.target.value)} placeholder="e.g. Arc Furnace" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">ID</label>
                <input type="text" value={macId} disabled={!!editingMachineId} onChange={(e) => setMacId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'))} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-zinc-500 dark:text-zinc-400 disabled:opacity-50 outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('common.description')}</label>
                <textarea value={macDesc} onChange={(e) => setMacDesc(e.target.value)} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none h-20" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] text-emerald-600 dark:text-emerald-500 uppercase font-black tracking-wider">Input Slots</label>
                    <button type="button" onClick={() => addSlot('input')} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1"><Plus size={10}/> ADD</button>
                  </div>
                  <div className="space-y-2">
                    {macInputs.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <input type="text" value={slot.label} onChange={(e) => updateSlot('input', idx, 'label', e.target.value)} className="flex-1 bg-transparent border-none text-xs focus:ring-0 text-zinc-700 dark:text-zinc-200" placeholder="Label" />
                        <select value={slot.type} onChange={(e) => updateSlot('input', idx, 'type', e.target.value)} className="bg-transparent border-none text-[10px] font-bold uppercase focus:ring-0 text-zinc-500">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="button" onClick={() => removeSlot('input', idx)} className="text-zinc-400 hover:text-red-500"><X size={14}/></button>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] text-orange-600 dark:text-orange-500 uppercase font-black tracking-wider">Output Slots</label>
                    <button type="button" onClick={() => addSlot('output')} className="text-[10px] font-bold text-orange-600 hover:text-orange-500 flex items-center gap-1"><Plus size={10}/> ADD</button>
                  </div>
                  <div className="space-y-2">
                    {macOutputs.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <input type="text" value={slot.label} onChange={(e) => updateSlot('output', idx, 'label', e.target.value)} className="flex-1 bg-transparent border-none text-xs focus:ring-0 text-zinc-700 dark:text-zinc-200" placeholder="Label" />
                        <select value={slot.type} onChange={(e) => updateSlot('output', idx, 'type', e.target.value)} className="bg-transparent border-none text-[10px] font-bold uppercase focus:ring-0 text-zinc-500">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="button" onClick={() => removeSlot('output', idx)} className="text-zinc-400 hover:text-red-500"><X size={14}/></button>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-black text-sm transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest mt-2">
              {editingMachineId ? t('common.update') : t('common.create')}
            </button>
          </form>

          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
             {machines.map(m => (
               <div key={m.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-xl group transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{m.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 opacity-70 uppercase tracking-tighter">
                        ID: {m.id} • {m.inputs.length} IN / {m.outputs.length} OUT
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEditMachine(m)} className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteMachine(m.id)} className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'collaboration' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-[#1a1a1c] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-7 shadow-sm">
             <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                  <Globe size={18} className="text-blue-500" /> {t('management.sync.title')}
                </h3>
                <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800">
                   {syncStatus === 'success' ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-red-500" />}
                   <span className={`text-[10px] font-black uppercase tracking-widest ${syncStatus === 'success' ? 'text-emerald-500' : 'text-zinc-500'}`}>{syncStatus}</span>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="col-span-2">
                   <button 
                     type="button" 
                     onClick={() => setSyncSettings({...syncSettings, enabled: !syncSettings.enabled})}
                     className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                       syncSettings.enabled ? 'bg-blue-600/5 border-blue-500/30 shadow-inner' : 'bg-zinc-50 dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800'
                     }`}
                   >
                     <div className="flex items-center gap-3 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                       <div className={`w-3 h-3 rounded-full ${syncSettings.enabled ? 'bg-blue-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                       {t('management.sync.enable')} (WebSocket)
                     </div>
                     <div className={`w-10 h-5 rounded-full relative transition-colors ${syncSettings.enabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-800'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${syncSettings.enabled ? 'left-6' : 'left-1'}`} />
                     </div>
                   </button>
                </div>

                <div className="col-span-2 space-y-2">
                   <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">Architect Server URL (ws/wss)</label>
                   <div className="relative">
                      <Globe size={16} className="absolute left-3.5 top-3.5 text-zinc-400" />
                      <input 
                        type="text" 
                        value={syncSettings.apiUrl} 
                        onChange={(e) => setSyncSettings({...syncSettings, apiUrl: e.target.value})}
                        placeholder="wss://your-architect-server.com/api/v1/live" 
                        className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-11 pr-3 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('management.sync.username')}</label>
                   <input 
                     type="text" 
                     value={syncSettings.username} 
                     onChange={(e) => setSyncSettings({...syncSettings, username: e.target.value})}
                     className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                   />
                </div>

                <div className="space-y-2">
                   <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-wider">{t('management.sync.password')}</label>
                   <input 
                     type="password" 
                     value={syncSettings.password} 
                     onChange={(e) => setSyncSettings({...syncSettings, password: e.target.value})}
                     className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                   />
                </div>

                <div className="flex items-end col-span-2 pt-4">
                  <button 
                    onClick={() => triggerSync()}
                    disabled={!syncSettings.enabled || syncStatus !== 'success'}
                    className="w-full bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-600 text-white px-4 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg active:scale-[0.98] uppercase tracking-[0.1em]"
                  >
                    <RefreshCcw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                    Force Synchronize Current State
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ResourceLibrary;
