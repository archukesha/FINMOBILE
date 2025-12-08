
import React, { useState, useEffect } from 'react';
import { Debt, TransactionType } from '../types';
import { getDebts, saveDebt, deleteDebt, saveTransaction, getCategories } from '../services/storage';
import Icon from './Icon';

interface DebtsProps {
  onBack: () => void;
  initialTab?: 'I_OWE' | 'OWE_ME';
}

const Debts: React.FC<DebtsProps> = ({ onBack, initialTab }) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [activeTab, setActiveTab] = useState<'I_OWE' | 'OWE_ME'>('I_OWE');
  
  // Create Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; debt: Debt | null }>({ isOpen: false, debt: null });
  const [paymentAmount, setPaymentAmount] = useState('');

  const categories = getCategories();

  // Add Form State
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    setDebts(getDebts());
    if (initialTab) {
        setActiveTab(initialTab);
    }
  }, [initialTab]);

  const filteredDebts = debts.filter(d => d.type === activeTab);
  const totalAmount = filteredDebts.reduce((acc, d) => acc + d.amount, 0);

  // Helper for safe IDs
  const generateId = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!person || !amount) return;

    const val = parseFloat(amount);
    const newDebt: Debt = {
      id: generateId(),
      type: activeTab,
      person,
      amount: val,
      initialAmount: val,
      currency: 'RUB',
      dueDate
    };
    saveDebt(newDebt);
    setDebts(getDebts());
    setShowAdd(false);
    setPerson('');
    setAmount('');
    setDueDate('');
  };

  const openPaymentModal = (debt: Debt) => {
      setPaymentModal({ isOpen: true, debt });
      setPaymentAmount(debt.amount.toString());
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal.debt || !paymentAmount) return;

    const payVal = parseFloat(paymentAmount);
    if (payVal <= 0) return;

    const debt = paymentModal.debt;
    const isFullRepayment = payVal >= debt.amount;
    
    // 1. Update Debt
    const updatedDebt = { ...debt, amount: debt.amount - payVal };
    
    // 2. Create Transaction
    if (debt.type === 'I_OWE') {
        // Expense - Use dedicated Debt category or fall back to Other
        const catId = categories.find(c => c.id === 'exp_debt')?.id 
                    || categories.find(c => c.name.toLowerCase().includes('долг'))?.id
                    || 'exp_other';
        saveTransaction({
            id: generateId(),
            amount: payVal,
            type: TransactionType.EXPENSE,
            categoryId: catId,
            date: new Date().toISOString().split('T')[0],
            note: `Возврат долга: ${debt.person}`
        });
    } else {
        // Income (OWE_ME)
        const catId = categories.find(c => c.name === 'Фриланс' || c.type === 'INCOME')?.id || 'inc_salary';
        saveTransaction({
            id: generateId(),
            amount: payVal,
            type: TransactionType.INCOME,
            categoryId: catId,
            date: new Date().toISOString().split('T')[0],
            note: `Оплата от: ${debt.person}`
        });
    }

    // 3. Save or Delete
    if (isFullRepayment) {
        deleteDebt(debt.id);
    } else {
        saveDebt(updatedDebt);
    }

    setDebts(getDebts());
    setPaymentModal({ isOpen: false, debt: null });
    setPaymentAmount('');
  };

  return (
    <div className="p-5 space-y-6 h-full flex flex-col animate-page-enter">
       <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
          <Icon name="arrow-left" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {activeTab === 'OWE_ME' ? 'Ожидается выплат' : 'Мои долги'}
        </h2>
      </div>

      {/* Tabs */}
      <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
        <button 
          onClick={() => setActiveTab('I_OWE')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'I_OWE' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400'}`}
        >
          Я должен
        </button>
        <button 
           onClick={() => setActiveTab('OWE_ME')}
           className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'OWE_ME' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400'}`}
        >
          Мне должны
        </button>
      </div>

      <div className="text-center py-4">
         <div className="text-xs text-slate-400 font-bold uppercase">Общая сумма</div>
         <div className={`text-3xl font-black ${activeTab === 'I_OWE' ? 'text-rose-500' : 'text-emerald-500'}`}>
            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalAmount)}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-20 no-scrollbar">
        {filteredDebts.length === 0 && (
           <div className="text-center py-10 text-slate-400">
             <div className="text-4xl mb-2">🤝</div>
             <p>Список пуст</p>
           </div>
        )}

        {filteredDebts.map(debt => {
          const percent = debt.initialAmount > 0 
            ? Math.max(0, Math.round(((debt.initialAmount - debt.amount) / debt.initialAmount) * 100))
            : 0;
            
          return (
            <div key={debt.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
               <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-3">
                   {activeTab === 'OWE_ME' ? (
                       <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
                           <Icon name="briefcase" size={20} />
                       </div>
                   ) : (
                       <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg">
                           <Icon name="user" size={20} />
                       </div>
                   )}
                   <div>
                       <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-none">{debt.person}</h3>
                       {debt.dueDate ? (
                           <p className="text-xs text-red-400 font-medium mt-1">Срок: {new Date(debt.dueDate).toLocaleDateString()}</p>
                       ) : (
                           <p className="text-xs text-slate-400 mt-1">Без срока</p>
                       )}
                   </div>
                 </div>
                 <div className="text-right">
                   <div className="font-bold text-slate-800 dark:text-white text-lg">{debt.amount} ₽</div>
                   {debt.initialAmount !== debt.amount && (
                       <div className="text-xs text-slate-400 line-through">из {debt.initialAmount} ₽</div>
                   )}
                 </div>
               </div>

               {/* Progress */}
               {percent > 0 && (
                   <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                      <div className={`h-full ${activeTab === 'I_OWE' ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${percent}%` }}></div>
                   </div>
               )}

               <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-400">Получено {percent}%</span>
                  <button 
                    onClick={() => openPaymentModal(debt)}
                    className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-transform hover:bg-slate-800 dark:hover:bg-slate-600"
                  >
                    {activeTab === 'I_OWE' ? 'Вернуть часть' : 'Получить оплату'}
                  </button>
               </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
       {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 animate-in slide-in-from-bottom-10 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Новая запись</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <input 
                placeholder={activeTab === 'OWE_ME' ? "Название проекта / Клиент" : "Имя / Контакт"}
                className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white placeholder-slate-400"
                value={person} onChange={e => setPerson(e.target.value)} autoFocus required
              />
              <input 
                  type="number" 
                  placeholder="Сумма" 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white placeholder-slate-400"
                  value={amount} onChange={e => setAmount(e.target.value)} required
              />
              <div>
                <label className="text-xs text-slate-400 font-bold ml-1">
                    {activeTab === 'OWE_ME' ? 'Ожидается до (опционально)' : 'Вернуть до (опционально)'}
                </label>
                <input 
                  type="date" 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 mt-1 text-slate-800 dark:text-white"
                  value={dueDate} onChange={e => setDueDate(e.target.value)} 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 text-slate-500 font-bold">Отмена</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Button (Floating) */}
      {!showAdd && !paymentModal.isOpen && (
        <button 
          onClick={() => setShowAdd(true)}
          className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-slate-300 dark:shadow-blue-900/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Icon name="plus" />
          <span>Добавить запись</span>
        </button>
      )}

      {/* Payment Processing Modal */}
      {paymentModal.isOpen && paymentModal.debt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center sm:items-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 animate-in slide-in-from-bottom-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        {paymentModal.debt.type === 'I_OWE' ? 'Возврат долга' : 'Получение оплаты'}
                    </h3>
                    <button onClick={() => setPaymentModal({isOpen: false, debt: null})} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">✕</button>
                </div>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Остаток долга: <span className="font-bold text-slate-800 dark:text-white">{paymentModal.debt.amount} ₽</span>
                </p>

                <form onSubmit={handleConfirmPayment} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Сумма операции</label>
                        <input 
                            type="number" 
                            className="w-full text-center text-3xl font-bold p-3 border-b-2 border-blue-500 outline-none bg-transparent text-slate-800 dark:text-white"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 mt-4 active:scale-[0.98] transition-transform"
                    >
                        Подтвердить и записать
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Debts;