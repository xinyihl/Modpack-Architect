import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Cpu, X, Settings2 } from 'lucide-react';
import { MachineDefinition, MachineSlot, MetadataField, MetadataFieldType, ResourceCategory } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { ModalOverlay } from '../shared/ModalOverlay';

interface MachineManagerProps {
  machines: MachineDefinition[];
  categories: ResourceCategory[];
  onAddMachine: (m: MachineDefinition) => void;
  onUpdateMachine: (m: MachineDefinition) => void;
  onDeleteMachine: (id: string) => void;
}

export const MachineManager: React.FC<MachineManagerProps> = ({ 
  machines, categories, onAddMachine, onUpdateMachine, onDeleteMachine 
}) => {
  const { t } = useI18n();
  const [macSearch, setMacSearch] = useState('');
  const [activeModal, setActiveModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<MachineDefinition | null>(null);

  const [macName, setMacName] = useState('');
  const [macId, setMacId] = useState('');
  const [macDesc, setMacDesc] = useState('');
  const [macInputs, setMacInputs] = useState<MachineSlot[]>([]);
  const [macOutputs, setMacOutputs] = useState<MachineSlot[]>([]);
  const [macMetadata, setMacMetadata] = useState<MetadataField[]>([]);

  const openModal = (m?: MachineDefinition) => {
    if (m) {
      setEditingMachine(m); setMacName(m.name); setMacId(m.id); setMacDesc(m.description); setMacInputs(m.inputs); setMacOutputs(m.outputs); setMacMetadata(m.metadataSchema || []);
    } else {
      setEditingMachine(null); setMacName(''); setMacId(''); setMacDesc(''); setMacInputs([]); setMacOutputs([]); setMacMetadata([]);
    }
    setActiveModal(true);
  };

  const addSlot = (type: 'input' | 'output') => {
    const newSlot: MachineSlot = { type: categories[0]?.id || 'item', label: '', optional: false };
    if (type === 'input') setMacInputs([...macInputs, newSlot]); else setMacOutputs([...macOutputs, newSlot]);
  };

  const updateSlot = (type: 'input' | 'output', index: number, field: keyof MachineSlot, value: any) => {
    const setter = type === 'input' ? setMacInputs : setMacOutputs;
    setter(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeSlot = (type: 'input' | 'output', index: number) => {
    const setter = type === 'input' ? setMacInputs : setMacOutputs;
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const addMetadataField = () => {
    const newField: MetadataField = { key: '', label: '', type: 'string' };
    setMacMetadata([...macMetadata, newField]);
  };

  const updateMetadataField = (index: number, field: keyof MetadataField, value: any) => {
    setMacMetadata(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const removeMetadataField = (index: number) => {
    setMacMetadata(prev => prev.filter((_, i) => i !== index));
  };

  const filteredMachines = useMemo(() => machines.filter(m => (m.name || '').toLowerCase().includes(macSearch.toLowerCase()) || (m.id || '').toLowerCase().includes(macSearch.toLowerCase())), [machines, macSearch]);

  const safeUpperCase = (val: any) => (val ? String(val).toUpperCase() : '');

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto px-4">
      <div className="flex gap-4 items-center bg-white dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-3.5 text-zinc-400 dark:text-zinc-600" />
          <input type="text" value={macSearch} onChange={(e) => setMacSearch(e.target.value)} placeholder={t('sidebar.searchPlaceholder')} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-zinc-900 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500 outline-none h-[44px] font-medium" />
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-[44px] rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/10 active:scale-95 transition-all">
          <Plus size={16} /> {t('common.create')}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {filteredMachines.map(m => (
          <div key={m.id} className="flex flex-col p-8 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-lg relative overflow-hidden">
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-100 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 rounded-2xl border border-blue-200 dark:border-blue-600/20"><Cpu size={26} /></div>
                    <div>
                        <div className="text-base font-black text-zinc-800 dark:text-zinc-100 tracking-wide uppercase mb-1">{m.name}</div>
                        <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-widest font-bold">ID: {m.id}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(m)} className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all shadow-sm"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteMachine(m.id)} className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all shadow-sm"><Trash2 size={16} /></button>
                </div>
            </div>
            <div className="flex items-center gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" /><span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{m.inputs.length} {t('form.inputs')}</span></div>
                <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" /><span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{m.outputs.length} {t('form.outputs')}</span></div>
            </div>
          </div>
        ))}
      </div>

      {activeModal && (
        <ModalOverlay title={editingMachine ? t('management.macEdit') : t('management.macTitle')} icon={Cpu} onClose={() => setActiveModal(false)} maxWidth="max-w-6xl">
          <form onSubmit={(e) => {
            e.preventDefault();
            const machine = { id: macId || macName.toLowerCase().replace(/\s+/g, '_'), name: macName, description: macDesc, inputs: macInputs, outputs: macOutputs, metadataSchema: macMetadata };
            if (editingMachine) onUpdateMachine(machine); else onAddMachine(machine);
            setActiveModal(false);
          }} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('management.displayName')}</label><input type="text" required value={macName} onChange={(e) => setMacName(e.target.value)} placeholder="e.g. Arc Furnace" className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] font-bold" /></div>
                <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">ID</label><input type="text" value={macId} onChange={(e) => setMacId(e.target.value)} placeholder="internal_id" className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px]" /></div>
              </div>
              <div className="space-y-2"><label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-1 tracking-widest">{t('common.description')}</label><textarea value={macDesc} onChange={(e) => setMacDesc(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none h-[400px] font-medium leading-relaxed shadow-inner" /></div>
            </div>
            <div className="space-y-8 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><label className="text-[11px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">{t('form.inputSlots')}</label><button type="button" onClick={() => addSlot('input')} className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 transition-all flex items-center gap-1"><Plus size={10} /> {safeUpperCase(t('form.addSlot'))}</button></div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {macInputs.length > 0 ? (macInputs.map((slot, idx) => (<div key={idx} className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 group hover:border-zinc-300 dark:hover:border-zinc-700/50 transition-all shadow-sm"><div className="flex items-center justify-between"><input type="text" value={slot.label} onChange={(e) => updateSlot('input', idx, 'label', e.target.value)} className="bg-transparent border-none text-xs text-zinc-800 dark:text-zinc-200 outline-none font-black uppercase tracking-wide flex-1" placeholder="Slot Label..." /><button type="button" onClick={() => removeSlot('input', idx)} className="text-zinc-400 hover:text-red-500 dark:text-zinc-600 transition-colors"><X size={14}/></button></div><div className="flex items-center gap-3"><select value={slot.type} onChange={(e) => updateSlot('input', idx, 'type', e.target.value)} className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 h-10 shadow-sm">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><label className="flex items-center gap-2 cursor-pointer group/label"><div className="relative flex items-center"><input type="checkbox" checked={slot.optional} onChange={(e) => updateSlot('input', idx, 'optional', e.target.checked)} className="sr-only peer" /><div className="w-4 h-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all"></div><X size={10} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 scale-0 peer-checked:scale-100 transition-all" /></div><span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter select-none">{t('form.optional')}</span></label></div></div>))) : (<div className="flex items-center justify-center h-[120px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl opacity-40"><span className="text-[10px] font-black text-zinc-300 dark:text-zinc-800 uppercase tracking-widest">{t('common.noResults')}</span></div>)}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><label className="text-[11px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest">{t('form.outputSlots')}</label><button type="button" onClick={() => addSlot('output')} className="text-[10px] font-black text-orange-600 dark:text-orange-500 hover:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 transition-all flex items-center gap-1"><Plus size={10} /> {safeUpperCase(t('form.addSlot'))}</button></div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {macOutputs.length > 0 ? (macOutputs.map((slot, idx) => (<div key={idx} className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 group hover:border-zinc-300 dark:hover:border-zinc-700/50 transition-all shadow-sm"><div className="flex items-center justify-between"><input type="text" value={slot.label} onChange={(e) => updateSlot('output', idx, 'label', e.target.value)} className="bg-transparent border-none text-xs text-zinc-800 dark:text-zinc-200 outline-none font-black uppercase tracking-wide flex-1" placeholder="Slot Label..." /><button type="button" onClick={() => removeSlot('output', idx)} className="text-zinc-400 hover:text-red-500 dark:text-zinc-600 transition-colors"><X size={14}/></button></div><div className="flex items-center gap-3"><select value={slot.type} onChange={(e) => updateSlot('output', idx, 'type', e.target.value)} className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 h-10 shadow-sm">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><label className="flex items-center gap-2 cursor-pointer group/label"><div className="relative flex items-center"><input type="checkbox" checked={slot.optional} onChange={(e) => updateSlot('output', idx, 'optional', e.target.checked)} className="sr-only peer" /><div className="w-4 h-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all"></div><X size={10} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 scale-0 peer-checked:scale-100 transition-all" /></div><span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter select-none">{t('form.optional')}</span></label></div></div>))) : (<div className="flex items-center justify-center h-[120px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl opacity-40"><span className="text-[10px] font-black text-zinc-300 dark:text-zinc-800 uppercase tracking-widest">{t('common.noResults')}</span></div>)}
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex-1">
                  <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Settings2 size={16} className="text-blue-500" /><label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">{t('management.metadataSchema')}</label></div><button type="button" onClick={addMetadataField} className="text-[10px] font-black text-blue-600 dark:text-blue-500 hover:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 transition-all flex items-center gap-1 shadow-sm"><Plus size={10} /> {t('management.addField')}</button></div>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {macMetadata.length > 0 ? (macMetadata.map((field, idx) => (<div key={idx} className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 group shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700"><div className="flex-1 space-y-2"><input type="text" value={field.label} onChange={(e) => updateMetadataField(idx, 'label', e.target.value)} placeholder={t('management.fieldLabel')} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold shadow-sm" /><input type="text" value={field.key} onChange={(e) => updateMetadataField(idx, 'key', e.target.value)} placeholder={t('management.fieldKey')} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-[10px] font-mono text-zinc-500 outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" /></div><div className="flex items-center gap-3"><select value={field.type} onChange={(e) => updateMetadataField(idx, 'type', e.target.value as MetadataFieldType)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-black uppercase text-zinc-500 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer h-[38px] min-w-[100px] shadow-sm"><option value="string">String</option><option value="number">Number</option><option value="boolean">Boolean</option><option value="color">Color</option></select><button type="button" onClick={() => removeMetadataField(idx)} className="p-2 text-zinc-400 hover:text-red-500 dark:text-zinc-600 transition-colors"><Trash2 size={16}/></button></div></div>))) : (<div className="flex items-center justify-center h-[80px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl opacity-40"><span className="text-[10px] font-black text-zinc-300 dark:text-zinc-800 uppercase tracking-widest">{t('management.noFields')}</span></div>)}
                  </div>
              </div>
            </div>
            <div className="lg:col-span-2 mt-4 pt-6 border-t border-zinc-100 dark:border-zinc-800"><button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 active:scale-[0.98]">{editingMachine ? t('common.update') : t('common.create')}</button></div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
};
