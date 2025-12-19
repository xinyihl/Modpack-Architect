import React, { useRef } from 'react';
import { Puzzle, UploadCloud, FileJson, Trash2 } from 'lucide-react';
import { Plugin } from '../../types';
import { useI18n } from '../../context/I18nContext';

interface PluginManagerProps {
  plugins: Plugin[];
  addPlugin: (script: string) => void;
  removePlugin: (id: string) => void;
}

export const PluginManager: React.FC<PluginManagerProps> = ({ 
  plugins, addPlugin, removePlugin 
}) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePluginUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const script = ev.target?.result as string;
        addPlugin(script);
      } catch (err) {
        // Handle error (notification should be handled in context)
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300 max-w-5xl mx-auto px-4">
      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3"><Puzzle size={24} className="text-blue-500" /><h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-widest">{t('management.pluginManager')}</h3></div>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">{t('management.pluginWarning')}</p>
        </div>
        <div onClick={() => fileInputRef.current?.click()} className="w-full md:w-80 h-40 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-blue-500 dark:hover:border-blue-500/5 transition-all cursor-pointer group shadow-sm">
          <UploadCloud size={32} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
          <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest px-6 text-center">{t('management.dropPlugin')} (.js)</span>
          <input type="file" ref={fileInputRef} onChange={handlePluginUpload} accept=".js" className="hidden" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {plugins.length > 0 ? plugins.map(p => (
          <div key={p.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl group shadow-md transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800"><FileJson size={28} className="text-blue-500" /></div>
              <div className="space-y-1">
                <div className="flex items-center gap-3"><h4 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wide">{p.name}</h4><span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">V{p.version}</span></div>
                <p className="text-xs text-zinc-500 font-medium">{p.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-6 md:mt-0 w-full md:w-auto">
              <div className="flex flex-col items-end gap-1 px-4 border-r border-zinc-100 dark:border-zinc-800"><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">MACHINES</span><span className="text-sm font-black text-zinc-800 dark:text-zinc-300">{p.machines.length}</span></div>
              <div className="flex flex-col items-end gap-1 px-4"><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">PROCESSORS</span><span className="text-sm font-black text-zinc-800 dark:text-zinc-300">{p.processors.length}</span></div>
              <button onClick={() => removePlugin(p.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 ml-auto"><Trash2 size={14} /> {t('common.uninstall')}</button>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl opacity-30">
            <Puzzle size={48} className="text-zinc-300 dark:text-zinc-800 mb-4" /><span className="text-xs font-black uppercase tracking-widest">{t('common.noResults')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
