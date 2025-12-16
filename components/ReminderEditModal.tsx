
import React, { useState, useEffect } from 'react';
import { Reminder, RepeatConfig, ReminderSettings } from '../types';
import Icon from './Icon';

interface ReminderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: Partial<Reminder>) => void;
  initialData?: Reminder | null;
  settings: ReminderSettings | null;
}

const ReminderEditModal: React.FC<ReminderEditModalProps> = ({ isOpen, onClose, onSave, initialData, settings }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [repeatType, setRepeatType] = useState<RepeatConfig['type']>('NONE');
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setMessage(initialData.message || '');
        const scheduled = new Date(initialData.scheduledAt);
        setDate(scheduled.toISOString().split('T')[0]);
        setTime(scheduled.toTimeString().slice(0, 5));
        setRepeatType(initialData.repeat.type);
        setRepeatEvery(initialData.repeat.every || 1);
        setWeekDays(initialData.repeat.weekDays || []);
        setIsActive(initialData.isActive);
      } else {
        setTitle('');
        setMessage('');
        const now = new Date();
        now.setDate(now.getDate() + 1); 
        setDate(now.toISOString().split('T')[0]);
        setTime(settings?.defaultTime || '09:00');
        setRepeatType('NONE');
        setRepeatEvery(1);
        setWeekDays([]);
        setIsActive(true);
      }
    }
  }, [isOpen, initialData, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;
    const localDate = new Date(`${date}T${time}:00`); 
    const payload: Partial<Reminder> = {
      title,
      message,
      scheduledAt: localDate.toISOString(),
      repeat: { type: repeatType, every: repeatEvery, weekDays: repeatType === 'WEEKLY' ? weekDays : undefined },
      timezone: settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      channels: settings?.defaultChannels || ['TELEGRAM'],
      isActive
    };
    if (initialData) payload.id = initialData.id;
    onSave(payload);
  };

  const toggleWeekDay = (day: number) => setWeekDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 relative z-10 animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                {initialData ? 'Редактировать' : 'Новое'}
            </h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <Icon name="x" size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <input 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none text-lg font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={title} onChange={e => setTitle(e.target.value)} required placeholder="Название напоминания" autoFocus
                />
                <textarea 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 resize-none h-24 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={message} onChange={e => setMessage(e.target.value)} placeholder="Добавить описание..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 pl-1">Дата</label>
                    <input type="date" className="w-full bg-transparent font-bold text-slate-700 dark:text-white outline-none" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 pl-1">Время</label>
                    <input type="time" className="w-full bg-transparent font-bold text-slate-700 dark:text-white outline-none" value={time} onChange={e => setTime(e.target.value)} required />
                </div>
            </div>

            <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase pl-2">Повторение</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map(type => (
                        <button
                            key={type} type="button" onClick={() => setRepeatType(type)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${repeatType === type ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                        >
                            {type === 'NONE' ? 'Нет' : type === 'DAILY' ? 'День' : type === 'WEEKLY' ? 'Неделя' : type === 'MONTHLY' ? 'Месяц' : 'Год'}
                        </button>
                    ))}
                </div>

                {repeatType !== 'NONE' && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl animate-in fade-in">
                        <div className="flex items-center gap-3 mb-4">
                             <span className="text-sm font-bold text-slate-500">Повторять каждые</span>
                             <input type="number" min="1" max="99" className="w-14 p-1 text-center bg-white dark:bg-slate-700 rounded-lg text-sm font-bold outline-none" value={repeatEvery} onChange={e => setRepeatEvery(parseInt(e.target.value) || 1)} />
                             <span className="text-sm font-bold text-slate-500">{repeatType === 'DAILY' ? 'дн.' : repeatType === 'WEEKLY' ? 'нед.' : repeatType === 'MONTHLY' ? 'мес.' : 'лет'}</span>
                        </div>
                        {repeatType === 'WEEKLY' && (
                            <div className="flex justify-between">
                                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((dayName, idx) => {
                                    const dayNum = idx + 1;
                                    const isSelected = weekDays.includes(dayNum);
                                    return (
                                        <button key={dayNum} type="button" onClick={() => toggleWeekDay(dayNum)} className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${isSelected ? 'bg-blue-500 text-white shadow-md transform scale-110' : 'bg-white dark:bg-slate-700 text-slate-400'}`}>
                                            {dayName}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-400/30 mt-4 active:scale-95 transition-transform">
                {initialData ? 'Сохранить' : 'Создать напоминание'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default ReminderEditModal;
