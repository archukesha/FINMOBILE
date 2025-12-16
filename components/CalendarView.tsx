
import React, { useMemo, useState } from 'react';
import Icon from './Icon';
import { getTransactionsByMonth, getSubscriptions } from '../services/storage';
import { TransactionType } from '../types';

interface CalendarViewProps {
    onBack: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onBack }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0=Sun
    // Adjust to Monday start (1=Mon ... 0=Sun -> 0=Mon ... 6=Sun)
    const offset = startDay === 0 ? 6 : startDay - 1;

    const events = useMemo(() => {
        const map: Record<number, {type: 'income'|'expense'|'sub', title: string, amount: number}[]> = {};
        
        // 1. Transactions
        const txs = getTransactionsByMonth(currentDate);
        txs.forEach(tx => {
            // tx.date is "YYYY-MM-DD". Split it to get the day safely.
            const parts = tx.date.split('-');
            const day = parseInt(parts[2], 10);
            
            if(!map[day]) map[day] = [];
            map[day].push({
                type: tx.type === TransactionType.INCOME ? 'income' : 'expense',
                title: tx.note || 'Операция',
                amount: tx.amount
            });
        });

        // 2. Subscriptions (Simulated for this month)
        const subs = getSubscriptions().filter(s => s.isActive);
        subs.forEach(s => {
            const subDate = new Date(s.nextPaymentDate);
            // Check if recurrent date falls in this month/year or just simple day match
            // Simplification: Check if day exists in this month
            const day = subDate.getDate();
            if (day <= daysInMonth) {
                 if(!map[day]) map[day] = [];
                 map[day].push({ type: 'sub', title: s.name, amount: s.amount });
            }
        });

        return map;
    }, [currentDate, daysInMonth]);

    const changeMonth = (delta: number) => {
        const d = new Date(currentDate);
        d.setMonth(d.getMonth() + delta);
        setCurrentDate(d);
        setSelectedDay(null);
    };

    const dayEvents = selectedDay ? events[selectedDay] : [];

    return (
        <div className="p-5 h-full flex flex-col bg-white dark:bg-slate-900 animate-page-enter">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Icon name="arrow-left" />
                </button>
                <div className="flex items-center gap-4">
                    <button onClick={() => changeMonth(-1)}><Icon name="chevron-left" /></button>
                    <span className="font-bold text-lg capitalize">{currentDate.toLocaleString('ru', {month:'long', year:'numeric'})}</span>
                    <button onClick={() => changeMonth(1)}><Icon name="chevron-right" /></button>
                </div>
                <div className="w-10" />
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase">
                {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {Array.from({length: offset}).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({length: daysInMonth}).map((_, i) => {
                    const day = i + 1;
                    const dayEventsList = events[day] || [];
                    const hasIncome = dayEventsList.some(e => e.type === 'income');
                    const hasExpense = dayEventsList.some(e => e.type === 'expense');
                    const hasSub = dayEventsList.some(e => e.type === 'sub');
                    const isSelected = selectedDay === day;

                    return (
                        <div 
                            key={day} 
                            onClick={() => setSelectedDay(day)}
                            className={`aspect-[4/5] rounded-xl p-1 relative flex flex-col items-center justify-start border transition-colors cursor-pointer ${
                                isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'
                            }`}
                        >
                            <span className={`text-xs font-bold ${isSelected ? 'text-white' : ''}`}>{day}</span>
                            <div className="flex gap-1 mt-1 flex-wrap justify-center">
                                {hasIncome && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></div>}
                                {hasExpense && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`}></div>}
                                {hasSub && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'} animate-pulse`}></div>}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Event List for Selected Day */}
            <div className="mt-6 flex-1 overflow-y-auto no-scrollbar pb-10">
                {selectedDay ? (
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white mb-3">
                            {selectedDay} {currentDate.toLocaleString('ru', {month:'long'})}
                        </h3>
                        {dayEvents?.length > 0 ? (
                            <div className="space-y-2">
                                {dayEvents.map((evt, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${
                                                evt.type === 'income' ? 'bg-emerald-500' : evt.type === 'sub' ? 'bg-blue-500' : 'bg-rose-500'
                                            }`}></div>
                                            <span className="text-sm font-medium dark:text-white">{evt.title}</span>
                                        </div>
                                        <span className="text-sm font-bold dark:text-white">
                                            {evt.type === 'income' ? '+' : '-'}{evt.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">Нет операций</p>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-4">
                        <p className="text-xs font-bold uppercase mb-4">Статистика</p>
                        <div className="flex gap-4 text-xs font-bold text-slate-500 justify-center">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Доход</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Расход</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Подписка</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarView;
