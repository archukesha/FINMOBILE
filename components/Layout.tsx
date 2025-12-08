
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
    { id: 'ADD_TRANSACTION', label: 'Добавить', icon: 'plus' },
    { id: 'GOALS', label: 'Цели', icon: 'target' },
    { id: 'HUB', label: 'Профиль', icon: 'user' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-28">
        {children}
      </main>

      {/* AI Floating Action Button */}
      {onOpenAdvice && activeView !== 'ADD_TRANSACTION' && (
        <button
          onClick={onOpenAdvice}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-300 dark:shadow-indigo-900/50 flex items-center justify-center text-white text-2xl animate-in zoom-in duration-300 hover:scale-105 active:scale-95 transition-transform border-2 border-white/20"
        >
          <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg animate-pulse"></div>
          <div className="relative z-10">
             <Icon name="sparkles" />
          </div>
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 safe-area-bottom rounded-t-2xl transition-colors duration-300">
        <div className="flex justify-around items-end h-20 pb-4">
          {navItems.map((item) => {
            // Map sub-views to their parent tab for highlighting
            let highlight = activeView === item.id;
            if (item.id === 'HUB' && ['SETTINGS', 'SUBSCRIPTIONS', 'DEBTS', 'EDUCATION'].includes(activeView)) {
              highlight = true;
            }

            const isAdd = item.id === 'ADD_TRANSACTION';
            
            if (isAdd) {
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="flex flex-col items-center justify-end -mt-8 group"
                >
                  <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-full shadow-lg shadow-blue-300 dark:shadow-blue-900/50 flex items-center justify-center text-white text-2xl transform transition-transform group-active:scale-95 border-4 border-slate-50 dark:border-slate-900">
                    <Icon name={item.icon} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 mt-1">{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                  highlight ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <span className={`text-2xl mb-1 transition-transform ${highlight ? 'scale-110' : ''}`}>
                  <Icon name={item.icon} />
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;