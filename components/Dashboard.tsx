
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Category, TransactionType, Achievement, Debt } from '../types';
import { getTransactionsByMonth, getAchievements, getDebts } from '../services/storage';
import Icon from './Icon';

interface DashboardProps {
  categories: Category[];
  refreshTrigger: number;
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenExpectedIncome?: () => void;
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ categories, refreshTrigger, currentDate, onDateChange, onEditTransaction, onOpenExpectedIncome, onNavigate }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  
  useEffect(() => {
    setAchievements(getAchievements());
    setDebts(getDebts());
  }, [refreshTrigger]);

  const monthData = useMemo(() => {
    const txs = getTransactionsByMonth(currentDate);
    const income = txs.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expense = txs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    
    return {
      txs: txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      income,
      expense,
      balance: income - expense
    };
  }, [refreshTrigger, currentDate]);

  // Urgent Debts Logic (Due within 3 days)
  const urgentDebts = useMemo(() => {
    const now = new Date();
    // Normalize to start of day
    now.setHours(0,0,0,0);
    
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);

    return debts.filter(d => {
        if (!d.nextPaymentDate || d.remainingAmount <= 0) return false;
        const dueDate = new Date(d.nextPaymentDate);
        return dueDate >= now && dueDate <= threeDaysFromNow;
    });
  }, [debts]);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Неизвестно';
  const getCategoryIcon = (id: string) => categories.find(c => c.id === id)?.icon || 'circle';
  const getCategoryColor = (id: string) => categories.find(c => c.id === id)?.color || '#94a3b8';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    onDateChange(newDate);
  };

  // --- Grouping Logic ---
  const displayedTransactions = showAllTransactions ? monthData.txs : monthData.txs.slice(0, 5);
  
  const groupedTransactions = useMemo(() => {
      const groups: Record<string, Transaction[]> = {};
      displayedTransactions.forEach(tx => {
          if (!groups[tx.date]) groups[tx.date] = [];
          groups[tx.date].push(tx);
      });
      return groups;
  }, [displayedTransactions]);

  const getDateLabel = (dateStr: string) => {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return 'Сегодня';
      if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
      
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
  };
  // ----------------------

  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const isCurrentMonth = new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
  
  return (
    <div className="p-5 space-y-6 animate-page-enter pb-32">
      {/* Redesigned Header */}
      <div className="flex justify-between items-center pt-2">
         <div className="flex flex-col">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Баланс
                {monthData.balance < 0 && <span className="text-red-500 text-lg">⚠️</span>}
            </h1>
         </div>
         <button onClick={() => onNavigate('HUB')} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform">
             <div className="w-full h-full flex items-center justify-center text-slate-500"><Icon name="user" size={20} /></div>
         </button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500">
              <Icon name="chevron-left" size={20} />
          </button>
          <div className="font-bold text-slate-800 dark:text-white text-sm capitalize">
              {capitalizedMonth} <span className="text-slate-400 font-normal">{currentDate.getFullYear()}</span>
          </div>
          <button onClick={() => changeMonth(1)} disabled={isCurrentMonth} className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 ${isCurrentMonth ? 'opacity-30' : ''}`}>
              <Icon name="chevron-right" size={20} />
          </button>
      </div>

      {/* DEBT ALERTS */}
      {urgentDebts.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-[1.5rem] animate-pulse-slow">
              <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                      <Icon name="alert-triangle" size={20} />
                  </div>
                  <div className="flex-1">
                      <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">Скоро платеж!</h4>
                      <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                          {urgentDebts[0].title}: {urgentDebts[0].remainingAmount} ₽ до {new Date(urgentDebts[0].nextPaymentDate!).toLocaleDateString()}
                      </p>
                      <button onClick={() => onNavigate('DEBTS')} className="mt-2 text-xs font-bold bg-white dark:bg-slate-800 text-red-600 px-3 py-1.5 rounded-lg shadow-sm">
                          Перейти к оплате
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Main Card - RESTRUCTURED */}
      <div className="relative overflow-hidden bg-[#0f172a] rounded-[2.5rem] p-6 text-white shadow-2xl shadow-indigo-900/20 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-40 group-hover:opacity-50 transition-all duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600 rounded-full blur-[60px] opacity-30 group-hover:opacity-40 transition-all duration-1000"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center">
              
              {/* Prominent Income/Expense Row */}
              <div className="flex w-full items-center justify-around mb-6 pt-2">
                  <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Icon name="arrow-up-right" size={14} /> Доход
                      </span>
                      <span className="text-3xl font-black tracking-tight">{formatCurrency(monthData.income)}</span>
                  </div>
                  
                  <div className="w-px h-12 bg-white/10"></div>

                  <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Icon name="arrow-down-right" size={14} /> Расход
                      </span>
                      <span className="text-3xl font-black tracking-tight">{formatCurrency(monthData.expense)}</span>
                  </div>
              </div>
              
              {/* Secondary Balance/Savings Row */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-3 border border-white/5 w-full justify-center">
                  <span className="text-xs text-slate-300 font-medium uppercase tracking-wide">Накопления:</span>
                  <span className={`text-lg font-bold ${monthData.balance >= 0 ? 'text-white' : 'text-rose-300'}`}>
                      {monthData.balance > 0 ? '+' : ''}{formatCurrency(monthData.balance)}
                  </span>
              </div>

          </div>
      </div>
      
      {/* Transactions List Grouped By Date */}
      <div>
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Операции</h3>
          {monthData.txs.length > 5 && (
             <button 
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
             >
                {showAllTransactions ? 'Свернуть' : 'Показать все'}
             </button>
          )}
        </div>

        <div className="space-y-6">
            {monthData.txs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Icon name="receipt" size={48} className="mb-3 opacity-20" />
                    <p className="text-sm font-medium">В этом месяце пока пусто</p>
                </div>
            ) : (
                Object.keys(groupedTransactions).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(dateKey => (
                    <div key={dateKey} className="animate-in slide-in-from-bottom-2 fade-in duration-500">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-2 sticky top-0 bg-slate-50 dark:bg-[#0f1115] z-10 py-1">
                            {getDateLabel(dateKey)}
                        </div>
                        <div className="space-y-3">
                            {groupedTransactions[dateKey].map(tx => (
                                <div 
                                    key={tx.id} 
                                    onClick={() => onEditTransaction(tx)}
                                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-transform cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div 
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md text-xl shrink-0"
                                            style={{ backgroundColor: tx.type === TransactionType.EXPENSE ? getCategoryColor(tx.categoryId) : '#10b981' }}
                                        >
                                            <Icon name={tx.type === TransactionType.INCOME ? 'wallet' : getCategoryIcon(tx.categoryId)} size={22} />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{getCategoryName(tx.categoryId)}</h4>
                                            {tx.note && <p className="text-xs text-slate-400 font-medium truncate pr-2">{tx.note}</p>}
                                        </div>
                                    </div>
                                    <div className={`font-bold text-base whitespace-nowrap ${tx.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                        {tx.type === TransactionType.INCOME ? '+' : '-'}{Math.abs(tx.amount).toLocaleString('ru-RU')} ₽
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
