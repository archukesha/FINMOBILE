
import React from 'react';
import Icon from './Icon';

interface PremiumBlockProps {
  onGoToSettings: () => void;
  title: string;
  onBack?: () => void;
}

const PremiumBlock: React.FC<PremiumBlockProps> = ({ onGoToSettings, title, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-page-enter">
      
      <div className="relative mb-8">
          <div className="w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl shadow-inner relative z-10">
              <Icon name="lock" size={40} className="text-slate-300 dark:text-slate-600" />
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center text-amber-900 shadow-lg animate-bounce-slow z-20 border-4 border-slate-50 dark:border-[#0f1115]">
              <Icon name="star" size={20} className="fill-current" />
          </div>
      </div>

      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">
        {title} <br/> закрыт
      </h2>
      
      <p className="text-center text-slate-500 dark:text-slate-400 mb-8 max-w-xs leading-relaxed">
        Эта функция доступна в расширенных тарифах. Разблокируйте полный потенциал приложения!
      </p>

      <div className="w-full max-w-sm space-y-4">
        <button 
            onClick={onGoToSettings}
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
        >
            <span>Посмотреть тарифы</span>
            <Icon name="arrow-right" size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
        <button 
            onClick={onBack || (() => window.history.back())}
            className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
            Назад
        </button>
      </div>
    </div>
  );
};

export default PremiumBlock;
