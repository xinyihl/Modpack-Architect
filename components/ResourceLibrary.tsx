import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { useModpack } from '../context/ModpackContext';
import { ResourceManager } from './library/ResourceManager';
import { CategoryManager } from './library/CategoryManager';
import { MachineManager } from './library/MachineManager';
import { PluginManager } from './library/PluginManager';
import { SyncManager } from './library/SyncManager';

const ResourceLibrary: React.FC = () => {
  const { t } = useI18n();
  const { 
    resources, categories, machines, 
    addResource, updateResource, deleteResource,
    addCategory, updateCategory, deleteCategory,
    addMachine, updateMachine, deleteMachine,
    syncSettings, syncStatus, setSyncSettings, triggerSync, 
    plugins, addPlugin, removePlugin 
  } = useModpack();
  
  const [activeTab, setActiveTab] = useState<'resources' | 'categories' | 'machines' | 'collaboration' | 'plugins'>('resources');

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
          <ResourceManager 
            resources={resources} categories={categories} 
            onAddResource={addResource} onUpdateResource={updateResource} onDeleteResource={deleteResource} 
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager 
            categories={categories} 
            onAddCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} 
          />
        )}

        {activeTab === 'machines' && (
          <MachineManager 
            machines={machines} categories={categories}
            onAddMachine={addMachine} onUpdateMachine={updateMachine} onDeleteMachine={deleteMachine} 
          />
        )}

        {activeTab === 'plugins' && (
          <PluginManager 
            plugins={plugins} addPlugin={addPlugin} removePlugin={removePlugin} 
          />
        )}

        {activeTab === 'collaboration' && (
          <SyncManager 
            syncSettings={syncSettings} syncStatus={syncStatus} 
            setSyncSettings={setSyncSettings} triggerSync={triggerSync} 
          />
        )}
      </div>
    </div>
  );
};

export default ResourceLibrary;