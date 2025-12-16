
import React from 'react';
import { ViewState } from '../types';
import Icon from './Icon';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  onOpenAdvice?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, onOpenAdvice }) => {
  const navItems: { id: ViewState; label: string; icon: string }[] = [
    { id: 'DASHBOARD', label: 'Главная', icon: 'home' },
    { id: 'ANALYTICS', label: 'Отчеты', icon: 'pie-chart' },
    { id: 'ADD_TRANSACTION', label: '', icon: 'plus' },
    { id: 'GOALS', label: 'Цели', icon: 'target' },
    { id: 'HUB', label: 'Меню', icon: 'grid' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0f1115] text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-500 relative">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-28 pt-safe">
        {children}
      </main>

      {/* Floating Action Button (Advice) */}
      {onOpenAdvice && activeView !== 'ADD_TRANSACTION' && (
        <button
          onClick={onOpenAdvice}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white text-2xl animate-float border border-white/20 active:scale-90 transition-transform"
        >
           <Icon name="sparkles" size={24} />
        </button>
      )}

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 z-50 pointer-events-none safe-area-bottom">
        <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl rounded-[2rem] pointer-events-auto h-20 flex justify-around items-center px-2">
          {navItems.map((item) => {
            let highlight = activeView === item.id;
            if (item.id === 'HUB' && ['SETTINGS', 'SUBSCRIPTIONS', 'DEBTS', 'EDUCATION', 'REMINDERS'].includes(activeView)) {
              highlight = true;
            }

            const isAdd = item.id === 'ADD_TRANSACTION';
            
            if (isAdd) {
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="relative -top-8 group"
                >
                  <div className="w-16 h-16 bg-slate-900 dark:bg-indigo-600 rounded-full shadow-xl shadow-indigo-500/30 dark:shadow-indigo-900/50 flex items-center justify-center text-white transform transition-all duration-300 group-active:scale-90 border-4 border-slate-50 dark:border-[#0f1115]">
                    <Icon name="plus" size={32} />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                  highlight 
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon name={item.icon} size={24} className={highlight ? 'fill-current' : ''} />
                <span className={`text-[9px] font-bold mt-1 transition-opacity ${highlight ? 'opacity-100' : 'opacity-0 hidden'}`}>
                    {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
