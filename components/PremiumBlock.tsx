import React from 'react';
import Icon from './Icon';

interface PremiumBlockProps {
  onGoToSettings: () => void;
  title: string;
}

const PremiumBlock: React.FC<PremiumBlockProps> = ({ onGoToSettings, title }) => {
  return (
    <div className="flex flex-col items-center justify-start p-4 h-full animate-page-enter pb-32 overflow-y-auto">
      
      <div className="text-center mb-6 mt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 animate-bounce-slow">
             <Icon name="lock" size={32} className="text-slate-400 dark:text-slate-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
          {title} <br /><span className="text-slate-400 dark:text-slate-500 font-medium text-base">недоступно в вашем тарифе</span>
        </h2>
      </div>

      <div className="w-full space-y-5 max-w-sm">
        {/* PRO Card */}
        <div 
          onClick={onGoToSettings}
          className="w-full bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-lg shadow-slate-200 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform flex flex-col"
        >
          <div className="absolute top-0 right-0 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-bl-xl uppercase tracking-wider">
            Базовый
          </div>
          <div className="flex items-center gap-4 mb-5">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-2xl shadow-inner text-white">
               <Icon name="zap" size={24} />
             </div>
             <div>
               <h3 className="text-xl font-black text-slate-700 dark:text-white">PRO</h3>
               <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">Для начинающих</div>
             </div>
          </div>

          <div className="space-y-3 mb-6">
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0"><Icon name="check" size={14} /></div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Расширенная аналитика</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0"><Icon name="check" size={14} /></div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Финансовые цели</span>
             </div>
          </div>

          <button 
            className="w-full py-3.5 bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 text-slate-700 dark:text-white font-bold rounded-2xl text-sm transition-colors flex justify-between px-5 items-center mt-auto"
          >
            <span>Перейти в меню</span>
            <span className="bg-white dark:bg-slate-600 px-2 py-0.5 rounded-md shadow-sm">99 ₽</span>
          </button>
        </div>

        {/* PREMIUM Card */}
        <div 
          onClick={onGoToSettings}
          className="w-full bg-slate-900 dark:bg-slate-950 rounded-[2rem] p-6 shadow-xl shadow-amber-200/40 dark:shadow-amber-900/20 border border-slate-800 dark:border-slate-800 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform flex flex-col"
        >
          <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-bl-xl uppercase tracking-wider shadow-md">
            Хит
          </div>
          
          {/* Glow effect */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-yellow-400 blur-[60px] opacity-20 rounded-full pointer-events-none"></div>

          <div className="flex items-center gap-4 mb-2 relative z-10">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 text-slate-900 border-2 border-white/20">
               <Icon name="crown" size={24} />
             </div>
             <div>
               <h3 className="text-xl font-black text-white">PREMIUM</h3>
               <div className="text-xs text-slate-400 font-medium">Полный контроль + AI</div>
             </div>
          </div>

          <div className="relative z-10 mb-5 pl-1">
             <div className="inline-flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-2.5 py-1">
                <span className="text-[10px]"><Icon name="star" size={10} className="fill-yellow-400 text-yellow-400" /></span>
                <span className="text-[10px] font-bold text-yellow-400">Выбор 92% пользователей</span>
             </div>
          </div>

          <div className="space-y-3 mb-6 relative z-10">
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-xs font-bold shrink-0"><Icon name="check" size={14} /></div>
                <span className="text-sm font-bold text-slate-300">Все функции PRO</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-xs font-bold shrink-0"><Icon name="check" size={14} /></div>
                <span className="text-sm font-bold text-slate-300">Свои категории расходов</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-xs font-bold shrink-0"><Icon name="check" size={14} /></div>
                <span className="text-sm font-bold text-slate-300">AI-финансовый советник</span>
             </div>
          </div>

          <button 
            className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold rounded-2xl text-sm transition-transform shadow-lg flex justify-between px-5 items-center relative z-10 mt-auto"
          >
            <span>Перейти в меню</span>
            <span className="bg-white/30 px-2 py-0.5 rounded-md text-slate-900">199 ₽</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumBlock;