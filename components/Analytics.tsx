
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Category, TransactionType, SubscriptionLevel } from '../types';
import { getTransactionsByMonth } from '../services/storage';
import PremiumBlock from './PremiumBlock';
import Icon from './Icon';

interface AnalyticsProps {
  categories: Category[];
  subscriptionLevel: SubscriptionLevel;
  onGoToSettings: () => void;
  currentDate: Date;
}

const Analytics: React.FC<AnalyticsProps> = ({ categories, subscriptionLevel, onGoToSettings, currentDate }) => {
  const txs = useMemo(() => getTransactionsByMonth(currentDate), [currentDate]);
  const [analysisType, setAnalysisType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  
  // State for drill-down view
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const data = useMemo(() => {
    // Group by category
    const categoryMap: Record<string, number> = {};
    let totalAmount = 0;

    const targetType = analysisType === 'EXPENSE' ? TransactionType.EXPENSE : TransactionType.INCOME;

    txs.filter(t => t.type === targetType).forEach(t => {
      categoryMap[t.categoryId] = (categoryMap[t.categoryId] || 0) + t.amount;
      totalAmount += t.amount;
    });

    return Object.keys(categoryMap).map(catId => {
      const cat = categories.find(c => c.id === catId);
      return {
        id: catId,
        name: cat?.name || 'Неизвестно',
        value: categoryMap[catId],
        color: cat?.color || '#94a3b8',
        icon: cat?.icon || 'circle'
      };
    }).sort((a, b) => b.value - a.value);
  }, [txs, categories, analysisType]);

  // Check for "Other" category dominance
  const otherCategory = data.find(d => d.name === 'Прочее');
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const otherWarning = analysisType === 'EXPENSE' && otherCategory && total > 0 && (otherCategory.value / total) > 0.15;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
  
  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Filter transactions for the selected category
  const selectedTransactions = useMemo(() => {
    if (!selectedCategoryId) return [];
    return txs
      .filter(t => t.categoryId === selectedCategoryId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCategoryId, txs]);

  // --- ACCESS CHECK (PRO or PREMIUM) ---
  const hasAccess = subscriptionLevel === 'PRO' || subscriptionLevel === 'PREMIUM';

  if (!hasAccess) {
    return <PremiumBlock onGoToSettings={onGoToSettings} title="Детальные отчеты" />;
  }

  // --- Render Detail View ---
  if (selectedCategoryId) {
    const category = categories.find(c => c.id === selectedCategoryId);
    const categoryTotal = selectedTransactions.reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="p-5 space-y-6 h-full flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setSelectedCategoryId(null)}
                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                    <Icon name="arrow-left" size={20} />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Icon name={category?.icon || 'circle'} />
                        {category?.name}
                    </h2>
                    <p className="text-xs text-slate-400">Детализация за {monthName}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
                <div className="text-sm font-bold text-slate-400 uppercase mb-1">Итого</div>
                <div className="text-3xl font-extrabold text-slate-800 dark:text-white">{formatCurrency(categoryTotal)}</div>
                <div className="text-xs text-slate-400 mt-2">
                    {selectedTransactions.length} операций
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3">История операций</h3>
                <div className="space-y-3">
                    {selectedTransactions.map(tx => (
                         <div key={tx.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between border border-slate-50 dark:border-slate-700">
                            <div>
                                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                    {new Date(tx.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })}
                                </div>
                                {tx.note && <div className="text-xs text-slate-400 mt-0.5">{tx.note}</div>}
                            </div>
                            <div className="font-bold text-slate-800 dark:text-white">
                                {formatCurrency(tx.amount)}
                            </div>
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
  }

  // --- Render Main Chart View ---
  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Отчеты</h2>
           <p className="text-xs text-slate-400">{capitalizedMonth} {currentDate.getFullYear()}</p>
        </div>
        
        {/* Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <button 
            onClick={() => setAnalysisType('EXPENSE')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              analysisType === 'EXPENSE' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400'
            }`}
          >
            Расходы
          </button>
          <button 
            onClick={() => setAnalysisType('INCOME')}
             className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              analysisType === 'INCOME' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400'
            }`}
          >
            Доходы
          </button>
        </div>
      </div>
      
      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 h-80 relative">
        {data.length > 0 ? (
          <>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                cornerRadius={6}
                onClick={(data) => setSelectedCategoryId(data.id)}
                className="cursor-pointer outline-none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" className="hover:opacity-80 transition-opacity cursor-pointer" />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(0)} ₽`}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-xs text-slate-400 font-medium uppercase">
              {analysisType === 'EXPENSE' ? 'Траты' : 'Доход'}
            </div>
            <div className={`text-xl font-bold ${analysisType === 'EXPENSE' ? 'text-rose-500' : 'text-emerald-500'}`}>
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(total)}
            </div>
          </div>
          <div className="absolute bottom-2 w-full text-center text-[10px] text-slate-400">
             Нажмите на категорию для деталей
          </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
            <span className="text-4xl mb-2">📊</span>
            <span>Нет данных за этот период</span>
          </div>
        )}
      </div>

      {/* Top Categories List */}
      <div className="pb-20">
        <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Категории</h3>
        <div className="space-y-4">
          {data.map((item, idx) => (
            <div 
                key={idx} 
                className="flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-transform p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
                onClick={() => setSelectedCategoryId(item.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm text-lg" style={{ backgroundColor: item.color }}>
                   <Icon name={item.icon} size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</div>
                  <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full opacity-60" style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }}></div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-800 dark:text-white">{item.value.toFixed(0)} ₽</div>
                <div className="text-xs text-slate-400">
                  {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advice based on data */}
      {otherWarning && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 p-4 rounded-2xl text-yellow-800 dark:text-yellow-200 text-sm flex gap-3 items-start">
           <span className="text-xl">💡</span>
           <div>
              <strong>Совет:</strong> Расходы в категории «Прочее» составляют {Math.round((otherCategory!.value / total) * 100)}% от общего бюджета. 
              Попробуйте создать более точные категории для контроля!
           </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
