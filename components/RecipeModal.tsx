
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Cpu } from 'lucide-react';
import { Recipe, Resource, MachineDefinition } from '../types';
import RecipeForm from './RecipeForm';
import { useI18n } from '../App';

interface RecipeModalProps {
  resources: Resource[];
  machines: MachineDefinition[];
  editingRecipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ resources, machines, editingRecipe, isOpen, onClose, onSave }) => {
  const { t } = useI18n();
  const [step, setStep] = useState<'select-machine' | 'config'>('select-machine');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingRecipe) {
        setStep('config');
        setSelectedMachineId(editingRecipe.machineId);
      } else {
        setStep('select-machine');
        setSelectedMachineId(null);
      }
    }
  }, [isOpen, editingRecipe]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {editingRecipe ? t('modal.editRecipe') : t('modal.newRecipe')}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${step === 'select-machine' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                {t('modal.stepMachine')}
              </span>
              <ChevronRight size={12} className="text-zinc-300 dark:text-zinc-700" />
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${step === 'config' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                {t('modal.stepConfig')}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {step === 'select-machine' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center space-y-2"><h3 className="text-zinc-500 dark:text-zinc-400 font-medium italic text-sm">{t('modal.selectMachinePrompt')}</h3></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {machines.map((machine) => (
                  <button key={machine.id} onClick={() => handleSelectMachine(machine.id)} className={`flex items-start text-left gap-4 p-4 rounded-xl border transition-all group ${selectedMachineId === machine.id ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/20 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                    <div className={`p-3 rounded-lg transition-colors ${selectedMachineId === machine.id ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}><Cpu size={24} /></div>
                    <div>
                      <h4 className={`font-bold transition-colors ${selectedMachineId === machine.id ? 'text-blue-700 dark:text-white' : 'text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>{machine.name}</h4>
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">{machine.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 'config' && selectedMachine && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              <RecipeForm resources={resources} machine={selectedMachine} initialRecipe={editingRecipe} onSave={onSave} onCancel={handleReset} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
