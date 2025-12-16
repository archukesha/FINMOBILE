
import React, { useEffect, useState } from 'react';
import { ViewState, SubscriptionLevel, Achievement, Theme, TelegramUser, AccentColor, ACCENT_COLORS } from '../types';
import { getAchievements, checkAchievements, getTheme, saveTheme, getAccentColor, saveAccentColor } from '../services/storage';
import { haptic } from '../services/telegram';
import Icon from './Icon';

interface ProfileHubProps {
  subscriptionLevel: SubscriptionLevel;
  onNavigate: (view: ViewState) => void;
  onReset: () => void;
  onOpenAdvice?: () => void;
  telegramUser?: TelegramUser | null;
  onTogglePrivacy: () => void;
  isPrivacyMode: boolean;
}

const ProfileHub: React.FC<ProfileHubProps> = ({ subscriptionLevel, onNavigate, onReset, onOpenAdvice, telegramUser, onTogglePrivacy, isPrivacyMode }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [theme, setTheme] = useState<Theme>('LIGHT');
  const [accent, setAccent] = useState<AccentColor>('INDIGO');
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    checkAchievements();
    setAchievements(getAchievements());
    setTheme(getTheme());
    setAccent(getAccentColor());
  }, []);

  const toggleTheme = () => {
      haptic.impact('light');
      const newTheme = theme === 'LIGHT' ? 'DARK' : 'LIGHT';
      setTheme(newTheme);
      saveTheme(newTheme);
  };

  const changeAccent = (color: AccentColor) => {
      haptic.selection();
      setAccent(color);
      saveAccentColor(color);
  };

  const handleShare = () => {
      const inviteLink = `https://t.me/FinBotMobile?start=ref_${telegramUser?.id || 'guest'}`;
      if (window.Telegram?.WebApp?.openTelegramLink) {
           const text = encodeURIComponent("Управляй финансами как профи!");
           const url = `https://t.me/share/url?url=${inviteLink}&text=${text}`;
           window.Telegram.WebApp.openTelegramLink(url);
      } else {
           if (navigator.share) {
               navigator.share({
                   title: 'FinBot Mobile',
                   text: 'Управляй финансами как профи!',
                   url: inviteLink
               }).catch(console.error);
           } else {
               navigator.clipboard.writeText(inviteLink);
               alert("Ссылка скопирована: " + inviteLink);
           }
      }
  };

  const handleDonate = () => {
      alert("В MVP демо-версии оплата через Stars эмулируется.");
  };

  const handleInviteToBudget = () => {
      const uniqueId = Math.random().toString(36).substr(2, 9);
      const link = `https://t.me/FinBotMobile?start=join_${uniqueId}`;
      navigator.clipboard.writeText(link);
      alert("Ссылка на совместный бюджет скопирована! Отправь её партнеру: " + link);
  };

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalAchievements = achievements.length;
  const achievementProgress = Math.round((unlockedCount / totalAchievements) * 100);

  return (
    <div className="p-5 space-y-6 animate-page-enter pb-24">
      {/* Profile Header Card */}
      <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-[100%] transition-transform group-hover:scale-110 duration-700"></div>
          
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
                        {subscriptionLevel !== 'FREE' && (
                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg border-2 border-white dark:border-slate-800 shadow-sm">
                                {subscriptionLevel}
                            </div>
                        )}
                    </div>
                </div>
                
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-2">
                        {telegramUser ? telegramUser.first_name : 'Гость'}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={onTogglePrivacy} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isPrivacyMode ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon name={isPrivacyMode ? 'eye-off' : 'eye'} size={12} />
                            {isPrivacyMode ? 'Скрыто' : 'Баланс'}
                        </button>
                    </div>
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
      
      {/* Achievements Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] p-5 text-white shadow-lg relative overflow-hidden cursor-pointer" onClick={() => setShowAchievements(!showAchievements)}>
          <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Icon name="trophy" size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg leading-tight">Достижения</h3>
                      <p className="text-xs text-indigo-100 opacity-80">{unlockedCount} из {totalAchievements} открыто</p>
                  </div>
              </div>
              <Icon name={showAchievements ? "chevron-up" : "chevron-down"} />
          </div>
          <div className="mt-4 h-1.5 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/90 transition-all duration-1000" style={{width: `${achievementProgress}%`}}></div>
          </div>
          
          {showAchievements && (
              <div className="mt-4 grid grid-cols-4 gap-2 animate-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                  {achievements.map(ach => (
                      <div key={ach.id} onClick={() => setSelectedAchievement(ach)} className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-transform active:scale-95 ${ach.isUnlocked ? 'bg-white/20 text-white cursor-pointer' : 'bg-black/20 text-white/30 grayscale'}`}>
                          <Icon name={ach.icon} size={20} />
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* Main Navigation (Restored + Goals) */}
      <div className="grid grid-cols-2 gap-3">
          {/* GOALS / PIGGY BANK BUTTON (ADDED) */}
          <button onClick={() => onNavigate('GOALS')} className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] flex items-center gap-3 border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all shadow-sm col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30"><Icon name="piggy-bank" size={24} /></div>
              <div className="text-left">
                  <span className="block font-black text-slate-800 dark:text-white text-base">Копилка и Цели</span>
                  <span className="text-xs text-slate-400">Накопления</span>
              </div>
              <Icon name="chevron-right" className="ml-auto text-slate-300" />
          </button>

          <button onClick={() => onNavigate('SUBSCRIPTIONS')} className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] flex items-center gap-3 border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center"><Icon name="layers" size={20} /></div>
              <div className="text-left">
                  <span className="block font-bold text-slate-800 dark:text-white text-sm">Подписки</span>
                  <span className="text-[10px] text-slate-400">Регулярные</span>
              </div>
          </button>

          <button onClick={() => onNavigate('DEBTS')} className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] flex items-center gap-3 border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center"><Icon name="hand-coins" size={20} /></div>
              <div className="text-left">
                  <span className="block font-bold text-slate-800 dark:text-white text-sm">Долги</span>
                  <span className="text-[10px] text-slate-400">Кредиты</span>
              </div>
          </button>

          <button onClick={() => onNavigate('EDUCATION')} className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] flex items-center gap-3 border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center"><Icon name="book-open" size={20} /></div>
              <div className="text-left">
                  <span className="block font-bold text-slate-800 dark:text-white text-sm">Знания</span>
                  <span className="text-[10px] text-slate-400">Статьи</span>
              </div>
          </button>

          <button onClick={() => onNavigate('REMINDERS')} className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] flex items-center gap-3 border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center"><Icon name="bell" size={20} /></div>
              <div className="text-left">
                  <span className="block font-bold text-slate-800 dark:text-white text-sm">События</span>
                  <span className="text-[10px] text-slate-400">Напоминания</span>
              </div>
          </button>
      </div>

      {/* Tools Section (New Features) */}
      <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase px-2">Инструменты</h4>
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-2 shadow-sm border border-slate-100 dark:border-slate-700">
              <button onClick={() => onNavigate('SPLIT_BILL')} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"><Icon name="divide" size={16} /></div>
                      <span className="font-bold text-sm dark:text-white">Разделить чек</span>
                  </div>
                  <Icon name="chevron-right" size={16} className="text-slate-300" />
              </button>
              
              <button onClick={() => handleInviteToBudget()} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center"><Icon name="users" size={16} /></div>
                      <span className="font-bold text-sm dark:text-white">Совместный доступ</span>
                  </div>
                  <Icon name="chevron-right" size={16} className="text-slate-300" />
              </button>

              <button onClick={() => onNavigate('SETTINGS')} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center"><Icon name="settings" size={16} /></div>
                      <span className="font-bold text-sm dark:text-white">Тарифы и Настройки</span>
                  </div>
                  <Icon name="chevron-right" size={16} className="text-slate-300" />
              </button>
          </div>
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-2 gap-3">
          <button onClick={handleShare} className="bg-emerald-500 text-white p-4 rounded-[2rem] flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
               <Icon name="gift" size={24} />
               <span className="text-xs font-bold">Пригласи друга</span>
          </button>
          <button onClick={handleDonate} className="bg-yellow-400 text-yellow-900 p-4 rounded-[2rem] flex flex-col items-center justify-center gap-1 shadow-lg shadow-yellow-400/30 active:scale-95 transition-transform">
               <Icon name="coffee" size={24} />
               <span className="text-xs font-bold">Донат автору</span>
          </button>
      </div>

      {/* Theme Picker */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 px-2">Тема приложения</h4>
          <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
              {(Object.keys(ACCENT_COLORS) as AccentColor[]).map(colorKey => (
                  <button
                    key={colorKey}
                    onClick={() => changeAccent(colorKey)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${accent === colorKey ? 'scale-110 ring-2 ring-offset-2 ring-slate-200 dark:ring-slate-600' : ''}`}
                    style={{ backgroundColor: ACCENT_COLORS[colorKey].primary }}
                  >
                      {accent === colorKey && <Icon name="check" size={16} className="text-white" />}
                  </button>
              ))}
          </div>
      </div>

      {/* Feedback & Reset */}
      <div className="space-y-3">
         <button onClick={() => setShowFeedback(!showFeedback)} className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center justify-center gap-2 text-slate-500 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Icon name="message-square" size={18} />
            <span>Написать отзыв</span>
         </button>

         {showFeedback && (
             <div className="p-4 bg-white dark:bg-slate-800 rounded-[2rem] shadow-lg animate-in slide-in-from-top-2 border border-slate-100 dark:border-slate-700">
                 <textarea placeholder="Нашли баг или есть идея?" className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl mb-3 outline-none dark:text-white text-sm" rows={3}></textarea>
                 <button className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm">Отправить</button>
             </div>
         )}
         
         <button onClick={onReset} className="w-full p-4 flex items-center justify-center gap-2 text-red-400 font-bold text-xs opacity-60 hover:opacity-100 transition-opacity">
            <Icon name="trash-2" size={14} />
            <span>Сбросить данные</span>
         </button>
      </div>

       {/* Achievement Detail Modal */}
       {selectedAchievement && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedAchievement(null)}>
               <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
                   <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-4xl shadow-lg mb-4">
                       <Icon name={selectedAchievement.icon} size={40} />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{selectedAchievement.title}</h3>
                   <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">{selectedAchievement.description}</p>
                   {selectedAchievement.isUnlocked ? (
                       <div className="inline-block bg-emerald-100 text-emerald-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                           Открыто {new Date(selectedAchievement.unlockedAt!).toLocaleDateString()}
                       </div>
                   ) : (
                        <div className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                           Заблокировано
                       </div>
                   )}
                   <button onClick={() => setSelectedAchievement(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><Icon name="x" /></button>
               </div>
           </div>
       )}
    </div>
  );
};

export default ProfileHub;
