
import React, { useState, useEffect } from 'react';
import { Subscription, TransactionType } from '../types';
import { getSubscriptions, saveSubscription, deleteSubscription, getCategories, saveTransaction } from '../services/storage';
import Icon from './Icon';

interface SubscriptionsProps {
  onBack: () => void;
  onUpdate?: () => void;
}

const Subscriptions: React.FC<SubscriptionsProps> = ({ onBack, onUpdate }) => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const categories = getCategories();

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  useEffect(() => {
    setSubs(getSubscriptions());
  }, []);

  const totalMonthly = subs.reduce((acc, s) => {
    if (!s.isActive) return acc;
    return acc + (s.billingPeriod === 'MONTHLY' ? s.amount : s.amount / 12);
  }, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !date) return;

    const newSub: Subscription = {
      id: crypto.randomUUID(),
      name,
      amount: parseFloat(amount),
      currency: 'RUB',
      billingPeriod: period,
      nextPaymentDate: date,
      categoryId: categories.find(c => c.type === 'EXPENSE')?.id || 'exp_other',
      isActive: true
    };

    saveSubscription(newSub);
    setSubs(getSubscriptions());
    setShowAdd(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить подписку?')) {
      deleteSubscription(id);
      setSubs(getSubscriptions());
    }
  };

  const handlePay = (sub: Subscription) => {
    const confirmMsg = `Списать ${sub.amount} ₽ и добавить в расходы?`;
    if (confirm(confirmMsg)) {
        // 1. Create Transaction
        saveTransaction({
            id: crypto.randomUUID(),
            amount: sub.amount,
            type: TransactionType.EXPENSE,
            categoryId: sub.categoryId,
            date: new Date().toISOString().split('T')[0],
            note: `Подписка: ${sub.name}`
        });

        // 2. Update Next Payment Date
        const nextDate = new Date(sub.nextPaymentDate);
        if (sub.billingPeriod === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);
        else nextDate.setFullYear(nextDate.getFullYear() + 1);
        
        const updatedSub = { ...sub, nextPaymentDate: nextDate.toISOString().split('T')[0] };
        saveSubscription(updatedSub);
        setSubs(getSubscriptions());
        
        // 3. Force Global Refresh
        if (onUpdate) onUpdate();
    }
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setDate('');
    setPeriod('MONTHLY');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  return (
    <div className="p-5 space-y-6 h-full flex flex-col animate-page-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
          <Icon name="arrow-left" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Подписки</h2>
      </div>

      {/* Summary Card */}
      <div className="bg-slate-900 dark:bg-indigo-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-300 dark:shadow-indigo-900/50">
        <div className="text-sm text-slate-400 dark:text-indigo-200 font-medium uppercase tracking-wider mb-1">
          Ежемесячные траты
        </div>
        <div className="text-3xl font-black">
          {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalMonthly)}
        </div>
        <div className="text-xs text-slate-500 dark:text-indigo-300 mt-2">
          Включая {subs.filter(s => s.billingPeriod === 'YEARLY').length} годовых подписок
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-24 no-scrollbar">
        {subs.length === 0 && !showAdd && (
           <div className="text-center py-10 text-slate-400 dark:text-slate-600">
             <div className="text-4xl mb-2">📅</div>
             <p>Нет активных подписок</p>
           </div>
        )}

        {subs.map(sub => (
          <div key={sub.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shrink-0">
                <Icon name="calendar" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-800 dark:text-white truncate pr-2">{sub.name}</div>
                <div className="text-xs text-slate-400 truncate">
                  {sub.billingPeriod === 'MONTHLY' ? 'Мес.' : 'Год'} • {formatDate(sub.nextPaymentDate)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
               <div className="text-right">
                  <div className="font-bold text-slate-800 dark:text-white">{sub.amount} ₽</div>
                  <button 
                     onClick={() => handleDelete(sub.id)}
                     className="text-[10px] text-red-400 opacity-50 hover:opacity-100 p-1"
                  >
                     Удалить
                  </button>
               </div>
               <button 
                 onClick={() => handlePay(sub)}
                 className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-colors"
                 title="Списать"
               >
                  <Icon name="check" size={18} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Button / Modal */}
      {showAdd ? (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 animate-in slide-in-from-bottom-10 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Новая подписка</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <input 
                placeholder="Название (Netflix, Интернет...)" 
                className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                value={name} onChange={e => setName(e.target.value)} autoFocus required
              />
              <div className="flex gap-3">
                <input 
                  type="number" 
                  placeholder="Сумма" 
                  className="flex-1 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  value={amount} onChange={e => setAmount(e.target.value)} required
                />
                 <select 
                   value={period} 
                   onChange={(e: any) => setPeriod(e.target.value)}
                   className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-slate-800 dark:text-white"
                 >
                   <option value="MONTHLY">Мес</option>
                   <option value="YEARLY">Год</option>
                 </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold ml-1">Следующее списание</label>
                <input 
                  type="date" 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 mt-1 text-slate-800 dark:text-white"
                  value={date} onChange={e => setDate(e.target.value)} required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 text-slate-500 font-bold">Отмена</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowAdd(true)}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/50 flex items-center justify-center gap-2 active:scale-95 transition-transform fixed bottom-24 left-5 right-5 max-w-md mx-auto z-10"
        >
          <Icon name="plus" />
          <span>Добавить подписку</span>
        </button>
      )}
    </div>
  );
};

export default Subscriptions;