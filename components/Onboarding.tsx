
import React, { useState } from 'react';
import Icon from './Icon';
import { Currency } from '../types';
import { saveCurrency } from '../services/storage';
import { api } from '../services/api';
import { haptic } from '../services/telegram';

interface OnboardingProps {
    onComplete: () => void;
}

const STEPS = ['INTRO', 'CURRENCY', 'NOTIFICATIONS', 'FINAL'] as const;

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>('RUB');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleNext = async () => {
        haptic.impact('light');
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            // Finish
            saveCurrency(selectedCurrency);
            // Save notification preference
            if (notificationsEnabled) {
                await api.reminders.updateSettings({ enabled: true });
            }
            onComplete();
        }
    };

    const currencies: { code: Currency; label: string; symbol: string }[] = [
        { code: 'RUB', label: 'Российский Рубль', symbol: '₽' },
        { code: 'USD', label: 'US Dollar', symbol: '$' },
        { code: 'EUR', label: 'Euro', symbol: '€' },
        { code: 'KZT', label: 'Тенге', symbol: '₸' },
    ];

    const renderStepContent = () => {
        switch (STEPS[currentStepIndex]) {
            case 'INTRO':
                return (
                    <div className="flex flex-col items-center justify-center text-center animate-in slide-in-from-right duration-500">
                         <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-8 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/10 animate-float">
                            <Icon name="wallet" size={64} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                            Добро пожаловать
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg px-4">
                            FinBot поможет навести порядок в деньгах. Давайте быстро настроим приложение под вас.
                        </p>
                    </div>
                );
            case 'CURRENCY':
                return (
                    <div className="w-full animate-in slide-in-from-right duration-500">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 mx-auto flex items-center justify-center mb-4">
                                <Icon name="coins" size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Основная валюта</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">В чем вы ведете учет?</p>
                        </div>
                        <div className="space-y-3">
                            {currencies.map((curr) => (
                                <button
                                    key={curr.code}
                                    onClick={() => { setSelectedCurrency(curr.code); haptic.selection(); }}
                                    className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${
                                        selectedCurrency === curr.code 
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-white shadow-md' 
                                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold">{curr.symbol}</span>
                                        <span className="font-bold">{curr.label}</span>
                                    </div>
                                    {selectedCurrency === curr.code && <Icon name="check-circle" className="text-indigo-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'NOTIFICATIONS':
                return (
                    <div className="w-full text-center animate-in slide-in-from-right duration-500">
                        <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 mx-auto flex items-center justify-center mb-6 animate-pulse-slow">
                            <Icon name="bell" size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Напоминания</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 px-4">
                            Бот может напоминать записывать расходы вечером или уведомлять о плановых платежах.
                        </p>
                        
                        <button
                            onClick={() => { setNotificationsEnabled(!notificationsEnabled); haptic.selection(); }}
                            className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all ${
                                notificationsEnabled
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                        >
                            <span className="font-bold text-lg">
                                {notificationsEnabled ? 'Уведомления включены' : 'Уведомления выключены'}
                            </span>
                            <div className={`w-12 h-7 rounded-full bg-black/20 relative`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${notificationsEnabled ? 'left-6' : 'left-1'}`}></div>
                            </div>
                        </button>
                    </div>
                );
            case 'FINAL':
                return (
                     <div className="flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center mb-8 shadow-2xl shadow-purple-500/30">
                           <Icon name="rocket" size={64} />
                       </div>
                       <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                           Всё готово!
                       </h1>
                       <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg px-4">
                           Приятного использования. Начните с добавления первой операции или создайте цель.
                       </p>
                   </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col p-6">
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
                {renderStepContent()}
            </div>

            <div className="w-full max-w-md mx-auto space-y-6">
                <div className="flex justify-center gap-2">
                    {STEPS.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStepIndex ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} />
                    ))}
                </div>
                <button 
                    onClick={handleNext}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 active:scale-95 transition-transform"
                >
                    {currentStepIndex === STEPS.length - 1 ? 'Поехали!' : 'Далее'}
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
