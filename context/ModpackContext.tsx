
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Resource, Recipe, ResourceCategory, MachineDefinition, SyncSettings, SyncStatus, ModpackData, Plugin, RecipeProcessor } from '../types';
import { INITIAL_MACHINES } from '../constants/machines';
import { useNotifications } from './NotificationContext';
import { getAllFromStore, saveToStore, deleteFromStore, clearStore } from '../utils/db';
import { translations } from '../translations';

interface ModpackContextType {
  categories: ResourceCategory[];
  resources: Resource[];
  recipes: Recipe[];
  machines: MachineDefinition[];
  plugins: Plugin[];
  syncSettings: SyncSettings;
  syncStatus: SyncStatus;
  setCategories: (c: ResourceCategory[]) => void;
  setResources: (r: Resource[]) => void;
  setRecipes: (r: Recipe[]) => void;
  setMachines: (m: MachineDefinition[]) => void;
  setSyncSettings: (s: SyncSettings) => void;
  addResource: (res: Resource) => void;
  updateResource: (res: Resource) => void;
  deleteResource: (id: string) => void;
  addRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  addCategory: (cat: ResourceCategory) => void;
  updateCategory: (cat: ResourceCategory) => void;
  deleteCategory: (id: string) => void;
  addMachine: (m: MachineDefinition) => void;
  updateMachine: (m: MachineDefinition) => void;
  deleteMachine: (id: string) => void;
  addPlugin: (script: string) => void;
  removePlugin: (id: string) => void;
  triggerSync: () => void;
}

const ModpackContext = createContext<ModpackContextType | undefined>(undefined);

const INITIAL_CATEGORIES: ResourceCategory[] = [
  { id: 'item', name: 'Items', color: '#3b82f6', iconType: 'box' },
  { id: 'fluid', name: 'Fluids', color: '#f97316', iconType: 'droplet' },
  { id: 'energy', name: 'Energy', color: '#eab308', iconType: 'zap' },
];

const INITIAL_RESOURCES: Resource[] = [
  { id: 'iron_ore', name: 'Iron Ore', type: 'item', hidden: false },
  { id: 'iron_ingot', name: 'Iron Ingot', type: 'item', hidden: false },
  { id: 'energy', name: 'FE Energy', type: 'energy', hidden: true },
];

export const ModpackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showNotification } = useNotifications();
  const [categories, setCategoriesState] = useState<ResourceCategory[]>(INITIAL_CATEGORIES);
  const [resources, setResourcesState] = useState<Resource[]>(INITIAL_RESOURCES);
  const [recipes, setRecipesState] = useState<Recipe[]>([]);
  const [machines, setMachinesState] = useState<MachineDefinition[]>(INITIAL_MACHINES);
  const [plugins, setPluginsState] = useState<Plugin[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper to get localized text manually for context
  const getLocale = useCallback(() => {
     // Default to zh-CN if can't find. Simplified for this app.
     return (document.documentElement.lang || 'zh-CN') as 'en-US' | 'zh-CN';
  }, []);

  const [syncSettings, setSyncSettings] = useState<SyncSettings>(() => {
    const saved = localStorage.getItem('sync_settings');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      apiUrl: '',
      username: '',
      password: '',
      syncInterval: 30
    };
  });

  const ws = useRef<WebSocket | null>(null);
  const isInternalChange = useRef(false);

  // Helper to evaluate plugin script safely
  const evaluatePlugin = useCallback((script: string): Plugin | null => {
    try {
      const factory = new Function(script);
      const result = factory();
      if (result && result.id && result.name && Array.isArray(result.machines) && Array.isArray(result.processors)) {
        return { ...result, scriptContent: script };
      }
      throw new Error("Invalid plugin structure. Ensure it returns an object with id, name, machines, and processors.");
    } catch (e) {
      showNotification('error', 'Plugin Error', e instanceof Error ? e.message : 'Unknown script error');
      return null;
    }
  }, [showNotification]);

  // Load from IndexedDB on startup
  useEffect(() => {
    const loadData = async () => {
      try {
        const [dbCats, dbRes, dbRecs, dbMacs, dbPlugins] = await Promise.all([
          getAllFromStore<ResourceCategory>('categories'),
          getAllFromStore<Resource>('resources'),
          getAllFromStore<Recipe>('recipes'),
          getAllFromStore<MachineDefinition>('machines'),
          getAllFromStore<Plugin>('plugins'),
        ]);

        if (dbCats.length > 0) setCategoriesState(dbCats);
        else for (const cat of INITIAL_CATEGORIES) await saveToStore('categories', cat);

        if (dbRes.length > 0) setResourcesState(dbRes);
        else for (const res of INITIAL_RESOURCES) await saveToStore('resources', res);

        if (dbMacs.length > 0) setMachinesState(dbMacs);
        else for (const mac of INITIAL_MACHINES) await saveToStore('machines', mac);

        if (dbRecs.length > 0) setRecipesState(dbRecs);

        const evaluatedPlugins: Plugin[] = [];
        dbPlugins.forEach(p => {
          const evaled = evaluatePlugin(p.scriptContent);
          if (evaled) evaluatedPlugins.push(evaled);
        });
        setPluginsState(evaluatedPlugins);

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load data', error);
        setIsInitialized(true); 
      }
    };

    loadData();
  }, [evaluatePlugin]);

  const broadcastState = useCallback((data: ModpackData) => {
    const socket = ws.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'SYNC_STATE',
        data,
        sender: syncSettings.username,
        timestamp: new Date().toISOString()
      }));
    }
  }, [syncSettings.username]);

  const triggerSync = useCallback(() => {
    broadcastState({ categories, resources, recipes, machines, plugins });
  }, [broadcastState, categories, resources, recipes, machines, plugins]);

  const wrapUpdate = useCallback((data: ModpackData) => {
    if (!isInternalChange.current) {
      broadcastState(data);
    }
  }, [broadcastState]);

  // Setters
  const setCategories = (cats: ResourceCategory[]) => {
    setCategoriesState(cats);
    clearStore('categories').then(() => cats.forEach(c => saveToStore('categories', c)));
  };
  const setResources = (res: Resource[]) => {
    setResourcesState(res);
    clearStore('resources').then(() => res.forEach(r => saveToStore('resources', r)));
  };
  const setRecipes = (recs: Recipe[]) => {
    setRecipesState(recs);
    clearStore('recipes').then(() => recs.forEach(r => saveToStore('recipes', r)));
  };
  const setMachines = (macs: MachineDefinition[]) => {
    setMachinesState(macs);
    clearStore('machines').then(() => macs.forEach(m => saveToStore('machines', m)));
  };

  // Operations
  const addResource = (res: Resource) => setResourcesState(prev => {
    const next = [...prev, res];
    saveToStore('resources', res);
    wrapUpdate({ categories, resources: next, recipes, machines, plugins });
    return next;
  });

  const updateResource = (res: Resource) => setResourcesState(prev => {
    const next = prev.map(r => r.id === res.id ? res : r);
    saveToStore('resources', res);
    wrapUpdate({ categories, resources: next, recipes, machines, plugins });
    return next;
  });

  const deleteResource = (id: string) => {
    const usedInRecipes = recipes.filter(r => 
      r.inputs.some(i => i.resourceId === id) || 
      r.outputs.some(o => o.resourceId === id)
    );

    if (usedInRecipes.length > 0) {
      const msg = translations[getLocale()].management.errors.resourceUsed.replace('{count}', String(usedInRecipes.length));
      showNotification('error', 'Action Blocked', msg);
      return;
    }

    setResourcesState(prev => {
      const next = prev.filter(r => r.id !== id);
      deleteFromStore('resources', id);
      wrapUpdate({ categories, resources: next, recipes, machines, plugins });
      return next;
    });
  };

  const addRecipe = (recipe: Recipe) => setRecipesState(prev => {
    const idx = prev.findIndex(r => r.id === recipe.id);
    const next = idx >= 0 ? prev.map((r, i) => i === idx ? recipe : r) : [...prev, recipe];
    saveToStore('recipes', recipe);
    wrapUpdate({ categories, resources, recipes: next, machines, plugins });
    return next;
  });

  const deleteRecipe = (id: string) => setRecipesState(prev => {
    const next = prev.filter(r => r.id !== id);
    deleteFromStore('recipes', id);
    wrapUpdate({ categories, resources, recipes: next, machines, plugins });
    return next;
  });

  const addCategory = (cat: ResourceCategory) => setCategoriesState(prev => {
    const next = [...prev, cat];
    saveToStore('categories', cat);
    wrapUpdate({ categories: next, resources, recipes, machines, plugins });
    return next;
  });

  const updateCategory = (cat: ResourceCategory) => setCategoriesState(prev => {
    const next = prev.map(c => c.id === cat.id ? cat : c);
    saveToStore('categories', cat);
    wrapUpdate({ categories: next, resources, recipes, machines, plugins });
    return next;
  });

  const deleteCategory = (id: string) => {
    const resourcesUsing = resources.filter(r => r.type === id);
    const machinesUsing = machines.filter(m => 
      m.inputs.some(i => i.type === id) || 
      m.outputs.some(o => o.type === id)
    );

    if (resourcesUsing.length > 0 || machinesUsing.length > 0) {
      const count = resourcesUsing.length + machinesUsing.length;
      const msg = translations[getLocale()].management.errors.categoryUsed.replace('{count}', String(count));
      showNotification('error', 'Action Blocked', msg);
      return;
    }

    setCategoriesState(prev => {
      const next = prev.filter(c => c.id !== id);
      deleteFromStore('categories', id);
      wrapUpdate({ categories: next, resources, recipes, machines, plugins });
      return next;
    });
  };

  const addMachine = (m: MachineDefinition) => setMachinesState(prev => {
    const next = [...prev, m];
    saveToStore('machines', m);
    wrapUpdate({ categories, resources, recipes, machines: next, plugins });
    return next;
  });

  const updateMachine = (m: MachineDefinition) => setMachinesState(prev => {
    const next = prev.map(old => old.id === m.id ? m : old);
    saveToStore('machines', m);
    wrapUpdate({ categories, resources, recipes, machines: next, plugins });
    return next;
  });

  const deleteMachine = (id: string) => {
    const recipesUsing = recipes.filter(r => r.machineId === id);
    
    if (recipesUsing.length > 0) {
      const msg = translations[getLocale()].management.errors.machineUsed.replace('{count}', String(recipesUsing.length));
      showNotification('error', 'Action Blocked', msg);
      return;
    }

    setMachinesState(prev => {
      const next = prev.filter(m => m.id !== id);
      deleteFromStore('machines', id);
      wrapUpdate({ categories, resources, recipes, machines: next, plugins });
      return next;
    });
  };

  // Plugin System logic
  const addPlugin = (script: string) => {
    const plugin = evaluatePlugin(script);
    if (!plugin) return;

    setPluginsState(prev => {
      const filtered = prev.filter(p => p.id !== plugin.id);
      const next = [...filtered, plugin];
      saveToStore('plugins', { id: plugin.id, scriptContent: script });

      setMachinesState(mPrev => {
        const mNext = [...mPrev];
        plugin.machines.forEach(pm => {
          const idx = mNext.findIndex(existing => existing.id === pm.id);
          if (idx >= 0) mNext[idx] = pm;
          else mNext.push(pm);
          saveToStore('machines', pm);
        });
        return mNext;
      });

      wrapUpdate({ categories, resources, recipes, machines, plugins: next });
      return next;
    });
    showNotification('success', 'Plugin Loaded', `Successfully compiled plugin: ${plugin.name}`);
  };

  const removePlugin = (id: string) => {
    setPluginsState(prev => {
      const next = prev.filter(p => p.id !== id);
      deleteFromStore('plugins', id);
      wrapUpdate({ categories, resources, recipes, machines, plugins: next });
      return next;
    });
    showNotification('info', 'Plugin Uninstalled', 'Processors removed.');
  };

  useEffect(() => {
    localStorage.setItem('sync_settings', JSON.stringify(syncSettings));
    if (syncSettings.enabled && syncSettings.apiUrl) {
      let socket: WebSocket | null = null;
      let wsUrl = syncSettings.apiUrl.trim();
      if (wsUrl.startsWith('http')) wsUrl = wsUrl.replace(/^http/, 'ws');
      if (!wsUrl) return;

      const connect = () => {
        setSyncStatus('syncing');
        try {
          socket = new WebSocket(wsUrl);
          ws.current = socket;
          socket.onopen = () => {
            if (ws.current !== socket) return;
            setSyncStatus('success');
            socket.send(JSON.stringify({ type: 'AUTH', username: syncSettings.username, password: syncSettings.password }));
          };
          socket.onmessage = (event) => {
            if (ws.current !== socket) return;
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === 'SYNC_STATE' && msg.data) {
                isInternalChange.current = true;
                const remote: ModpackData = msg.data;
                setCategories(remote.categories);
                setResources(remote.resources);
                setRecipes(remote.recipes);
                setMachines(remote.machines);
                if (remote.plugins) {
                    const evaled = remote.plugins.map(p => evaluatePlugin(p.scriptContent)).filter(Boolean) as Plugin[];
                    setPluginsState(evaled);
                }
                setTimeout(() => { isInternalChange.current = false; }, 100);
              }
            } catch (e) { console.error('WS Error', e); }
          };
          socket.onclose = () => { if (ws.current === socket) { setSyncStatus('idle'); ws.current = null; } };
          socket.onerror = () => { if (ws.current === socket) { setSyncStatus('error'); showNotification('error', 'Connection Failed', 'Could not reach server.'); } };
        } catch (e) { setSyncStatus('error'); }
      };
      connect();
      return () => { if (socket) socket.close(); };
    } else {
      setSyncStatus('idle');
      if (ws.current) ws.current.close();
    }
  }, [syncSettings.enabled, syncSettings.apiUrl, syncSettings.username, syncSettings.password, showNotification, evaluatePlugin]);

  if (!isInitialized) return null;

  return (
    <ModpackContext.Provider value={{
      categories, resources, recipes, machines, plugins, syncSettings, syncStatus,
      setCategories, setResources, setRecipes, setMachines, setSyncSettings,
      addResource, updateResource, deleteResource, addRecipe, deleteRecipe,
      addCategory, updateCategory, deleteCategory,
      addMachine, updateMachine, deleteMachine,
      addPlugin, removePlugin, triggerSync
    }}>
      {children}
    </ModpackContext.Provider>
  );
};

export const useModpack = () => {
  const context = useContext(ModpackContext);
  if (!context) throw new Error("useModpack must be used within ModpackProvider");
  return context;
};
