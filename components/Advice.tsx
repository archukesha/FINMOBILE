import React, { useState } from 'react';
import PremiumBlock from './PremiumBlock';
import { getTransactionsByMonth, getCategories } from '../services/storage';
import { TransactionType, SubscriptionLevel } from '../types';
import { api } from '../services/api';
import Icon from './Icon';

interface AdviceProps {
  subscriptionLevel: SubscriptionLevel;
  onGoToSettings: () => void;
}

const Advice: React.FC<AdviceProps> = ({ subscriptionLevel, onGoToSettings }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  if (subscriptionLevel !== 'MAX') {
    return <PremiumBlock onGoToSettings={onGoToSettings} title="AI Финансист" />;
  }

  const handleAsk = async () => {
    setLoading(true);
    try {
        const date = new Date(selectedMonth);
        const txs = getTransactionsByMonth(date);
        const categories = getCategories();
        
        const income = txs.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
        const expense = txs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
        
        // Find top category
        const expenseMap: Record<string, number> = {};
        txs.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
            expenseMap[t.categoryId] = (expenseMap[t.categoryId] || 0) + t.amount;
        });
        const topCatId = Object.keys(expenseMap).sort((a,b) => expenseMap[b] - expenseMap[a])[0];
        const topCatName = categories.find(c => c.id === topCatId)?.name || 'Нет данных';

        const result = await api.ai.getAdvice({
            income, expense, balance: income - expense, topCategory: topCatName, month: selectedMonth
        });
        setAdvice(result);
    } catch (e) {
        setAdvice("Ошибка соединения с сервером.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-4">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 blur-2xl rounded-full"></div>
             <div className="relative z-10">
                 <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl mb-4 border border-white/20">🤖</div>
                 <h2 className="text-xl font-bold">AI Аналитик</h2>
                 <p className="text-indigo-200 text-sm mt-1">Выберите месяц для анализа:</p>
                 
                 <div className="mt-4 flex gap-2">
                     <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white/20 border border-white/30 text-white rounded-xl px-4 py-2 outline-none font-bold"
                     />
                     <button 
                        onClick={handleAsk}
                        disabled={loading}
                        className="bg-white text-indigo-700 px-6 py-2 rounded-xl font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50"
                     >
                         {loading ? '...' : 'Анализ'}
                     </button>
                 </div>
             </div>
        </div>

        {/* Chat Area */}
        <div className="space-y-4 min-h-[200px]">
            {loading && (
                <div className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 h-24"></div>
                </div>
            )}
            
            {advice && !loading && (
                <div className="flex gap-4 animate-pop">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shrink-0">
                        <Icon name="sparkles" size={20} />
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed">
                        {advice}
                    </div>
                </div>
            )}

            {!advice && !loading && (
                <div className="text-center text-slate-400 py-10">
                    Нажмите "Анализ", чтобы получить отчет.
                </div>
            )}
        </div>
    </div>
  );
};

export default Advice;