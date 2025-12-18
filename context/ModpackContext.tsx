
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Resource, Recipe, ResourceCategory, MachineDefinition, SyncSettings, SyncStatus, ModpackData } from '../types';
import { INITIAL_MACHINES } from '../constants/machines';
import { useNotifications } from './NotificationContext';
import { getAllFromStore, saveToStore, deleteFromStore, clearStore } from '../utils/db';

interface ModpackContextType {
  categories: ResourceCategory[];
  resources: Resource[];
  recipes: Recipe[];
  machines: MachineDefinition[];
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Load from IndexedDB on startup
  useEffect(() => {
    const loadData = async () => {
      try {
        const [dbCats, dbRes, dbRecs, dbMacs] = await Promise.all([
          getAllFromStore<ResourceCategory>('categories'),
          getAllFromStore<Resource>('resources'),
          getAllFromStore<Recipe>('recipes'),
          getAllFromStore<MachineDefinition>('machines'),
        ]);

        if (dbCats.length > 0) setCategoriesState(dbCats);
        else {
          // Seed initial categories if DB is empty
          for (const cat of INITIAL_CATEGORIES) await saveToStore('categories', cat);
        }

        if (dbRes.length > 0) setResourcesState(dbRes);
        else {
          for (const res of INITIAL_RESOURCES) await saveToStore('resources', res);
        }

        if (dbMacs.length > 0) setMachinesState(dbMacs);
        else {
          for (const mac of INITIAL_MACHINES) await saveToStore('machines', mac);
        }

        if (dbRecs.length > 0) setRecipesState(dbRecs);

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load data from IndexedDB', error);
        setIsInitialized(true); // Proceed anyway with defaults
      }
    };

    loadData();
  }, []);

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
    broadcastState({ categories, resources, recipes, machines });
  }, [broadcastState, categories, resources, recipes, machines]);

  const wrapUpdate = useCallback((data: ModpackData) => {
    if (!isInternalChange.current) {
      broadcastState(data);
    }
  }, [broadcastState]);

  // Bulk update helpers for imports/sync
  const setCategories = useCallback((cats: ResourceCategory[]) => {
    setCategoriesState(cats);
    clearStore('categories').then(() => cats.forEach(c => saveToStore('categories', c)));
  }, []);

  const setResources = useCallback((res: Resource[]) => {
    setResourcesState(res);
    clearStore('resources').then(() => res.forEach(r => saveToStore('resources', r)));
  }, []);

  const setRecipes = useCallback((recs: Recipe[]) => {
    setRecipesState(recs);
    clearStore('recipes').then(() => recs.forEach(r => saveToStore('recipes', r)));
  }, []);

  const setMachines = useCallback((macs: MachineDefinition[]) => {
    setMachinesState(macs);
    clearStore('machines').then(() => macs.forEach(m => saveToStore('machines', m)));
  }, []);

  useEffect(() => {
    localStorage.setItem('sync_settings', JSON.stringify(syncSettings));
    
    if (syncSettings.enabled && syncSettings.apiUrl) {
      let socket: WebSocket | null = null;
      let wsUrl = syncSettings.apiUrl.trim();
      
      if (wsUrl.startsWith('http')) {
        wsUrl = wsUrl.replace(/^http/, 'ws');
      }
      
      if (!wsUrl) return;

      const connect = () => {
        setSyncStatus('syncing');
        try {
          socket = new WebSocket(wsUrl);
          ws.current = socket;

          socket.onopen = () => {
            if (ws.current !== socket) return;
            setSyncStatus('success');
            socket.send(JSON.stringify({
              type: 'AUTH',
              username: syncSettings.username,
              password: syncSettings.password
            }));
            showNotification('success', 'Real-time Sync Active', 'Connected to architectural server.');
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
                setTimeout(() => { isInternalChange.current = false; }, 100);
              }
            } catch (e) {
              console.error('Failed to parse WS message', e);
            }
          };

          socket.onclose = () => {
            if (ws.current === socket) {
              setSyncStatus('idle');
              ws.current = null;
            }
          };

          socket.onerror = () => {
            if (ws.current === socket) {
              setSyncStatus('error');
              showNotification('error', 'Connection Failed', 'Could not reach the synchronization server.');
            }
          };
        } catch (e) {
          setSyncStatus('error');
          console.error('WebSocket creation error:', e);
        }
      };

      connect();
      return () => {
        if (socket) {
          socket.close();
          if (ws.current === socket) ws.current = null;
        }
      };
    } else {
      setSyncStatus('idle');
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    }
  }, [syncSettings.enabled, syncSettings.apiUrl, syncSettings.username, syncSettings.password, showNotification, setCategories, setResources, setRecipes, setMachines]);

  // Operations
  const addResource = (res: Resource) => setResourcesState(prev => {
    const next = [...prev, res];
    saveToStore('resources', res);
    wrapUpdate({ categories, resources: next, recipes, machines });
    return next;
  });

  const updateResource = (res: Resource) => setResourcesState(prev => {
    const next = prev.map(r => r.id === res.id ? res : r);
    saveToStore('resources', res);
    wrapUpdate({ categories, resources: next, recipes, machines });
    return next;
  });

  const deleteResource = (id: string) => setResourcesState(prev => {
    const next = prev.filter(r => r.id !== id);
    deleteFromStore('resources', id);
    wrapUpdate({ categories, resources: next, recipes, machines });
    return next;
  });

  const addRecipe = (recipe: Recipe) => setRecipesState(prev => {
    const idx = prev.findIndex(r => r.id === recipe.id);
    const next = idx >= 0 ? prev.map((r, i) => i === idx ? recipe : r) : [...prev, recipe];
    saveToStore('recipes', recipe);
    wrapUpdate({ categories, resources, recipes: next, machines });
    return next;
  });

  const deleteRecipe = (id: string) => setRecipesState(prev => {
    const next = prev.filter(r => r.id !== id);
    deleteFromStore('recipes', id);
    wrapUpdate({ categories, resources, recipes: next, machines });
    return next;
  });

  const addCategory = (cat: ResourceCategory) => setCategoriesState(prev => {
    const next = [...prev, cat];
    saveToStore('categories', cat);
    wrapUpdate({ categories: next, resources, recipes, machines });
    return next;
  });

  const updateCategory = (cat: ResourceCategory) => setCategoriesState(prev => {
    const next = prev.map(c => c.id === cat.id ? cat : c);
    saveToStore('categories', cat);
    wrapUpdate({ categories: next, resources, recipes, machines });
    return next;
  });

  const deleteCategory = (id: string) => setCategoriesState(prev => {
    const next = prev.filter(c => c.id !== id);
    deleteFromStore('categories', id);
    wrapUpdate({ categories: next, resources, recipes, machines });
    return next;
  });

  const addMachine = (m: MachineDefinition) => setMachinesState(prev => {
    const next = [...prev, m];
    saveToStore('machines', m);
    wrapUpdate({ categories, resources, recipes, machines: next });
    return next;
  });

  const updateMachine = (m: MachineDefinition) => setMachinesState(prev => {
    const next = prev.map(old => old.id === m.id ? m : old);
    saveToStore('machines', m);
    wrapUpdate({ categories, resources, recipes, machines: next });
    return next;
  });

  const deleteMachine = (id: string) => setMachinesState(prev => {
    const next = prev.filter(m => m.id !== id);
    deleteFromStore('machines', id);
    wrapUpdate({ categories, resources, recipes, machines: next });
    return next;
  });

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <ModpackContext.Provider value={{
      categories, resources, recipes, machines, syncSettings, syncStatus,
      setCategories, setResources, setRecipes, setMachines, setSyncSettings,
      addResource, updateResource, deleteResource, addRecipe, deleteRecipe,
      addCategory, updateCategory, deleteCategory,
      addMachine, updateMachine, deleteMachine, triggerSync
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
