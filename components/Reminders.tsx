
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Reminder, ReminderHistoryItem, ReminderSettings } from '../types';
import ReminderEditModal from './ReminderEditModal';
import Icon from './Icon';

interface RemindersProps {
  onBack: () => void;
}

const Reminders: React.FC<RemindersProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY' | 'SETTINGS'>('ACTIVE');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [history, setHistory] = useState<ReminderHistoryItem[]>([]);
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
        if (activeTab === 'ACTIVE') setReminders((await api.reminders.list()).items);
        else if (activeTab === 'HISTORY') setHistory(await api.reminders.getHistory());
        setSettings(await api.reminders.getSettings());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const handleCreateOrUpdate = async (data: Partial<Reminder>) => {
      try {
          if (data.id) await api.reminders.update(data.id, data);
          else await api.reminders.create(data as Omit<Reminder, 'id' | 'nextRun'>);
          showToast('Сохранено', 'success');
          setIsModalOpen(false);
          setEditingReminder(null);
          loadData();
      } catch (e) { showToast('Ошибка', 'error'); }
  };

  const handleDelete = async (id: string) => {
      if (!confirm('Удалить?')) return;
      await api.reminders.delete(id);
      setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleToggleActive = async (rem: Reminder) => {
      const newState = !rem.isActive;
      setReminders(prev => prev.map(r => r.id === rem.id ? { ...r, isActive: newState } : r));
      await api.reminders.update(rem.id, { isActive: newState });
  };

  const handleRunNow = async (id: string) => {
      showToast('Отправка...', 'success');
      await api.reminders.run(id);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!settings) return;
      await api.reminders.updateSettings(settings);
      showToast('Настройки сохранены', 'success');
  };

  const renderActiveTab = () => (
      <div className="space-y-4 pb-24">
          {reminders.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-[2.5rem]">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Icon name="bell-off" size={32} className="opacity-50" />
                  </div>
                  <p className="font-medium">Список пуст</p>
                  <button onClick={() => { setEditingReminder(null); setIsModalOpen(true); }} className="mt-4 text-blue-500 font-bold text-sm hover:underline">Создать первое</button>
              </div>
          )}
          
          {reminders.map(r => (
              <div key={r.id} className={`bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border transition-all duration-300 ${r.isActive ? 'border-slate-100 dark:border-slate-700 opacity-100' : 'border-slate-100 dark:border-slate-800 opacity-60 grayscale'}`}>
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 mr-4">
                          <h3 className="font-bold text-xl text-slate-800 dark:text-white leading-tight mb-1">{r.title}</h3>
                          {r.message && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">{r.message}</p>}
                      </div>
                      <button 
                        onClick={() => handleToggleActive(r)}
                        className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${r.isActive ? 'bg-emerald-500 shadow-md shadow-emerald-200' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${r.isActive ? 'left-6' : 'left-1'}`} />
                      </button>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                       <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <Icon name="calendar" size={14} />
                          {new Date(r.nextRun || r.scheduledAt).toLocaleString('ru-RU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </div>
                       <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <Icon name="repeat" size={14} />
                          {r.repeat.type === 'NONE' ? 'Разово' : r.repeat.type}
                       </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-50 dark:border-slate-700 pt-4">
                      <button onClick={() => handleRunNow(r.id)} className="flex-1 py-3 bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors">Проверить</button>
                      <button onClick={() => { setEditingReminder(r); setIsModalOpen(true); }} className="w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 text-slate-600 rounded-xl hover:bg-slate-100">
                          <Icon name="edit-2" size={16} />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="w-12 flex items-center justify-center bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl hover:bg-red-100">
                          <Icon name="trash-2" size={16} />
                      </button>
                  </div>
              </div>
          ))}
      </div>
  );

  const renderHistoryTab = () => (
      <div className="space-y-4 pb-20">
          {history.length === 0 && !loading && <p className="text-center text-slate-400 py-10">История пуста</p>}
          <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-6 py-2">
            {history.map(item => (
                <div key={item.id} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                        item.status === 'SENT' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-800 dark:text-white text-sm">{item.title}</span>
                            <span className="text-[10px] text-slate-400">{new Date(item.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                             <span className="text-xs text-slate-400">{new Date(item.sentAt).toLocaleDateString()}</span>
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${item.status === 'SENT' ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>{item.status}</span>
                        </div>
                    </div>
                </div>
            ))}
          </div>
      </div>
  );

  const renderSettingsTab = () => (
      <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center"><Icon name="bell" size={20} /></div>
                      <span className="font-bold text-slate-800 dark:text-white">Уведомления</span>
                  </div>
                  <input type="checkbox" className="w-6 h-6 accent-indigo-600 rounded-md" checked={settings?.enabled ?? true} onChange={e => setSettings(prev => prev ? { ...prev, enabled: e.target.checked } : null)} />
              </div>

              <div className="space-y-5">
                  <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-2xl">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Часовой пояс</label>
                      <select className="w-full bg-transparent font-bold text-slate-700 dark:text-white outline-none" value={settings?.timezone} onChange={e => setSettings(prev => prev ? { ...prev, timezone: e.target.value } : null)}>
                          <option value="Europe/Moscow">Europe/Moscow</option>
                          <option value="UTC">UTC</option>
                          <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>Local System</option>
                      </select>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-3 pl-2">Каналы доставки</label>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl flex items-center gap-3">
                          <Icon name="send" size={18} className="text-blue-500" />
                          <div className="flex-1">
                              <span className="block text-sm font-bold text-blue-700 dark:text-blue-300">Telegram Bot</span>
                              <span className="text-[10px] text-blue-500 opacity-80">Основной канал</span>
                          </div>
                          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-slate-800"></div>
                      </div>
                  </div>
              </div>
          </div>
          <button type="submit" className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg active:scale-95 transition-transform">Сохранить</button>
      </form>
  );

  return (
    <div className="p-5 h-full flex flex-col animate-page-enter relative pb-28">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all">
          <Icon name="arrow-left" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Напоминания</h2>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8 shrink-0">
          {(['ACTIVE', 'HISTORY', 'SETTINGS'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-slate-400'}`}>
                  {tab === 'ACTIVE' ? 'Список' : tab === 'HISTORY' ? 'История' : 'Опции'}
              </button>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"/></div> : 
             activeTab === 'ACTIVE' ? renderActiveTab() : activeTab === 'HISTORY' ? renderHistoryTab() : renderSettingsTab()
          }
      </div>

      {activeTab === 'ACTIVE' && (
          <button onClick={() => { setEditingReminder(null); setIsModalOpen(true); }} className="absolute bottom-24 right-5 w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-400/30 flex items-center justify-center text-3xl active:scale-90 transition-transform z-30">
              <Icon name="plus" />
          </button>
      )}

      {toast && <div className={`absolute top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-4 z-50 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>{toast.msg}</div>}

      <ReminderEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleCreateOrUpdate} initialData={editingReminder} settings={settings} />
    </div>
  );
};

export default Reminders;
