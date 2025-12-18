
import React, { useState, useMemo, useEffect, createContext, useContext, useRef } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  BackgroundVariant
} from 'reactflow';
import { Layers, Plus, Database, Settings, Search, Cpu, X, Languages, Download, Upload, ArrowRight, Filter } from 'lucide-react';

import { Resource, Recipe, ResourceCategory, MachineDefinition } from './types';
import { buildGraph } from './utils/graphBuilder';
import { INITIAL_MACHINES } from './constants/machines';
import RecipeModal from './components/RecipeModal';
import ResourceLibrary from './components/ResourceLibrary';
import { translations, Locale } from './translations';

// I18n Context
interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: any;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
};

// Initial Demo Categories
const INITIAL_CATEGORIES: ResourceCategory[] = [
  { id: 'item', name: 'Items', color: '#3b82f6', iconType: 'box' },
  { id: 'fluid', name: 'Fluids', color: '#f97316', iconType: 'droplet' },
  { id: 'energy', name: 'Energy', color: '#eab308', iconType: 'zap' },
  { id: 'gas', name: 'Gases', color: '#93c5fd', iconType: 'wind' },
];

const INITIAL_RESOURCES: Resource[] = [
  { id: 'iron_ore', name: 'Iron Ore', type: 'item', hidden: false },
  { id: 'iron_ingot', name: 'Iron Ingot', type: 'item', hidden: false },
  { id: 'iron_dust', name: 'Iron Dust', type: 'item', hidden: false },
  { id: 'energy', name: 'FE Energy', type: 'energy', hidden: true },
];

const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'smelting_iron',
    name: 'Smelt Iron',
    machineId: 'furnace',
    inputs: [{ resourceId: 'iron_ore', amount: 1 }],
    outputs: [{ resourceId: 'iron_ingot', amount: 1 }],
    duration: 200
  },
  {
    id: 'crushing_iron',
    name: 'Crush Iron',
    machineId: 'crusher',
    inputs: [{ resourceId: 'iron_ore', amount: 1 }, { resourceId: 'energy', amount: 2000 }],
    outputs: [{ resourceId: 'iron_dust', amount: 2 }],
    duration: 100
  },
  {
    id: 'smelting_dust',
    name: 'Smelt Dust',
    machineId: 'furnace',
    inputs: [{ resourceId: 'iron_dust', amount: 1 }],
    outputs: [{ resourceId: 'iron_ingot', amount: 1 }],
    duration: 100
  }
];

export default function App() {
  const [locale, setLocale] = useState<Locale>('zh-CN');
  const t = (path: string) => {
    return path.split('.').reduce((obj, key) => (obj as any)?.[key], translations[locale]);
  };

  const [categories, setCategories] = useState<ResourceCategory[]>(INITIAL_CATEGORIES);
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [machines, setMachines] = useState<MachineDefinition[]>(INITIAL_MACHINES);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Sidebar Search & Filter State
  const [recipeSearch, setRecipeSearch] = useState('');
  const [machineFilter, setMachineFilter] = useState('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { nodes: layoutNodes, edges: layoutEdges } = buildGraph(resources, recipes);
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [resources, recipes, setNodes, setEdges]);

  const handleSaveRecipe = (recipe: Recipe) => {
    setRecipes(prev => {
      const index = prev.findIndex(r => r.id === recipe.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = recipe;
        return copy;
      }
      return [...prev, recipe];
    });
    setIsRecipeModalOpen(false);
    setEditingRecipeId(null);
  };

  const handleEditRecipe = (id: string) => {
    setEditingRecipeId(id);
    setIsRecipeModalOpen(true);
  };

  const handleAddResource = (res: Resource) => setResources(prev => [...prev, res]);
  const handleUpdateResource = (res: Resource) => setResources(prev => prev.map(r => r.id === res.id ? res : r));
  const handleDeleteResource = (id: string) => {
    const isUsed = recipes.some(r => r.inputs.some(i => i.resourceId === id) || r.outputs.some(o => o.resourceId === id));
    if (isUsed && !confirm(t('common.confirmDelete'))) return;
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const handleAddCategory = (cat: ResourceCategory) => setCategories(prev => [...prev, cat]);
  const handleUpdateCategory = (cat: ResourceCategory) => setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
  const handleDeleteCategory = (id: string) => {
    if (resources.some(r => r.type === id)) {
      alert('This type is currently being used.');
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleAddMachine = (m: MachineDefinition) => setMachines(prev => [...prev, m]);
  const handleUpdateMachine = (m: MachineDefinition) => setMachines(prev => prev.map(old => old.id === m.id ? m : old));
  const handleDeleteMachine = (id: string) => {
    if (recipes.some(r => r.machineId === id)) {
      alert('This machine is used in existing recipes.');
      return;
    }
    setMachines(prev => prev.filter(m => m.id !== id));
  };

  const handleExport = () => {
    const data = { categories, resources, recipes, machines };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `modpack_architect_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.categories) setCategories(data.categories);
        if (data.resources) setResources(data.resources);
        if (data.recipes) setRecipes(data.recipes);
        if (data.machines) setMachines(data.machines);
        alert('Import successful!');
      } catch (err) {
        alert('Failed to parse import file. Please ensure it is a valid Modpack Architect JSON.');
      }
    };
    reader.readAsText(file);
  };

  const editingRecipe = useMemo(() => recipes.find(r => r.id === editingRecipeId) || null, [recipes, editingRecipeId]);
  const selectedResource = useMemo(() => resources.find(r => r.id === selectedNodeId), [resources, selectedNodeId]);
  
  const relatedRecipes = useMemo(() => {
    if (!selectedNodeId) return { asInput: [], asOutput: [] };
    return {
      asInput: recipes.filter(r => r.inputs.some(i => i.resourceId === selectedNodeId)),
      asOutput: recipes.filter(r => r.outputs.some(o => o.resourceId === selectedNodeId)),
    };
  }, [recipes, selectedNodeId]);

  const filteredRecipesList = useMemo(() => {
    return recipes.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(recipeSearch.toLowerCase());
      const matchesMachine = machineFilter === 'all' || r.machineId === machineFilter;
      return matchesSearch && matchesMachine;
    });
  }, [recipes, recipeSearch, machineFilter]);

  const renderRecipeEntry = (recipe: Recipe) => {
    const machine = machines.find(m => m.id === recipe.machineId);
    const getResName = (id: string) => resources.find(r => r.id === id)?.name || id;

    return (
      <div 
        key={recipe.id} 
        onClick={() => handleEditRecipe(recipe.id)} 
        className="bg-zinc-800/40 p-3 rounded-lg border border-zinc-800 hover:border-blue-600/50 hover:bg-zinc-800/80 transition-all cursor-pointer group"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="font-bold text-sm text-zinc-100 group-hover:text-blue-400 transition-colors">
            {recipe.name}
          </div>
          <div className="text-[9px] text-zinc-500 font-bold uppercase bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-700/50">
            {machine?.name || 'Unknown'}
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5 text-[10px] text-zinc-400">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="shrink-0 text-emerald-500/80 font-bold uppercase tracking-tighter">IN:</span>
            <span className="truncate opacity-80">
              {recipe.inputs.map(i => `${i.amount}x ${getResName(i.resourceId)}`).join(', ')}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="shrink-0 text-orange-500/80 font-bold uppercase tracking-tighter">OUT:</span>
            <span className="truncate opacity-80">
              {recipe.outputs.map(o => `${o.amount}x ${getResName(o.resourceId)}`).join(', ')}
            </span>
          </div>
        </div>
        
        {/* Visual duration bar */}
        <div className="mt-2.5 h-0.5 w-full bg-zinc-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500/40 group-hover:bg-blue-500/60 transition-colors" 
            style={{ width: `${Math.min(100, (recipe.duration || 100) / 10)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 font-sans">
        <div className="flex flex-col border-r border-zinc-800 bg-zinc-900 w-80 shrink-0">
          <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold">M</div>
                <span className="font-bold tracking-tight uppercase text-sm">Architect</span>
             </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setLocale(locale === 'en-US' ? 'zh-CN' : 'en-US')}
                className="p-2 text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
                title="Switch Language"
              >
                <Languages size={18} />
                <span className="text-[10px] font-bold">{locale === 'en-US' ? 'EN' : 'CN'}</span>
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-zinc-500 hover:text-white transition-colors" title={t('sidebar.management')}>
                <Settings size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 shrink-0">
              <button onClick={() => { setEditingRecipeId(null); setIsRecipeModalOpen(true); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded shadow-lg flex items-center justify-center gap-2 font-medium transition-transform active:scale-95">
                <Plus size={18} /> {t('sidebar.defineRecipe')}
              </button>
            </div>
            
            {/* Sidebar Recipe Search & Filter */}
            <div className="px-4 pb-4 shrink-0 space-y-2 border-b border-zinc-800/50 pb-4 mb-2">
               <div className="relative">
                  <Search className="absolute left-2 top-2.5 text-zinc-500" size={14} />
                  <input 
                    type="text" 
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    placeholder={t('sidebar.searchRecipesPlaceholder')} 
                    className="w-full bg-zinc-800 border-none rounded py-2 pl-8 pr-4 text-sm text-zinc-300 focus:ring-1 focus:ring-blue-500" 
                  />
               </div>
               <div className="flex items-center gap-2">
                  <div className="bg-zinc-800 rounded p-1.5 shrink-0">
                    <Filter size={12} className="text-zinc-500" />
                  </div>
                  <select 
                    value={machineFilter}
                    onChange={(e) => setMachineFilter(e.target.value)}
                    className="flex-1 bg-zinc-800 border-none rounded py-1 px-3 text-[10px] font-bold uppercase text-zinc-400 focus:ring-1 focus:ring-blue-500 outline-none h-7 tracking-tighter"
                  >
                    <option value="all">ALL MACHINES</option>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                  </select>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2 py-2">
                {t('sidebar.definedRecipes')} ({filteredRecipesList.length})
              </h3>
              <div className="space-y-1">
                {filteredRecipesList.length > 0 ? filteredRecipesList.map(recipe => (
                  <div key={recipe.id} onClick={() => handleEditRecipe(recipe.id)} className={`group p-2 rounded cursor-pointer border transition-colors ${editingRecipeId === recipe.id ? 'bg-blue-900/20 border-blue-800' : 'hover:bg-zinc-800 border-transparent hover:border-zinc-700'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-zinc-200 truncate pr-2">{recipe.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Cpu size={10} className="text-zinc-500" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                          {machines.find(m => m.id === recipe.machineId)?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-zinc-600 text-xs italic">
                    {t('common.noResults')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={(_, node) => setSelectedNodeId(node.id)} onPaneClick={() => setSelectedNodeId(null)} fitView className="bg-zinc-950">
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3f3f46" />
            <Controls className="bg-zinc-800 border-zinc-700 text-zinc-300 fill-zinc-300" />
          </ReactFlow>
          <div className="absolute top-4 left-4 pointer-events-none">
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 p-2 rounded text-xs text-zinc-400 shadow-xl flex items-center gap-3">
              <span>{resources.length} {t('sidebar.resources')}</span>
              <span className="w-1 h-1 bg-zinc-700 rounded-full" />
              <span>{recipes.length} {t('sidebar.recipes')}</span>
            </div>
          </div>
        </div>

        {selectedResource && (
          <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl z-10 shrink-0 animate-in slide-in-from-right-full duration-300">
            <div className="h-16 flex items-center px-6 border-b border-zinc-800 bg-zinc-800/50 shrink-0">
               <h2 className="font-bold text-lg text-white truncate">{selectedResource.name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-8">
               <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 shadow-inner">
                  <div className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-3">{t('common.metadata')}</div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500 font-medium">{t('common.type')}</span>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-600/20 text-blue-400 border border-blue-600/30">
                        {categories.find(c => c.id === selectedResource.type)?.name || selectedResource.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500 font-medium">{t('common.id')}</span>
                      <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[140px] opacity-70">{selectedResource.id}</span>
                    </div>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                    <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">{t('panel.producedBy')}</h3>
                    <span className="text-[10px] font-bold bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{relatedRecipes.asOutput.length}</span>
                  </div>
                  <div className="space-y-3">
                    {relatedRecipes.asOutput.length > 0 ? (
                      relatedRecipes.asOutput.map(renderRecipeEntry)
                    ) : (
                      <div className="text-[10px] text-zinc-600 italic px-1">{t('common.noResults')}</div>
                    )}
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                    <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">{t('panel.usedIn')}</h3>
                    <span className="text-[10px] font-bold bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{relatedRecipes.asInput.length}</span>
                  </div>
                  <div className="space-y-3">
                    {relatedRecipes.asInput.length > 0 ? (
                      relatedRecipes.asInput.map(renderRecipeEntry)
                    ) : (
                      <div className="text-[10px] text-zinc-600 italic px-1">{t('common.noResults')}</div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        <RecipeModal 
          isOpen={isRecipeModalOpen} 
          editingRecipe={editingRecipe} 
          resources={resources} 
          machines={machines}
          onClose={() => { setIsRecipeModalOpen(false); setEditingRecipeId(null); }} 
          onSave={handleSaveRecipe} 
        />

        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
            <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="text-blue-500" size={20} /> {t('management.title')}
                  </h2>
                  <div className="h-6 w-px bg-zinc-800" />
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleExport}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                      title={t('common.export')}
                    >
                      <Download size={14} /> {t('common.export')}
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                      title={t('common.import')}
                    >
                      <Upload size={14} /> {t('common.import')}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImport} 
                      accept=".json" 
                      className="hidden" 
                    />
                  </div>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 p-6 bg-zinc-950">
                <ResourceLibrary 
                  resources={resources} 
                  categories={categories}
                  machines={machines}
                  onAddResource={handleAddResource} 
                  onUpdateResource={handleUpdateResource}
                  onDeleteResource={handleDeleteResource}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onAddMachine={handleAddMachine}
                  onUpdateMachine={handleUpdateMachine}
                  onDeleteMachine={handleDeleteMachine}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </I18nContext.Provider>
  );
}
