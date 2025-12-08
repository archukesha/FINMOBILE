import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import PremiumBlock from './PremiumBlock';
import { getTransactionsByMonth, getCategories } from '../services/storage';
import { TransactionType } from '../types';

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
      // 1. Prepare Context Data
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
      const topExpenseAmount = topExpenseId ? expenseMap[topExpenseId] : 0;

      const contextPrompt = `
        Контекст пользователя за текущий месяц:
        - Доходы: ${income} RUB
        - Расходы: ${expense} RUB
        - Баланс: ${balance} RUB
        - Топ категория трат: ${topExpenseName} (${topExpenseAmount} RUB)
      `;

      // 2. Call AI
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Ты персональный финансовый советник для жителя России (Москва). 
          ${contextPrompt}
          
          Дай ОДИН короткий, конкретный и полезный совет, основываясь на этих цифрах.
          Если расходы превышают доходы, дай совет как сократить.
          Если денег много, посоветуй куда вложить (вклады, акции РФ).
          Если трат нет, просто дай мудрый совет про накопления.
          
          Ответ должен быть на русском языке, не длиннее 3 предложений. Без воды.
        `,
      });

      setAdvice(response.text);
    } catch (err) {
      console.error(err);
      setError("Не удалось связаться с финансовым оракулом. Попробуйте позже.");
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
              <h2 className="font-bold text-lg leading-tight">AI Советник</h2>
              <p className="text-xs text-indigo-200">Анализ ваших данных</p>
            </div>
          </div>

          <p className="text-sm text-indigo-100 mb-6 leading-relaxed">
            Нажмите кнопку ниже, чтобы получить совет, основанный на ваших реальных доходах и расходах за этот месяц.
          </p>

          {!advice && !loading && (
            <button 
              onClick={getAiAdvice}
              className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 active:scale-95 duration-200"
            >
              <span>Анализировать и дать совет</span>
              <span className="text-lg">✨</span>
            </button>
          )}

          {loading && (
             <div className="flex flex-col items-center justify-center py-4 space-y-3">
               <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
               <span className="text-xs font-medium text-indigo-200 animate-pulse">Изучаю ваши финансы...</span>
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
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Совет дня</h3>
               <p className="text-slate-800 font-medium leading-relaxed text-lg">
                 {advice}
               </p>
             </div>
           </div>
           <button 
             onClick={getAiAdvice}
             className="w-full mt-6 py-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors border-t border-slate-50 pt-4"
           >
             Обновить совет ↻
           </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-medium border border-rose-100">
          {error}
        </div>
      )}

      <div className="text-center text-[10px] text-slate-300 px-4">
         Советы генерируются AI на основе введенных вами данных. Не является ИИР.
      </div>
    </div>
  );
};

export default Advice;