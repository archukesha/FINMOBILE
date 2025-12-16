
import React, { useState, useRef, useEffect } from 'react';
import PremiumBlock from './PremiumBlock';
import { getTransactionsByMonth, getCategories } from '../services/storage';
import { TransactionType, SubscriptionLevel } from '../types';
import { api } from '../services/api';
import Icon from './Icon';

interface AdviceProps {
  subscriptionLevel: SubscriptionLevel;
  onGoToSettings: () => void;
  onBack: () => void;
}

interface Message {
    id: string;
    role: 'USER' | 'AI';
    text: string;
    date: Date;
}

const Advice: React.FC<AdviceProps> = ({ subscriptionLevel, onGoToSettings, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (subscriptionLevel !== 'MAX') {
    return <PremiumBlock onGoToSettings={onGoToSettings} title="AI Финансист" onBack={onBack} />;
  }

  const handleAsk = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    const dateObj = new Date(selectedMonth);
    const monthName = dateObj.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    
    // Add User Message
    const userMsg: Message = {
        id: `u_${Date.now()}`,
        role: 'USER',
        text: inputText,
        date: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    const currentQuery = inputText;
    setInputText(''); // Clear input

    try {
        const txs = getTransactionsByMonth(dateObj);
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

        // RAG: Pass filtered transactions to API
        const aiResponseText = await api.ai.getAdvice({
            income, 
            expense, 
            balance: income - expense, 
            topCategory: topCatName, 
            month: selectedMonth,
            transactions: txs // Pass transactions for RAG
        });

        const aiMsg: Message = {
            id: `a_${Date.now()}`,
            role: 'AI',
            text: aiResponseText,
            date: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);

    } catch (e) {
        const errorMsg: Message = {
            id: `err_${Date.now()}`,
            role: 'AI',
            text: "Извини, я не смог проанализировать данные. Попробуй позже.",
            date: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setLoading(false);
    }
  };

  const handleQuickAsk = () => {
       const dateObj = new Date(selectedMonth);
       const monthName = dateObj.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
       setInputText(`Проанализируй мои финансы за ${monthName}.`);
       // Trigger sending is slightly complex due to state update, user can just press send
  }

  return (
    <div className="flex flex-col h-[500px] max-h-[80vh]">
        {/* Header */}
        <div className="px-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse-slow">
                     <Icon name="sparkles" size={20} />
                 </div>
                 <div>
                     <h2 className="text-lg font-black text-slate-800 dark:text-white">AI Ассистент</h2>
                     <p className="text-xs text-slate-400 font-medium">Работает на базе Gemini</p>
                 </div>
             </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
            {/* Welcome Message */}
            {messages.length === 0 && (
                <div className="text-center py-10 opacity-60">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-3xl">
                        🤖
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-[200px] mx-auto mb-4">
                        Привет! Я твой финансовый помощник. Спроси меня:
                    </p>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => setInputText("Проанализируй этот месяц")} className="text-xs bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-xl">"Проанализируй этот месяц"</button>
                        <button onClick={() => setInputText("Сколько я потратил на еду?")} className="text-xs bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-xl">"Сколько я потратил на еду?"</button>
                    </div>
                </div>
            )}

            {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div 
                        className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                            msg.role === 'USER' 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                        }`}
                    >
                        {msg.text.split('\n').map((line, i) => (
                             <React.Fragment key={i}>{line}<br/></React.Fragment>
                        ))}
                        <div className={`text-[9px] mt-2 opacity-50 text-right ${msg.role === 'USER' ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {msg.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                </div>
            ))}

            {loading && (
                <div className="flex justify-start animate-in slide-in-from-bottom-2">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-700 flex gap-1.5 items-center h-12">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                </div>
            )}
            <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 safe-area-bottom">
            <div className="flex items-center gap-2 mb-2">
                 <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-slate-400 dark:text-slate-500 text-xs font-bold outline-none"
                    disabled={loading}
                />
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-slate-700">
                <input 
                    type="text" 
                    placeholder="Напиши вопрос..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="bg-transparent text-slate-700 dark:text-white px-4 py-2 outline-none font-medium text-sm w-full"
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                />
                <button 
                    onClick={handleAsk}
                    disabled={loading}
                    className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                >
                    <Icon name="send" size={18} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default Advice;
