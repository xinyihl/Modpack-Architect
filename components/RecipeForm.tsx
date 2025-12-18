
import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, Search, X, Trash2 } from 'lucide-react';
import { Recipe, Resource, ResourceStack, MachineDefinition, MachineSlot } from '../types';
import { useI18n } from '../App';
import { useNotifications } from '../context/NotificationContext';

interface RecipeFormProps {
  resources: Resource[];
  machine: MachineDefinition;
  initialRecipe?: Recipe | null;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ resources, machine, initialRecipe, onSave, onCancel, onDelete }) => {
  const { t } = useI18n();
  const { showNotification } = useNotifications();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState<number>(100);
  
  const [inputs, setInputs] = useState<{ resourceId: string; amount: number }[]>([]);
  const [outputs, setOutputs] = useState<{ resourceId: string; amount: number }[]>([]);
  
  const [inputSearch, setInputSearch] = useState<string[]>([]);
  const [outputSearch, setOutputSearch] = useState<string[]>([]);
  const [activeSlot, setActiveSlot] = useState<{ type: 'input' | 'output', index: number } | null>(null);

  const containerRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const initStacks = (slots: MachineSlot[], existingStacks?: ResourceStack[]) => {
      return slots.map((slot, idx) => {
        const existing = existingStacks?.[idx];
        return {
          resourceId: existing?.resourceId || '',
          amount: existing?.amount || 0,
        };
      });
    };

    if (initialRecipe) {
      setName(initialRecipe.name);
      setDuration(initialRecipe.duration || 100);
      const inStacks = initStacks(machine.inputs, initialRecipe.inputs);
      const outStacks = initStacks(machine.outputs, initialRecipe.outputs);
      setInputs(inStacks);
      setOutputs(outStacks);
      
      setInputSearch(inStacks.map(s => resources.find(r => r.id === s.resourceId)?.name || ''));
      setOutputSearch(outStacks.map(s => resources.find(r => r.id === s.resourceId)?.name || ''));
    } else {
      setName('');
      setDuration(100);
      setInputs(initStacks(machine.inputs));
      setOutputs(initStacks(machine.outputs));
      setInputSearch(machine.inputs.map(() => ''));
      setOutputSearch(machine.outputs.map(() => ''));
    }
  }, [initialRecipe, resources, machine]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveSlot(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const allInputsFilled = machine.inputs.every((slot, idx) => slot.optional || inputs[idx].resourceId !== '');
    const allOutputsFilled = machine.outputs.every((slot, idx) => slot.optional || outputs[idx].resourceId !== '');

    if (!allInputsFilled || !allOutputsFilled) {
      showNotification('error', '验证失败', '请为所有非可选槽位选择资源。');
      return;
    }

    const recipe: Recipe = {
      id: initialRecipe ? initialRecipe.id : name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now(),
      name,
      machineId: machine.id,
      duration,
      inputs: inputs.map(i => ({ resourceId: i.resourceId, amount: i.amount })),
      outputs: outputs.map(o => ({ resourceId: o.resourceId, amount: o.amount })),
    };

    onSave(recipe);
    showNotification('success', '保存成功', `配方 "${name}" 已保存。`);
  };

  const updateStack = (index: number, field: string, value: any, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    setter(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const handleSelectResource = (slotType: 'input' | 'output', index: number, resource: Resource) => {
    if (slotType === 'input') {
      updateStack(index, 'resourceId', resource.id, setInputs);
      const newSearch = [...inputSearch];
      newSearch[index] = resource.name;
      setInputSearch(newSearch);
    } else {
      updateStack(index, 'resourceId', resource.id, setOutputs);
      const newSearch = [...outputSearch];
      newSearch[index] = resource.name;
      setOutputSearch(newSearch);
    }
    setActiveSlot(null);
  };

  const renderFixedSlots = (
    slots: MachineSlot[],
    stacks: { resourceId: string; amount: number }[], 
    searchTerms: string[],
    setSearchTerms: React.Dispatch<React.SetStateAction<string[]>>,
    setter: React.Dispatch<React.SetStateAction<any[]>>,
    type: 'input' | 'output',
    label: string,
    colorClass: string
  ) => (
    <div className="space-y-3">
      <label className={`text-[11px] font-black uppercase tracking-widest ${colorClass}`}>{label}</label>
      <div className="space-y-5">
        {slots.map((slot, idx) => {
          const searchTerm = searchTerms[idx] || '';
          const filteredResources = resources.filter(r => 
            r.type === slot.type && 
            (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             r.id.toLowerCase().includes(searchTerm.toLowerCase()))
          );

          return (
            <div key={idx} className="space-y-1.5 relative">
              <div className="flex justify-between items-center px-0.5">
                 <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                   {slot.label} ({slot.type}) {slot.optional && <span className="text-zinc-500 dark:text-zinc-600 ml-1 opacity-60">可选</span>}
                 </span>
              </div>
              <div className={`flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-900/40 rounded border transition-all ${
                activeSlot?.type === type && activeSlot?.index === idx 
                  ? 'border-blue-500 ring-1 ring-blue-500/20 bg-white dark:bg-zinc-900' 
                  : 'border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-300 dark:focus-within:border-zinc-700'
              }`}>
                <div className={`w-1 h-6 rounded-full shrink-0 ${
                   slot.type === 'energy' ? 'bg-yellow-500' : 
                   slot.type === 'fluid' ? 'bg-orange-500' : 
                   'bg-blue-500'
                }`} />
                
                <div className="flex-1 relative flex items-center gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    placeholder={t('form.resourceSearchPlaceholder').replace('{type}', slot.type)}
                    onFocus={() => setActiveSlot({ type, index: idx })}
                    onChange={(e) => {
                      const newSearch = [...searchTerms];
                      newSearch[idx] = e.target.value;
                      setSearchTerms(newSearch);
                      setActiveSlot({ type, index: idx });
                    }}
                    className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none border-none p-1 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-medium"
                  />
                  
                  {searchTerm && (
                    <button 
                      type="button" 
                      onClick={() => {
                        const newSearch = [...searchTerms];
                        newSearch[idx] = '';
                        setSearchTerms(newSearch);
                        updateStack(idx, 'resourceId', '', setter);
                      }}
                      className="text-zinc-400 dark:text-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-500 mr-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                  
                  {activeSlot?.type === type && activeSlot?.index === idx && (
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[240px] bg-white dark:bg-[#1e1e21] border border-zinc-200 dark:border-[#2d2d31] rounded-xl shadow-xl z-[100] max-h-52 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2.5 sticky top-0 bg-white dark:bg-[#1e1e21] border-b border-zinc-100 dark:border-[#2d2d31]/50 flex items-center gap-2">
                         <Search size={10} className="text-zinc-400 dark:text-zinc-500" />
                         <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-[0.1em]">{t('common.results')}</span>
                      </div>
                      {filteredResources.length > 0 ? (
                        filteredResources.map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectResource(type, idx, r)}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-[#2d2d31]/80 group flex flex-col transition-colors border-b border-zinc-100 dark:border-[#2d2d31]/20 last:border-none ${
                              stacks[idx]?.resourceId === r.id ? 'bg-blue-50 dark:bg-blue-600/10' : ''
                            }`}
                          >
                            <span className={`font-bold transition-colors ${stacks[idx]?.resourceId === r.id ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                              {r.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 opacity-70">
                              ID: {r.id}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-xs text-zinc-400 dark:text-zinc-500 text-center italic flex flex-col items-center gap-2">
                          <AlertCircle size={16} className="opacity-20" />
                          <span>{t('common.noResults')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
                
                <div className="flex items-center gap-1.5 shrink-0 px-1">
                  <input
                    type="number"
                    value={stacks[idx]?.amount || 0}
                    onChange={(e) => updateStack(idx, 'amount', Number(e.target.value), setter)}
                    className="w-8 bg-transparent border-none text-sm text-right focus:outline-none text-zinc-700 dark:text-zinc-300 font-mono p-0"
                  />
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-black uppercase tracking-tighter">QTY</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <form ref={containerRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/60 shadow-inner">
        <div className="w-12 h-12 bg-white dark:bg-zinc-950 rounded-lg flex items-center justify-center font-bold text-xl text-zinc-300 dark:text-zinc-700 border border-zinc-200 dark:border-zinc-900">
          {machine.name[0]}
        </div>
        <div>
          <h3 className="font-bold text-zinc-900 dark:text-white text-lg flex items-center gap-2">
            {machine.name}
            <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-bold uppercase border border-zinc-200 dark:border-zinc-700">{t('common.machine')}</span>
          </h3>
          <p className="text-xs text-zinc-500 opacity-80">{machine.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">{t('form.recipeId')}</label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-200 dark:placeholder:text-zinc-800 font-medium shadow-sm"
            placeholder={t('form.recipeIdPlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">{t('form.duration')}</label>
          <div className="relative">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono shadow-sm"
            />
            <span className="absolute right-3 top-3 text-[9px] font-black text-zinc-300 dark:text-zinc-600 tracking-wider">TICKS</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        <div>
          {renderFixedSlots(machine.inputs, inputs, inputSearch, setInputSearch, setInputs, 'input', t('form.inputs'), 'text-emerald-600 dark:text-emerald-500')}
        </div>
        <div>
          {renderFixedSlots(machine.outputs, outputs, outputSearch, setOutputSearch, setOutputs, 'output', t('form.outputs'), 'text-orange-600 dark:text-orange-500')}
        </div>
      </div>

      <div className="flex items-center gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 mt-4">
        {initialRecipe && onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm(t('common.confirmDelete'))) {
                onDelete(initialRecipe.id);
              }
            }}
            className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors px-2 mr-auto flex items-center gap-1.5 group"
          >
            <Trash2 size={16} className="group-hover:scale-110 transition-transform" /> {t('common.delete')}
          </button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors px-2"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-2.5 rounded-lg font-black text-sm flex items-center gap-3 transition-all shadow-md active:scale-[0.98]"
        >
          <Save size={18} strokeWidth={2.5} /> {initialRecipe ? t('common.update') : t('common.create')}
        </button>
      </div>

      {resources.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/20 rounded-lg text-[10px] text-yellow-700 dark:text-yellow-600 font-bold uppercase tracking-tight">
          <AlertCircle size={14} />
          <span>{t('form.emptyLibrary')}</span>
        </div>
      )}
    </form>
  );
};

export default RecipeForm;
