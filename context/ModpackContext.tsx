
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Resource, Recipe, ResourceCategory, MachineDefinition } from '../types';
import { INITIAL_MACHINES } from '../constants/machines';

interface ModpackContextType {
  categories: ResourceCategory[];
  resources: Resource[];
  recipes: Recipe[];
  machines: MachineDefinition[];
  setCategories: React.Dispatch<React.SetStateAction<ResourceCategory[]>>;
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  setMachines: React.Dispatch<React.SetStateAction<MachineDefinition[]>>;
  // Operations
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
}

const ModpackContext = createContext<ModpackContextType | undefined>(undefined);

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

export const ModpackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<ResourceCategory[]>(INITIAL_CATEGORIES);
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [machines, setMachines] = useState<MachineDefinition[]>(INITIAL_MACHINES);

  const addResource = (res: Resource) => setResources(prev => [...prev, res]);
  const updateResource = (res: Resource) => setResources(prev => prev.map(r => r.id === res.id ? res : r));
  const deleteResource = (id: string) => setResources(prev => prev.filter(r => r.id !== id));

  const addRecipe = (recipe: Recipe) => setRecipes(prev => {
    const idx = prev.findIndex(r => r.id === recipe.id);
    if (idx >= 0) {
      const copy = [...prev];
      copy[idx] = recipe;
      return copy;
    }
    return [...prev, recipe];
  });

  const deleteRecipe = (id: string) => setRecipes(prev => prev.filter(r => r.id !== id));

  const addCategory = (cat: ResourceCategory) => setCategories(prev => [...prev, cat]);
  const updateCategory = (cat: ResourceCategory) => setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
  const deleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));

  const addMachine = (m: MachineDefinition) => setMachines(prev => [...prev, m]);
  const updateMachine = (m: MachineDefinition) => setMachines(prev => prev.map(old => old.id === m.id ? m : old));
  const deleteMachine = (id: string) => setMachines(prev => prev.filter(m => m.id !== id));

  return (
    <ModpackContext.Provider value={{
      categories, resources, recipes, machines,
      setCategories, setResources, setRecipes, setMachines,
      addResource, updateResource, deleteResource, addRecipe, deleteRecipe,
      addCategory, updateCategory, deleteCategory,
      addMachine, updateMachine, deleteMachine
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
