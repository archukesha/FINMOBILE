
import React, { useState } from 'react';
import { Goal, SubscriptionLevel } from '../types';
import { getGoals, saveGoal, deleteGoal } from '../services/storage';
import PremiumBlock from './PremiumBlock';
import Icon from './Icon';

interface GoalsProps {
  refreshTrigger: number;
  subscriptionLevel: SubscriptionLevel;
  onGoToSettings: () => void;
}

const Goals: React.FC<GoalsProps> = ({ refreshTrigger, subscriptionLevel, onGoToSettings }) => {
  const [goals, setGoals] = useState<Goal[]>(getGoals());
  const [showAdd, setShowAdd] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');

  // Update local state when parent triggers refresh
  React.useEffect(() => {
    setGoals(getGoals());
  }, [refreshTrigger]);

  // --- ACCESS CHECK (PRO or PREMIUM) ---
  const hasAccess = subscriptionLevel === 'PRO' || subscriptionLevel === 'PREMIUM';

  if (!hasAccess) {
    return <PremiumBlock onGoToSettings={onGoToSettings} title="Финансовые цели" />;
  }

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName || !newGoalAmount) return;

    const newGoal: Goal = {
      id: crypto.randomUUID(),
      name: newGoalName,
      targetAmount: parseFloat(newGoalAmount),
      currentAmount: 0,
      color: '#3b82f6' // Default blue
    };

    saveGoal(newGoal);
    setGoals(getGoals());
    setShowAdd(false);
    setNewGoalName('');
    setNewGoalAmount('');
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту цель?')) {
      deleteGoal(id);
      setGoals(getGoals());
    }
  };

  const formatCurrency = (val: number) => {
     return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="p-5 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Финансовые цели</h2>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-slate-300 dark:shadow-slate-900/30 hover:bg-slate-800 transition-colors"
        >
          {showAdd ? 'Отмена' : '+ Создать'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddGoal} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg shadow-slate-100 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Название</label>
            <input
              type="text"
              placeholder="Например, Отпуск"
              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 dark:text-white"
              value={newGoalName}
              onChange={e => setNewGoalName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Целевая сумма</label>
            <input
              type="number"
              placeholder="0"
              className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 dark:text-white"
              value={newGoalAmount}
              onChange={e => setNewGoalAmount(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md shadow-blue-200 dark:shadow-blue-900/50 hover:bg-blue-700 transition-colors">Сохранить цель</button>
        </form>
      )}

      <div className="space-y-4 pb-20">
        {goals.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <span className="text-4xl block mb-2">🎯</span>
            <p className="text-slate-400 font-medium">Нет целей. Самое время начать!</p>
          </div>
        ) : (
          goals.map(goal => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            return (
              <div key={goal.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-lg">🚀</div>
                     <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{goal.name}</h3>
                        <p className="text-xs text-slate-400 font-medium">Цель: {formatCurrency(goal.targetAmount)}</p>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="block text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(goal.currentAmount)}</span>
                    <button 
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors p-1"
                      title="Удалить цель"
                    >
                      <Icon name="trash-2" size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar Background */}
                <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
                  <span>Старт</span>
                  <span className={percent >= 100 ? 'text-emerald-500' : 'text-blue-500'}>{percent}%</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Goals;
