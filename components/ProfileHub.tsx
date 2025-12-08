
import React, { useEffect, useState } from 'react';
import { ViewState, SubscriptionLevel, Achievement, Theme } from '../types';
import { getAchievements, checkAchievements, getTheme, saveTheme } from '../services/storage';
import Icon from './Icon';

interface ProfileHubProps {
  subscriptionLevel: SubscriptionLevel;
  onNavigate: (view: ViewState) => void;
  onReset: () => void;
  onOpenAdvice?: () => void;
}

const ProfileHub: React.FC<ProfileHubProps> = ({ subscriptionLevel, onNavigate, onReset, onOpenAdvice }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [theme, setTheme] = useState<Theme>('LIGHT');

  useEffect(() => {
    checkAchievements();
    setAchievements(getAchievements());
    setTheme(getTheme());
  }, []);

  const toggleTheme = () => {
      const newTheme = theme === 'LIGHT' ? 'DARK' : 'LIGHT';
      setTheme(newTheme);
      saveTheme(newTheme);
  };

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const progress = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  // --- DETAILED ACHIEVEMENTS VIEW ---
  if (showAchievements) {
    return (
        <div className="p-5 space-y-6 animate-in slide-in-from-right h-full flex flex-col">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setShowAchievements(false)} 
                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <Icon name="arrow-left" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Достижения</h2>
            </div>
            
            {/* Stats & Progress */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg shadow-yellow-100 dark:shadow-yellow-900/10 border border-yellow-50 dark:border-yellow-900/30 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                <div className="relative z-10">
                    <div className="text-5xl mb-3 filter drop-shadow-sm">🏆</div>
                    <h3 className="font-black text-2xl text-slate-800 dark:text-white">{unlockedCount} из {achievements.length}</h3>
                    <p className="text-slate-400 text-sm mb-5 font-medium">получено наград</p>
                    
                    <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-1000 relative" 
                            style={{ width: `${progress}%` }}
                        >
                             <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                    <div className="text-right mt-1 text-[10px] font-bold text-amber-500">{progress}%</div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-3 pb-24 overflow-y-auto flex-1 no-scrollbar">
                {achievements.map(ach => (
                    <div 
                        key={ach.id} 
                        className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                            ach.isUnlocked 
                                ? 'bg-white dark:bg-slate-800 border-yellow-200 dark:border-yellow-900/50 shadow-sm' 
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60 grayscale'
                        }`}
                    >
                        <div className="text-4xl shrink-0 filter drop-shadow-sm flex items-center justify-center w-12 h-12">
                            <Icon name={ach.icon} size={32} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 dark:text-white text-sm">{ach.title}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{ach.description}</div>
                            {ach.isUnlocked && (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-2 uppercase tracking-wider flex items-center gap-1">
                                    <Icon name="check" size={12} /> Получено
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  // --- MAIN HUB VIEW ---
  return (
    <div className="p-5 space-y-8 animate-page-enter">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-200 dark:shadow-blue-900/50">
            <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full border-4 border-transparent overflow-hidden flex items-center justify-center text-slate-200 dark:text-slate-600">
                <Icon name="user" size={40} />
            </div>
            </div>
            <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Мой профиль</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border ${
                subscriptionLevel === 'PREMIUM' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' : 
                subscriptionLevel === 'PRO' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
                }`}>
                {subscriptionLevel}
                </span>
                {subscriptionLevel === 'FREE' && (
                <button onClick={() => onNavigate('SETTINGS')} className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline">Улучшить</button>
                )}
            </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <button 
             onClick={toggleTheme}
             className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-yellow-400 transition-colors"
          >
              <Icon name={theme === 'LIGHT' ? 'moon' : 'sun'} size={20} />
          </button>
      </div>

      {/* Modules Grid */}
      <div>
         <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-lg">Сервисы</h3>
         <div className="grid grid-cols-2 gap-4">
            {/* 1. Subscriptions */}
            <button onClick={() => onNavigate('SUBSCRIPTIONS')} className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95 group">
               <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Icon name="calendar" size={24} /></div>
               <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Подписки</span>
            </button>

            {/* 2. Debts */}
            <button onClick={() => onNavigate('DEBTS')} className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95 group">
               <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Icon name="users" size={24} /></div>
               <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Долги</span>
            </button>

            {/* 3. Achievements (Moved to button) */}
            <button 
                onClick={() => setShowAchievements(true)} 
                className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95 group relative overflow-hidden"
            >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                    <Icon name="trophy" size={24} />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm relative z-10">Достижения</span>
                <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md">
                    {unlockedCount}
                </span>
            </button>

            {/* 4. AI Advisor */}
            <button 
                onClick={onOpenAdvice} 
                className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95 group"
            >
               <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Icon name="sparkles" size={24} /></div>
               <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">AI Советник</span>
            </button>

            {/* 5. Education (Full Width) */}
            <button onClick={() => onNavigate('EDUCATION')} className="col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-3xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 flex items-center justify-between text-white group relative overflow-hidden active:scale-[0.99] transition-transform">
               <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
               <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl backdrop-blur-sm border border-white/10"><Icon name="book-open" /></div>
                  <div className="text-left">
                     <div className="font-bold text-lg">База знаний</div>
                     <div className="text-xs text-blue-100 font-medium">Курсы и статьи</div>
                  </div>
               </div>
               <div className="relative z-10"><Icon name="chevron-right" /></div>
            </button>
         </div>
      </div>

      {/* Legacy Settings Link */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
         <button onClick={() => onNavigate('SETTINGS')} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors">
            <div className="flex items-center gap-3">
               <div className="text-slate-400"><Icon name="settings" size={20} /></div>
               <span>Настройки и Тарифы</span>
            </div>
            <Icon name="chevron-right" size={16} className="text-slate-300 dark:text-slate-600" />
         </button>
         <div className="h-px bg-slate-50 dark:bg-slate-700 w-full"></div>
         <button onClick={onReset} className="w-full flex items-center justify-between p-5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 font-bold text-sm transition-colors">
            <div className="flex items-center gap-3">
               <Icon name="trash-2" size={20} />
               <span>Сброс данных</span>
            </div>
         </button>
      </div>

      <div className="text-center text-[10px] text-slate-300 dark:text-slate-600 pb-24">
         ID: {subscriptionLevel === 'PREMIUM' ? 'USER-8821-GOLD' : 'USER-GUEST'} • v2.5.0
      </div>
    </div>
  );
};

export default ProfileHub;