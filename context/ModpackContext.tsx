
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Resource, Recipe, ResourceCategory, MachineDefinition, SyncSettings, SyncStatus, ModpackData } from '../types';
import { INITIAL_MACHINES } from '../constants/machines';
import { useNotifications } from './NotificationContext';

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
  const [categories, setCategories] = useState<ResourceCategory[]>(INITIAL_CATEGORIES);
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [machines, setMachines] = useState<MachineDefinition[]>(INITIAL_MACHINES);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
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

  const broadcastState = useCallback((data: ModpackData) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'SYNC_STATE',
        data,
        sender: syncSettings.username,
        timestamp: new Date().toISOString()
      }));
    }
  }, [syncSettings.username]);

  // Handle local state updates and broadcast
  const wrapUpdate = useCallback((setter: any, data: ModpackData) => {
    if (!isInternalChange.current) {
      broadcastState(data);
    }
  }, [broadcastState]);

  useEffect(() => {
    localStorage.setItem('sync_settings', JSON.stringify(syncSettings));
    
    if (syncSettings.enabled && syncSettings.apiUrl) {
      const connect = () => {
        setSyncStatus('syncing');
        // Convert http/https URL to ws/wss if user provided a standard URL
        let wsUrl = syncSettings.apiUrl;
        if (wsUrl.startsWith('http')) {
          wsUrl = wsUrl.replace(/^http/, 'ws');
        }
        
        try {
          const socket = new WebSocket(wsUrl);
          ws.current = socket;

          socket.onopen = () => {
            setSyncStatus('success');
            // Immediate Auth
            socket.send(JSON.stringify({
              type: 'AUTH',
              username: syncSettings.username,
              password: syncSettings.password
            }));
            showNotification('success', 'Real-time Sync Active', 'Connected to architectural server.');
          };

          socket.onmessage = (event) => {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === 'SYNC_STATE') {
                isInternalChange.current = true;
                const remote: ModpackData = msg.data;
                setCategories(remote.categories);
                setResources(remote.resources);
                setRecipes(remote.recipes);
                setMachines(remote.machines);
                setTimeout(() => { isInternalChange.current = false; }, 50);
              }
            } catch (e) {
              console.error('Failed to parse WS message', e);
            }
          };

          socket.onclose = () => {
            setSyncStatus('idle');
            // Optional: Automatic reconnection logic
          };

          socket.onerror = () => {
            setSyncStatus('error');
            showNotification('error', 'Connection Failed', 'Could not reach the synchronization server.');
          };
        } catch (e) {
          setSyncStatus('error');
        }
      };

      connect();
      return () => {
        ws.current?.close();
      };
    }
  }, [syncSettings.enabled, syncSettings.apiUrl, syncSettings.username, syncSettings.password, showNotification]);

  const triggerSync = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      broadcastState({ categories, resources, recipes, machines });
    }
  };

  // Operations wrapped with broadcast logic
  const addResource = (res: Resource) => setResources(prev => {
    const next = [...prev, res];
    wrapUpdate(null, { categories, resources: next, recipes, machines });
    return next;
  });

  const updateResource = (res: Resource) => setResources(prev => {
    const next = prev.map(r => r.id === res.id ? res : r);
    wrapUpdate(null, { categories, resources: next, recipes, machines });
    return next;
  });

  const deleteResource = (id: string) => setResources(prev => {
    const next = prev.filter(r => r.id !== id);
    wrapUpdate(null, { categories, resources: next, recipes, machines });
    return next;
  });

  const addRecipe = (recipe: Recipe) => setRecipes(prev => {
    const idx = prev.findIndex(r => r.id === recipe.id);
    const next = idx >= 0 ? prev.map((r, i) => i === idx ? recipe : r) : [...prev, recipe];
    wrapUpdate(null, { categories, resources, recipes: next, machines });
    return next;
  });

  const deleteRecipe = (id: string) => setRecipes(prev => {
    const next = prev.filter(r => r.id !== id);
    wrapUpdate(null, { categories, resources, recipes: next, machines });
    return next;
  });

  const addCategory = (cat: ResourceCategory) => setCategories(prev => {
    const next = [...prev, cat];
    wrapUpdate(null, { categories: next, resources, recipes, machines });
    return next;
  });

  const updateCategory = (cat: ResourceCategory) => setCategories(prev => {
    const next = prev.map(c => c.id === cat.id ? cat : c);
    wrapUpdate(null, { categories: next, resources, recipes, machines });
    return next;
  });

  const deleteCategory = (id: string) => setCategories(prev => {
    const next = prev.filter(c => c.id !== id);
    wrapUpdate(null, { categories: next, resources, recipes, machines });
    return next;
  });

  const addMachine = (m: MachineDefinition) => setMachines(prev => {
    const next = [...prev, m];
    wrapUpdate(null, { categories, resources, recipes, machines: next });
    return next;
  });

  const updateMachine = (m: MachineDefinition) => setMachines(prev => {
    const next = prev.map(old => old.id === m.id ? m : old);
    wrapUpdate(null, { categories, resources, recipes, machines: next });
    return next;
  });

  const deleteMachine = (id: string) => setMachines(prev => {
    const next = prev.filter(m => m.id !== id);
    wrapUpdate(null, { categories, resources, recipes, machines: next });
    return next;
  });

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
