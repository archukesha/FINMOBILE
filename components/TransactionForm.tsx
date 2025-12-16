
import React, { useState, useEffect, useRef } from 'react';
import { TransactionType, Category, SubscriptionLevel, Transaction, Debt, Currency } from '../types';
import { saveTransaction, updateGoalProgress, getGoals, saveCategory, deleteTransaction, updateTransaction, saveDebt, saveAllCategories, getCurrency } from '../services/storage';
import { api } from '../services/api';
import { COLORS, AVAILABLE_ICONS, CURRENCY_RATES } from '../constants';
import PremiumBlock from './PremiumBlock';
import { haptic } from '../services/telegram';
import Icon from './Icon';

interface TransactionFormProps {
  categories: Category[];
  onComplete: () => void;
  onCategoryUpdate: () => void;
  subscriptionLevel: SubscriptionLevel;
  onGoToSettings: () => void;
  initialData?: Transaction | null;
}

const getLocalDateString = () => {
    const d = new Date();
    // Use sv-SE locale to get YYYY-MM-DD format regardless of user location, but in local time
    return d.toLocaleDateString('sv-SE');
};

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  categories, 
  onComplete, 
  onCategoryUpdate, 
  subscriptionLevel, 
  onGoToSettings,
  initialData 
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amountInput, setAmountInput] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('RUB');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(getLocalDateString());
  const [note, setNote] = useState<string>('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  // Reorder Mode
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

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
  
  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!initialData;

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmountInput(initialData.originalAmount?.toString() || initialData.amount.toString());
      setCurrency(initialData.currency || 'RUB');
      setCategoryId(initialData.categoryId);
      setDate(initialData.date);
      setNote(initialData.note || '');
      if (initialData.goalId) setGoalId(initialData.goalId);
    } else {
        setCurrency(getCurrency());
    }
  }, [initialData]);

  // Dynamically filter categories based on current type state
  const filteredCategories = localCategories.filter(c => {
    if (type === TransactionType.INCOME) return c.type === 'INCOME';
    if (type === TransactionType.EXPENSE) return c.type === 'EXPENSE';
    return true; // For deposit/other
  });

  // Safe Calculator Evaluation
  const calculateAmount = () => {
      try {
          // Allow digits, +, -, *, /, ., ( )
          if (/^[0-9+\-*/.() ]+$/.test(amountInput)) {
               // eslint-disable-next-line no-new-func
               const result = new Function('return ' + amountInput)();
               if (isFinite(result)) {
                   setAmountInput(parseFloat(result.toFixed(2)).toString());
                   return result;
               }
          }
      } catch (e) {
          // invalid expression
      }
      return parseFloat(amountInput);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Strict masking: allow only numbers and math symbols. Remove letters immediately.
      const val = e.target.value.replace(/[^0-9.,+\-*/() ]/g, '');
      setAmountInput(val);
  };

  const handleBlurAmount = () => {
      calculateAmount();
  };

  // --- AI HANDLERS ---

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Голосовой ввод не поддерживается вашим браузером.');
        return;
    }

    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsAiProcessing(true);
        haptic.impact('light');

        recognition.start();

        recognition.onresult = async (event: any) => {
            const text = event.results[0][0].transcript;
            setNote(text); // Show raw text first
            
            try {
                const parsed = await api.ai.parseVoiceCommand(text, categories);
                if (parsed.amount) setAmountInput(parsed.amount.toString());
                if (parsed.categoryId) setCategoryId(parsed.categoryId);
                if (parsed.note) setNote(parsed.note);
                haptic.notification('success');
            } catch (e) {
                console.error(e);
            } finally {
                setIsAiProcessing(false);
            }
        };

        recognition.onerror = (e: any) => {
            console.warn("Speech error", e);
            setIsAiProcessing(false);
            alert("Ошибка распознавания речи. Проверьте разрешения.");
        };
        recognition.onend = () => {
            if (isAiProcessing) setIsAiProcessing(false); 
        };
    } catch (e) {
        alert("Не удалось запустить голосовой ввод.");
        setIsAiProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
          alert("Файл слишком большой (макс 5МБ)");
          return;
      }

      setIsAiProcessing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
              const parsed = await api.ai.parseReceipt(base64);
              if (parsed.amount) setAmountInput(parsed.amount.toString());
              if (parsed.date) setDate(parsed.date);
              if (parsed.note) setNote(parsed.note);
              if (parsed.categoryId) setCategoryId(parsed.categoryId);
              haptic.notification('success');
          } catch (e) {
              alert('Не удалось распознать чек');
          } finally {
              setIsAiProcessing(false);
          }
      };
      reader.readAsDataURL(file);
  };

  const handleNoteBlur = async () => {
      if (note && !categoryId && !isEditMode && type === TransactionType.EXPENSE) {
          try {
             const suggested = await api.ai.suggestCategory(note, categories);
             if (suggested) setCategoryId(suggested);
          } catch {}
      }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalVal = calculateAmount();
    
    if (!finalVal || finalVal <= 0) return;

    // Normalize to RUB for storage
    const rate = CURRENCY_RATES[currency] || 1;
    const normalizedAmount = finalVal * rate;

    haptic.impact('heavy');

    const txBase = {
        amount: normalizedAmount,
        originalAmount: finalVal,
        currency: currency,
        date,
        note
    };

    // --- EDIT MODE ---
    if (isEditMode && initialData) {
      updateTransaction({
        ...initialData,
        ...txBase,
        type,
        categoryId: categoryId || initialData.categoryId, // Preserve if not changed
        goalId: type === TransactionType.SAVING_DEPOSIT ? goalId : undefined
      });
      if (type === TransactionType.SAVING_DEPOSIT && goalId) {
           updateGoalProgress(goalId, normalizedAmount - initialData.amount);
      }
      onComplete();
      return;
    }

    // --- CREATE MODE ---
    if (type === TransactionType.INCOME && isPrepayment) {
        saveTransaction({
            id: crypto.randomUUID(),
            type: TransactionType.INCOME,
            categoryId: categoryId || filteredCategories[0]?.id,
            ...txBase,
            note: note ? `${note} (Предоплата)` : 'Предоплата по проекту'
        });

        // Simplified Debt logic 
        const total = parseFloat(totalProjectAmount);
        const remaining = total - finalVal;

        if (remaining > 0 && clientName) {
            const newDebt: Debt = {
                id: crypto.randomUUID(),
                type: 'OWE_ME',
                title: clientName,
                totalAmount: remaining,
                remainingAmount: remaining,
                startDate: new Date().toISOString(),
                nextPaymentDate: projectDueDate || undefined
            };
            saveDebt(newDebt);
        }

    } else if (type === TransactionType.INCOME && splitSavings) {
      const savingsAmount = normalizedAmount * (savingsPercent / 100);

      saveTransaction({
        id: crypto.randomUUID(),
        type: TransactionType.INCOME,
        categoryId: categoryId || filteredCategories[0]?.id,
        ...txBase
      });

      saveTransaction({
        id: crypto.randomUUID(),
        amount: savingsAmount,
        currency: 'RUB', // Internal transfer usually base currency
        type: TransactionType.SAVING_DEPOSIT,
        categoryId: 'sav_transfer',
        date,
        note: `Авто-копилка (${savingsPercent}%)`
      });

    } else if (type === TransactionType.SAVING_DEPOSIT) {
      saveTransaction({
        id: crypto.randomUUID(),
        type: TransactionType.SAVING_DEPOSIT,
        ...txBase,
        categoryId: 'sav_transfer',
        goalId
      });
      if (goalId) updateGoalProgress(goalId, normalizedAmount);

    } else {
      saveTransaction({
        id: crypto.randomUUID(),
        type: type,
        categoryId: categoryId || filteredCategories[0]?.id || 'exp_other', // Fallback
        ...txBase
      });
    }

    onComplete();
  };

  const handleDelete = () => {
    haptic.impact('medium');
    if (initialData && confirm('Удалить эту операцию?')) {
      deleteTransaction(initialData.id);
      onComplete();
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
      e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); 
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
      const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
      if (dragIndex === dropIndex) return;

      const newFiltered = [...filteredCategories];
      const [removed] = newFiltered.splice(dragIndex, 1);
      newFiltered.splice(dropIndex, 0, removed);

      newFiltered.forEach((cat, idx) => { cat.order = idx; });
      saveAllCategories(localCategories.map(c => {
          const updated = newFiltered.find(nf => nf.id === c.id);
          return updated || c;
      }));
      onCategoryUpdate(); 
      haptic.impact('light');
  };

  const initCreateCategory = () => {
    if (subscriptionLevel !== 'FREE') {
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
      type: type === TransactionType.INCOME ? 'INCOME' : 'EXPENSE',
      order: 9999
    };

    saveCategory(newCat);
    onCategoryUpdate();
    setIsCreatingCategory(false);
    setNewCatName('');
    setCategoryId(newCat.id);
  };

  const setPercentAmount = (percent: number) => {
      haptic.selection();
      const total = parseFloat(totalProjectAmount);
      if (total > 0) {
          setAmountInput(Math.round(total * (percent / 100)).toString());
      }
  };

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
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-slate-800 dark:text-white"
                autoFocus
                required
              />
            </div>
             <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Бюджет (Лимит в месяц)</label>
              <input 
                type="number" 
                placeholder="Необязательно"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-slate-800 dark:text-white"
              />
            </div>

            <div className="space-y-2">
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Цвет</label>
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                   {COLORS.map(c => (
                       <button key={c} type="button" onClick={() => setNewCatColor(c)} className={`w-8 h-8 rounded-full flex-shrink-0 ${newCatColor === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} style={{backgroundColor: c}}></button>
                   ))}
               </div>
            </div>

            <div className="space-y-2">
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Иконка</label>
               <div className="grid grid-cols-6 gap-2 h-40 overflow-y-auto">
                   {AVAILABLE_ICONS.map(i => (
                       <button key={i} type="button" onClick={() => setNewCatIcon(i)} className={`w-10 h-10 rounded-xl flex items-center justify-center ${newCatIcon === i ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                           <Icon name={i} size={20} />
                       </button>
                   ))}
               </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/40 mt-8"
            >
              Создать категорию
            </button>
         </form>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-slate-900 h-full flex flex-col pb-20 relative">
      {/* AI Processing Overlay */}
      {isAiProcessing && (
          <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center flex-col animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-indigo-500 animate-pulse flex items-center justify-center text-white shadow-xl shadow-indigo-500/50">
                  <Icon name="sparkles" size={32} className="animate-spin" />
              </div>
              <p className="mt-4 font-bold text-slate-800 dark:text-white">AI анализирует...</p>
          </div>
      )}

      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          {isEditMode ? 'Редактировать' : 'Новая операция'}
        </h2>
        
        {!isEditMode && (
            <div className="flex gap-2">
                 <button 
                    onClick={handleVoiceInput}
                    className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center active:scale-95 transition-transform"
                >
                     <Icon name="mic" size={20} />
                </button>
                <div className="relative">
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <Icon name="camera" size={20} />
                    </button>
                </div>
                {isEditMode && (
                  <button 
                    type="button"
                    onClick={onComplete}
                    className="text-sm font-medium text-slate-400 ml-2"
                  >
                    Отмена
                  </button>
                )}
            </div>
        )}
      </div>
      
      {/* Type Switcher */}
      <div className="grid grid-cols-3 gap-3 mb-6 mt-2 shrink-0">
        <button
          type="button"
          onClick={() => { haptic.selection(); setType(TransactionType.EXPENSE); setIsPrepayment(false); setCategoryId(''); }}
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
          onClick={() => { haptic.selection(); setType(TransactionType.INCOME); setSplitSavings(false); setCategoryId(''); }}
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
          onClick={() => { haptic.selection(); setType(TransactionType.SAVING_DEPOSIT); setIsPrepayment(false); setCategoryId('sav_transfer'); }}
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

      <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col min-h-0">
        
        {/* Amount with Currency & Calculator */}
        <div className="text-center shrink-0">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {type === TransactionType.INCOME && isPrepayment ? 'Предоплата (сейчас)' : 'Сумма'}
          </label>
          <div className="flex items-center justify-center gap-2">
             <div className="relative inline-block w-3/4">
                <input
                ref={amountInputRef}
                type="text"
                inputMode="decimal" 
                value={amountInput}
                onChange={handleAmountChange}
                onBlur={handleBlurAmount}
                className="w-full text-center py-4 bg-slate-50 dark:bg-slate-800 border-b-4 border-indigo-500/20 focus:border-indigo-500 rounded-t-xl outline-none text-4xl font-black text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 transition-colors"
                placeholder="0"
                required
                autoFocus={!isEditMode}
                />
             </div>
             <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="bg-slate-100 dark:bg-slate-800 font-bold text-sm rounded-xl px-3 py-2 outline-none text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
             >
                 <option value="RUB">RUB</option>
                 <option value="USD">USD</option>
                 <option value="EUR">EUR</option>
                 <option value="KZT">KZT</option>
             </select>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Можно писать примеры: 150+50</div>
        </div>

        {/* Date & Note (Moved Up) */}
        <div className="grid grid-cols-2 gap-4 shrink-0">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Комментарий</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="Например: Такси"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary outline-none placeholder-slate-400"
            />
          </div>
        </div>

        {/* Category Grid */}
        {type !== TransactionType.SAVING_DEPOSIT && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-3">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Категория</label>
               <button 
                type="button" 
                onClick={() => setIsReorderMode(!isReorderMode)}
                className={`text-xs font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 ${isReorderMode ? 'text-primary' : 'text-slate-400'}`}
               >
                 {isReorderMode ? 'Готово' : 'Сортировка'}
               </button>
            </div>
            
            {/* Expanded height for grid, using flex-1 to take available space but allowing scroll */}
            <div className="grid grid-cols-4 gap-3 overflow-y-auto no-scrollbar pb-2 content-start flex-1" style={{ minHeight: '120px' }}>
              {filteredCategories.map((cat, index) => (
                <div
                    key={cat.id}
                    draggable={isReorderMode}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={isReorderMode ? 'animate-pulse cursor-move' : ''}
                >
                    <button
                    type="button"
                    onClick={() => { haptic.selection(); setCategoryId(cat.id); }}
                    disabled={isReorderMode}
                    className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border ${
                        categoryId === cat.id && !isReorderMode
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20' 
                        : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    >
                        <span className="text-2xl"><Icon name={cat.icon} /></span>
                        <span className="truncate w-full text-center text-[10px] font-medium px-1">{cat.name}</span>
                    </button>
                </div>
              ))}
              
              {/* Add Category Button */}
              <button
                type="button"
                onClick={initCreateCategory}
                className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 relative"
              >
                {subscriptionLevel === 'FREE' && <span className="absolute top-1 right-1 text-[8px] bg-amber-400 text-amber-900 px-1 rounded-sm font-bold">PLUS</span>}
                <span className="text-2xl"><Icon name="plus" /></span>
                <span className="text-[10px] font-medium">Создать</span>
              </button>
            </div>
          </div>
        )}

        {/* Goal Selector for Savings */}
        {type === TransactionType.SAVING_DEPOSIT && (
          <div className="flex-1">
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
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none font-medium text-slate-700 dark:text-slate-200"
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
             <div className="space-y-4 shrink-0">
                 <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                    <div>
                      <span className="block text-sm font-bold text-indigo-900 dark:text-indigo-200">Работа по предоплате?</span>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 opacity-80">Учет долга заказчика</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => { haptic.selection(); setIsPrepayment(!isPrepayment); setSplitSavings(false); }}
                        className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 shadow-inner ${isPrepayment ? 'bg-indigo-500 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'}`}
                    >
                        <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
                    </button>
                 </div>

                 {isPrepayment && (
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                        {/* Fields */}
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
                        </div>
                     </div>
                 )}
             </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-4 pb-4 shrink-0">
          <button
            type="submit"
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 hover:opacity-90 transition-transform active:scale-[0.98] flex justify-center items-center gap-2"
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
