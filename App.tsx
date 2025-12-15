
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import Analytics from './components/Analytics';
import Goals from './components/Goals';
import Advice from './components/Advice';
import AdviceModal from './components/AdviceModal';
import ProfileHub from './components/ProfileHub';
import Subscriptions from './components/Subscriptions';
import Debts from './components/Debts';
import Education from './components/Education';
import Reminders from './components/Reminders';
import Icon from './components/Icon';
import { ViewState, SubscriptionLevel, Transaction, TelegramUser } from './types';
import { getCategories, getSubscriptionLevel, setSubscriptionLevel, checkAchievements, getTheme, saveTheme } from './services/storage';
import { api } from './services/api';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  const [categories, setCategories] = useState(getCategories());
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const [subLevel, setSubLevel] = useState<SubscriptionLevel>('FREE');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // New Global States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [debtsInitialTab, setDebtsInitialTab] = useState<'I_OWE' | 'OWE_ME'>('I_OWE');
  
  // Subscription Billing Cycle
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  
  // Advice Modal State
  const [isAdviceOpen, setIsAdviceOpen] = useState(false);

  // Telegram User
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const initApp = async () => {
        // 1. Initialize Storage
        setSubLevel(getSubscriptionLevel());
        checkAchievements();
        
        // 2. Initialize Telegram Web App & Auth
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            
            // Get User Data
            if (tg.initDataUnsafe?.user) {
                setTgUser(tg.initDataUnsafe.user);
            }

            // --- AUTHENTICATION FLOW ---
            if (tg.initData) {
                try {
                    // Send initData to backend to verify signature and get JWT
                    const authResult = await api.auth.login(tg.initData);
                    console.log('Backend Auth Success:', authResult);
                    setIsAuthenticated(true);
                    // Sync subscription level from server
                    if (authResult.user.subscriptionLevel !== 'FREE') {
                        setSubLevel(authResult.user.subscriptionLevel);
                        setSubscriptionLevel(authResult.user.subscriptionLevel);
                    }
                } catch (e) {
                    console.error('Auth failed', e);
                }
            }

            // Sync Theme
            const applyTgTheme = () => {
                 if (tg.colorScheme === 'dark') {
                     saveTheme('DARK');
                     document.documentElement.classList.add('dark');
                 } else {
                     saveTheme('LIGHT');
                     document.documentElement.classList.remove('dark');
                 }
            };

            applyTgTheme();
            tg.onEvent('themeChanged', applyTgTheme);
        } else {
            // Browser Dev Mode
            saveTheme(getTheme());
            setIsAuthenticated(true); // Mock auth for browser
        }
    };

    initApp();
  }, []);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    checkAchievements();
  };

  const handleCategoryUpdate = () => {
    setCategories(getCategories());
  };

  const handleTransactionComplete = () => {
    refreshData();
    setEditingTransaction(null);
    setActiveView('DASHBOARD');
  };

  const handleGoToSettings = () => {
    setActiveView('HUB');
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setActiveView('ADD_TRANSACTION');
  };

  const handleNavigate = (view: ViewState) => {
    if (view === 'ADD_TRANSACTION' && activeView !== 'DASHBOARD') {
       setEditingTransaction(null);
    }
    // Default debts tab reset
    if (view === 'DEBTS') {
        setDebtsInitialTab('I_OWE'); 
    }
    setActiveView(view);
  };

  const handleOpenExpectedIncome = () => {
      setDebtsInitialTab('OWE_ME');
      setActiveView('DEBTS');
  };

  // --- YOOKASSA PAYMENT HANDLER ---
  const handlePayment = async (plan: 'PRO' | 'PREMIUM') => {
      const price = plan === 'PRO' 
          ? (billingPeriod === 'MONTHLY' ? 99 : 950)
          : (billingPeriod === 'MONTHLY' ? 199 : 1900);
      
      const planId = plan === 'PRO' 
        ? (billingPeriod === 'MONTHLY' ? 'PRO_MONTHLY' : 'PRO_YEARLY')
        : (billingPeriod === 'MONTHLY' ? 'PREMIUM_MONTHLY' : 'PREMIUM_YEARLY');

      if (!confirm(`Перейти к оплате ${plan} за ${price} ₽ через ЮKassa?`)) return;

      try {
          // 1. Get Payment Link from Backend
          const response = await api.payment.createPayment(planId);
          
          // 2. Open Yookassa in Telegram
          if (window.Telegram?.WebApp) {
              window.Telegram.WebApp.openLink(response.confirmationUrl);
          } else {
              window.open(response.confirmationUrl, '_blank');
          }

          // 3. Poll/Simulate Success (In real app, Webhook handles this)
          // For demo purposes, we simulate a successful callback
          setTimeout(async () => {
              const status = await api.payment.checkStatus(response.providerPaymentId);
              if (status.status === 'SUCCEEDED') {
                  setSubscriptionLevel(plan);
                  setSubLevel(plan);
                  alert(`Оплата прошла успешно! Ваш тариф: ${plan}`);
                  refreshData();
              }
          }, 4000);

      } catch (e) {
          alert('Ошибка создания платежа. Попробуйте позже.');
          console.error(e);
      }
  };

  const handleReset = () => {
    if(confirm('Вы уверены, что хотите удалить все локальные данные?')) {
      localStorage.clear(); 
      window.location.reload(); 
    }
  };

  // Pricing Constants
  const prices = {
      pro: {
          monthly: 99,
          yearly: 950, // Approx 20% off (99 * 12 * 0.8)
      },
      premium: {
          monthly: 199,
          yearly: 1900, // Approx 20% off (199 * 12 * 0.8)
      }
  };

  // Render view based on state
  const renderContent = () => {
    switch (activeView) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            categories={categories} 
            refreshTrigger={refreshTrigger} 
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onEditTransaction={handleEditTransaction}
            onOpenExpectedIncome={handleOpenExpectedIncome}
            onNavigate={handleNavigate}
          />
        );
      case 'ADD_TRANSACTION':
        return (
          <TransactionForm 
            categories={categories} 
            onComplete={handleTransactionComplete} 
            onCategoryUpdate={handleCategoryUpdate}
            subscriptionLevel={subLevel}
            onGoToSettings={handleGoToSettings}
            initialData={editingTransaction}
          />
        );
      case 'ANALYTICS':
        return (
          <Analytics 
            categories={categories} 
            subscriptionLevel={subLevel} 
            onGoToSettings={handleGoToSettings}
            currentDate={currentDate} 
          />
        );
      case 'GOALS':
        return <Goals refreshTrigger={refreshTrigger} subscriptionLevel={subLevel} onGoToSettings={handleGoToSettings} />;
      
      // NEW MODULES
      case 'HUB':
        return (
          <ProfileHub 
            subscriptionLevel={subLevel} 
            onNavigate={handleNavigate} 
            onReset={handleReset} 
            onOpenAdvice={() => setIsAdviceOpen(true)}
            telegramUser={tgUser}
          />
        );
      
      case 'SUBSCRIPTIONS':
        return <Subscriptions onBack={() => handleNavigate('HUB')} onUpdate={refreshData} />;
      
      case 'DEBTS':
        return <Debts onBack={() => handleNavigate('HUB')} initialTab={debtsInitialTab} />;

      case 'REMINDERS':
        return <Reminders onBack={() => handleNavigate('HUB')} />;

      case 'EDUCATION':
        return <Education onBack={() => handleNavigate('HUB')} />;

      case 'SETTINGS':
        return (
          <div className="space-y-6 animate-page-enter h-full flex flex-col">
             <div className="flex items-center gap-4 p-5">
               <button onClick={() => handleNavigate('HUB')} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <Icon name="arrow-left" />
               </button>
               <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Тарифы</h2>
             </div>
             <div className="p-5 pt-0 pb-32 flex-1 overflow-y-auto no-scrollbar">
                
                {/* Billing Cycle Toggle */}
                <div className="flex justify-center mb-8">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center relative shadow-inner">
                        <button 
                           onClick={() => setBillingPeriod('MONTHLY')}
                           className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all z-10 ${billingPeriod === 'MONTHLY' ? 'text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-600 shadow-md transform scale-105' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Ежемесячно
                        </button>
                        <button 
                           onClick={() => setBillingPeriod('YEARLY')}
                           className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all z-10 flex items-center gap-1 ${billingPeriod === 'YEARLY' ? 'text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-600 shadow-md transform scale-105' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Ежегодно
                            <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1">-20%</span>
                        </button>
                    </div>
                </div>

                {/* Current Status Banner */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 dark:bg-slate-950 p-8 mb-8 shadow-2xl shadow-slate-300 dark:shadow-black/50 border border-slate-800 dark:border-slate-800">
                    <div className="relative z-10 text-center">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl backdrop-blur-sm border border-white/10">
                         <Icon name="rocket" size={32} className="text-white" />
                      </div>
                      <h3 className="text-white font-black text-2xl mb-2">Больше возможностей</h3>
                      <p className="text-slate-400 text-sm mb-6 max-w-[80%] mx-auto leading-relaxed">
                        {subLevel === 'FREE' ? 'Вы используете базовую версию.' : `Ваш текущий план: ${subLevel}`}
                      </p>
                    </div>
                    {/* Abstract Decoration */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                {/* Pricing Cards */}
                <div className="space-y-6">
                     {/* PRO */}
                     {subLevel !== 'PRO' && subLevel !== 'PREMIUM' && (
                         <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative group overflow-hidden transition-colors">
                             <div className="flex justify-between items-center relative z-10 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl text-slate-600 dark:text-slate-300">
                                        <Icon name="zap" size={28} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-xl text-slate-800 dark:text-white">PRO</div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">Для начинающих</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-2xl text-slate-800 dark:text-white">
                                        {billingPeriod === 'MONTHLY' ? `${prices.pro.monthly} ₽` : `${prices.pro.yearly} ₽`}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium">
                                        {billingPeriod === 'MONTHLY' ? '/ месяц' : '/ год'}
                                    </div>
                                </div>
                             </div>

                             <ul className="space-y-3 mb-6 pl-1">
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"><Icon name="check" size={14} /></div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Расширенная аналитика</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"><Icon name="check" size={14} /></div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Финансовые цели</span>
                                </li>
                             </ul>

                             <button onClick={() => handlePayment('PRO')} className="w-full py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold rounded-2xl text-sm transition-colors relative z-10 active:scale-[0.98]">
                                 Подключить PRO
                             </button>
                         </div>
                     )}

                     {/* PREMIUM */}
                     {subLevel !== 'PREMIUM' && (
                         <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-1 shadow-xl shadow-indigo-200 dark:shadow-indigo-900/30 relative group">
                             <div className="bg-white dark:bg-slate-800 rounded-[1.4rem] p-6 h-full relative overflow-hidden">
                                 {/* Popular Badge */}
                                 <div className="absolute top-0 right-0 bg-amber-400 text-[10px] font-bold px-3 py-1.5 rounded-bl-xl text-amber-900 uppercase tracking-wider shadow-sm">
                                     Хит продаж
                                 </div>

                                 <div className="flex justify-between items-center mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center text-2xl shadow-lg shadow-orange-200 dark:shadow-none text-slate-900">
                                            <Icon name="crown" size={28} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-black text-slate-800 dark:text-white text-xl">PREMIUM</div>
                                            <div className="text-xs text-indigo-500 dark:text-indigo-300 font-bold uppercase tracking-wide">Полный контроль</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-2xl text-slate-800 dark:text-white">
                                            {billingPeriod === 'MONTHLY' ? `${prices.premium.monthly} ₽` : `${prices.premium.yearly} ₽`}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium">
                                            {billingPeriod === 'MONTHLY' ? '/ месяц' : '/ год'}
                                        </div>
                                    </div>
                                 </div>

                                 <div className="relative z-10 mb-6 pl-1">
                                     <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-full px-3 py-1">
                                        <span className="text-amber-500"><Icon name="star" size={12} className="fill-amber-500" /></span>
                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Выбор 92% пользователей</span>
                                     </div>
                                 </div>

                                 <ul className="space-y-3 mb-6 relative z-10 pl-1">
                                     <li className="flex items-center gap-3">
                                         <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400"><Icon name="check" size={14} /></div>
                                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Все функции PRO</span>
                                     </li>
                                     <li className="flex items-center gap-3">
                                         <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400"><Icon name="check" size={14} /></div>
                                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Свои категории расходов</span>
                                     </li>
                                     <li className="flex items-center gap-3">
                                         <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400"><Icon name="check" size={14} /></div>
                                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">AI-финансовый советник</span>
                                     </li>
                                 </ul>

                                 <button onClick={() => handlePayment('PREMIUM')} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 active:scale-[0.98] relative z-10">
                                     Подключить PREMIUM
                                 </button>
                             </div>
                         </div>
                     )}

                     {subLevel === 'PREMIUM' && (
                         <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-3xl text-center border border-emerald-100 dark:border-emerald-900/30 animate-in fade-in">
                             <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🎉</div>
                             <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">У вас максимальный тариф!</h3>
                             <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">Спасибо за поддержку проекта.</p>
                         </div>
                     )}
                </div>
             </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <Layout 
        activeView={activeView} 
        onNavigate={handleNavigate}
        onOpenAdvice={() => setIsAdviceOpen(true)}
      >
        <div key={activeView} className="animate-page-enter h-full">
          {renderContent()}
        </div>
      </Layout>

      <AdviceModal 
        isOpen={isAdviceOpen} 
        onClose={() => setIsAdviceOpen(false)} 
        subscriptionLevel={subLevel}
        onGoToSettings={handleGoToSettings}
      />
    </>
  );
};

export default App;
