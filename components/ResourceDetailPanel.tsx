
import React, { useMemo } from 'react';
import { useModpack } from '../context/ModpackContext';
import { useI18n } from '../App';
import { Resource, Recipe, RecipeProcessor } from '../types';
import { Clipboard, Check } from 'lucide-react';

interface ResourceDetailPanelProps {
  resourceId: string;
  onEditRecipe: (id: string) => void;
}

const ResourceDetailPanel: React.FC<ResourceDetailPanelProps> = ({ resourceId, onEditRecipe }) => {
  const { resources, recipes, machines, categories, plugins } = useModpack();
  const { t } = useI18n();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const selectedResource = resources.find(r => r.id === resourceId);
  
  const related = useMemo(() => {
    if (!resourceId) return { asInput: [], asOutput: [] };
    return {
      asInput: recipes.filter(r => r.inputs.some(i => i.resourceId === resourceId)),
      asOutput: recipes.filter(r => r.outputs.some(o => o.resourceId === resourceId)),
    };
  }, [recipes, resourceId]);

  const activeProcessors = useMemo(() => {
    return plugins.flatMap(p => p.processors);
  }, [plugins]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const processRecipe = (recipe: Recipe, processor: RecipeProcessor): string => {
    const machine = machines.find(m => m.id === recipe.machineId);
    if (!machine) return "// Error: Machine not found";

    // If processor has a JS handler function, use it
    if (processor.handler && typeof processor.handler === 'function') {
        try {
            return processor.handler(recipe, machine, resources);
        } catch (e) {
            return `// Processor Error: ${e instanceof Error ? e.message : 'Unknown script error'}`;
        }
    }

    // Fallback to basic string template
    let output = processor.template || "";
    const inputNames = recipe.inputs.map(i => `"${resources.find(r => r.id === i.resourceId)?.name || i.resourceId}"`).join(', ');
    const outputNames = recipe.outputs.map(o => `"${resources.find(r => r.id === o.resourceId)?.name || o.resourceId}"`).join(', ');
    const inputIds = recipe.inputs.map(i => `"${i.resourceId}"`).join(', ');
    const outputIds = recipe.outputs.map(o => `"${o.resourceId}"`).join(', ');

    output = output.replace(/\{\{machine\}\}/g, machine.id);
    output = output.replace(/\{\{machine_name\}\}/g, machine.name);
    output = output.replace(/\{\{recipe_name\}\}/g, recipe.name);
    output = output.replace(/\{\{duration\}\}/g, String(recipe.duration || 100));
    output = output.replace(/\{\{inputs\}\}/g, `[${inputNames}]`);
    output = output.replace(/\{\{outputs\}\}/g, `[${outputNames}]`);
    output = output.replace(/\{\{input_ids\}\}/g, `[${inputIds}]`);
    output = output.replace(/\{\{output_ids\}\}/g, `[${outputIds}]`);

    return output;
  };

  if (!selectedResource) return null;

  const renderRecipeEntry = (recipe: Recipe) => {
    const machine = machines.find(m => m.id === recipe.machineId);
    const getResName = (id: string) => resources.find(r => r.id === id)?.name || id;

    return (
      <div key={recipe.id} className="bg-white dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-all group shadow-sm flex flex-col gap-4">
        <div onClick={() => onEditRecipe(recipe.id)} className="cursor-pointer">
          <div className="flex justify-between items-start mb-2">
            <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{recipe.name}</div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/50">{machine?.name || 'Unknown'}</div>
          </div>
          <div className="flex flex-col gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2 overflow-hidden"><span className="shrink-0 text-emerald-600 dark:text-emerald-500/80 font-bold uppercase tracking-tighter">IN:</span><span className="truncate opacity-80">{recipe.inputs.map(i => `${i.amount}x ${getResName(i.resourceId)}`).join(', ')}</span></div>
            <div className="flex items-center gap-2 overflow-hidden"><span className="shrink-0 text-orange-600 dark:text-orange-500/80 font-bold uppercase tracking-tighter">OUT:</span><span className="truncate opacity-80">{recipe.outputs.map(o => `${o.amount}x ${getResName(o.resourceId)}`).join(', ')}</span></div>
          </div>
        </div>
        {activeProcessors.length > 0 && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/50 space-y-3">
             <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{t('panel.generatedScripts')}</div>
             <div className="space-y-2">
               {activeProcessors.map(proc => {
                 const generated = processRecipe(recipe, proc);
                 return (
                   <div key={proc.id} className="relative group/code">
                      <pre className="bg-zinc-950 text-[10px] text-zinc-300 p-3 rounded-lg overflow-x-auto font-mono leading-relaxed border border-zinc-800 whitespace-pre-wrap">{generated}</pre>
                      <button onClick={() => copyToClipboard(generated, `${recipe.id}-${proc.id}`)} className="absolute top-2 right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-md transition-all opacity-0 group-hover/code:opacity-100" title={t('common.copy')}>{copiedId === `${recipe.id}-${proc.id}` ? <Check size={12} className="text-emerald-500" /> : <Clipboard size={12} />}</button>
                      <div className="absolute bottom-2 left-3 text-[8px] font-black text-zinc-600 uppercase tracking-tighter pointer-events-none">{proc.name}</div>
                   </div>
                 );
               })}
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl z-10 shrink-0 animate-in slide-in-from-right-full duration-300 overflow-hidden">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 shrink-0"><h2 className="font-bold text-lg text-zinc-900 dark:text-white truncate">{selectedResource.name}</h2></div>
      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
         <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-inner">
            <div className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase font-black tracking-widest mb-3">{t('common.metadata')}</div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center"><span className="text-xs text-zinc-500 font-medium">{t('common.type')}</span><span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-600/30">{categories.find(c => c.id === selectedResource.type)?.name || selectedResource.type}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-zinc-500 font-medium">{t('common.id')}</span><span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-[140px] opacity-70">{selectedResource.id}</span></div>
            </div>
         </div>
         <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2"><h3 className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t('panel.producedBy')}</h3><span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 px-2 py-0.5 rounded-full">{related.asOutput.length}</span></div>
            <div className="space-y-3">{related.asOutput.length > 0 ? related.asOutput.map(renderRecipeEntry) : <div className="text-xs text-zinc-400 italic px-2">{t('common.noResults')}</div>}</div>
         </div>
         <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2"><h3 className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t('panel.usedIn')}</h3><span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 px-2 py-0.5 rounded-full">{related.asInput.length}</span></div>
            <div className="space-y-3">{related.asInput.length > 0 ? related.asInput.map(renderRecipeEntry) : <div className="text-xs text-zinc-400 italic px-2">{t('common.noResults')}</div>}</div>
         </div>
      </div>
    </div>
  );
};

export default ResourceDetailPanel;
