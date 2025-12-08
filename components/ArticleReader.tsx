
import React from 'react';
import { Article } from '../types';
import Icon from './Icon';

interface ArticleReaderProps {
  article: Article | null;
  onClose: () => void;
}

const ArticleReader: React.FC<ArticleReaderProps> = ({ article, onClose }) => {
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white dark:bg-slate-900 animate-in slide-in-from-bottom duration-300">
      {/* Header Image/Color Area */}
      <div className={`relative h-56 ${article.color} flex items-end p-6 shrink-0`}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-colors z-50"
        >
          <Icon name="x" size={24} />
        </button>
        
        <div className="relative z-10 text-white w-full">
           <div className="flex items-center gap-2 mb-3 opacity-90">
             <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">
                {article.category}
             </span>
             <span className="text-xs font-medium flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                <Icon name="clock" size={12} /> {article.readTime} мин
             </span>
           </div>
           <h1 className="text-2xl sm:text-3xl font-black leading-tight drop-shadow-md max-w-[90%]">{article.title}</h1>
        </div>

        {/* Abstract Pattern Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
           <Icon name={article.icon} size={250} className="absolute -right-12 -bottom-16 rotate-12" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
        <div className="prose prose-slate dark:prose-invert max-w-none pb-20">
          <p className="lead text-lg font-medium text-slate-600 dark:text-slate-300 mb-8 italic border-l-4 border-indigo-500 pl-4 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-r-lg">
             {article.description}
          </p>
          
          <div className="space-y-6">
            {article.content.map((paragraph, index) => (
              <p key={index} className="text-slate-800 dark:text-slate-200 leading-relaxed text-lg">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                🎓
             </div>
             <div>
                <p className="font-bold text-slate-800 dark:text-white">ФинБот Академия</p>
                <p className="text-xs text-slate-400">Знание — лучшая инвестиция</p>
             </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Sticky Action */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 safe-area-bottom">
         <button 
           onClick={onClose}
           className="w-full py-3.5 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
         >
           Понятно, спасибо
         </button>
      </div>
    </div>
  );
};

export default ArticleReader;