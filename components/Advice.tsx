
import React, { useState } from 'react';
import PremiumBlock from './PremiumBlock';
import { getTransactionsByMonth, getCategories } from '../services/storage';
import { TransactionType } from '../types';
import { api } from '../services/api';

interface AdviceProps {
  subscriptionLevel: 'FREE' | 'PRO' | 'PREMIUM';
  onGoToSettings: () => void;
}

const Advice: React.FC<AdviceProps> = ({ subscriptionLevel, onGoToSettings }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (subscriptionLevel !== 'PREMIUM') {
    return <PremiumBlock onGoToSettings={onGoToSettings} title="AI Советник" />;
  }

  const getAiAdvice = async () => {
    setLoading(true);
    setError(null);
    setAdvice(null);
    
    try {
      // 1. Prepare Context Data locally
      const currentDate = new Date();
      const txs = getTransactionsByMonth(currentDate);
      const categories = getCategories();

      const income = txs.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
      const expense = txs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
      const balance = income - expense;

      // Find top expense category
      const expenseMap: Record<string, number> = {};
      txs.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
        expenseMap[t.categoryId] = (expenseMap[t.categoryId] || 0) + t.amount;
      });
      const topExpenseId = Object.keys(expenseMap).sort((a, b) => expenseMap[b] - expenseMap[a])[0];
      const topExpenseName = topExpenseId ? (categories.find(c => c.id === topExpenseId)?.name || 'Неизвестно') : 'Нет трат';

      // 2. Call Backend API
      // The backend will secure the OpenAI API Key and construct the prompt
      const result = await api.ai.getAdvice({
          income,
          expense,
          balance,
          topCategory: topExpenseName
      });

      setAdvice(result);
    } catch (err) {
      console.error(err);
      setError("Сервер AI временно недоступен. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-5 pt-4">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-xl border border-white/30">
              🤖
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">ChatGPT Ассистент</h2>
              <p className="text-xs text-indigo-200">Powered by OpenAI & Backend</p>
            </div>
          </div>

          <p className="text-sm text-indigo-100 mb-6 leading-relaxed">
            Я проанализирую ваши транзакции через защищенный сервер и дам совет по оптимизации бюджета.
          </p>

          {!advice && !loading && (
            <button 
              onClick={getAiAdvice}
              className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 active:scale-95 duration-200"
            >
              <span>Получить совет</span>
              <span className="text-lg">✨</span>
            </button>
          )}

          {loading && (
             <div className="flex flex-col items-center justify-center py-4 space-y-3">
               <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
               <span className="text-xs font-medium text-indigo-200 animate-pulse">Генерация ответа (API)...</span>
             </div>
          )}
        </div>
      </div>

      {/* Result Card */}
      {advice && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex gap-4">
             <div className="text-3xl">💡</div>
             <div>
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Совет от AI</h3>
               <p className="text-slate-800 font-medium leading-relaxed text-lg">
                 {advice}
               </p>
             </div>
           </div>
           <button 
             onClick={getAiAdvice}
             className="w-full mt-6 py-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors border-t border-slate-50 pt-4"
           >
             Обновить
           </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-medium border border-rose-100">
          {error}
        </div>
      )}

      <div className="text-center text-[10px] text-slate-300 px-4">
         Используется API gpt-4o-mini. Не является инвестиционной рекомендацией.
      </div>
    </div>
  );
};

export default Advice;
