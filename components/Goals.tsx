
import React, { useState } from 'react';
import { Goal, SubscriptionLevel } from '../types';
import { getGoals, saveGoal, deleteGoal, updateGoalProgress, getTransactions } from '../services/storage';
import { api } from '../services/api';
import PremiumBlock from './PremiumBlock';
import Icon from './Icon';
import SwipeableRow from './SwipeableRow';

interface GoalsProps {
  refreshTrigger: number;
  subscriptionLevel: SubscriptionLevel;
  onGoToSettings: () => void;
  onBack: () => void;
}

const Goals: React.FC<GoalsProps> = ({ refreshTrigger, subscriptionLevel, onGoToSettings, onBack }) => {
  const [goals, setGoals] = useState<Goal[]>(getGoals());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', target: '', icon: 'target' });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Deposit Modal State
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  React.useEffect(() => { setGoals(getGoals()); }, [refreshTrigger]);

  const hasAccess = subscriptionLevel !== 'FREE'; // Available from PLUS
  if (!hasAccess) return <PremiumBlock onGoToSettings={onGoToSettings} title="Финансовые цели" onBack={onBack} />;

  const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.name || !form.target) return;
      saveGoal({
          id: crypto.randomUUID(),
          name: form.name,
          targetAmount: Math.abs(parseFloat(form.target)), // Prevent negative target
          currentAmount: 0,
          color: '#4f46e5',
          icon: form.icon
      });
      setGoals(getGoals());
      setShowAdd(false);
      setForm({ name: '', target: '', icon: 'target' });
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(depositGoalId && depositAmount) {
          const val = parseFloat(depositAmount);
          if (isNaN(val) || val <= 0) return;
          
          updateGoalProgress(depositGoalId, val);
          setGoals(getGoals());
          setDepositGoalId(null);
          setDepositAmount('');
          
          // Trigger confetti
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
      }
  };

  const handleDeleteGoal = (id: string) => {
      if(confirm('Удалить эту цель?')) {
          deleteGoal(id);
          setGoals(getGoals());
      }
  };

  const handleAiGenerate = async () => {
      setIsAiLoading(true);
      try {
          const suggestion = await api.ai.suggestGoal(getTransactions());
          setForm({ name: suggestion.title, target: suggestion.amount.toString(), icon: 'rocket' });
          setShowAdd(true);
      } catch(e) {
          alert('AI не смог придумать цель');
      } finally {
          setIsAiLoading(false);
      }
  };

  return (
    <div className="p-5 space-y-6 pb-32 relative">
       {/* Confetti Animation */}
       {showConfetti && (
           <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden flex justify-center">
               <div className="absolute inset-0 bg-transparent flex justify-center">
                   {[...Array(30)].map((_,i) => (
                       <div key={i} className="absolute top-0 text-3xl animate-float" style={{
                           left: `${Math.random()*100}vw`,
                           animationDuration: `${2+Math.random()*2}s`,
                           animationDelay: `${Math.random()}s`
                       }}>🎉</div>
                   ))}
               </div>
           </div>
       )}

       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Мои Цели</h2>
        <div className="flex gap-2">
            <button onClick={handleAiGenerate} disabled={isAiLoading} className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50">
                <Icon name={isAiLoading ? "loader" : "sparkles"} className={isAiLoading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => setShowAdd(!showAdd)} className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                <Icon name={showAdd ? "x" : "plus"} />
            </button>
        </div>
       </div>

       {showAdd && (
           <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl animate-slide-up space-y-4">
               <h3 className="font-bold text-lg mb-2 dark:text-white">Новая цель</h3>
               <input placeholder="Название (напр. Машина)" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-700 outline-none font-bold text-slate-900 dark:text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} autoFocus />
               <input type="number" placeholder="Сумма" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-700 outline-none font-bold text-slate-900 dark:text-white" value={form.target} onChange={e => setForm({...form, target: e.target.value})} />
               <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold">Создать</button>
           </form>
       )}

       <div className="grid grid-cols-1 gap-5">
           {goals.map(g => {
               const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
               return (
                   <SwipeableRow key={g.id} onSwipeLeft={() => handleDeleteGoal(g.id)}>
                       <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 text-[100px] leading-none -mr-4 -mt-4 transition-transform group-hover:rotate-12 pointer-events-none">
                               <Icon name={g.icon || 'target'} size={100} />
                           </div>
                           
                           <div className="relative z-10">
                               <div className="flex justify-between items-start mb-4">
                                   <div>
                                       <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Цель</div>
                                       <h3 className="text-2xl font-black text-slate-900 dark:text-white">{g.name}</h3>
                                   </div>
                                   <button 
                                        onClick={() => handleDeleteGoal(g.id)}
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                                   >
                                       <Icon name="trash-2" size={16} />
                                   </button>
                               </div>

                               <div className="flex items-end gap-2 mb-2">
                                   <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{g.currentAmount.toLocaleString()}</span>
                                   <span className="text-sm font-bold text-slate-400 mb-1">/ {g.targetAmount.toLocaleString()}</span>
                               </div>

                               <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                                   <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out" style={{width: `${percent}%`}}></div>
                               </div>

                               <button onClick={() => setDepositGoalId(g.id)} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2">
                                   <Icon name="plus" size={16} /> Пополнить
                               </button>
                           </div>
                       </div>
                   </SwipeableRow>
               )
           })}
       </div>

       {/* Deposit Modal */}
       {depositGoalId && (
           <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setDepositGoalId(null)} />
               <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 relative z-10 animate-slide-up shadow-2xl">
                   <h3 className="text-xl font-bold text-center mb-4 dark:text-white">Пополнить копилку</h3>
                   <form onSubmit={handleDepositSubmit}>
                       <input 
                            type="number" 
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center text-3xl font-black mb-6 outline-none dark:text-white focus:ring-2 focus:ring-indigo-500" 
                            placeholder="0" 
                            value={depositAmount}
                            onChange={e => setDepositAmount(e.target.value)}
                            autoFocus
                       />
                       <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg">Внести</button>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};
export default Goals;
