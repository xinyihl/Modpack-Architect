
import React, { useMemo } from 'react';
import { useModpack } from '../context/ModpackContext';
import { useI18n } from '../App';
import { Resource, Recipe } from '../types';

interface ResourceDetailPanelProps {
  resourceId: string;
  onEditRecipe: (id: string) => void;
}

const ResourceDetailPanel: React.FC<ResourceDetailPanelProps> = ({ resourceId, onEditRecipe }) => {
  const { resources, recipes, machines, categories } = useModpack();
  const { t } = useI18n();

  const selectedResource = resources.find(r => r.id === resourceId);
  
  const related = useMemo(() => {
    if (!resourceId) return { asInput: [], asOutput: [] };
    return {
      asInput: recipes.filter(r => r.inputs.some(i => i.resourceId === resourceId)),
      asOutput: recipes.filter(r => r.outputs.some(o => o.resourceId === resourceId)),
    };
  }, [recipes, resourceId]);

  if (!selectedResource) return null;

  const renderRecipeEntry = (recipe: Recipe) => {
    const machine = machines.find(m => m.id === recipe.machineId);
    const getResName = (id: string) => resources.find(r => r.id === id)?.name || id;

    return (
      <div 
        key={recipe.id} 
        onClick={() => onEditRecipe(recipe.id)} 
        className="bg-zinc-800/40 p-3 rounded-lg border border-zinc-800 hover:border-blue-600/50 hover:bg-zinc-800/80 transition-all cursor-pointer group"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="font-bold text-sm text-zinc-100 group-hover:text-blue-400 transition-colors">{recipe.name}</div>
          <div className="text-[9px] text-zinc-500 font-bold uppercase bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-700/50">
            {machine?.name || 'Unknown'}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 text-[10px] text-zinc-400">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="shrink-0 text-emerald-500/80 font-bold uppercase tracking-tighter">IN:</span>
            <span className="truncate opacity-80">{recipe.inputs.map(i => `${i.amount}x ${getResName(i.resourceId)}`).join(', ')}</span>
          </div>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="shrink-0 text-orange-500/80 font-bold uppercase tracking-tighter">OUT:</span>
            <span className="truncate opacity-80">{recipe.outputs.map(o => `${o.amount}x ${getResName(o.resourceId)}`).join(', ')}</span>
          </div>
        </div>
        <div className="mt-2.5 h-0.5 w-full bg-zinc-900 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500/40 group-hover:bg-blue-500/60" style={{ width: `${Math.min(100, (recipe.duration || 100) / 10)}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl z-10 shrink-0 animate-in slide-in-from-right-full duration-300">
      <div className="h-16 flex items-center px-6 border-b border-zinc-800 bg-zinc-800/50 shrink-0">
         <h2 className="font-bold text-lg text-white truncate">{selectedResource.name}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-8">
         <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 shadow-inner">
            <div className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-3">{t('common.metadata')}</div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-medium">{t('common.type')}</span>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-600/20 text-blue-400 border border-blue-600/30">
                  {categories.find(c => c.id === selectedResource.type)?.name || selectedResource.type}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-medium">{t('common.id')}</span>
                <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[140px] opacity-70">{selectedResource.id}</span>
              </div>
            </div>
         </div>
         <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">{t('panel.producedBy')}</h3>
              <span className="text-[10px] font-bold bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{related.asOutput.length}</span>
            </div>
            <div className="space-y-3">{related.asOutput.map(renderRecipeEntry)}</div>
         </div>
         <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">{t('panel.usedIn')}</h3>
              <span className="text-[10px] font-bold bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{related.asInput.length}</span>
            </div>
            <div className="space-y-3">{related.asInput.map(renderRecipeEntry)}</div>
         </div>
      </div>
    </div>
  );
};

export default ResourceDetailPanel;
