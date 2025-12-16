
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Category, TransactionType, Achievement, Debt, SmartInsight } from '../types';
import { getTransactionsByMonth, getAchievements, getDebts, deleteTransaction, getTransactions } from '../services/storage';
import { api } from '../services/api';
import { haptic } from '../services/telegram';
import Icon from './Icon';
import SwipeableRow from './SwipeableRow';

interface DashboardProps {
  categories: Category[];
  refreshTrigger: number;
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenExpectedIncome?: () => void;
  onNavigate: (view: string) => void;
  isPrivacyMode: boolean; // New Prop
}

const TransactionSkeleton = () => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
            <div className="space-y-2">
                <div className="w-24 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
        </div>
        <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ categories, refreshTrigger, currentDate, onDateChange, onEditTransaction, onOpenExpectedIncome, onNavigate, isPrivacyMode }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [smartInsight, setSmartInsight] = useState<SmartInsight | null>(null);
  
  // Filters & Search
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterMinAmount, setFilterMinAmount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    setAchievements(getAchievements());
    setDebts(getDebts());
    
    // Load Smart Insight
    api.ai.getSmartInsights(getTransactions()).then(insights => {
        if (insights.length > 0) setSmartInsight(insights[0]);
    });

    setTimeout(() => setLoading(false), 500);
  }, [refreshTrigger, currentDate]);

  const monthData = useMemo(() => {
    const txs = getTransactionsByMonth(currentDate);
    const income = txs.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expense = txs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    
    // Previous Month Comparison logic
    const prevDate = new Date(currentDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevTxs = getTransactionsByMonth(prevDate);
    const prevExpense = prevTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    
    const expenseDiff = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0;

    // Apply Filters & Search
    let filteredTxs = txs;
    if (filterType !== 'ALL') {
        filteredTxs = filteredTxs.filter(t => 
            filterType === 'INCOME' ? t.type === TransactionType.INCOME : t.type === TransactionType.EXPENSE
        );
    }
    if (filterMinAmount) {
        filteredTxs = filteredTxs.filter(t => t.amount >= filterMinAmount);
    }
    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        filteredTxs = filteredTxs.filter(t => 
            (t.note && t.note.toLowerCase().includes(lowerQ)) ||
            (t.amount.toString().includes(lowerQ))
        );
    }

    return {
      txs: filteredTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      income,
      expense,
      balance: income - expense,
      expenseDiff
    };
  }, [refreshTrigger, currentDate, filterType, filterMinAmount, searchQuery]);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Неизвестно';
  const getCategoryIcon = (id: string) => categories.find(c => c.id === id)?.icon || 'circle';
  const getCategoryColor = (id: string) => categories.find(c => c.id === id)?.color || '#94a3b8';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
  };

  const changeMonth = (offset: number) => {
    haptic.selection();
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    onDateChange(newDate);
  };

  const handleDeleteTx = (id: string) => {
      haptic.notification('warning');
      if (confirm('Удалить операцию?')) {
          deleteTransaction(id);
          window.location.reload(); 
      }
  };

  const groupedTransactions = useMemo(() => {
      const groups: Record<string, Transaction[]> = {};
      monthData.txs.forEach(tx => {
          if (!groups[tx.date]) groups[tx.date] = [];
          groups[tx.date].push(tx);
      });
      return groups;
  }, [monthData.txs]);

  const getDateLabel = (dateStr: string) => {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return 'Сегодня';
      if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
  };

  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const isCurrentMonth = new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
  
  return (
    <div className="p-5 space-y-6 animate-page-enter pb-32">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
         <div className="flex flex-col">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Баланс
                {monthData.balance < 0 && <span className="text-2xl animate-bounce">😢</span>}
            </h1>
         </div>
         <div className="flex gap-2">
            <button onClick={() => onNavigate('CALENDAR')} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform flex items-center justify-center text-slate-500">
                <Icon name="calendar" size={20} />
            </button>
            <button onClick={() => onNavigate('HUB')} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform flex items-center justify-center text-slate-500">
                <Icon name="user" size={20} />
            </button>
         </div>
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

      {/* Main Card */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-6 text-white shadow-2xl shadow-primary/20 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[80px] opacity-40 group-hover:opacity-50 transition-all duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600 rounded-full blur-[60px] opacity-30 group-hover:opacity-40 transition-all duration-1000"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center">
              
              <div className="flex w-full items-center justify-around mb-6 pt-2">
                  <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Icon name="arrow-up-right" size={14} /> Доход
                      </span>
                      <span className={`text-3xl font-black tracking-tight ${isPrivacyMode ? 'blur-md select-none' : ''}`}>{formatCurrency(monthData.income)}</span>
                  </div>
                  
                  <div className="w-px h-12 bg-white/10"></div>

                  <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Icon name="arrow-down-right" size={14} /> Расход
                      </span>
                      <span className={`text-3xl font-black tracking-tight ${isPrivacyMode ? 'blur-md select-none' : ''}`}>{formatCurrency(monthData.expense)}</span>
                  </div>
              </div>
              
              <div className={`bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-3 border border-white/5 w-full justify-center ${monthData.balance < 0 ? 'bg-red-500/20 border-red-500/30' : ''}`}>
                  <span className="text-xs text-slate-300 font-medium uppercase tracking-wide">Накопления:</span>
                  <span className={`text-lg font-bold ${monthData.balance >= 0 ? 'text-white' : 'text-red-300'} ${isPrivacyMode ? 'blur-md select-none' : ''}`}>
                      {monthData.balance > 0 ? '+' : ''}{formatCurrency(monthData.balance)}
                  </span>
              </div>

              {/* Period Comparison */}
              {monthData.expenseDiff !== 0 && (
                  <div className="mt-4 text-xs font-medium text-slate-400 bg-black/20 px-3 py-1 rounded-full">
                      Расходы {monthData.expenseDiff > 0 ? 'выросли' : 'снизились'} на {Math.abs(Math.round(monthData.expenseDiff))}% по сравнению с прошлым месяцем
                  </div>
              )}
          </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Поиск по операциям..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 outline-none text-sm font-medium dark:text-white focus:ring-2 focus:ring-primary/50"
          />
      </div>

      {/* Transactions List */}
      <div>
        <div className="space-y-6">
            {loading ? (
                <>
                    <TransactionSkeleton />
                    <TransactionSkeleton />
                    <TransactionSkeleton />
                </>
            ) : monthData.txs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Icon name="receipt" size={48} className="mb-3 opacity-20" />
                    <p className="text-sm font-medium">Ничего не найдено</p>
                </div>
            ) : (
                Object.keys(groupedTransactions).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(dateKey => (
                    <div key={dateKey} className="animate-in slide-in-from-bottom-2 fade-in duration-500">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-2 sticky top-0 bg-slate-50 dark:bg-[#0f1115] z-10 py-1">
                            {getDateLabel(dateKey)}
                        </div>
                        <div className="space-y-3">
                            {groupedTransactions[dateKey].map(tx => (
                                <SwipeableRow 
                                    key={tx.id}
                                    onSwipeLeft={() => handleDeleteTx(tx.id)}
                                    onSwipeRight={() => onEditTransaction(tx)}
                                    rightColor="bg-blue-500"
                                    rightIcon="edit-2"
                                >
                                    <div 
                                        onClick={() => { haptic.selection(); onEditTransaction(tx); }}
                                        className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-transform cursor-pointer"
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
                                                {tx.currency && tx.currency !== 'RUB' && (
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">{tx.originalAmount} {tx.currency}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`font-bold text-base whitespace-nowrap ${tx.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-slate-900 dark:text-white'} ${isPrivacyMode ? 'blur-sm' : ''}`}>
                                            {tx.type === TransactionType.INCOME ? '+' : '-'}{Math.abs(tx.amount).toLocaleString('ru-RU')} ₽
                                        </div>
                                    </div>
                                </SwipeableRow>
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
