
import React, { useMemo, useState } from 'react';
import Icon from './Icon';
import { getGoals, markArticleRead } from '../services/storage';
import { ARTICLES } from '../constants';
import { Article } from '../types';
import ArticleReader from './ArticleReader';

interface EducationProps {
  onBack: () => void;
}

const Education: React.FC<EducationProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'BASICS' | 'INVESTING' | 'BUDGET' | 'DEBT'>('ALL');
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  // Logic to show personalized content (Top Banner)
  const recommendations = useMemo(() => {
    const goals = getGoals();
    const hasSafetyNet = goals.some(g => g.name.toLowerCase().includes('подушка') || g.name.toLowerCase().includes('резерв'));
    
    // Find specific articles from constant
    const safetyNetArticle = ARTICLES.find(a => a.id === 'safety_net');
    const budgetArticle = ARTICLES.find(a => a.id === '50_30_20');

    const recs = [];

    if (!hasSafetyNet && safetyNetArticle) {
      recs.push(safetyNetArticle);
    } else if (budgetArticle) {
       recs.push(budgetArticle);
    }
    
    return recs;
  }, []);

  const filteredArticles = useMemo(() => {
     if (selectedCategory === 'ALL') return ARTICLES;
     return ARTICLES.filter(a => a.category === selectedCategory);
  }, [selectedCategory]);

  const handleRead = (article: Article) => {
      setReadingArticle(article);
      markArticleRead(article.id);
  };

  const categories: {id: string, label: string}[] = [
      { id: 'ALL', label: 'Все' },
      { id: 'BASICS', label: 'Основы' },
      { id: 'BUDGET', label: 'Бюджет' },
      { id: 'INVESTING', label: 'Инвестиции' },
      { id: 'DEBT', label: 'Долги' }
  ];

  return (
    <>
    <div className="p-5 space-y-6 animate-page-enter pb-32">
       <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <Icon name="arrow-left" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">База знаний</h2>
      </div>

      <div className="bg-slate-900 dark:bg-indigo-950 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-slate-300 dark:shadow-slate-900/50">
         <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-30"></div>
         <h3 className="font-bold text-lg mb-2 relative z-10">Финансовая грамотность</h3>
         <p className="text-slate-300 text-sm relative z-10">
           {ARTICLES.length} простых уроков, которые помогут быстрее достичь ваших целей и избежать долгов.
         </p>
      </div>

      {recommendations.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 flex items-center gap-2">
            <span>🔥</span> Рекомендуем вам
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {recommendations.map(article => (
              <div 
                key={article.id} 
                onClick={() => handleRead(article)}
                className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-start gap-4 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group"
              >
                <div className={`w-14 h-14 rounded-2xl ${article.color} flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon name={article.icon} size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{article.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">{article.description}</p>
                  <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-700 inline-block px-2 py-0.5 rounded-md">
                    Читать • {article.readTime} мин
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3">Каталог статей</h3>
        
        {/* Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-2">
           {categories.map(cat => (
             <button
               key={cat.id}
               onClick={() => setSelectedCategory(cat.id as any)}
               className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                 selectedCategory === cat.id 
                   ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-md' 
                   : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
               }`}
             >
               {cat.label}
             </button>
           ))}
        </div>

        {/* List */}
        <div className="space-y-3">
           {filteredArticles.map(article => (
             <button 
                key={article.id}
                onClick={() => handleRead(article)}
                className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-4 text-left hover:border-blue-200 dark:hover:border-blue-700 transition-colors group active:bg-slate-50 dark:active:bg-slate-700"
             >
                <div className={`w-10 h-10 rounded-xl ${article.color} bg-opacity-10 flex items-center justify-center text-lg shrink-0`}>
                  <div className={`${article.color.replace('bg-', 'text-')}`}>
                     <Icon name={article.icon} size={20} />
                  </div>
                </div>
                <div className="flex-1">
                   <div className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-tight">{article.title}</div>
                   <div className="text-[10px] text-slate-400 mt-1">{article.readTime} мин чтения</div>
                </div>
                <Icon name="chevron-right" size={16} className="text-slate-300 dark:text-slate-600" />
             </button>
           ))}
        </div>
      </div>
    </div>

    {/* Reader Modal */}
    {readingArticle && (
       <ArticleReader article={readingArticle} onClose={() => setReadingArticle(null)} />
    )}
    </>
  );
};

export default Education;
