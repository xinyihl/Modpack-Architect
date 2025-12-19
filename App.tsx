
import React, { useState, useMemo, useEffect, createContext, useContext } from 'react';
import ReactFlow, { Controls, Background, useNodesState, useEdgesState, BackgroundVariant } from 'reactflow';
import { ModpackProvider, useModpack } from './context/ModpackContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { buildGraph } from './utils/graphBuilder';
import { translations, Locale } from './translations';

import Sidebar from './components/Sidebar';
import ResourceDetailPanel from './components/ResourceDetailPanel';
import RecipeModal from './components/RecipeModal';
import ResourceLibrary from './components/ResourceLibrary';
import CodeGeneratorModal from './components/CodeGeneratorModal';
import { Database, Download, Upload, X, Wifi, WifiOff, FileCode } from 'lucide-react';

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
  const { resources, recipes, categories, machines, setCategories, setResources, setRecipes, setMachines, addRecipe, deleteRecipe, addResource, updateResource, deleteResource, addCategory, updateCategory, deleteCategory, addMachine, updateMachine, deleteMachine, syncStatus, syncSettings, plugins } = useModpack();
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const { showNotification } = useNotifications();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

  useEffect(() => {
    const { nodes: layoutNodes, edges: layoutEdges } = buildGraph(resources, recipes);
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [resources, recipes, setNodes, setEdges]);

  // Sync locale to HTML lang for Context usage
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const handleEditRecipe = (id: string) => {
    setEditingRecipeId(id);
    setIsRecipeModalOpen(true);
  };

  const handleDeleteRecipe = (id: string) => {
    const recipeToDelete = recipes.find(r => r.id === id);
    if (!recipeToDelete) return;

    const outputs = recipeToDelete.outputs.map(o => o.resourceId);
    const dependentRecipe = recipes.find(r => 
      r.id !== id && r.inputs.some(i => outputs.includes(i.resourceId))
    );

    if (dependentRecipe) {
      const otherProducers = recipes.filter(r => 
        r.id !== id && r.outputs.some(o => outputs.includes(o.resourceId))
      );

      if (otherProducers.length === 0) {
        showNotification(
          'error',
          '无法删除配方',
          `配方 "${recipeToDelete.name}" 是资源 "${resources.find(res => outputs.includes(res.id))?.name}" 的唯一产出途径，而该资源正被配方 "${dependentRecipe.name}" 使用。`
        );
        return;
      }
    }

    deleteRecipe(id);
    showNotification('success', '删除成功', `配方 "${recipeToDelete.name}" 已移除。`);
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
    showNotification('success', '导出成功', '您的数据已保存。');
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
        showNotification('success', '导入成功', '数据已成功同步。');
      } catch (err) { 
        showNotification('error', '导入失败', '所选文件格式不正确或已损坏。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
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
          className="bg-zinc-50 dark:bg-zinc-950"
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color={theme === 'dark' ? '#3f3f46' : '#d1d5db'} 
          />
          <Controls className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-300 fill-zinc-800 dark:fill-zinc-300" />
        </ReactFlow>
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200 dark:border-zinc-800 p-2 rounded text-xs text-zinc-500 dark:text-zinc-400 shadow-xl flex items-center gap-3">
            <div className="flex items-center gap-3">
              <span>{resources.length} {t('sidebar.resources')}</span>
              <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
              <span>{recipes.length} {t('sidebar.recipes')}</span>
            </div>
            {syncSettings.enabled && (
              <>
                <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800 mx-1" />
                <div className="flex items-center" title={t('management.sync.status')}>
                  {syncStatus === 'success' ? (
                    <Wifi size={14} className="text-emerald-500 animate-pulse" />
                  ) : syncStatus === 'error' ? (
                    <WifiOff size={14} className="text-red-500" />
                  ) : (
                    <Wifi size={14} className="text-zinc-400 animate-pulse" />
                  )}
                </div>
              </>
            )}
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
        onDelete={handleDeleteRecipe}
      />

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-50 dark:bg-zinc-950 animate-in fade-in duration-200">
          <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-[#1a1a1c] border-b border-zinc-200 dark:border-zinc-800 shrink-0 shadow-sm z-20">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Database className="text-white" size={20} />
                </div>
                <h2 className="text-lg font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                  {t('management.title')}
                </h2>
              </div>
              
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

              <div className="flex items-center gap-6">
                <button 
                  onClick={handleExport} 
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-blue-600 transition-colors"
                >
                  <Download size={16} /> {t('common.export')}
                </button>
                <label 
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <Upload size={16} /> {t('common.import')}
                  <input type="file" onChange={handleImport} accept=".json" className="hidden" />
                </label>
                <button 
                  onClick={() => setIsCodeModalOpen(true)}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  <FileCode size={16} /> {t('management.generateFull')}
                </button>
              </div>
            </div>

            <button 
              onClick={() => setIsSettingsOpen(false)} 
              className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-300 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            >
              <X size={16} /> {t('common.cancel')}
            </button>
          </header>

          <main className="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-[#09090b]">
            <div className="flex-1 w-full max-w-7xl mx-auto px-8 py-8 flex flex-col overflow-hidden">
              <ResourceLibrary 
                resources={resources} categories={categories} machines={machines}
                onAddResource={addResource} onUpdateResource={updateResource} onDeleteResource={deleteResource}
                onAddCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory}
                onAddMachine={addMachine} onUpdateMachine={updateMachine} onDeleteMachine={deleteMachine}
              />
            </div>
          </main>
        </div>
      )}

      <CodeGeneratorModal 
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  const [locale, setLocale] = useState<Locale>('zh-CN');
  const t = (path: string) => {
    return path.split('.').reduce((obj, key) => (obj as any)?.[key], translations[locale]);
  };

  return (
    <ThemeProvider>
      <NotificationProvider>
        <ModpackProvider>
          <I18nContext.Provider value={{ locale, setLocale, t }}>
            <MainLayout />
          </I18nContext.Provider>
        </ModpackProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
