
import React, { useState, useEffect } from 'react';
import { Subscription, TransactionType, SubscriptionLevel } from '../types';
import { getCategories, saveTransaction } from '../services/storage';
import { api } from '../services/api';
import PremiumBlock from './PremiumBlock';
import Icon from './Icon';
import SwipeableRow from './SwipeableRow';

interface SubscriptionsProps {
  onBack: () => void;
  onUpdate?: () => void;
  subscriptionLevel: SubscriptionLevel;
  onGoToSettings: () => void;
}

const Subscriptions: React.FC<SubscriptionsProps> = ({ onBack, onUpdate, subscriptionLevel, onGoToSettings }) => {
  const [externalSubs, setExternalSubs] = useState<Subscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  
  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  // Lock for FREE and PLUS users (Requires PRO+)
  if (subscriptionLevel === 'FREE' || subscriptionLevel === 'PLUS') {
      return (
          <div className="h-full flex flex-col">
              <div className="p-5 flex items-center gap-4">
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all">
                    <Icon name="arrow-left" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Мои Подписки</h2>
              </div>
              <PremiumBlock onGoToSettings={onGoToSettings} title="SaaS Подписки" />
          </div>
      );
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      try {
          const subs = await api.subscriptions.list();
          setExternalSubs(subs);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingSubs(false);
      }
  };

  const handleSaveExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !date) return;
    const categories = getCategories();
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
    await api.subscriptions.create(newSub);
    setExternalSubs(await api.subscriptions.list());
    setShowAdd(false);
    resetForm();
  };

  const handleDeleteExternal = async (id: string) => {
    if (confirm('Удалить подписку?')) {
      await api.subscriptions.delete(id);
      setExternalSubs(await api.subscriptions.list());
    }
  };

  const handleLogPayment = async (sub: Subscription) => {
    if (!confirm(`Списать ${sub.amount} ₽? Это добавит расход в статистику.`)) return;
    saveTransaction({
        id: crypto.randomUUID(),
        amount: sub.amount,
        type: TransactionType.EXPENSE,
        currency: 'RUB',
        categoryId: sub.categoryId,
        date: new Date().toISOString().split('T')[0],
        note: `Подписка: ${sub.name}`
    });
    const nextDate = new Date(sub.nextPaymentDate);
    if (sub.billingPeriod === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);
    else nextDate.setFullYear(nextDate.getFullYear() + 1);
    await api.subscriptions.update(sub.id, { nextPaymentDate: nextDate.toISOString().split('T')[0] });
    setExternalSubs(await api.subscriptions.list());
    if (onUpdate) onUpdate();
    alert("Платеж записан!");
  };

  const resetForm = () => { setName(''); setAmount(''); setDate(''); setPeriod('MONTHLY'); };
  const totalMonthly = externalSubs.reduce((acc, s) => s.isActive ? acc + (s.billingPeriod === 'MONTHLY' ? s.amount : s.amount / 12) : acc, 0);

  return (
    <div className="p-5 space-y-8 h-full flex flex-col animate-page-enter pb-32">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all">
          <Icon name="arrow-left" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Мои Подписки</h2>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-end mb-5 px-1">
              <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Список сервисов</h3>
                  <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Расход в месяц:</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                        {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalMonthly)}
                      </span>
                  </div>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
            {loadingSubs ? <div className="text-center py-10 text-slate-400">Загрузка...</div> : 
             externalSubs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem]">
                    <Icon name="layers" size={48} className="mb-4 opacity-20" />
                    <p className="font-medium">Добавьте свои сервисы (Netflix, Yandex...)</p>
                    <button onClick={() => setShowAdd(true)} className="mt-4 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm">Добавить</button>
                </div>
            ) : (
                externalSubs.map(sub => (
                    <SwipeableRow key={sub.id} onSwipeLeft={() => handleDeleteExternal(sub.id)} onSwipeRight={() => handleLogPayment(sub)} rightIcon="check" rightColor="bg-emerald-500">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold uppercase shadow-sm">
                                        {sub.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-lg">{sub.name}</h4>
                                        <p className="text-xs font-medium text-slate-400">{sub.amount} ₽ / {sub.billingPeriod === 'MONTHLY' ? 'мес' : 'год'}</p>
                                    </div>
                                </div>
                                <div className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg uppercase tracking-wide ${
                                    new Date(sub.nextPaymentDate) < new Date() ? 'bg-red-50 text-red-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                }`}>
                                    {new Date(sub.nextPaymentDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                </div>
                            </div>
                        </div>
                    </SwipeableRow>
                ))
            )}
          </div>
      </div>

      <button onClick={() => setShowAdd(true)} className="fixed bottom-24 right-5 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center z-40 animate-pop active:scale-90 transition-transform"><Icon name="plus" /></button>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 animate-in slide-in-from-bottom-10 shadow-2xl relative">
            <button onClick={() => setShowAdd(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><Icon name="x" size={16} /></button>
            <h3 className="text-2xl font-black mb-6 text-slate-800 dark:text-white">Новая подписка</h3>
            <form onSubmit={handleSaveExternal} className="space-y-5">
              <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 pl-1">Название</label>
                  <input placeholder="Netflix, Spotify..." className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-white" value={name} onChange={e => setName(e.target.value)} autoFocus required />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-2 pl-1">Сумма</label>
                     <input type="number" placeholder="299" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 dark:text-white" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                 <div className="w-1/3">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 pl-1">Период</label>
                    <select value={period} onChange={(e: any) => setPeriod(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none font-bold text-slate-800 dark:text-white appearance-none">
                       <option value="MONTHLY">Мес</option>
                       <option value="YEARLY">Год</option>
                     </select>
                 </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 pl-1">Дата списания</label>
                <input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-white" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-slate-300 dark:shadow-indigo-900/50 mt-4 active:scale-95 transition-transform">Добавить</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
