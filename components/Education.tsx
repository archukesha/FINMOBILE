
import React, { useMemo, useState } from 'react';
import Icon from './Icon';
import { ARTICLES } from '../constants';
import { Article, SubscriptionLevel } from '../types';
import ArticleReader from './ArticleReader';
import PremiumBlock from './PremiumBlock';

interface EducationProps {
  onBack: () => void;
  subscriptionLevel: SubscriptionLevel;
  onGoToSettings: () => void;
}

const Education: React.FC<EducationProps> = ({ onBack, subscriptionLevel, onGoToSettings }) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [search, setSearch] = useState('');

  // Lock for FREE users (Requires PLUS+)
  if (subscriptionLevel === 'FREE') {
      return (
          <div className="h-full flex flex-col">
              <div className="p-5 flex items-center gap-4">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Icon name="arrow-left" />
                </button>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">База знаний</h2>
              </div>
              <PremiumBlock onGoToSettings={onGoToSettings} title="База знаний" />
          </div>
      );
  }

  const featured = ARTICLES[0]; 

  const filtered = ARTICLES.filter(a => {
      const matchCat = selectedCategory === 'ALL' || a.category === selectedCategory;
      const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
  });

  return (
    <>
    <div className="p-5 pb-32 animate-page-enter">
       <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
          <Icon name="arrow-left" />
        </button>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">База знаний</h2>
      </div>

      <div className="relative mb-8 z-20">
          <Icon name="search" className="absolute left-4 top-4 text-slate-400" size={20} />
          <input 
            placeholder="Поиск статей..." 
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 outline-none font-medium dark:text-white transition-all focus:ring-2 focus:ring-indigo-500/20"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
      </div>

      {/* Featured Card */}
      {!search && selectedCategory === 'ALL' && (
          <div onClick={() => setReadingArticle(featured)} className="mb-8 relative rounded-[2.5rem] overflow-hidden aspect-[4/3] group cursor-pointer shadow-xl active:scale-[0.98] transition-all z-10">
              <div className={`absolute inset-0 ${featured.color} opacity-90`}></div>
              <Icon name={featured.icon} size={150} className="absolute -right-10 -bottom-10 text-white opacity-20 rotate-12 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                  <span className="bg-white/20 backdrop-blur self-start px-3 py-1 rounded-lg text-xs font-bold uppercase mb-2">Главное</span>
                  <h3 className="text-3xl font-black leading-tight mb-2">{featured.title}</h3>
                  <p className="line-clamp-2 opacity-90">{featured.description}</p>
              </div>
          </div>
      )}

      {/* Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2 z-20 relative">
          {['ALL', 'BASICS', 'INVESTING', 'BUDGET'].map(c => (
              <button 
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === c ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-105' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500'}`}
              >
                  {c === 'ALL' ? 'Все' : c === 'BASICS' ? 'Основы' : c === 'INVESTING' ? 'Инвестиции' : 'Бюджет'}
              </button>
          ))}
      </div>

      <div className="space-y-4 relative z-10">
          {filtered.map(article => (
              <div 
                key={article.id} 
                onClick={() => setReadingArticle(article)} 
                className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] flex items-center gap-4 shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md"
              >
                  <div className={`w-16 h-16 rounded-2xl ${article.color} flex items-center justify-center text-white text-2xl shadow-md shrink-0`}>
                      <Icon name={article.icon} size={28} />
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-900 dark:text-white leading-tight mb-1">{article.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase">
                          <span className="flex items-center gap-1"><Icon name="clock" size={10} /> {article.readTime} мин</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span>{article.category === 'BASICS' ? 'Основы' : article.category === 'INVESTING' ? 'Инвестиции' : article.category === 'BUDGET' ? 'Бюджет' : 'Долги'}</span>
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
    {readingArticle && <ArticleReader article={readingArticle} onClose={() => setReadingArticle(null)} />}
    </>
  );
};
export default Education;
