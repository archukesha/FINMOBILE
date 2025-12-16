
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { Category, TransactionType, SubscriptionLevel } from '../types';
import { getTransactionsByMonth } from '../services/storage';
import PremiumBlock from './PremiumBlock';
import Icon from './Icon';

interface AnalyticsProps {
  categories: Category[];
  subscriptionLevel: SubscriptionLevel;
  onGoToSettings: () => void;
  currentDate: Date;
  onBack: () => void;
}

type ChartMode = 'CATEGORY' | 'TREND' | 'WEEKDAY';

const Analytics: React.FC<AnalyticsProps> = ({ categories, subscriptionLevel, onGoToSettings, currentDate: propDate, onBack }) => {
  const [selectedDate, setSelectedDate] = useState(propDate);
  const [analysisType, setAnalysisType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [chartMode, setChartMode] = useState<ChartMode>('CATEGORY');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const txs = useMemo(() => getTransactionsByMonth(selectedDate), [selectedDate]);

  // --- Data Prep: Categories (Pie) ---
  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    const targetType = analysisType === 'EXPENSE' ? TransactionType.EXPENSE : TransactionType.INCOME;

    txs.filter(t => t.type === targetType).forEach(t => {
      categoryMap[t.categoryId] = (categoryMap[t.categoryId] || 0) + t.amount;
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

  const total = categoryData.reduce((sum, item) => sum + item.value, 0);

  // --- Data Prep: Trend (Area) ---
  const trendData = useMemo(() => {
      const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
      const result = [];
      const targetType = analysisType === 'EXPENSE' ? TransactionType.EXPENSE : TransactionType.INCOME;
      
      for (let i = 1; i <= daysInMonth; i++) {
          const dayTxs = txs.filter(t => {
              const d = new Date(t.date);
              return d.getDate() === i && t.type === targetType;
          });
          const sum = dayTxs.reduce((acc, t) => acc + t.amount, 0);
          result.push({ day: i, amount: sum });
      }
      return result;
  }, [txs, selectedDate, analysisType]);

  // --- Data Prep: Weekdays (Bar) ---
  const weekdayData = useMemo(() => {
      const sums = new Array(7).fill(0);
      const targetType = analysisType === 'EXPENSE' ? TransactionType.EXPENSE : TransactionType.INCOME;

      txs.filter(t => t.type === targetType).forEach(t => {
          const day = new Date(t.date).getDay(); // 0 = Sun, 1 = Mon...
          sums[day] += t.amount;
      });

      // Shift to start from Monday: Mon(1), Tue(2)... Sun(0)
      const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      const mapIndex = [1, 2, 3, 4, 5, 6, 0];
      
      return labels.map((label, i) => ({
          name: label,
          value: sums[mapIndex[i]]
      }));
  }, [txs, analysisType]);


  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
    setSelectedCategoryId(null);
  };

  const handleShareStory = () => {
      // Mock share story
      alert("Генерирую сториз для Telegram...");
      // Ideally calls window.Telegram.WebApp.shareToStory(...) with a generated image URL
  };

  const filteredTransactions = useMemo(() => {
      if (!selectedCategoryId) return [];
      return txs.filter(t => t.categoryId === selectedCategoryId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCategoryId, txs]);

  const hasAccess = subscriptionLevel !== 'FREE' && subscriptionLevel !== 'PLUS'; // Pro+
  if (!hasAccess) return <PremiumBlock onGoToSettings={onGoToSettings} title="Аналитика Pro" onBack={onBack} />;

  const monthName = selectedDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const activeColor = analysisType === 'EXPENSE' ? '#f43f5e' : '#10b981'; // Rose or Emerald

  return (
    <div className="p-5 space-y-6 animate-page-enter pb-32">
      {/* Header & Date Picker */}
      <div className="flex flex-col gap-4">
         <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Отчеты</h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                <button onClick={() => setAnalysisType('EXPENSE')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${analysisType === 'EXPENSE' ? 'bg-white dark:bg-slate-700 shadow text-rose-500' : 'text-slate-400'}`}>Расходы</button>
                <button onClick={() => setAnalysisType('INCOME')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${analysisType === 'INCOME' ? 'bg-white dark:bg-slate-700 shadow text-emerald-500' : 'text-slate-400'}`}>Доходы</button>
            </div>
         </div>
         
         <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
             <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg"><Icon name="chevron-left" /></button>
             <span className="font-bold text-slate-700 dark:text-white capitalize">{monthName}</span>
             <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg"><Icon name="chevron-right" /></button>
         </div>

         {/* Chart Mode Switcher */}
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
             <button onClick={() => { setChartMode('CATEGORY'); setSelectedCategoryId(null); }} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${chartMode === 'CATEGORY' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-400'}`}>Категории</button>
             <button onClick={() => setChartMode('TREND')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${chartMode === 'TREND' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-400'}`}>Динамика</button>
             <button onClick={() => setChartMode('WEEKDAY')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${chartMode === 'WEEKDAY' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-400'}`}>Дни недели</button>
         </div>
      </div>

      {/* Chart Container */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 relative min-h-[350px] flex items-center justify-center overflow-hidden">
         {total > 0 ? (
             <div className="w-full h-72 relative animate-in fade-in zoom-in-95 duration-300">
                 
                 {/* PIE CHART */}
                 {chartMode === 'CATEGORY' && (
                    <>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    cornerRadius={8}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.color} 
                                            stroke="none" 
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setSelectedCategoryId(entry.id === selectedCategoryId ? null : entry.id)}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                {selectedCategoryId ? categoryData.find(d => d.id === selectedCategoryId)?.name : 'Всего'}
                            </span>
                            <span className="text-2xl font-black text-slate-800 dark:text-white">
                                {selectedCategoryId 
                                ? categoryData.find(d => d.id === selectedCategoryId)?.value.toLocaleString() 
                                : total.toLocaleString()} ₽
                            </span>
                        </div>
                    </>
                 )}

                 {/* TREND CHART (Area) */}
                 {chartMode === 'TREND' && (
                     <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={trendData}>
                             <defs>
                                 <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor={activeColor} stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor={activeColor} stopOpacity={0}/>
                                 </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                             <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fill: '#94a3b8'}} 
                                interval={2} 
                             />
                             <Tooltip 
                                cursor={{stroke: activeColor, strokeWidth: 1, strokeDasharray: '3 3'}}
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                labelStyle={{color: '#64748b', fontSize: '10px', fontWeight: 'bold'}}
                                itemStyle={{color: activeColor, fontWeight: 'bold'}}
                                formatter={(value: any) => [`${value} ₽`]}
                                labelFormatter={(label) => `${label} ${monthName}`}
                             />
                             <Area 
                                type="monotone" 
                                dataKey="amount" 
                                stroke={activeColor} 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorValue)" 
                             />
                         </AreaChart>
                     </ResponsiveContainer>
                 )}

                 {/* WEEKDAY CHART (Bar) */}
                 {chartMode === 'WEEKDAY' && (
                     <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={weekdayData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                             <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} 
                             />
                             <Tooltip 
                                cursor={{fill: 'rgba(0,0,0,0.05)'}}
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                itemStyle={{color: activeColor, fontWeight: 'bold'}}
                                formatter={(value: any) => [`${value} ₽`]}
                             />
                             <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {weekdayData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={activeColor} fillOpacity={0.6 + (entry.value / Math.max(...weekdayData.map(d=>d.value)) * 0.4)} />
                                ))}
                             </Bar>
                         </BarChart>
                     </ResponsiveContainer>
                 )}

             </div>
         ) : (
             <div className="text-center text-slate-400">
                 <Icon name="bar-chart-2" size={48} className="mx-auto mb-2 opacity-20" />
                 <p>Нет данных</p>
             </div>
         )}
      </div>

      <button onClick={handleShareStory} className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-2xl shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <Icon name="camera" size={20} /> Поделиться в Stories
      </button>

      {/* Drill-down List (Only for Category Mode) */}
      {chartMode === 'CATEGORY' && (
          selectedCategoryId ? (
            <div className="animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 dark:text-white">Операции: {categoryData.find(d => d.id === selectedCategoryId)?.name}</h3>
                    <button onClick={() => setSelectedCategoryId(null)} className="text-xs font-bold text-blue-500">Назад ко всем</button>
                </div>
                <div className="space-y-3">
                    {filteredTransactions.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div>
                                <div className="text-sm font-bold text-slate-800 dark:text-white">{new Date(tx.date).toLocaleDateString()}</div>
                                {tx.note && <div className="text-xs text-slate-400">{tx.note}</div>}
                            </div>
                            <div className="font-bold">{tx.amount.toLocaleString()} ₽</div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Топ категорий</h3>
                <div className="space-y-4">
                    {categoryData.map((item, i) => (
                        <div key={item.id} className="relative cursor-pointer" onClick={() => setSelectedCategoryId(item.id)}>
                            <div className="flex justify-between items-center mb-1.5 z-10 relative">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shadow-sm" style={{backgroundColor: item.color}}>
                                        <Icon name={item.icon} size={16} />
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-slate-800 dark:text-white text-sm">{item.value.toLocaleString()} ₽</span>
                                    <span className="text-xs text-slate-400 ml-2">{Math.round((item.value/total)*100)}%</span>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full opacity-80" style={{width: `${(item.value/total)*100}%`, backgroundColor: item.color}}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
      )}
    </div>
  );
};

export default Analytics;
