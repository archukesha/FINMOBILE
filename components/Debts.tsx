
import React, { useState, useEffect } from 'react';
import { Debt, TransactionType, SubscriptionLevel } from '../types';
import { getDebts, saveDebt, deleteDebt, saveTransaction, updateDebt } from '../services/storage';
import PremiumBlock from './PremiumBlock';
import Icon from './Icon';

interface DebtsProps {
  onBack: () => void;
  initialTab?: 'BANK_LOAN' | 'I_OWE' | 'OWE_ME';
  subscriptionLevel: SubscriptionLevel;
  onGoToSettings: () => void;
}

const Debts: React.FC<DebtsProps> = ({ onBack, initialTab, subscriptionLevel, onGoToSettings }) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [activeTab, setActiveTab] = useState<'BANK_LOAN' | 'I_OWE' | 'OWE_ME'>('BANK_LOAN');
  const [showAdd, setShowAdd] = useState(false);
  
  // Form
  const [form, setForm] = useState<Partial<Debt>>({
      title: '', totalAmount: 0, type: 'BANK_LOAN', interestRate: 0, termMonths: 12, nextPaymentDate: ''
  });

  // Lock for FREE and PLUS users (Requires PRO+)
  if (subscriptionLevel === 'FREE' || subscriptionLevel === 'PLUS') {
      return (
          <div className="h-full flex flex-col">
              <div className="p-5 flex items-center gap-4">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Icon name="arrow-left" />
                </button>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Кредитный портфель</h2>
              </div>
              <PremiumBlock onGoToSettings={onGoToSettings} title="Кредиты и Долги" />
          </div>
      );
  }

  useEffect(() => {
    refreshList();
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const refreshList = () => {
      setDebts(getDebts());
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if(!form.title || !form.totalAmount) return;
      
      const monthlyPmt = form.type === 'BANK_LOAN' && form.interestRate && form.termMonths 
        ? (form.totalAmount * (1 + form.interestRate/100)) / form.termMonths 
        : 0;

      saveDebt({
          id: crypto.randomUUID(),
          title: form.title,
          totalAmount: Number(form.totalAmount),
          remainingAmount: Number(form.totalAmount),
          type: activeTab,
          startDate: new Date().toISOString(),
          interestRate: Number(form.interestRate),
          termMonths: Number(form.termMonths),
          monthlyPayment: monthlyPmt > 0 ? monthlyPmt : undefined,
          nextPaymentDate: form.nextPaymentDate || undefined
      });
      refreshList();
      setShowAdd(false);
      setForm({ title: '', totalAmount: 0, type: activeTab, interestRate: 0, termMonths: 12, nextPaymentDate: '' });
  };

  const handleDelete = (id: string) => {
      if(confirm('Вы уверены, что хотите удалить эту запись?')) {
          deleteDebt(id);
          refreshList();
      }
  };

  const handleMakePayment = (debt: Debt) => {
      const amountStr = prompt(`Внести платеж для "${debt.title}".\nОстаток: ${debt.remainingAmount} ₽\nВведите сумму:`);
      if (!amountStr) return;
      
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
          alert("Некорректная сумма");
          return;
      }

      // 1. Create Expense Transaction
      saveTransaction({
          id: crypto.randomUUID(),
          amount: amount,
          type: TransactionType.EXPENSE,
          categoryId: 'exp_debt', // Ensure this category exists in constants or storage logic
          date: new Date().toISOString().split('T')[0],
          note: `Платеж по долгу: ${debt.title}`
      });

      // 2. Update Debt Remaining Amount
      const newRemaining = Math.max(0, debt.remainingAmount - amount);
      const updatedDebt = { ...debt, remainingAmount: newRemaining };
      
      // Update next payment date if monthly (simple logic)
      if (debt.nextPaymentDate && newRemaining > 0) {
          const nextDate = new Date(debt.nextPaymentDate);
          nextDate.setMonth(nextDate.getMonth() + 1);
          updatedDebt.nextPaymentDate = nextDate.toISOString().split('T')[0];
      }

      updateDebt(updatedDebt);
      refreshList();
      alert(`Платеж ${amount} ₽ принят. Остаток: ${newRemaining} ₽`);
  };

  const filtered = debts.filter(d => d.type === activeTab);

  return (
    <div className="p-5 h-full flex flex-col pb-32 animate-page-enter">
       <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
          <Icon name="arrow-left" />
        </button>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Кредитный портфель</h2>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6">
          {[
              {id: 'BANK_LOAN', label: 'Кредиты'},
              {id: 'I_OWE', label: 'Долги'},
              {id: 'OWE_ME', label: 'Мне должны'}
          ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setActiveTab(t.id as any)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === t.id ? 'bg-white dark:bg-slate-600 shadow-md text-indigo-600 dark:text-white' : 'text-slate-400'}`}
              >
                  {t.label}
              </button>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
          {filtered.length === 0 && (
              <div className="text-center text-slate-400 py-10">
                  <Icon name="check-circle" size={48} className="mx-auto mb-2 opacity-20" />
                  <p>В этом разделе чисто</p>
              </div>
          )}
          {filtered.map(item => {
              const progress = Math.round(((item.totalAmount - item.remainingAmount) / item.totalAmount) * 100);
              return (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between mb-2">
                        <div className="font-bold text-lg dark:text-white">{item.title}</div>
                        <div className="font-black text-slate-900 dark:text-white">{item.remainingAmount.toLocaleString()} ₽</div>
                    </div>
                    
                    {item.nextPaymentDate && (
                        <div className="text-xs font-bold text-red-500 mb-3 flex items-center gap-1">
                            <Icon name="calendar" size={12} />
                            Срок: {new Date(item.nextPaymentDate).toLocaleDateString()}
                        </div>
                    )}

                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-indigo-500" style={{width: `${progress}%`}}></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-slate-400 font-bold uppercase">
                        <span>Выплачено {progress}%</span>
                        {item.monthlyPayment && <span>{Math.round(item.monthlyPayment)} ₽/мес</span>}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700 flex gap-2">
                        <button 
                            onClick={() => handleMakePayment(item)}
                            className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                        >
                            Внести платеж
                        </button>
                         <button onClick={() => handleDelete(item.id)} className="px-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40">
                             <Icon name="trash-2" size={18} />
                         </button>
                    </div>
                </div>
              );
          })}
      </div>

      <button onClick={() => setShowAdd(true)} className="fixed bottom-24 right-5 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center z-40 animate-pop active:scale-90 transition-transform"><Icon name="plus" /></button>

      {showAdd && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-10">
                  <h3 className="font-bold text-xl dark:text-white">Новая запись</h3>
                  <input placeholder="Название (Сбер, Иван...)" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold dark:text-white" value={form.title} onChange={e => setForm({...form, title: e.target.value})} autoFocus />
                  <input type="number" placeholder="Сумма долга" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold dark:text-white" value={form.totalAmount || ''} onChange={e => setForm({...form, totalAmount: parseFloat(e.target.value)})} />
                  
                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Дата возврата / платежа</label>
                      <input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold dark:text-white" value={form.nextPaymentDate || ''} onChange={e => setForm({...form, nextPaymentDate: e.target.value})} />
                  </div>

                  {activeTab === 'BANK_LOAN' && (
                      <div className="flex gap-4">
                          <input type="number" placeholder="% ставка" className="w-1/2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white" value={form.interestRate || ''} onChange={e => setForm({...form, interestRate: parseFloat(e.target.value)})} />
                          <input type="number" placeholder="Месяцев" className="w-1/2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white" value={form.termMonths || ''} onChange={e => setForm({...form, termMonths: parseFloat(e.target.value)})} />
                      </div>
                  )}
                  
                  <div className="flex gap-2 mt-4">
                      <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">Отмена</button>
                      <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">Создать</button>
                  </div>
              </form>
          </div>
      )}
    </div>
  );
};
export default Debts;
