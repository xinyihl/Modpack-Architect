
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

  // Capture current state for broadcast
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

  // Use current values if no data is passed (for manual trigger)
  const triggerSync = useCallback(() => {
    broadcastState({ categories, resources, recipes, machines });
  }, [broadcastState, categories, resources, recipes, machines]);

  // Handle local state updates and broadcast
  const wrapUpdate = useCallback((data: ModpackData) => {
    if (!isInternalChange.current) {
      broadcastState(data);
    }
  }, [broadcastState]);

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
                // Allow a small window for the state updates to settle before enabling broadcasts again
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
  }, [syncSettings.enabled, syncSettings.apiUrl, syncSettings.username, syncSettings.password, showNotification]);

  // Operations wrapped with broadcast logic
  const addResource = (res: Resource) => setResources(prev => {
    const next = [...prev, res];
    wrapUpdate({ categories, resources: next, recipes, machines });
    return next;
  });

  const updateResource = (res: Resource) => setResources(prev => {
    const next = prev.map(r => r.id === res.id ? res : r);
    wrapUpdate({ categories, resources: next, recipes, machines });
    return next;
  });

  const deleteResource = (id: string) => setResources(prev => {
    const next = prev.filter(r => r.id !== id);
    wrapUpdate({ categories, resources: next, recipes, machines });
    return next;
  });

  const addRecipe = (recipe: Recipe) => setRecipes(prev => {
    const idx = prev.findIndex(r => r.id === recipe.id);
    const next = idx >= 0 ? prev.map((r, i) => i === idx ? recipe : r) : [...prev, recipe];
    wrapUpdate({ categories, resources, recipes: next, machines });
    return next;
  });

  const deleteRecipe = (id: string) => setRecipes(prev => {
    const next = prev.filter(r => r.id !== id);
    wrapUpdate({ categories, resources, recipes: next, machines });
    return next;
  });

  const addCategory = (cat: ResourceCategory) => setCategories(prev => {
    const next = [...prev, cat];
    wrapUpdate({ categories: next, resources, recipes, machines });
    return next;
  });

  const updateCategory = (cat: ResourceCategory) => setCategories(prev => {
    const next = prev.map(c => c.id === cat.id ? cat : c);
    wrapUpdate({ categories: next, resources, recipes, machines });
    return next;
  });

  const deleteCategory = (id: string) => setCategories(prev => {
    const next = prev.filter(c => c.id !== id);
    wrapUpdate({ categories: next, resources, recipes, machines });
    return next;
  });

  const addMachine = (m: MachineDefinition) => setMachines(prev => {
    const next = [...prev, m];
    wrapUpdate({ categories, resources, recipes, machines: next });
    return next;
  });

  const updateMachine = (m: MachineDefinition) => setMachines(prev => {
    const next = prev.map(old => old.id === m.id ? m : old);
    wrapUpdate({ categories, resources, recipes, machines: next });
    return next;
  });

  const deleteMachine = (id: string) => setMachines(prev => {
    const next = prev.filter(m => m.id !== id);
    wrapUpdate({ categories, resources, recipes, machines: next });
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
