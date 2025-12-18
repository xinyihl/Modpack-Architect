
import React, { useState, useMemo } from 'react';
import { Plus, Search, Cpu, Filter, Languages, Settings, Sun, Moon } from 'lucide-react';
import { useModpack } from '../context/ModpackContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../App';

interface SidebarProps {
  onDefineRecipe: () => void;
  onEditRecipe: (id: string) => void;
  onOpenSettings: () => void;
  activeRecipeId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onDefineRecipe, onEditRecipe, onOpenSettings, activeRecipeId }) => {
  const { recipes, machines } = useModpack();
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const [search, setSearch] = useState('');
  const [machineFilter, setMachineFilter] = useState('all');

  const filtered = useMemo(() => {
    return recipes.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
      const matchesMachine = machineFilter === 'all' || r.machineId === machineFilter;
      return matchesSearch && matchesMachine;
    });
  }, [recipes, search, machineFilter]);

  return (
    <div className="flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-80 shrink-0 h-full transition-colors duration-300">
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">M</div>
          <span className="font-bold tracking-tight uppercase text-sm text-zinc-900 dark:text-zinc-100">Architect</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button 
            onClick={toggleTheme}
            className="p-2 text-zinc-500 hover:text-blue-500 dark:hover:text-white transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={() => setLocale(locale === 'en-US' ? 'zh-CN' : 'en-US')}
            className="p-2 text-zinc-500 hover:text-blue-500 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <Languages size={18} />
            <span className="text-[10px] font-bold">{locale === 'en-US' ? 'EN' : 'CN'}</span>
          </button>
          <button onClick={onOpenSettings} className="p-2 text-zinc-500 hover:text-blue-500 dark:hover:text-white transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="p-4 shrink-0">
        <button onClick={onDefineRecipe} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded shadow-lg flex items-center justify-center gap-2 font-medium transition-transform active:scale-95">
          <Plus size={18} /> {t('sidebar.defineRecipe')}
        </button>
      </div>
      
      <div className="px-4 pb-4 shrink-0 space-y-2 border-b border-zinc-100 dark:border-zinc-800/50 mb-2">
         <div className="relative">
            <Search className="absolute left-2 top-2.5 text-zinc-400 dark:text-zinc-500" size={14} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('sidebar.searchRecipesPlaceholder')} 
              className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded py-2 pl-8 pr-4 text-sm text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-blue-500 outline-none" 
            />
         </div>
         <div className="flex items-center gap-2">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded p-1.5 shrink-0">
              <Filter size={12} className="text-zinc-400 dark:text-zinc-500" />
            </div>
            <select 
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded py-1 px-3 text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400 focus:ring-1 focus:ring-blue-500 outline-none h-7 tracking-tighter"
            >
              <option value="all">{t('sidebar.allMachines').toUpperCase()}</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
            </select>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-2">
          {t('sidebar.definedRecipes')} ({filtered.length})
        </h3>
        <div className="space-y-1">
          {filtered.length > 0 ? filtered.map(recipe => (
            <div key={recipe.id} onClick={() => onEditRecipe(recipe.id)} className={`group p-2 rounded cursor-pointer border transition-colors ${activeRecipeId === recipe.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate pr-2">{recipe.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <Cpu size={10} className="text-zinc-400 dark:text-zinc-500" />
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
                    {machines.find(m => m.id === recipe.machineId)?.name || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-zinc-400 dark:text-zinc-600 text-xs italic">
              {t('common.noResults')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
