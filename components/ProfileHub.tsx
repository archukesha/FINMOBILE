import React, { useEffect, useState } from 'react';
import { ViewState, SubscriptionLevel, Achievement, Theme, TelegramUser } from '../types';
import { getAchievements, checkAchievements, getTheme, saveTheme } from '../services/storage';
import Icon from './Icon';

interface ProfileHubProps {
  subscriptionLevel: SubscriptionLevel;
  onNavigate: (view: ViewState) => void;
  onReset: () => void;
  onOpenAdvice?: () => void;
  telegramUser?: TelegramUser | null;
}

const ProfileHub: React.FC<ProfileHubProps> = ({ subscriptionLevel, onNavigate, onReset, onOpenAdvice, telegramUser }) => {
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
        <div className="p-5 space-y-6 animate-in slide-in-from-right h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setShowAchievements(false)} 
                    className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
                >
                    <Icon name="arrow-left" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Достижения</h2>
            </div>
            
            {/* Stats & Progress */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-[2rem] text-white shadow-xl shadow-orange-200 dark:shadow-orange-900/20 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl"></div>
                <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-yellow-300 opacity-20 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-inner border border-white/20">
                        🏆
                    </div>
                    <h3 className="font-black text-3xl mb-1">{unlockedCount} / {achievements.length}</h3>
                    <p className="text-orange-50 font-medium text-sm mb-6">наград получено</p>
                    
                    <div className="w-full h-3 bg-black/10 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                            className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-3 pb-24 overflow-y-auto flex-1 no-scrollbar">
                {achievements.map(ach => (
                    <div 
                        key={ach.id} 
                        className={`p-4 rounded-3xl border flex items-center gap-4 transition-all duration-300 ${
                            ach.isUnlocked 
                                ? 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-900/50 shadow-sm' 
                                : 'bg-slate-100 dark:bg-slate-900 border-transparent opacity-60 grayscale'
                        }`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                            ach.isUnlocked 
                             ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-600 dark:text-amber-400' 
                             : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}>
                            <Icon name={ach.icon} size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-slate-800 dark:text-white text-base">{ach.title}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight font-medium">{ach.description}</div>
                        </div>
                        {ach.isUnlocked && (
                             <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-md transform rotate-12">
                                <Icon name="check" size={12} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
  }

  // --- MAIN HUB VIEW ---
  return (
    <div className="p-5 space-y-8 animate-page-enter">
      {/* Profile Header Card */}
      <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/50 to-transparent dark:from-blue-900/20 rounded-bl-[100%] transition-transform group-hover:scale-110 duration-700"></div>
          
          <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="relative">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-slate-100 dark:bg-slate-700 p-1 shadow-inner overflow-hidden">
                        {telegramUser?.photo_url ? (
                            <img src={telegramUser.photo_url} alt="User" className="w-full h-full object-cover rounded-[1.2rem]" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-600 rounded-[1.2rem] text-slate-400">
                                <Icon name="user" size={32} />
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                             subscriptionLevel === 'MAX' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                             subscriptionLevel === 'PRO' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600' :
                             subscriptionLevel === 'PLUS' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                             'bg-slate-400'
                        }`}>
                             {subscriptionLevel === 'MAX' ? 'MAX' : subscriptionLevel === 'PRO' ? 'PRO' : subscriptionLevel === 'PLUS' ? 'PLUS' : 'FREE'}
                        </div>
                    </div>
                </div>
                
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-2">
                        {telegramUser ? telegramUser.first_name : 'Гость'}
                    </h2>
                    {subscriptionLevel === 'FREE' ? (
                         <button onClick={() => onNavigate('SUBSCRIPTIONS')} className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                            Улучшить тариф
                         </button>
                    ) : (
                        <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Активная подписка
                        </div>
                    )}
                </div>
              </div>

              <button 
                onClick={toggleTheme}
                className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors border border-slate-100 dark:border-slate-600 active:scale-95"
              >
                  <Icon name={theme === 'LIGHT' ? 'moon' : 'sun'} size={22} />
              </button>
          </div>
      </div>

      {/* Modules Grid */}
      <div>
         <h3 className="font-bold text-slate-800 dark:text-white mb-5 text-lg px-2">Мои Сервисы</h3>
         <div className="grid grid-cols-2 gap-4">
            
            <button 
                onClick={() => onNavigate('SUBSCRIPTIONS')} 
                className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-start gap-4 hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden"
            >
               <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-bl-full transition-transform group-hover:scale-150 duration-500"></div>
               <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                   <Icon name="calendar" size={24} />
               </div>
               <div>
                   <span className="block font-bold text-slate-800 dark:text-white text-base">Подписки</span>
                   <span className="text-xs text-slate-400">Управление</span>
               </div>
            </button>

            <button 
                onClick={() => onNavigate('DEBTS')} 
                className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-start gap-4 hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden"
            >
               <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/5 rounded-bl-full transition-transform group-hover:scale-150 duration-500"></div>
               <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                   <Icon name="users" size={24} />
               </div>
               <div>
                   <span className="block font-bold text-slate-800 dark:text-white text-base">Долги</span>
                   <span className="text-xs text-slate-400">Учет возвратов</span>
               </div>
            </button>

            <button 
                onClick={() => onNavigate('REMINDERS')} 
                className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-start gap-4 hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden"
            >
               <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full transition-transform group-hover:scale-150 duration-500"></div>
               <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                   <Icon name="bell" size={24} />
               </div>
               <div>
                   <span className="block font-bold text-slate-800 dark:text-white text-base">Напоминания</span>
                   <span className="text-xs text-slate-400">Платежи и дела</span>
               </div>
            </button>

            <button 
                onClick={onOpenAdvice} 
                className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-start gap-4 hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden"
            >
               <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full transition-transform group-hover:scale-150 duration-500"></div>
               <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
                   <Icon name="sparkles" size={24} />
               </div>
               <div>
                   <span className="block font-bold text-slate-800 dark:text-white text-base">AI Советник</span>
                   <span className="text-xs text-slate-400">Анализ трат</span>
               </div>
            </button>

             {/* Achievements (Wide) */}
            <button 
                onClick={() => setShowAchievements(true)} 
                className="col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-5 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 flex items-center justify-between active:scale-[0.99] transition-transform group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-amber-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Icon name="trophy" size={24} />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-slate-800 dark:text-white text-base">Мои достижения</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{unlockedCount} из {achievements.length} получено</div>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                    <Icon name="chevron-right" size={20} />
                </div>
            </button>

            {/* Education (Full Width) */}
            <button onClick={() => onNavigate('EDUCATION')} className="col-span-2 bg-slate-900 dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl shadow-slate-200 dark:shadow-black/50 flex items-center justify-between text-white group relative overflow-hidden active:scale-[0.99] transition-transform">
               <div className="absolute right-0 top-0 w-40 h-40 bg-indigo-500 opacity-20 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
               <div className="flex items-center gap-5 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-colors"><Icon name="book-open" /></div>
                  <div className="text-left">
                     <div className="font-bold text-lg">База знаний</div>
                     <div className="text-xs text-slate-400 font-medium">Повышайте грамотность</div>
                  </div>
               </div>
               <div className="relative z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Icon name="arrow-right" size={20} /></div>
            </button>
         </div>
      </div>

      {/* Settings & Danger Zone */}
      <div className="space-y-3 pb-24">
         <button onClick={() => onNavigate('SETTINGS')} className="w-full bg-white dark:bg-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-700 active:scale-[0.99] transition-transform group">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                   <Icon name="settings" size={20} />
               </div>
               <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Настройки и Тарифы</span>
            </div>
            <Icon name="chevron-right" size={18} className="text-slate-300 dark:text-slate-600" />
         </button>
         
         <button onClick={onReset} className="w-full bg-red-50 dark:bg-red-900/10 rounded-3xl p-5 flex items-center justify-center gap-2 text-red-500 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
            <Icon name="trash-2" size={18} />
            <span>Сбросить данные</span>
         </button>

         <div className="text-center text-[10px] text-slate-300 dark:text-slate-600 pt-4">
             FinBot Mobile • Версия 3.0.0 (Design Update)
         </div>
      </div>
    </div>
  );
};

export default ProfileHub;