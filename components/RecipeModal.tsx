import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronRight, Cpu, Search } from 'lucide-react';
import { Recipe, Resource, MachineDefinition } from '../types';
import RecipeForm from './RecipeForm';
import { useI18n } from '../context/I18nContext';

interface RecipeModalProps {
  resources: Resource[];
  machines: MachineDefinition[];
  editingRecipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
  onDelete?: (id: string) => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ resources, machines, editingRecipe, isOpen, onClose, onSave, onDelete }) => {
  const { t } = useI18n();
  const [step, setStep] = useState<'select-machine' | 'config'>('select-machine');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [machineSearch, setMachineSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMachineSearch('');
      if (editingRecipe) {
        setStep('config');
        setSelectedMachineId(editingRecipe.machineId);
      } else {
        setStep('select-machine');
        setSelectedMachineId(null);
      }
    }
  }, [isOpen, editingRecipe]);

  const filteredMachines = useMemo(() => {
    return machines.filter(m => 
      m.name.toLowerCase().includes(machineSearch.toLowerCase()) || 
      m.id.toLowerCase().includes(machineSearch.toLowerCase())
    );
  }, [machines, machineSearch]);

  if (!isOpen) return null;

  const selectedMachine = machines.find(m => m.id === (selectedMachineId || editingRecipe?.machineId));

  const handleSelectMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setStep('config');
  };

  const handleReset = () => {
    if (editingRecipe) {
      onClose();
    } else {
      setStep('select-machine');
      setSelectedMachineId(null);
    }
  };

  const handleSave = (recipe: Recipe) => {
    onSave(recipe);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-transparent">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="bg-blue-600/10 p-2 rounded-lg">
                <Cpu size={18} className="text-blue-500" />
              </div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-widest">
                {editingRecipe ? t('modal.editRecipe') : t('modal.newRecipe')}
              </h2>
            </div>
            <div className="flex items-center gap-3 ml-0.5">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${step === 'select-machine' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-200 dark:bg-zinc-800/50 text-zinc-500'}`}>
                {t('modal.stepMachine')}
              </div>
              <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-700" />
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${step === 'config' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-200 dark:bg-zinc-800/50 text-zinc-500'}`}>
                {t('modal.stepConfig')}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all"><X size={24} /></button>
        </div>
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0c0c0e]/30">
          {step === 'select-machine' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
              <div className="text-center">
                <div className="relative max-w-md mx-auto">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={machineSearch}
                    onChange={(e) => setMachineSearch(e.target.value)}
                    placeholder={t('modal.searchMachinesPlaceholder')}
                    className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[52px] font-bold shadow-inner"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {filteredMachines.length > 0 ? filteredMachines.map((machine) => (
                  <button 
                    key={machine.id} 
                    onClick={() => handleSelectMachine(machine.id)} 
                    className={`flex items-start text-left gap-6 p-6 rounded-2xl border transition-all group relative overflow-hidden ${
                      selectedMachineId === machine.id 
                        ? 'bg-blue-600/5 dark:bg-blue-600/10 border-blue-500 shadow-2xl shadow-blue-600/5' 
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className={`p-4 rounded-xl transition-all duration-300 ${
                      selectedMachineId === machine.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}>
                      <Cpu size={28} />
                    </div>
                    <div>
                      <h4 className={`text-base font-black uppercase tracking-wide transition-colors ${selectedMachineId === machine.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>{machine.name}</h4>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium line-clamp-2 mt-1.5 leading-relaxed">{machine.description}</p>
                    </div>
                  </button>
                )) : (
                  <div className="col-span-full py-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <Cpu size={40} className="mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-black uppercase tracking-widest">{t('common.noResults')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {step === 'config' && selectedMachine && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-400">
              <RecipeForm resources={resources} machine={selectedMachine} initialRecipe={editingRecipe} onSave={handleSave} onCancel={handleReset} onDelete={handleDelete} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
