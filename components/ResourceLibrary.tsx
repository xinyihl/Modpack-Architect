
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Box, Droplets, Zap, Wind, Star, Tag, Cpu, X, Settings2, Search, Filter, Share2, Globe, RefreshCcw, Wifi, WifiOff } from 'lucide-react';
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
      showNotification('success', '删除成功', `机器 "${machine?.name}" 已移除。`);
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
  const cancelEditMachine = () => { setEditingMachineId(null); setMacName(''); setMacId(''); setMacDesc(''); setMacInputs([]); setMacOutputs([]); };

  const handleSubmitResource = (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = resId.trim() || resName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const res: Resource = { id: finalId, name: resName.trim(), type: resType, hidden: resType === 'energy' };
    if (editingResourceId) onUpdateResource(res);
    else onAddResource(res);
    cancelEditResource();
  };

  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = catId.trim() || catName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cat: ResourceCategory = { id: finalId, name: catName.trim(), color: catColor, iconType: catIcon };
    if (editingCategoryId) onUpdateCategory(cat);
    else onAddCategory(cat);
    cancelEditCategory();
  };

  const handleSubmitMachine = (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = macId.trim() || macName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const mac: MachineDefinition = { id: finalId, name: macName.trim(), description: macDesc.trim(), inputs: macInputs, outputs: macOutputs };
    if (editingMachineId) onUpdateMachine(mac);
    else onAddMachine(mac);
    cancelEditMachine();
  };

  const addSlot = (type: 'input' | 'output') => {
    const newSlot: MachineSlot = { type: categories[0]?.id || 'item', label: 'New Slot', optional: false };
    if (type === 'input') setMacInputs([...macInputs, newSlot]);
    else setMacOutputs([...macOutputs, newSlot]);
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
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-bold capitalize transition-colors ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
            {t(`management.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === 'resources' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <form onSubmit={handleSubmitResource} className="bg-white dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-2">
                {editingResourceId ? <Edit2 size={14} /> : <Plus size={14} />} 
                {editingResourceId ? t('management.resEdit') : t('management.resTitle')}
              </span>
              {editingResourceId && <button type="button" onClick={cancelEditResource} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X size={14}/></button>}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">{t('management.displayName')}</label>
                <input type="text" required value={resName} onChange={(e) => setResName(e.target.value)} placeholder="e.g. Copper Ingot" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">{t('management.internalId')}</label>
                <input type="text" value={resId} disabled={!!editingResourceId} onChange={(e) => setResId(e.target.value.toLowerCase().replace(/[^a-z0-9:_/]/g, '_'))} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1.5 text-sm font-mono text-zinc-500 dark:text-zinc-400 disabled:opacity-50" />
              </div>
            </div>
            <div className="flex gap-2 items-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex-1 space-y-1">
                <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">{t('common.category')}</label>
                <select value={resType} onChange={(e) => setResType(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-600 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-blue-500">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-1.5 rounded transition-all font-bold text-sm shadow-md">
                {editingResourceId ? t('common.update') : t('common.register')}
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 items-center bg-zinc-50 dark:bg-zinc-900/30 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800/50 shadow-inner">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-400 dark:text-zinc-600" />
              <input 
                type="text" 
                value={resSearch}
                onChange={(e) => setResSearch(e.target.value)}
                placeholder={t('sidebar.searchPlaceholder')}
                className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Filter size={12} className="text-zinc-400 dark:text-zinc-600" />
              <select 
                value={resFilterCat}
                onChange={(e) => setResFilterCat(e.target.value)}
                className="bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 focus:ring-1 focus:ring-blue-500 outline-none font-bold uppercase tracking-tighter"
              >
                <option value="all">{t('sidebar.allCategories').toUpperCase()}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredResources.map((res) => {
              const cat = categories.find(c => c.id === res.type);
              return (
                <div key={res.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded group hover:border-blue-400 dark:hover:border-zinc-700 transition-colors shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded">{getIcon(cat?.iconType || 'box', cat?.color || '#52525b')}</div>
                    <div>
                      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{res.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{res.id} • {cat?.name}</div>
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
          <form onSubmit={handleSubmitCategory} className="bg-white dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-2">
                {editingCategoryId ? <Edit2 size={14} /> : <Tag size={14} />} 
                {editingCategoryId ? t('management.catEdit') : t('management.catTitle')}
              </span>
              {editingCategoryId && <button type="button" onClick={cancelEditCategory} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X size={14}/></button>}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">{t('common.name')}</label>
                <input type="text" required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Mana" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">{t('common.id')}</label>
                <input type="text" value={catId} disabled={!!editingCategoryId} onChange={(e) => setCatId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1.5 text-sm font-mono text-zinc-500 dark:text-zinc-400 disabled:opacity-50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">{t('management.iconStyle')}</label>
                <div className="flex gap-1 p-1 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700">
                  {(['box', 'droplet', 'zap', 'wind', 'star'] as const).map(icon => (
                    <button key={icon} type="button" onClick={() => setCatIcon(icon)} className={`flex-1 flex items-center justify-center p-2 rounded transition-all ${catIcon === icon ? 'bg-blue-600 dark:bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                      {icon === 'box' && <Box size={14} />}{icon === 'droplet' && <Droplets size={14} />}{icon === 'zap' && <Zap size={14} />}{icon === 'wind' && <Wind size={14} />}{icon === 'star' && <Star size={14} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">{t('management.color')}</label>
                <input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="w-full h-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-1 cursor-pointer" />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-1.5 rounded font-bold text-sm transition-colors shadow-md">
              {editingCategoryId ? t('common.update') : t('common.create')}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'collaboration' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-6 shadow-sm">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Globe size={18} className="text-blue-500" /> {t('management.sync.title')}
                </h3>
                <div className="flex items-center gap-2">
                   {syncStatus === 'success' ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-red-500" />}
                   <span className={`text-[10px] font-bold uppercase ${syncStatus === 'success' ? 'text-emerald-500' : 'text-zinc-500'}`}>{syncStatus}</span>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800">
                   <input 
                     type="checkbox" 
                     id="enable-sync" 
                     checked={syncSettings.enabled} 
                     onChange={(e) => setSyncSettings({...syncSettings, enabled: e.target.checked})}
                     className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                   />
                   <label htmlFor="enable-sync" className="text-sm font-bold text-zinc-700 dark:text-zinc-200 cursor-pointer">
                     {t('management.sync.enable')} (WebSocket Real-time)
                   </label>
                </div>

                <div className="col-span-2 space-y-1">
                   <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">Architect Server URL (ws/wss)</label>
                   <div className="relative">
                      <Globe size={14} className="absolute left-3 top-2.5 text-zinc-400" />
                      <input 
                        type="text" 
                        value={syncSettings.apiUrl} 
                        onChange={(e) => setSyncSettings({...syncSettings, apiUrl: e.target.value})}
                        placeholder="wss://your-architect-server.com/api/v1/live" 
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded pl-10 pr-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                   </div>
                   <p className="text-[10px] text-zinc-500 mt-1 italic">Edits are broadcast instantly via WebSocket when enabled.</p>
                </div>

                <div className="space-y-1">
                   <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">{t('management.sync.username')}</label>
                   <input 
                     type="text" 
                     value={syncSettings.username} 
                     onChange={(e) => setSyncSettings({...syncSettings, username: e.target.value})}
                     className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                   />
                </div>

                <div className="space-y-1">
                   <label className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold ml-1">{t('management.sync.password')}</label>
                   <input 
                     type="password" 
                     value={syncSettings.password} 
                     onChange={(e) => setSyncSettings({...syncSettings, password: e.target.value})}
                     className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                   />
                </div>

                <div className="flex items-end col-span-2 pt-4">
                  <button 
                    onClick={() => triggerSync()}
                    disabled={!syncSettings.enabled || syncStatus !== 'success'}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg"
                  >
                    <RefreshCcw size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                    Force Broadcast Local State
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
