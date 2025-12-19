
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Resource, Recipe, ResourceCategory, MachineDefinition, SyncSettings, SyncStatus, ModpackData, Plugin, RecipeProcessor } from '../types';
import { INITIAL_MACHINES } from '../constants/machines';
import { useNotifications } from './NotificationContext';
import { getAllFromStore, saveToStore, deleteFromStore, clearStore } from '../utils/db';
import { translations } from '../i18n/translations';

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
  const [pluginsState, setPluginsState] = useState<Plugin[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isInitialized, setIsInitialized] = useState(false);

  // 定义内置的标准导出插件
  const builtInPlugin = useMemo((): Plugin => ({
    id: 'builtin-standard',
    name: '内置标准导出器',
    description: '通用的脚本/JSON 导出方案，支持所有已注册机器。',
    version: '1.0.0',
    scriptContent: '',
    machines: [],
    processors: machines.map(m => ({
        id: `builtin-${m.id}`,
        name: `${m.name} 处理程序`,
        description: `针对 ${m.name} 的标准导出逻辑`,
        machineId: m.id,
        handler: (recipe: Recipe, machine: MachineDefinition, resources: Resource[]) => {
            const getResName = (id: string) => resources.find(r => r.id === id)?.name || id;
            const inputs = recipe.inputs.map(i => `"${getResName(i.resourceId)}" (${i.amount})`).join(', ');
            const outputs = recipe.outputs.map(o => `"${getResName(o.resourceId)}" (${o.amount})`).join(', ');
            return `// 配方: ${recipe.name}\n// 机器: ${machine.name}\nrecipe.add("${machine.id}", [${outputs}], [${inputs}], ${recipe.duration || 100});`;
        }
    }))
  }), [machines]);

  const plugins = useMemo(() => [builtInPlugin, ...pluginsState], [builtInPlugin, pluginsState]);

  const getLocale = useCallback(() => {
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

  const evaluatePlugin = useCallback((script: string): Plugin | null => {
    try {
      if (!script) return null;
      const factory = new Function(script);
      const result = factory();
      if (result && result.id && result.name && Array.isArray(result.machines) && Array.isArray(result.processors)) {
        return { ...result, scriptContent: script };
      }
      return null;
    } catch (e) {
      console.error('Plugin compilation failed', e);
      return null;
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dbCats, dbRes, dbRecs, dbMacs, dbPlugins] = await Promise.all([
          getAllFromStore<ResourceCategory>('categories'),
          getAllFromStore<Resource>('resources'),
          getAllFromStore<Recipe>('recipes'),
          getAllFromStore<MachineDefinition>('machines'),
          getAllFromStore<any>('plugins'),
        ]);

        if (dbCats.length > 0) setCategoriesState(dbCats);
        if (dbRes.length > 0) setResourcesState(dbRes);
        if (dbMacs.length > 0) setMachinesState(dbMacs);
        if (dbRecs.length > 0) setRecipesState(dbRecs);

        const evaluated: Plugin[] = [];
        dbPlugins.forEach(p => {
          const evaled = evaluatePlugin(p.scriptContent);
          if (evaled) evaluated.push(evaled);
        });
        setPluginsState(evaluated);
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
    broadcastState({ categories, resources, recipes, machines, plugins: pluginsState });
  }, [broadcastState, categories, resources, recipes, machines, pluginsState]);

  const wrapUpdate = useCallback((data: ModpackData) => {
    if (!isInternalChange.current) broadcastState(data);
  }, [broadcastState]);

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

  const addResource = (res: Resource) => setResourcesState(prev => {
    const next = [...prev, res];
    saveToStore('resources', res);
    wrapUpdate({ categories, resources: next, recipes, machines, plugins: pluginsState });
    return next;
  });

  const updateResource = (res: Resource) => setResourcesState(prev => {
    const next = prev.map(r => r.id === res.id ? res : r);
    saveToStore('resources', res);
    wrapUpdate({ categories, resources: next, recipes, machines, plugins: pluginsState });
    return next;
  });

  const deleteResource = (id: string) => {
    const used = recipes.filter(r => r.inputs.some(i => i.resourceId === id) || r.outputs.some(o => o.resourceId === id));
    if (used.length > 0) {
      const currentLocale = getLocale();
      showNotification('error', '操作受阻', translations[currentLocale].management.errors.resourceUsed.replace('{count}', String(used.length)));
      return;
    }
    setResourcesState(prev => {
      const next = prev.filter(r => r.id !== id);
      deleteFromStore('resources', id);
      wrapUpdate({ categories, resources: next, recipes, machines, plugins: pluginsState });
      return next;
    });
  };

  const addRecipe = (recipe: Recipe) => setRecipesState(prev => {
    const idx = prev.findIndex(r => r.id === recipe.id);
    const next = idx >= 0 ? prev.map((r, i) => i === idx ? recipe : r) : [...prev, recipe];
    saveToStore('recipes', recipe);
    wrapUpdate({ categories, resources, recipes: next, machines, plugins: pluginsState });
    return next;
  });

  const deleteRecipe = (id: string) => setRecipesState(prev => {
    const next = prev.filter(r => r.id !== id);
    deleteFromStore('recipes', id);
    wrapUpdate({ categories, resources, recipes: next, machines, plugins: pluginsState });
    return next;
  });

  const addCategory = (cat: ResourceCategory) => setCategoriesState(prev => {
    const next = [...prev, cat];
    saveToStore('categories', cat);
    wrapUpdate({ categories: next, resources, recipes, machines, plugins: pluginsState });
    return next;
  });

  const updateCategory = (cat: ResourceCategory) => setCategoriesState(prev => {
    const next = prev.map(c => c.id === cat.id ? cat : c);
    saveToStore('categories', cat);
    wrapUpdate({ categories: next, resources, recipes, machines, plugins: pluginsState });
    return next;
  });

  const deleteCategory = (id: string) => {
    const rU = resources.filter(r => r.type === id);
    const mU = machines.filter(m => m.inputs.some(i => i.type === id) || m.outputs.some(o => o.type === id));
    if (rU.length > 0 || mU.length > 0) {
      const currentLocale = getLocale();
      showNotification('error', '操作受阻', translations[currentLocale].management.errors.categoryUsed.replace('{count}', String(rU.length + mU.length)));
      return;
    }
    setCategoriesState(prev => {
      const next = prev.filter(c => c.id !== id);
      deleteFromStore('categories', id);
      wrapUpdate({ categories: next, resources, recipes, machines, plugins: pluginsState });
      return next;
    });
  };

  const addMachine = (m: MachineDefinition) => setMachinesState(prev => {
    const next = [...prev, m];
    saveToStore('machines', m);
    wrapUpdate({ categories, resources, recipes, machines: next, plugins: pluginsState });
    return next;
  });

  const updateMachine = (m: MachineDefinition) => setMachinesState(prev => {
    const next = prev.map(old => old.id === m.id ? m : old);
    saveToStore('machines', m);
    wrapUpdate({ categories, resources, recipes, machines: next, plugins: pluginsState });
    return next;
  });

  const deleteMachine = (id: string) => {
    const used = recipes.filter(r => r.machineId === id);
    if (used.length > 0) {
      const currentLocale = getLocale();
      showNotification('error', '操作受阻', translations[currentLocale].management.errors.machineUsed.replace('{count}', String(used.length)));
      return;
    }
    setMachinesState(prev => {
      const next = prev.filter(m => m.id !== id);
      deleteFromStore('machines', id);
      wrapUpdate({ categories, resources, recipes, machines: next, plugins: pluginsState });
      return next;
    });
  };

  const addPlugin = (script: string) => {
    const plugin = evaluatePlugin(script);
    if (!plugin) {
      showNotification('error', '加载失败', '插件脚本无效或格式不正确。');
      return;
    }
    setPluginsState(prev => {
      const next = [...prev.filter(p => p.id !== plugin.id), plugin];
      saveToStore('plugins', { id: plugin.id, scriptContent: script });
      setMachinesState(mPrev => {
        const mNext = [...mPrev];
        plugin.machines.forEach(pm => {
          const idx = mNext.findIndex(ex => ex.id === pm.id);
          if (idx >= 0) mNext[idx] = pm; else mNext.push(pm);
          saveToStore('machines', pm);
        });
        return mNext;
      });
      return next;
    });
    showNotification('success', '插件已加载', `成功导入插件: ${plugin.name}`);
  };

  const removePlugin = (id: string) => {
    setPluginsState(prev => {
      const next = prev.filter(p => p.id !== id);
      deleteFromStore('plugins', id);
      return next;
    });
    showNotification('info', '插件已卸载', '相关的处理器已被移除。');
  };

  useEffect(() => {
    localStorage.setItem('sync_settings', JSON.stringify(syncSettings));
    if (syncSettings.enabled && syncSettings.apiUrl) {
      let wsUrl = syncSettings.apiUrl.trim().replace(/^http/, 'ws');
      try {
        const socket = new WebSocket(wsUrl);
        ws.current = socket;
        socket.onopen = () => {
          setSyncStatus('success');
          socket.send(JSON.stringify({ type: 'AUTH', username: syncSettings.username, password: syncSettings.password }));
        };
        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'SYNC_STATE' && msg.data) {
              isInternalChange.current = true;
              const remote: ModpackData = msg.data;
              setCategoriesState(remote.categories);
              setResourcesState(remote.resources);
              setRecipesState(remote.recipes);
              setMachinesState(remote.machines);
              if (remote.plugins) {
                setPluginsState(remote.plugins.map(p => evaluatePlugin(p.scriptContent)).filter(Boolean) as Plugin[]);
              }
              setTimeout(() => { isInternalChange.current = false; }, 100);
            }
          } catch (e) { console.error('WS Sync Error', e); }
        };
        socket.onerror = () => { setSyncStatus('error'); };
        socket.onclose = () => { setSyncStatus('idle'); ws.current = null; };
        return () => socket.close();
      } catch (e) { console.error(e); }
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
