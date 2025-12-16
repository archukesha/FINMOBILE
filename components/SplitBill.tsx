
import React, { useState } from 'react';
import Icon from './Icon';

interface SplitBillProps {
    onBack: () => void;
}

const SplitBill: React.FC<SplitBillProps> = ({ onBack }) => {
    const [total, setTotal] = useState('');
    const [people, setPeople] = useState(2);
    const [tip, setTip] = useState(0);

    const amount = parseFloat(total) || 0;
    const finalAmount = amount + (amount * (tip / 100));
    const perPerson = finalAmount / people;

    return (
        <div className="p-5 h-full flex flex-col bg-white dark:bg-slate-900 animate-page-enter">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Icon name="arrow-left" />
                </button>
                <h2 className="text-2xl font-bold dark:text-white">Разделить чек</h2>
            </div>

            <div className="flex-1 space-y-8">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Сумма чека</label>
                    <input 
                        type="number" 
                        value={total} 
                        onChange={e => setTotal(e.target.value)}
                        placeholder="0" 
                        className="w-full text-5xl font-black bg-transparent outline-none dark:text-white placeholder-slate-200" 
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-4">Количество людей: {people}</label>
                    <input 
                        type="range" 
                        min="2" max="10" 
                        value={people} 
                        onChange={e => setPeople(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-2 text-slate-400 text-xs font-bold">
                        <span>2</span><span>10</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Чаевые: {tip}%</label>
                    <div className="flex gap-2">
                        {[0, 10, 15, 20].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setTip(t)}
                                className={`flex-1 py-3 rounded-xl font-bold transition-colors ${tip === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                            >
                                {t}%
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] text-center">
                    <p className="text-slate-400 font-bold uppercase text-xs mb-2">С каждого по</p>
                    <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                        {perPerson.toFixed(0)} ₽
                    </div>
                    {tip > 0 && <p className="text-xs text-slate-400 mt-2">Включая чаевые {(amount * tip/100).toFixed(0)} ₽</p>}
                </div>
            </div>
        </div>
    );
};

export default SplitBill;
