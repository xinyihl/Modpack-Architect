
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLFormElement>(null);
  const slotRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isUserEditingName = useRef(false);

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
      isUserEditingName.current = true;
    } else {
      setName('');
      setDuration(100);
      setInputs(initStacks(machine.inputs));
      setOutputs(initStacks(machine.outputs));
      setInputSearch(machine.inputs.map(() => ''));
      setOutputSearch(machine.outputs.map(() => ''));
      isUserEditingName.current = false;
    }
  }, [initialRecipe, resources, machine]);

  useEffect(() => {
    if (activeSlot) {
      const key = `${activeSlot.type}-${activeSlot.index}`;
      const el = slotRefs.current.get(key);
      if (el) {
        const rect = el.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width
        });
      }
    }
  }, [activeSlot]);

  // Update position on scroll to keep dropdown attached to input
  useEffect(() => {
    const handleScroll = () => {
      if (activeSlot) {
        const key = `${activeSlot.type}-${activeSlot.index}`;
        const el = slotRefs.current.get(key);
        if (el) {
          const rect = el.getBoundingClientRect();
          setDropdownPos({
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width
          });
        }
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [activeSlot]);

  // Auto-generate name based on first input
  useEffect(() => {
    if (!initialRecipe && !isUserEditingName.current && inputs.length > 0) {
      const firstInputResId = inputs[0].resourceId;
      if (firstInputResId) {
        const res = resources.find(r => r.id === firstInputResId);
        if (res) {
          setName(`${machine.name} - ${res.name}`);
        }
      }
    }
  }, [inputs, machine.name, resources, initialRecipe]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const portal = document.getElementById('search-results-portal');
        if (portal && portal.contains(event.target as Node)) return;
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
    <div className="space-y-4">
      <label className={`text-[12px] font-black uppercase tracking-wider ${colorClass}`}>{label}</label>
      <div className="space-y-6">
        {slots.map((slot, idx) => {
          const searchTerm = searchTerms[idx] || '';
          const isActive = activeSlot?.type === type && activeSlot?.index === idx;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center px-0.5">
                 <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-tight">
                   {slot.label} ({slot.type}) {slot.optional && <span className="text-zinc-600 ml-1 opacity-60">可选</span>}
                 </span>
              </div>
              <div 
                ref={(el) => { if(el) slotRefs.current.set(`${type}-${idx}`, el); else slotRefs.current.delete(`${type}-${idx}`); }}
                className={`flex items-center gap-3 p-1.5 bg-zinc-950/40 rounded-xl border transition-all ${
                  isActive 
                    ? 'border-blue-500 ring-2 ring-blue-500/10 bg-zinc-900' 
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className={`w-1 h-8 rounded-full shrink-0 ml-1 ${
                   slot.type === 'energy' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]' : 
                   slot.type === 'fluid' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]' : 
                   'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
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
                    }}
                    className="flex-1 bg-transparent text-sm text-zinc-200 outline-none border-none p-1 placeholder:text-zinc-700 font-bold"
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
                      className="text-zinc-600 hover:text-zinc-400 mr-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="h-4 w-px bg-zinc-800 mx-1" />
                
                <div className="flex items-center gap-1.5 shrink-0 px-2">
                  <input
                    type="number"
                    value={stacks[idx]?.amount || 0}
                    onChange={(e) => updateStack(idx, 'amount', Number(e.target.value), setter)}
                    className="w-10 bg-transparent border-none text-sm text-right focus:outline-none text-zinc-300 font-mono font-bold p-0"
                  />
                  <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">QTY</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSearchResults = () => {
    if (!activeSlot) return null;
    const { type, index } = activeSlot;
    const slot = type === 'input' ? machine.inputs[index] : machine.outputs[index];
    const searchTerm = type === 'input' ? inputSearch[index] : outputSearch[index];
    const stacks = type === 'input' ? inputs : outputs;
    
    const filteredResources = resources.filter(r => 
      r.type === slot.type && 
      (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       r.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return createPortal(
      <div 
        id="search-results-portal"
        style={{ 
          position: 'fixed', 
          top: dropdownPos.top, 
          left: dropdownPos.left, 
          width: dropdownPos.width,
          zIndex: 9999
        }} 
        className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] max-h-56 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
      >
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800/50 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Search size={12} className="text-zinc-600" />
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{t('common.results')}</span>
           </div>
           <span className="text-[9px] text-zinc-700 font-bold uppercase">{filteredResources.length} Found</span>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {filteredResources.length > 0 ? (
            filteredResources.map(r => (
              <button
                key={r.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectResource(type, index, r)}
                className={`w-full text-left px-5 py-3 text-sm hover:bg-zinc-800 group flex flex-col transition-all border-b border-zinc-800/30 last:border-none ${
                  stacks[index]?.resourceId === r.id ? 'bg-blue-600/10' : ''
                }`}
              >
                <span className={`font-bold transition-colors ${stacks[index]?.resourceId === r.id ? 'text-blue-400' : 'text-zinc-200 group-hover:text-blue-400'}`}>
                  {r.name}
                </span>
                <span className="text-[11px] text-zinc-600 font-mono mt-0.5 uppercase tracking-tighter">
                  ID: {r.id}
                </span>
              </button>
            ))
          ) : (
            <div className="px-6 py-10 text-xs text-zinc-600 text-center italic flex flex-col items-center gap-3">
              <AlertCircle size={20} className="opacity-10" />
              <span>{t('common.noResults')}</span>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <form ref={containerRef} onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center gap-6 bg-zinc-950/40 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center font-black text-2xl text-zinc-700 border border-zinc-800 shadow-inner">
          {machine.name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-black text-white text-xl uppercase tracking-wide">
              {machine.name}
            </h3>
            <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-lg text-zinc-400 font-black uppercase border border-zinc-700 tracking-widest">{t('common.machine')}</span>
          </div>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">{machine.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="sm:col-span-2 space-y-2">
          <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t('form.recipeId')}</label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              isUserEditingName.current = true;
            }}
            className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-800 font-bold shadow-inner h-[52px]"
            placeholder={t('form.recipeIdPlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t('form.duration')}</label>
          <div className="relative">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-bold shadow-inner h-[52px]"
            />
            <span className="absolute right-4 top-4 text-[10px] font-black text-zinc-700 tracking-widest">TICKS</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pt-4">
        <div>
          {renderFixedSlots(machine.inputs, inputs, inputSearch, setInputSearch, setInputs, 'input', t('form.inputs'), 'text-emerald-500')}
        </div>
        <div>
          {renderFixedSlots(machine.outputs, outputs, outputSearch, setOutputSearch, setOutputs, 'output', t('form.outputs'), 'text-orange-500')}
        </div>
      </div>

      <div className="flex items-center gap-6 pt-10 border-t border-zinc-800 mt-4">
        {initialRecipe && onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm(t('common.confirmDelete'))) {
                onDelete(initialRecipe.id);
              }
            }}
            className="text-sm font-black text-red-500 hover:text-red-400 transition-all px-2 mr-auto flex items-center gap-2 group uppercase tracking-widest"
          >
            <Trash2 size={18} className="group-hover:scale-110 transition-transform" /> {t('common.delete')}
          </button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-black text-zinc-600 hover:text-zinc-300 transition-colors px-4 uppercase tracking-widest"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-3.5 rounded-xl font-black text-sm flex items-center gap-3 transition-all shadow-xl shadow-blue-600/10 active:scale-[0.98] uppercase tracking-widest"
        >
          <Save size={18} strokeWidth={2.5} /> {initialRecipe ? t('common.update') : t('common.create')}
        </button>
      </div>

      {resources.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-[11px] text-yellow-600 font-black uppercase tracking-widest">
          <AlertCircle size={18} />
          <span>{t('form.emptyLibrary')}</span>
        </div>
      )}

      {renderSearchResults()}
    </form>
  );
};

export default RecipeForm;
