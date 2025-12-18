
import React, { useState, useMemo, useEffect, createContext, useContext } from 'react';
import ReactFlow, { Controls, Background, useNodesState, useEdgesState, BackgroundVariant } from 'reactflow';
import { ModpackProvider, useModpack } from './context/ModpackContext';
import { buildGraph } from './utils/graphBuilder';
import { translations, Locale } from './translations';

import Sidebar from './components/Sidebar';
import ResourceDetailPanel from './components/ResourceDetailPanel';
import RecipeModal from './components/RecipeModal';
import ResourceLibrary from './components/ResourceLibrary';
import { Database, Download, Upload, X } from 'lucide-react';

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

function MainLayout() {
  const { resources, recipes, categories, machines, setCategories, setResources, setRecipes, setMachines, addRecipe, addResource, updateResource, deleteResource, addCategory, updateCategory, deleteCategory, addMachine, updateMachine, deleteMachine } = useModpack();
  const { t } = useI18n();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

  useEffect(() => {
    const { nodes: layoutNodes, edges: layoutEdges } = buildGraph(resources, recipes);
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [resources, recipes, setNodes, setEdges]);

  const handleEditRecipe = (id: string) => {
    setEditingRecipeId(id);
    setIsRecipeModalOpen(true);
  };

  const handleExport = () => {
    const data = { categories, resources, recipes, machines };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `modpack_architect_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.categories) setCategories(data.categories);
        if (data.resources) setResources(data.resources);
        if (data.recipes) setRecipes(data.recipes);
        if (data.machines) setMachines(data.machines);
      } catch (err) { alert('Invalid file'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 font-sans">
      <Sidebar 
        onDefineRecipe={() => { setEditingRecipeId(null); setIsRecipeModalOpen(true); }}
        onEditRecipe={handleEditRecipe}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeRecipeId={editingRecipeId}
      />

      <div className="flex-1 relative">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onNodeClick={(_, node) => setSelectedNodeId(node.id)} 
          onPaneClick={() => setSelectedNodeId(null)} 
          fitView 
          className="bg-zinc-950"
        >
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

      <ResourceDetailPanel resourceId={selectedNodeId || ''} onEditRecipe={handleEditRecipe} />

      <RecipeModal 
        isOpen={isRecipeModalOpen} 
        editingRecipe={recipes.find(r => r.id === editingRecipeId) || null} 
        resources={resources} 
        machines={machines}
        onClose={() => { setIsRecipeModalOpen(false); setEditingRecipeId(null); }} 
        onSave={addRecipe} 
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
                  <button onClick={handleExport} className="p-1.5 text-zinc-400 hover:text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                    <Download size={14} /> {t('common.export')}
                  </button>
                  <label className="p-1.5 text-zinc-400 hover:text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    <Upload size={14} /> {t('common.import')}
                    <input type="file" onChange={handleImport} accept=".json" className="hidden" />
                  </label>
                </div>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 p-6 bg-zinc-950 overflow-hidden">
              <ResourceLibrary 
                resources={resources} categories={categories} machines={machines}
                onAddResource={addResource} onUpdateResource={updateResource} onDeleteResource={deleteResource}
                onAddCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory}
                onAddMachine={addMachine} onUpdateMachine={updateMachine} onDeleteMachine={deleteMachine}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [locale, setLocale] = useState<Locale>('zh-CN');
  const t = (path: string) => {
    return path.split('.').reduce((obj, key) => (obj as any)?.[key], translations[locale]);
  };

  return (
    <ModpackProvider>
      <I18nContext.Provider value={{ locale, setLocale, t }}>
        <MainLayout />
      </I18nContext.Provider>
    </ModpackProvider>
  );
}
