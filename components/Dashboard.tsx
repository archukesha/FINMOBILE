
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
  const [pendingIncome, setPendingIncome] = useState<number>(0);
  const [debtsDueSoon, setDebtsDueSoon] = useState<Debt[]>([]);

  useEffect(() => {
    setAchievements(getAchievements());
    const debts = getDebts();
    // Sum up OWE_ME debts
    const oweMe = debts.filter(d => d.type === 'OWE_ME').reduce((acc, d) => acc + d.amount, 0);
    setPendingIncome(oweMe);

    // Check I_OWE debts due in 3 days
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);
    
    const urgent = debts.filter(d => {
        if (d.type !== 'I_OWE' || !d.dueDate) return false;
        const due = new Date(d.dueDate);
        return due >= now && due <= threeDaysLater;
    });
    setDebtsDueSoon(urgent);

  }, [refreshTrigger]);

  const monthData = useMemo(() => {
    const txs = getTransactionsByMonth(currentDate);
    const income = txs.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expense = txs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    const saved = txs.filter(t => t.type === TransactionType.SAVING_DEPOSIT).reduce((acc, t) => acc + t.amount, 0);
    const withdrawn = txs.filter(t => t.type === TransactionType.SAVING_WITHDRAWAL).reduce((acc, t) => acc + t.amount, 0);
    
    return {
      txs: txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      income,
      expense,
      netSavings: saved - withdrawn,
      balance: income - expense
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, currentDate]);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Неизвестно';
  const getCategoryIcon = (id: string) => categories.find(c => c.id === id)?.icon || 'circle';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    onDateChange(newDate);
  };

  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const isCurrentMonth = new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
  
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);

  return (
    <div className="p-5 space-y-6">
      {/* Header with Navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <button 
                onClick={() => changeMonth(-1)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
                <Icon name="chevron-left" size={20} />
            </button>
            <div className="text-center w-32">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-none">
                    {capitalizedMonth}
                </h1>
                <p className="text-slate-400 text-xs mt-0.5">{currentDate.getFullYear()}</p>
            </div>
            <button 
                onClick={() => changeMonth(1)}
                className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${isCurrentMonth ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isCurrentMonth}
            >
                <Icon name="chevron-right" size={20} />
            </button>
        </div>
        
        {/* Profile & Badges */}
        <button 
            onClick={() => onNavigate('HUB')}
            className="flex items-center gap-2"
        >
            {unlockedAchievements.length > 0 && (
                <div className="flex -space-x-2">
                    {unlockedAchievements.slice(0, 3).map(ach => (
                        <div key={ach.id} className="w-6 h-6 rounded-full bg-yellow-100 border border-white dark:border-slate-900 flex items-center justify-center text-xs shadow-sm" title={ach.title}>
                            <Icon name={ach.icon} size={14} />
                        </div>
                    ))}
                    {unlockedAchievements.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-500 dark:text-slate-300">
                            +{unlockedAchievements.length - 3}
                        </div>
                    )}
                </div>
            )}
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm transition-transform active:scale-95">
                <div className="w-full h-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300">
                    <Icon name="user" size={20} />
                </div>
            </div>
        </button>
      </div>

      {/* Main Balance Card - Redesigned */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-colors">
        
        <div className="grid grid-cols-2 gap-6 relative z-10 mb-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Доход</span>
              <span className="text-2xl font-extrabold text-emerald-500 tracking-tight">
                {formatCurrency(monthData.income)}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Расход</span>
              <span className="text-2xl font-extrabold text-rose-500 tracking-tight">
                {formatCurrency(monthData.expense)}
              </span>
            </div>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-slate-100 dark:bg-slate-700 mb-4"></div>

        {/* Bottom Stats (Savings) */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 transition-colors">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Icon name="piggy-bank" size={16} />
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">В копилке</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatCurrency(monthData.netSavings)}</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xs font-bold text-slate-400">Баланс</div>
                <div className={`text-sm font-bold ${monthData.balance >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-500'}`}>
                    {monthData.balance > 0 ? '+' : ''}{formatCurrency(monthData.balance)}
                </div>
            </div>
        </div>
      </div>
      
      {/* Debt Due Soon Warning */}
      {debtsDueSoon.length > 0 && (
         <div 
            onClick={() => onNavigate('DEBTS')}
            className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 cursor-pointer"
         >
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
               <Icon name="alert-circle" size={24} />
            </div>
            <div>
               <p className="text-sm font-bold text-red-800 dark:text-red-200">Срок возврата долга!</p>
               <p className="text-xs text-red-600 dark:text-red-300">
                  {debtsDueSoon.length} долг(а) нужно вернуть в ближайшие 3 дня.
               </p>
            </div>
            <Icon name="chevron-right" className="ml-auto text-red-300" size={16} />
         </div>
      )}

      {/* Pending Income (Freelance) Alert */}
      {pendingIncome > 0 && (
         <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-white dark:bg-indigo-800 text-indigo-600 dark:text-indigo-200 flex items-center justify-center shadow-sm">
                     <Icon name="briefcase" size={20} />
                 </div>
                 <div>
                     <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Ожидается выплат</p>
                     <p className="text-lg font-black text-indigo-900 dark:text-indigo-100 leading-tight">{formatCurrency(pendingIncome)}</p>
                 </div>
             </div>
             <div className="text-right">
                 <button 
                    onClick={onOpenExpectedIncome}
                    className="flex items-center gap-1 bg-white dark:bg-indigo-800 px-3 py-1.5 rounded-lg text-indigo-600 dark:text-indigo-200 text-xs font-bold shadow-sm hover:shadow-md transition-shadow"
                 >
                    <span>История</span>
                    <Icon name="chevron-right" size={14} />
                 </button>
             </div>
         </div>
      )}

      {/* Smart Advice Snippet */}
      {monthData.expense > monthData.income && monthData.income > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-orange-500 mt-1"><Icon name="alert-triangle" /></span>
          <div>
            <p className="text-sm text-orange-900 dark:text-orange-200 font-bold">Осторожно</p>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1 leading-relaxed">
              Расходы в этом месяце превышают доходы. Проверьте категории «Развлечения» или «Шопинг».
            </p>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">История</h2>
          <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">Все</button>
        </div>
        
        <div className="space-y-3">
          {monthData.txs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 border-dashed transition-colors">
              <div className="text-4xl mb-2 opacity-50"><Icon name="file-text" size={48} /></div>
              <p>Нет операций за этот период</p>
            </div>
          ) : (
            monthData.txs.slice(0, 15).map((tx) => (
              <button 
                key={tx.id} 
                onClick={() => onEditTransaction(tx)}
                className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between active:scale-[0.98] transition-all border border-slate-50 dark:border-slate-700 group hover:border-blue-100 dark:hover:border-slate-600"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:shadow-md transition-shadow ${
                    tx.type === TransactionType.INCOME ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                    tx.type === TransactionType.SAVING_DEPOSIT ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                    'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400'
                  }`}>
                    <Icon name={getCategoryIcon(tx.categoryId)} size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{getCategoryName(tx.categoryId)}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {new Date(tx.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                      {tx.note && <span className="mx-1">•</span>}
                      {tx.note}
                    </div>
                  </div>
                </div>
                <div className={`font-bold text-base whitespace-nowrap ${
                  tx.type === TransactionType.INCOME ? 'text-emerald-500' : 
                  tx.type === TransactionType.EXPENSE ? 'text-slate-800 dark:text-slate-200' : 'text-blue-500'
                }`}>
                  {tx.type === TransactionType.INCOME ? '+' : tx.type === TransactionType.EXPENSE ? '-' : ''}
                  {formatCurrency(tx.amount)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;