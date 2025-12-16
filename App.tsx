
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import Analytics from './components/Analytics';
import Goals from './components/Goals';
import AdviceModal from './components/AdviceModal';
import ProfileHub from './components/ProfileHub';
import Subscriptions from './components/Subscriptions';
import Debts from './components/Debts';
import Education from './components/Education';
import Reminders from './components/Reminders';
import CalendarView from './components/CalendarView'; // New
import SplitBill from './components/SplitBill'; // New
import Onboarding from './components/Onboarding'; // New
import Icon from './components/Icon';
import { ViewState, SubscriptionLevel, Transaction, TelegramUser } from './types';
import { getCategories, getSubscriptionLevel, setSubscriptionLevel, checkAchievements, getTheme, saveTheme, hasSeenOnboarding, setSeenOnboarding, setSharedWalletId } from './services/storage';
import { api } from './services/api';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  const [categories, setCategories] = useState(getCategories());
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const [subLevel, setSubLevel] = useState<SubscriptionLevel>('FREE');
  
  // New Global States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [debtsInitialTab, setDebtsInitialTab] = useState<'I_OWE' | 'OWE_ME'>('I_OWE');
  
  // Settings State
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  
  // Advice Modal State
  const [isAdviceOpen, setIsAdviceOpen] = useState(false);

  // Telegram User
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);

  // New Features State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);

  useEffect(() => {
    const initApp = async () => {
        // 1. Initialize Storage
        setSubLevel(getSubscriptionLevel());
        checkAchievements();

        // 2. Check Onboarding
        if (!hasSeenOnboarding()) {
            setShowOnboarding(true);
        }
        
        // 3. Initialize Telegram Web App & Auth
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            
            // Get User Data
            if (tg.initDataUnsafe?.user) {
                setTgUser(tg.initDataUnsafe.user);
            }

            // Handle Start Params (Referrals / Shared Wallet)
            const startParam = tg.initDataUnsafe?.start_param;
            if (startParam) {
                if (startParam.startsWith('join_')) {
                    const walletId = startParam.replace('join_', '');
                    setSharedWalletId(walletId);
                    showToast('Вы присоединились к совместному бюджету!', 'success');
                } else if (startParam.startsWith('ref_')) {
                    showToast('Бонус за реферала активирован!', 'info');
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
        }
    };

    initApp();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    checkAchievements();
    setSubLevel(getSubscriptionLevel());
  };

  const handleCategoryUpdate = () => {
    setCategories(getCategories());
  };

  const handleTransactionComplete = () => {
    refreshData();
    setEditingTransaction(null);
    setActiveView('DASHBOARD');
    showToast('Операция сохранена');
  };

  const handleGoToSettings = () => {
    setActiveView('SETTINGS');
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setActiveView('ADD_TRANSACTION');
  };

  const handleNavigate = (view: ViewState) => {
    if (view === 'ADD_TRANSACTION' && activeView !== 'DASHBOARD') {
       setEditingTransaction(null);
    }
    if (view === 'DEBTS') {
        setDebtsInitialTab('I_OWE'); 
    }
    setActiveView(view);
  };

  const handleOpenExpectedIncome = () => {
      setDebtsInitialTab('OWE_ME');
      setActiveView('DEBTS');
  };

  const handleReset = () => {
    if(confirm('Вы уверены, что хотите удалить все локальные данные?')) {
      localStorage.clear(); 
      window.location.reload(); 
    }
  };

  const handleSelectTariff = (level: SubscriptionLevel) => {
      setSubscriptionLevel(level);
      setSubLevel(level);
      const periodLabel = billingPeriod === 'MONTHLY' ? 'Месяц' : 'Год';
      showToast(`Тариф изменен на ${level} (${periodLabel})`, 'success');
  };

  const getPrice = (monthly: number, yearly: number) => {
      return billingPeriod === 'MONTHLY' ? `${monthly} ₽` : `${yearly} ₽`;
  };

  const handleOnboardingComplete = () => {
      setSeenOnboarding();
      setShowOnboarding(false);
      refreshData(); // Force refresh to apply currency settings if any
  };

  if (showOnboarding) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
  }

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
            isPrivacyMode={isPrivacyMode}
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
            onBack={() => handleNavigate('DASHBOARD')}
          />
        );
      case 'GOALS':
        return (
          <Goals 
            refreshTrigger={refreshTrigger} 
            subscriptionLevel={subLevel} 
            onGoToSettings={handleGoToSettings} 
            onBack={() => handleNavigate('DASHBOARD')}
          />
        );
      
      case 'HUB':
        return (
          <ProfileHub 
            subscriptionLevel={subLevel} 
            onNavigate={handleNavigate} 
            onReset={handleReset} 
            onOpenAdvice={() => setIsAdviceOpen(true)}
            telegramUser={tgUser}
            onTogglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
            isPrivacyMode={isPrivacyMode}
          />
        );
      
      case 'SUBSCRIPTIONS':
        return <Subscriptions subscriptionLevel={subLevel} onBack={() => handleNavigate('HUB')} onUpdate={refreshData} onGoToSettings={handleGoToSettings} />;
      
      case 'DEBTS':
        return <Debts subscriptionLevel={subLevel} onBack={() => handleNavigate('HUB')} initialTab={debtsInitialTab} onGoToSettings={handleGoToSettings} />;

      case 'REMINDERS':
        return <Reminders onBack={() => handleNavigate('HUB')} />;

      case 'EDUCATION':
        return <Education subscriptionLevel={subLevel} onBack={() => handleNavigate('HUB')} onGoToSettings={handleGoToSettings} />;

      case 'CALENDAR':
        return <CalendarView onBack={() => handleNavigate('DASHBOARD')} />;

      case 'SPLIT_BILL':
        return <SplitBill onBack={() => handleNavigate('HUB')} />;

      case 'SETTINGS':
        return (
          <div className="space-y-6 animate-page-enter h-full flex flex-col">
             <div className="flex items-center gap-4 p-5 pb-2">
               <button onClick={() => handleNavigate('HUB')} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <Icon name="arrow-left" />
               </button>
               <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Тарифы</h2>
             </div>

             {/* Billing Toggle */}
             <div className="px-5">
                 <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl relative">
                     <button 
                        onClick={() => setBillingPeriod('MONTHLY')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all z-10 ${billingPeriod === 'MONTHLY' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-slate-400'}`}
                     >
                         Ежемесячно
                     </button>
                     <button 
                        onClick={() => setBillingPeriod('YEARLY')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all z-10 relative ${billingPeriod === 'YEARLY' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-slate-400'}`}
                     >
                         Ежегодно
                         {billingPeriod !== 'YEARLY' && (
                             <span className="absolute -top-2 -right-1 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm animate-bounce-slow">
                                -17%
                             </span>
                         )}
                     </button>
                 </div>
             </div>

             <div className="p-5 pt-0 pb-32 flex-1 overflow-y-auto no-scrollbar space-y-4">
                
                {/* FREE */}
                <div onClick={() => handleSelectTariff('FREE')} className={`border-2 p-5 rounded-3xl relative overflow-hidden transition-all ${subLevel === 'FREE' ? 'border-indigo-500 bg-white dark:bg-slate-800' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-black text-xl text-slate-800 dark:text-white">FREE</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase">Базовый старт</p>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-slate-800 dark:text-white text-lg">0 ₽</span>
                            <span className="block text-[10px] text-slate-400 font-medium">навсегда</span>
                        </div>
                    </div>
                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <li>• Учет доходов и расходов</li>
                        <li>• Стандартные категории</li>
                    </ul>
                    {subLevel === 'FREE' && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] px-3 py-1 rounded-bl-xl font-bold">АКТИВЕН</div>}
                </div>

                {/* PLUS */}
                <div onClick={() => handleSelectTariff('PLUS')} className={`border-2 p-5 rounded-3xl relative overflow-hidden transition-all ${subLevel === 'PLUS' ? 'border-blue-500 bg-white dark:bg-slate-800' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-black text-xl text-slate-800 dark:text-white">PLUS</h3>
                            <p className="text-xs font-bold text-blue-500 uppercase">Расширенный</p>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-slate-800 dark:text-white text-lg">{getPrice(99, 990)}</span>
                            <span className="block text-[10px] text-slate-400 font-medium">{billingPeriod === 'MONTHLY' ? '/ месяц' : '/ год'}</span>
                        </div>
                    </div>
                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <li>• Свои категории</li>
                        <li>• База знаний</li>
                        <li>• Финансовые цели</li>
                    </ul>
                    {subLevel === 'PLUS' && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-3 py-1 rounded-bl-xl font-bold">АКТИВЕН</div>}
                </div>

                {/* PRO */}
                <div onClick={() => handleSelectTariff('PRO')} className={`border-2 p-5 rounded-3xl relative overflow-hidden transition-all ${subLevel === 'PRO' ? 'border-purple-500 bg-white dark:bg-slate-800' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-black text-xl text-slate-800 dark:text-white">PRO</h3>
                            <p className="text-xs font-bold text-purple-500 uppercase">Профессионал</p>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-slate-800 dark:text-white text-lg">{getPrice(199, 1990)}</span>
                            <span className="block text-[10px] text-slate-400 font-medium">{billingPeriod === 'MONTHLY' ? '/ месяц' : '/ год'}</span>
                        </div>
                    </div>
                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <li>• Все функции PLUS</li>
                        <li>• Учет Долгов и Кредитов</li>
                        <li>• Аналитика и Графики</li>
                        <li>• Мои Подписки (SaaS)</li>
                    </ul>
                    {subLevel === 'PRO' && <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] px-3 py-1 rounded-bl-xl font-bold">АКТИВЕН</div>}
                </div>

                {/* MAX */}
                <div onClick={() => handleSelectTariff('MAX')} className={`border-2 p-5 rounded-3xl relative overflow-hidden transition-all ${subLevel === 'MAX' ? 'border-amber-500 bg-white dark:bg-slate-800' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-black text-xl text-slate-800 dark:text-white">MAX</h3>
                            <p className="text-xs font-bold text-amber-500 uppercase">Максимальный</p>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-slate-800 dark:text-white text-lg">{getPrice(499, 4990)}</span>
                            <span className="block text-[10px] text-slate-400 font-medium">{billingPeriod === 'MONTHLY' ? '/ месяц' : '/ год'}</span>
                        </div>
                    </div>
                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <li>• Все функции PRO</li>
                        <li>• AI Финансовый Советник</li>
                        <li>• Приоритетная поддержка</li>
                    </ul>
                    {subLevel === 'MAX' && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] px-3 py-1 rounded-bl-xl font-bold">АКТИВЕН</div>}
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

      {/* Toast Notification */}
      {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-pop ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 
              toast.type === 'info' ? 'bg-slate-800 text-white' : 
              'bg-emerald-500 text-white'
          }`}>
              <Icon name={toast.type === 'error' ? 'alert-circle' : 'check-circle'} size={20} />
              <span className="font-bold text-sm">{toast.msg}</span>
          </div>
      )}

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
