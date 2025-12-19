import React from 'react';
import { Globe, Wifi, WifiOff, RefreshCcw } from 'lucide-react';
import { SyncSettings, SyncStatus } from '../../types';
import { useI18n } from '../../context/I18nContext';

interface SyncManagerProps {
  syncSettings: SyncSettings;
  syncStatus: SyncStatus;
  setSyncSettings: (s: SyncSettings) => void;
  triggerSync: () => void;
}

export const SyncManager: React.FC<SyncManagerProps> = ({ 
  syncSettings, syncStatus, setSyncSettings, triggerSync 
}) => {
  const { t } = useI18n();
  const safeUpperCase = (val: any) => (val ? String(val).toUpperCase() : '');

  return (
    <div className="animate-in fade-in duration-300 h-full flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900/40 p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-6">
          <div className="flex items-center gap-4"><div className="bg-blue-100 dark:bg-blue-600/10 p-3 rounded-2xl"><Globe size={24} className="text-blue-600 dark:text-blue-500" /></div><h3 className="text-lg font-black text-zinc-800 dark:text-white uppercase tracking-widest">{t('management.sync.title')}</h3></div>
          <div className={`flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800`}>
            {syncStatus === 'success' ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-zinc-400 dark:text-zinc-600" />}
            <span className={`text-[10px] font-black uppercase tracking-widest ${syncStatus === 'success' ? 'text-emerald-600' : 'text-zinc-400'}`}>{safeUpperCase(syncStatus)}</span>
          </div>
        </div>
        <div className="space-y-5">
          <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner">
            <div className="flex items-center gap-4"><div className={`w-3 h-3 rounded-full ${syncSettings.enabled ? 'bg-blue-500 animate-pulse' : 'bg-zinc-200 dark:bg-zinc-800'}`} /><span className="text-sm font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">{t('management.sync.enable')}</span></div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={syncSettings.enabled} onChange={(e) => setSyncSettings({...syncSettings, enabled: e.target.checked})} className="sr-only peer" />
              <div className="w-12 h-6 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white shadow-sm"></div>
            </label>
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-2 tracking-widest">SERVER URL</label>
            <input type="text" value={syncSettings.apiUrl} onChange={(e) => setSyncSettings({...syncSettings, apiUrl: e.target.value})} placeholder="wss://your-architect-server.com/api/v1/live" className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] shadow-sm font-bold" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-2 tracking-widest">{t('management.sync.username')}</label>
              <input type="text" value={syncSettings.username} onChange={(e) => setSyncSettings({...syncSettings, username: e.target.value})} className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] shadow-sm font-bold" />
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] text-zinc-400 dark:text-zinc-500 uppercase font-black ml-2 tracking-widest">{t('management.sync.password')}</label>
              <input type="password" value={syncSettings.password} onChange={(e) => setSyncSettings({...syncSettings, password: e.target.value})} className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-3 text-sm text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none h-[48px] shadow-sm font-bold" />
            </div>
          </div>
          <button onClick={() => triggerSync()} disabled={!syncSettings.enabled || syncStatus !== 'success'} className="w-full bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white px-6 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-2xl active:scale-[0.98] uppercase tracking-widest h-[56px]"><RefreshCcw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />FORCE SYNC</button>
        </div>
      </div>
    </div>
  );
};
