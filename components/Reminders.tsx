
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Reminder, ReminderSettings } from '../types';
import Icon from './Icon';

interface RemindersProps {
  onBack: () => void;
}

const Reminders: React.FC<RemindersProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [history, setHistory] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const [prefs, hist] = await Promise.all([
            api.reminders.getSettings(),
            api.reminders.getHistory()
        ]);
        setSettings(prefs);
        setHistory(hist);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const toggleEnabled = async () => {
      if (!settings) return;
      const newState = !settings.isEnabled;
      setSettings({ ...settings, isEnabled: newState }); // Optimistic
      await api.reminders.updateSettings({ isEnabled: newState });
  };

  return (
    <div className="p-5 space-y-6 h-full flex flex-col animate-page-enter">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
          <Icon name="arrow-left" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Напоминания</h2>
      </div>

      {/* Settings Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
         <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
                    <Icon name="bell" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Уведомления</h3>
                    <p className="text-xs text-slate-400">Напоминать о записях</p>
                </div>
            </div>
            {/* Toggle Switch */}
            <button 
                onClick={toggleEnabled}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings?.isEnabled ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${settings?.isEnabled ? 'translate-x-6' : ''}`}></div>
            </button>
         </div>

         <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
             <Icon name="globe" size={14} />
             <span>Часовой пояс: <span className="font-bold text-slate-600 dark:text-slate-300">{settings?.timezone || '...'}</span></span>
         </div>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
         <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-lg">История отправки</h3>
         <div className="space-y-3">
            {loading ? (
                <div className="text-center text-slate-400 py-10">Загрузка...</div>
            ) : history.length === 0 ? (
                <div className="text-center text-slate-400 py-10">История пуста</div>
            ) : (
                history.map(rem => (
                    <div key={rem.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <p className="text-sm font-medium text-slate-800 dark:text-white mb-2">{rem.text}</p>
                        <div className="flex justify-between items-center text-xs">
                             <span className="text-slate-400">{new Date(rem.createdAt).toLocaleString()}</span>
                             <span className={`font-bold px-2 py-0.5 rounded-md ${
                                 rem.status === 'SENT' ? 'bg-emerald-100 text-emerald-600' :
                                 rem.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                                 'bg-red-100 text-red-600'
                             }`}>
                                 {rem.status === 'SENT' ? 'Отправлено' : rem.status === 'PENDING' ? 'В очереди' : 'Ошибка'}
                             </span>
                        </div>
                    </div>
                ))
            )}
         </div>
      </div>
    </div>
  );
};

export default Reminders;
