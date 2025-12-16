
import React, { useState } from 'react';
import { ViewState } from '../types';
import Icon from './Icon';
import { haptic } from '../services/telegram';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  onOpenAdvice?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, onOpenAdvice }) => {
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  const navItems: { id: ViewState; label: string; icon: string }[] = [
    { id: 'DASHBOARD', label: 'Главная', icon: 'home' },
    { id: 'ANALYTICS', label: 'Отчеты', icon: 'pie-chart' },
    { id: 'ADD_TRANSACTION', label: '', icon: 'plus' }, // Placeholder for Center Button
    { id: 'GOALS', label: 'Цели', icon: 'target' },
    { id: 'HUB', label: 'Меню', icon: 'grid' },
  ];

  const toggleQuickMenu = () => {
      haptic.impact('medium');
      setIsQuickMenuOpen(!isQuickMenuOpen);
  };

  const handleNavClick = (id: ViewState) => {
      if (id === activeView) return;
      haptic.selection();
      onNavigate(id);
      setIsQuickMenuOpen(false);
  };

  const handleFabAction = (action: () => void) => {
      haptic.impact('light');
      action();
      setIsQuickMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0f1115] text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-500 relative">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-28 pt-safe">
        {children}
      </main>

      {/* QUICK ACTION FAB MENU */}
      {isQuickMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in"
            onClick={() => setIsQuickMenuOpen(false)}
          />
      )}
      
      {/* Fan Out Buttons */}
      <div className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none transition-all duration-300 ${isQuickMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
           {/* Add Transaction */}
           <button 
                onClick={() => handleFabAction(() => onNavigate('ADD_TRANSACTION'))}
                className={`absolute -translate-y-20 pointer-events-auto flex flex-col items-center gap-1 transition-all duration-300 ${isQuickMenuOpen ? 'scale-100' : 'scale-0'}`}
           >
               <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40">
                   <Icon name="plus" size={24} />
               </div>
               <span className="text-xs font-bold text-white bg-slate-900/50 px-2 py-0.5 rounded-md backdrop-blur-md">Операция</span>
           </button>

           {/* AI Advice */}
           {onOpenAdvice && (
                <button 
                    onClick={() => handleFabAction(onOpenAdvice)}
                    className={`absolute -translate-y-12 translate-x-20 pointer-events-auto flex flex-col items-center gap-1 transition-all duration-300 delay-75 ${isQuickMenuOpen ? 'scale-100' : 'scale-0'}`}
                >
                    <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40">
                        <Icon name="sparkles" size={20} />
                    </div>
                    <span className="text-xs font-bold text-white bg-slate-900/50 px-2 py-0.5 rounded-md backdrop-blur-md">AI Совет</span>
                </button>
           )}

            {/* Quick Goal */}
            <button 
                onClick={() => handleFabAction(() => onNavigate('GOALS'))}
                className={`absolute -translate-y-12 -translate-x-20 pointer-events-auto flex flex-col items-center gap-1 transition-all duration-300 delay-75 ${isQuickMenuOpen ? 'scale-100' : 'scale-0'}`}
            >
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
                    <Icon name="target" size={20} />
                </div>
                <span className="text-xs font-bold text-white bg-slate-900/50 px-2 py-0.5 rounded-md backdrop-blur-md">Цель</span>
            </button>
      </div>


      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 z-50 pointer-events-none safe-area-bottom">
        <nav className="glass-card rounded-[2rem] pointer-events-auto h-20 flex justify-around items-center px-2 shadow-2xl shadow-slate-200/50 dark:shadow-black/50">
          {navItems.map((item) => {
            let highlight = activeView === item.id;
            if (item.id === 'HUB' && ['SETTINGS', 'SUBSCRIPTIONS', 'DEBTS', 'EDUCATION', 'REMINDERS'].includes(activeView)) {
              highlight = true;
            }

            const isCenter = item.id === 'ADD_TRANSACTION';
            
            if (isCenter) {
              return (
                <button
                  key={item.id}
                  onClick={toggleQuickMenu}
                  className="relative -top-8 group"
                >
                  <div className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white transform transition-all duration-300 border-4 border-slate-50 dark:border-[#0f1115] ${isQuickMenuOpen ? 'bg-slate-800 rotate-45' : 'bg-primary shadow-primary/40'}`}>
                    <Icon name="plus" size={32} />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 group ${
                  highlight 
                    ? 'text-primary' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <div className={`transition-transform duration-300 ${highlight ? '-translate-y-1' : ''}`}>
                    <Icon name={item.icon} size={24} className={highlight ? 'fill-current' : ''} />
                </div>
                <span className={`text-[9px] font-bold mt-1 transition-all duration-300 ${highlight ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    {item.label}
                </span>
                {highlight && <div className="absolute bottom-2 w-1 h-1 bg-current rounded-full" />}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
