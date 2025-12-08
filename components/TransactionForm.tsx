
import React, { useState, useEffect } from 'react';
import { TransactionType, Category, SubscriptionLevel, Transaction, Debt } from '../types';
import { saveTransaction, updateGoalProgress, getGoals, saveCategory, deleteTransaction, updateTransaction, saveDebt } from '../services/storage';
import { COLORS, AVAILABLE_ICONS } from '../constants';
import PremiumBlock from './PremiumBlock';
import Icon from './Icon';

interface TransactionFormProps {
  categories: Category[];
  onComplete: () => void;
  onCategoryUpdate: () => void;
  subscriptionLevel: SubscriptionLevel;
  onGoToSettings: () => void;
  initialData?: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  categories, 
  onComplete, 
  onCategoryUpdate, 
  subscriptionLevel, 
  onGoToSettings,
  initialData 
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  
  // For Income: Split to Savings
  const [splitSavings, setSplitSavings] = useState(false);
  const [savingsPercent, setSavingsPercent] = useState<number>(20);

  // For Income: Freelance Prepayment
  const [isPrepayment, setIsPrepayment] = useState(false);
  const [totalProjectAmount, setTotalProjectAmount] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [projectDueDate, setProjectDueDate] = useState<string>('');

  // For Saving Deposit: Goal Selection
  const [goalId, setGoalId] = useState<string>('');
  const goals = getGoals();

  // Create Category State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(AVAILABLE_ICONS[0]);
  const [newCatColor, setNewCatColor] = useState(COLORS[0]);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId);
      setDate(initialData.date);
      setNote(initialData.note || '');
      if (initialData.goalId) setGoalId(initialData.goalId);
    }
  }, [initialData]);

  const filteredCategories = categories.filter(c => {
    if (type === TransactionType.INCOME) return c.type === 'INCOME';
    if (type === TransactionType.EXPENSE) return c.type === 'EXPENSE';
    return true; 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    // --- EDIT MODE ---
    if (isEditMode && initialData) {
      updateTransaction({
        ...initialData,
        amount: val,
        type,
        categoryId: categoryId || filteredCategories[0]?.id,
        date,
        note,
        goalId: type === TransactionType.SAVING_DEPOSIT ? goalId : undefined
      });
      if (type === TransactionType.SAVING_DEPOSIT && goalId) {
           updateGoalProgress(goalId, val - initialData.amount);
      }
      onComplete();
      return;
    }

    // --- CREATE MODE ---
    if (type === TransactionType.INCOME && isPrepayment) {
        // 1. Create the partial income transaction
        saveTransaction({
            id: crypto.randomUUID(),
            amount: val,
            type: TransactionType.INCOME,
            categoryId: categoryId || filteredCategories[0]?.id,
            date,
            note: note ? `${note} (Предоплата)` : 'Предоплата по проекту'
        });

        // 2. Calculate remaining amount
        const total = parseFloat(totalProjectAmount);
        const remaining = total - val;

        if (remaining > 0 && clientName) {
            // 3. Create a Debt (OWE_ME)
            const newDebt: Debt = {
                id: crypto.randomUUID(),
                type: 'OWE_ME',
                person: clientName,
                amount: remaining,
                initialAmount: remaining,
                currency: 'RUB',
                dueDate: projectDueDate || undefined
            };
            saveDebt(newDebt);
        }

    } else if (type === TransactionType.INCOME && splitSavings) {
      // Create Income
      const savingsAmount = val * (savingsPercent / 100);
      const incomeAmount = val; 

      saveTransaction({
        id: crypto.randomUUID(),
        amount: incomeAmount,
        type: TransactionType.INCOME,
        categoryId: categoryId || filteredCategories[0]?.id,
        date,
        note
      });

      // Create Auto-Savings transfer
      saveTransaction({
        id: crypto.randomUUID(),
        amount: savingsAmount,
        type: TransactionType.SAVING_DEPOSIT,
        categoryId: 'sav_transfer',
        date,
        note: `Авто-копилка (${savingsPercent}%)`
      });

    } else if (type === TransactionType.SAVING_DEPOSIT) {
      saveTransaction({
        id: crypto.randomUUID(),
        amount: val,
        type: TransactionType.SAVING_DEPOSIT,
        categoryId: 'sav_transfer',
        date,
        note,
        goalId
      });
      if (goalId) updateGoalProgress(goalId, val);

    } else {
      saveTransaction({
        id: crypto.randomUUID(),
        amount: val,
        type: type,
        categoryId: categoryId || filteredCategories[0]?.id,
        date,
        note
      });
    }

    onComplete();
  };

  const handleDelete = () => {
    if (initialData && confirm('Удалить эту операцию?')) {
      deleteTransaction(initialData.id);
      onComplete();
    }
  };

  const initCreateCategory = () => {
    if (subscriptionLevel === 'PREMIUM') {
      setIsCreatingCategory(true);
    } else {
      setShowPremiumPrompt(true);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    const newCat: Category = {
      id: `custom_${Date.now()}`,
      name: newCatName,
      icon: newCatIcon,
      color: newCatColor,
      type: type === TransactionType.INCOME ? 'INCOME' : 'EXPENSE'
    };

    saveCategory(newCat);
    onCategoryUpdate();
    setIsCreatingCategory(false);
    setNewCatName('');
    setCategoryId(newCat.id); // Select the new category
  };

  const setPercentAmount = (percent: number) => {
      const total = parseFloat(totalProjectAmount);
      if (total > 0) {
          setAmount(Math.round(total * (percent / 100)).toString());
      }
  };

  // Helper calculation for display
  const currentPrepaymentPercent = (amount && totalProjectAmount) 
    ? Math.round((parseFloat(amount) / parseFloat(totalProjectAmount)) * 100) 
    : 0;

  const getGoalRemaining = (id: string) => {
      const goal = goals.find(g => g.id === id);
      if (!goal) return 0;
      return Math.max(0, goal.targetAmount - goal.currentAmount);
  };

  if (showPremiumPrompt) {
    return (
      <div className="p-4 bg-white dark:bg-slate-900 h-full relative">
         <button onClick={() => setShowPremiumPrompt(false)} className="absolute top-4 right-4 z-10 text-slate-400 font-bold p-2">
            <Icon name="x" size={24} />
         </button>
         <PremiumBlock onGoToSettings={onGoToSettings} title="Создание категорий" />
      </div>
    );
  }

  if (isCreatingCategory) {
    return (
      <div className="p-4 bg-white dark:bg-slate-900 min-h-full pb-24">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Новая категория</h2>
            <button onClick={() => setIsCreatingCategory(false)} className="text-sm font-medium text-slate-400">Отмена</button>
         </div>

         <form onSubmit={handleCreateCategory} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Название</label>
              <input 
                type="text" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Например, Подписки"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Иконка</label>
              <div className="grid grid-cols-6 gap-2 h-32 overflow-y-auto p-2 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
                 {AVAILABLE_ICONS.map(icon => (
                   <button
                     key={icon}
                     type="button"
                     onClick={() => setNewCatIcon(icon)}
                     className={`aspect-square flex items-center justify-center rounded-lg transition-all ${newCatIcon === icon ? 'bg-blue-600 text-white shadow-md scale-110' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                   >
                      <Icon name={icon} size={20} />
                   </button>
                 ))}
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Цвет</label>
               <div className="flex flex-wrap gap-3">
                 {COLORS.map(color => (
                   <button
                    key={color}
                    type="button"
                    onClick={() => setNewCatColor(color)}
                    className={`w-10 h-10 rounded-full transition-transform ${newCatColor === color ? 'ring-4 ring-offset-2 ring-blue-100 dark:ring-blue-900 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                   />
                 ))}
               </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 dark:shadow-blue-900/50 mt-8"
            >
              Создать категорию
            </button>
         </form>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-slate-900 min-h-full flex flex-col pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          {isEditMode ? 'Редактировать' : 'Новая операция'}
        </h2>
        {isEditMode && (
          <button 
            type="button"
            onClick={onComplete}
            className="text-sm font-medium text-slate-400"
          >
            Отмена
          </button>
        )}
      </div>
      
      {/* Type Switcher - Visual Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6 mt-8">
        <button
          type="button"
          onClick={() => { setType(TransactionType.EXPENSE); setIsPrepayment(false); }}
          className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-200 border-2 active:scale-95 ${
            type === TransactionType.EXPENSE 
              ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-600 dark:text-rose-400 shadow-md scale-105' 
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <div className={`mb-1 transition-transform ${type === TransactionType.EXPENSE ? 'scale-110' : ''}`}>
             <Icon name="trending-down" size={24} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wide">Расход</span>
        </button>

        <button
          type="button"
          onClick={() => { setType(TransactionType.INCOME); setSplitSavings(false); }}
          className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-200 border-2 active:scale-95 ${
            type === TransactionType.INCOME
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md scale-105' 
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
           <div className={`mb-1 transition-transform ${type === TransactionType.INCOME ? 'scale-110' : ''}`}>
             <Icon name="trending-up" size={24} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wide">Доход</span>
        </button>

        <button
          type="button"
          onClick={() => { setType(TransactionType.SAVING_DEPOSIT); setIsPrepayment(false); }}
          className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-200 border-2 active:scale-95 ${
            type === TransactionType.SAVING_DEPOSIT
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400 shadow-md scale-105' 
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
           <div className={`mb-1 transition-transform ${type === TransactionType.SAVING_DEPOSIT ? 'scale-110' : ''}`}>
             <Icon name="piggy-bank" size={24} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wide">Копилка</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        
        {/* Amount */}
        <div className="text-center">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {type === TransactionType.INCOME && isPrepayment ? 'Предоплата (сейчас)' : 'Сумма'}
          </label>
          <div className="relative inline-block w-3/4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-center py-2 bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-4xl font-bold text-slate-800 dark:text-white placeholder-slate-200 dark:placeholder-slate-700"
              placeholder="0"
              required
              step="0.01"
              autoFocus={!isEditMode}
            />
            <span className="absolute right-0 bottom-4 text-slate-400 font-medium text-lg">₽</span>
          </div>
          
          {/* Percentage Helper for Freelance */}
          {type === TransactionType.INCOME && isPrepayment && totalProjectAmount && (
             <div className="mt-2 text-xs font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 inline-block px-2 py-1 rounded-md">
                 Это {currentPrepaymentPercent}% от заказа
             </div>
          )}
        </div>

        {/* Category Grid */}
        {type !== TransactionType.SAVING_DEPOSIT && (
          <div>
            <div className="flex justify-between items-center mb-3">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Категория</label>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border ${
                    categoryId === cat.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-100 dark:ring-blue-900' 
                      : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-2xl"><Icon name={cat.icon} /></span>
                  <span className="truncate w-full text-center text-[10px] font-medium px-1">{cat.name}</span>
                </button>
              ))}
              
              {/* Add Category Button - Only fully active for PREMIUM */}
              <button
                type="button"
                onClick={initCreateCategory}
                className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 relative"
              >
                {subscriptionLevel !== 'PREMIUM' && <span className="absolute top-1 right-1 text-[8px] bg-amber-400 text-amber-900 px-1 rounded-sm font-bold">PREM</span>}
                <span className="text-2xl"><Icon name="plus" /></span>
                <span className="text-[10px] font-medium">Создать</span>
              </button>
            </div>
          </div>
        )}

        {/* Goal Selector for Savings */}
        {type === TransactionType.SAVING_DEPOSIT && (
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Цель (Опционально)</label>
                {goalId && (
                     <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">
                         Осталось накопить: {getGoalRemaining(goalId)} ₽
                     </span>
                )}
            </div>
            <div className="relative">
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="">Общие накопления</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id}>{g.name} (Цель: {g.targetAmount})</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
            </div>
          </div>
        )}

        {/* Freelance Prepayment Option */}
        {!isEditMode && type === TransactionType.INCOME && (
             <div className="space-y-4">
                 <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                    <div>
                      <span className="block text-sm font-bold text-indigo-900 dark:text-indigo-200">Работа по предоплате?</span>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 opacity-80">Учет долга заказчика</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setIsPrepayment(!isPrepayment); setSplitSavings(false); }}
                        className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 shadow-inner ${isPrepayment ? 'bg-indigo-500 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'}`}
                    >
                        <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
                    </button>
                 </div>

                 {isPrepayment && (
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Имя клиента / Проект</label>
                             <input 
                                type="text"
                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400"
                                placeholder="Например, Логотип для кафе"
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                                required
                             />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Сумма заказа (Итого)</label>
                             <input 
                                type="number"
                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400"
                                placeholder="Сколько всего должны заплатить?"
                                value={totalProjectAmount}
                                onChange={e => setTotalProjectAmount(e.target.value)}
                                required
                             />
                             {/* Calculated Percentage Buttons */}
                             {totalProjectAmount && (
                                <div className="flex gap-2 mt-2">
                                   {[20, 30, 50].map(pct => (
                                     <button
                                       key={pct}
                                       type="button"
                                       onClick={() => setPercentAmount(pct)}
                                       className="flex-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold px-3 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-100 dark:border-indigo-900/30"
                                     >
                                       Предоплата {pct}%
                                     </button>
                                   ))}
                                </div>
                             )}

                             {amount && totalProjectAmount && (Number(totalProjectAmount) - Number(amount) > 0) && (
                                 <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold text-right border-t border-indigo-50 dark:border-indigo-900/30 pt-2">
                                     Останется получить: {Number(totalProjectAmount) - Number(amount)} ₽
                                 </div>
                             )}
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Срок сдачи (Опционально)</label>
                             <input 
                                type="date"
                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white"
                                value={projectDueDate}
                                onChange={e => setProjectDueDate(e.target.value)}
                             />
                        </div>
                     </div>
                 )}
             </div>
        )}

        {/* Income Split Option (Mutually exclusive with Prepayment) */}
        {!isEditMode && type === TransactionType.INCOME && !isPrepayment && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
            <div>
              <span className="block text-sm font-bold text-blue-900 dark:text-blue-200">Отложить сразу?</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 opacity-80">Авто-перевод % в копилку</span>
            </div>
            <div className="flex items-center gap-3">
              {splitSavings && (
                <div className="relative">
                   <input 
                    type="number" 
                    className="w-14 p-1 text-center text-sm font-bold text-blue-800 dark:text-blue-200 bg-white dark:bg-slate-700 border border-blue-200 dark:border-blue-800 rounded-lg focus:outline-none"
                    value={savingsPercent}
                    onChange={(e) => setSavingsPercent(Number(e.target.value))}
                    min="1" max="100"
                  />
                  <span className="absolute right-1 top-1 text-xs text-blue-300">%</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSplitSavings(!splitSavings)}
                className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 shadow-inner ${splitSavings ? 'bg-blue-500 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'}`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
              </button>
            </div>
          </div>
        )}

        {/* Date & Note */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Комментарий</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Такси, Обед..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-8 pb-4">
          <button
            type="submit"
            className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 dark:shadow-blue-900/30 hover:bg-slate-800 dark:hover:bg-blue-500 transition-transform active:scale-[0.98] flex justify-center items-center gap-2"
          >
            <span>{isEditMode ? 'Сохранить изменения' : 'Сохранить'}</span>
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              Удалить операцию
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
