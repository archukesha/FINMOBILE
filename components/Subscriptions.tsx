
import React, { useState, useEffect } from 'react';
import { Subscription, TransactionType, UserProfile, SubscriptionLevel } from '../types';
import { getCategories, saveTransaction, setSubscriptionLevel } from '../services/storage';
import { api } from '../services/api';
import Icon from './Icon';

interface SubscriptionsProps {
  onBack: () => void;
  onUpdate?: () => void;
}

const Subscriptions: React.FC<SubscriptionsProps> = ({ onBack, onUpdate }) => {
  // App Subscription State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [paymentPending, setPaymentPending] = useState(false);

  // External Subscriptions State
  const [externalSubs, setExternalSubs] = useState<Subscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  
  // Modals
  const [showAdd, setShowAdd] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      try {
          const [user, subs] = await Promise.all([
              api.auth.getMe(),
              api.subscriptions.list()
          ]);
          setUserProfile(user);
          setExternalSubs(subs);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingUser(false);
          setLoadingSubs(false);
      }
  };

  // --- APP SUBSCRIPTION LOGIC ---

  const handleAppPayment = async (plan: 'PRO_MONTHLY' | 'PRO_YEARLY' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY') => {
      setPaymentPending(true);
      try {
          // 1. Initiate
          const { confirmationUrl, providerPaymentId } = await api.payment.createPayment(plan);
          
          // 2. Open Payment Link
          if (window.Telegram?.WebApp) {
              window.Telegram.WebApp.openLink(confirmationUrl);
          } else {
              window.open(confirmationUrl, '_blank');
          }

          // 3. Poll for status (Mock simulation)
          // In reality, we'd wait for the user to return or use a webhook
          setTimeout(async () => {
              const res = await api.payment.checkStatus(providerPaymentId);
              if (res.status === 'SUCCEEDED') {
                  const newLevel = plan.includes('PREMIUM') ? 'PREMIUM' : 'PRO';
                  // Simulate backend updating the user
                  const newExpiry = new Date();
                  newExpiry.setMonth(newExpiry.getMonth() + (plan.includes('YEARLY') ? 12 : 1));
                  
                  // Optimistic Update
                  localStorage.setItem('finbot_sub_level', newLevel);
                  localStorage.setItem('finbot_sub_expiry', newExpiry.toISOString());
                  setSubscriptionLevel(newLevel);
                  
                  alert('Оплата прошла успешно! Подписка обновлена.');
                  fetchData(); // Refresh Profile
                  if (onUpdate) onUpdate();
              }
              setPaymentPending(false);
          }, 3000);

      } catch (e) {
          alert('Ошибка платежа');
          setPaymentPending(false);
      }
  };

  // --- EXTERNAL SUBSCRIPTIONS LOGIC ---

  const totalMonthly = externalSubs.reduce((acc, s) => {
    if (!s.isActive) return acc;
    return acc + (s.billingPeriod === 'MONTHLY' ? s.amount : s.amount / 12);
  }, 0);

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

    try {
        await api.subscriptions.create(newSub);
        setExternalSubs(await api.subscriptions.list());
        setShowAdd(false);
        resetForm();
    } catch (e) {
        alert('Не удалось сохранить');
    }
  };

  const handleDeleteExternal = async (id: string) => {
    if (confirm('Удалить подписку из списка?')) {
      await api.subscriptions.delete(id);
      setExternalSubs(await api.subscriptions.list());
    }
  };

  const handleLogPayment = async (sub: Subscription) => {
    // "Buy Month/Year" logic -> Create transaction and shift date
    const confirmMsg = `Списать ${sub.amount} ₽ и продлить на ${sub.billingPeriod === 'MONTHLY' ? 'месяц' : 'год'}?`;
    if (!confirm(confirmMsg)) return;

    // 1. Local Transaction
    saveTransaction({
        id: crypto.randomUUID(),
        amount: sub.amount,
        type: TransactionType.EXPENSE,
        categoryId: sub.categoryId,
        date: new Date().toISOString().split('T')[0],
        note: `Подписка: ${sub.name}`
    });

    // 2. Update Date via API
    const nextDate = new Date(sub.nextPaymentDate);
    if (sub.billingPeriod === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);
    else nextDate.setFullYear(nextDate.getFullYear() + 1);
    
    await api.subscriptions.update(sub.id, { nextPaymentDate: nextDate.toISOString().split('T')[0] });
    setExternalSubs(await api.subscriptions.list());
    if (onUpdate) onUpdate();
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setDate('');
    setPeriod('MONTHLY');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="p-5 space-y-8 h-full flex flex-col animate-page-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
          <Icon name="arrow-left" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Подписки</h2>
      </div>

      {/* --- APP SUBSCRIPTION CARD --- */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
         <div className="relative z-10">
             <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Ваш тариф</p>
                    <h3 className="text-3xl font-black">{userProfile?.subscriptionLevel || '...'}</h3>
                    {userProfile?.subscriptionExpiresAt && (
                        <p className="text-xs text-slate-300 mt-2 flex items-center gap-1">
                            <Icon name="clock" size={12} />
                            Истекает: {formatDate(userProfile.subscriptionExpiresAt)}
                        </p>
                    )}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl backdrop-blur-md">
                    <Icon name={userProfile?.subscriptionLevel === 'PREMIUM' ? 'crown' : userProfile?.subscriptionLevel === 'PRO' ? 'zap' : 'user'} />
                </div>
             </div>

             {/* Upgrade Options */}
             <div className="space-y-3 mt-6">
                {userProfile?.subscriptionLevel === 'FREE' && (
                    <button 
                        onClick={() => handleAppPayment('PRO_MONTHLY')}
                        disabled={paymentPending}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition-colors flex justify-between px-4 items-center"
                    >
                        <span>Купить PRO</span>
                        <span className="bg-blue-800/50 px-2 py-0.5 rounded text-xs">99 ₽ / мес</span>
                    </button>
                )}
                {userProfile?.subscriptionLevel !== 'PREMIUM' && (
                    <button 
                        onClick={() => handleAppPayment('PREMIUM_MONTHLY')}
                        disabled={paymentPending}
                        className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:to-orange-400 rounded-xl font-bold text-slate-900 text-sm transition-colors flex justify-between px-4 items-center"
                    >
                        <span>{userProfile?.subscriptionLevel === 'PRO' ? 'Улучшить до PREMIUM' : 'Купить PREMIUM'}</span>
                        <span className="bg-white/30 px-2 py-0.5 rounded text-xs">199 ₽ / мес</span>
                    </button>
                )}
                {paymentPending && <p className="text-center text-xs text-slate-400 animate-pulse">Обработка платежа...</p>}
             </div>
         </div>
         {/* Decor */}
         <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
      </div>

      {/* --- EXTERNAL SUBSCRIPTIONS --- */}
      <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-end mb-4">
              <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Внешние сервисы</h3>
                  <p className="text-xs text-slate-400">Итого в месяц: {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalMonthly)}</p>
              </div>
              <button onClick={() => setShowAdd(true)} className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                  <Icon name="plus" size={20} />
              </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pb-20 no-scrollbar">
            {loadingSubs ? (
                <div className="text-center py-10 text-slate-400">Загрузка...</div>
            ) : externalSubs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl">
                    <p>Нет подписок</p>
                </div>
            ) : (
                externalSubs.map(sub => (
                    <div key={sub.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-3 items-center">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg">
                                    <Icon name="credit-card" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white">{sub.name}</h4>
                                    <p className="text-xs text-slate-400">{sub.amount} ₽ / {sub.billingPeriod === 'MONTHLY' ? 'мес' : 'год'}</p>
                                </div>
                            </div>
                            <div className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                new Date(sub.nextPaymentDate) < new Date() ? 'bg-red-100 text-red-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                            }`}>
                                {new Date(sub.nextPaymentDate).toLocaleDateString()}
                            </div>
                        </div>
                        
                        <div className="flex gap-2 border-t border-slate-50 dark:border-slate-700 pt-3">
                            <button 
                                onClick={() => handleLogPayment(sub)}
                                className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                                Продлить
                            </button>
                            <button 
                                onClick={() => handleDeleteExternal(sub.id)}
                                className="py-2 px-3 bg-red-50 dark:bg-red-900/10 text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <Icon name="trash-2" size={14} />
                            </button>
                        </div>
                    </div>
                ))
            )}
          </div>
      </div>

      {/* Add External Sub Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 animate-in slide-in-from-bottom-10 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Добавить сервис</h3>
            <form onSubmit={handleSaveExternal} className="space-y-4">
              <input 
                placeholder="Название (Netflix, Яндекс...)" 
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
                <label className="text-xs text-slate-400 font-bold ml-1">Следующая оплата</label>
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
      )}
    </div>
  );
};

export default Subscriptions;
