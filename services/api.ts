
import { GoogleGenAI } from "@google/genai";
import { 
    AuthResponse, PaymentInitiateResponse, PaymentStatusResponse, AiAdviceRequest, 
    SubscriptionLevel, UserProfile, Subscription, 
    Reminder, ReminderSettings, ReminderListResponse, ReminderHistoryItem,
    ParsedTransaction, Category, Transaction, SmartInsight
} from '../types';
import { getSubscriptions as getLocalSubs, saveSubscription as saveLocalSub, deleteSubscription as deleteLocalSub } from './storage';

/**
 * API SERVICE
 */

// Initialize Gemini AI
const getApiKey = () => {
    try {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            return process.env.API_KEY || '';
        }
    } catch (e) {
        // Ignore error
    }
    return '';
};

const apiKey = getApiKey();
// Only initialize if key exists to prevent immediate crash, though SDK might handle empty
const genAI = new GoogleGenAI({ apiKey: apiKey });

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data Helpers for Reminders (Persisted to LocalStorage)
const getRemindersFromStorage = (): Reminder[] => {
    try {
        const data = localStorage.getItem('finbot_mock_reminders');
        return data ? JSON.parse(data) : [];
    } catch { return []; }
};

const saveRemindersToStorage = (reminders: Reminder[]) => {
    localStorage.setItem('finbot_mock_reminders', JSON.stringify(reminders));
};

const getReminderHistoryFromStorage = (): ReminderHistoryItem[] => {
    try {
        const data = localStorage.getItem('finbot_mock_reminder_history');
        return data ? JSON.parse(data) : [];
    } catch { return []; }
};

const getReminderSettingsFromStorage = (): ReminderSettings => {
    try {
        const data = localStorage.getItem('finbot_mock_reminder_settings');
        return data ? JSON.parse(data) : { 
            enabled: true, 
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            defaultChannels: ['TELEGRAM'],
            defaultTime: "09:00"
        };
    } catch { return { 
        enabled: true, 
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        defaultChannels: ['TELEGRAM'],
        defaultTime: "09:00"
    };}
};

const saveReminderSettingsToStorage = (settings: ReminderSettings) => {
    localStorage.setItem('finbot_mock_reminder_settings', JSON.stringify(settings));
};


export const api = {
    auth: {
        login: async (_initData: string): Promise<AuthResponse> => {
            await delay(500); 
            // DEFAULT TO MAX FOR DEMO/QA PURPOSES
            return {
                token: 'mock_jwt',
                user: {
                    id: 'user_001',
                    telegramId: 12345678,
                    firstName: 'User',
                    subscriptionLevel: (localStorage.getItem('finbot_sub_level') as SubscriptionLevel) || 'MAX',
                    subscriptionExpiresAt: null,
                    currency: 'RUB',
                    privacyMode: false
                }
            };
        },
        getMe: async (): Promise<UserProfile> => {
             await delay(300);
             return {
                id: 'user_001',
                telegramId: 12345678,
                firstName: 'User',
                subscriptionLevel: (localStorage.getItem('finbot_sub_level') as SubscriptionLevel) || 'MAX',
                subscriptionExpiresAt: null,
                currency: 'RUB',
                privacyMode: false
             };
        }
    },

    // ... Payment (Same as before) ...
    payment: {
        createPayment: async (_plan: string): Promise<PaymentInitiateResponse> => {
            await delay(1000);
            return {
                paymentId: `pay_${Date.now()}`,
                providerPaymentId: `yoo_${Date.now()}`,
                confirmationUrl: 'https://yoomoney.ru' 
            };
        },
        checkStatus: async (_providerPaymentId: string): Promise<PaymentStatusResponse> => {
            await delay(500);
            return { status: 'SUCCEEDED' };
        }
    },

    // ... Subscriptions (Same as before) ...
    subscriptions: {
        list: async (): Promise<Subscription[]> => { await delay(300); return getLocalSubs(); },
        create: async (sub: Subscription): Promise<Subscription> => { await delay(300); saveLocalSub(sub); return sub; },
        update: async (id: string, updates: Partial<Subscription>): Promise<Subscription> => { await delay(300); const s = getLocalSubs().find(x=>x.id===id); if(s) saveLocalSub({...s, ...updates}); return s!; },
        delete: async (id: string): Promise<void> => { await delay(300); deleteLocalSub(id); }
    },

    // ... Reminders (Persisted) ...
    reminders: {
        list: async (limit = 20, offset = 0): Promise<ReminderListResponse> => {
            await delay(300);
            const items = getRemindersFromStorage();
            return { items: items.slice(offset, offset + limit), total: items.length };
        },
        create: async (reminder: Omit<Reminder, 'id' | 'nextRun'>): Promise<Reminder> => {
            await delay(300);
            const items = getRemindersFromStorage();
            const newR = { ...reminder, id: `r_${Date.now()}`, nextRun: reminder.scheduledAt };
            items.push(newR);
            saveRemindersToStorage(items);
            return newR;
        },
        update: async (id: string, updates: Partial<Reminder>): Promise<Reminder> => {
            await delay(300);
            const items = getRemindersFromStorage();
            const idx = items.findIndex(r => r.id === id);
            if (idx !== -1) {
                items[idx] = { ...items[idx], ...updates };
                saveRemindersToStorage(items);
                return items[idx];
            }
            throw new Error("Reminder not found");
        },
        delete: async (id: string): Promise<void> => {
            await delay(300);
            const items = getRemindersFromStorage();
            const newItems = items.filter(r => r.id !== id);
            saveRemindersToStorage(newItems);
        },
        run: async (_id: string): Promise<{ status: string }> => { await delay(500); return { status: 'OK' }; },
        getHistory: async (): Promise<ReminderHistoryItem[]> => { 
            await delay(300); 
            return getReminderHistoryFromStorage(); 
        },
        getSettings: async (): Promise<ReminderSettings> => { 
            await delay(300); 
            return getReminderSettingsFromStorage(); 
        },
        updateSettings: async (settings: Partial<ReminderSettings>): Promise<ReminderSettings> => { 
            await delay(300); 
            const current = getReminderSettingsFromStorage();
            const updated = {...current, ...settings};
            saveReminderSettingsToStorage(updated);
            return updated; 
        }
    },

    ai: {
        // 1. RAG Chat
        getAdvice: async (context: AiAdviceRequest): Promise<string> => {
            // Simplify transactions for prompt to save tokens
            const txSummary = context.transactions?.slice(0, 50).map(t => 
                `${t.date}: ${t.amount}RUB (${t.type}) - Cat:${t.categoryId} Note:${t.note||''}`
            ).join('\n') || "Нет операций.";

            const prompt = `
            Ты - финансовый помощник. 
            Контекст пользователя за ${context.month}:
            Доход: ${context.income}, Расход: ${context.expense}, Баланс: ${context.balance}.
            Топ категория трат: ${context.topCategory}.
            
            Последние операции:
            ${txSummary}

            Задача: Ответь на вопрос пользователя или дай краткий совет. Если пользователь спрашивает про конкретные траты ("сколько я потратил на такси?"), используй список операций выше. Отвечай кратко, с эмодзи.
            `;

            try {
                if (!apiKey) throw new Error("No API Key");
                const response = await genAI.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                return response.text || "Ошибка ИИ.";
            } catch (error) {
                console.warn("Gemini Error or No Key:", error);
                // Graceful fallback for Demo/No-Key environment
                return `🤖 *Демо-режим AI*: 
                
Я вижу, что в этом месяце ваши доходы составили ${context.income}₽, а расходы ${context.expense}₽. 
Топ категория: ${context.topCategory}.

В полной версии с API ключом я бы дал детальный анализ ваших привычек! Попробуйте добавить API_KEY.`;
            }
        },

        // 2. Receipt Scanning (Vision)
        parseReceipt: async (base64Image: string): Promise<ParsedTransaction> => {
            try {
                if (!apiKey) throw new Error("No API Key");
                const response = await genAI.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [
                            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                            { text: "Analyze this receipt. Return JSON with 'total' (number), 'date' (YYYY-MM-DD), 'vendor' (string used for note), 'category' (guess one of: exp_food, exp_transport, exp_shopping, exp_health, exp_cafe). If unsure category, use exp_other." }
                        ]
                    },
                });

                const json = JSON.parse(response.text || '{}');
                return {
                    amount: json.total || 0,
                    date: json.date || new Date().toISOString().split('T')[0],
                    note: json.vendor || "Чек",
                    categoryId: json.category || "exp_other",
                    confidence: 0.9
                };
            } catch (e) {
                console.error("Receipt Parsing Error", e);
                // Mock success for demo
                return { amount: 1250, date: new Date().toISOString().split('T')[0], note: "Демо Чек (Магнит)", categoryId: "exp_food", confidence: 0 };
            }
        },

        // 3. Voice Parsing (NLP)
        parseVoiceCommand: async (transcript: string, categories: Category[]): Promise<ParsedTransaction> => {
            try {
                if (!apiKey) throw new Error("No API Key");
                const catList = categories.map(c => `${c.id} (${c.name})`).join(', ');
                const prompt = `
                Parse this financial command: "${transcript}".
                Available categories: ${catList}.
                Return JSON: { "amount": number, "categoryId": string, "note": string }.
                If category is unclear, map to best fit or 'exp_other'.
                Example: "Spent 500 on taxi" -> {"amount": 500, "categoryId": "exp_transport", "note": "taxi"}
                `;
                const response = await genAI.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { responseMimeType: "application/json" }
                });
                return JSON.parse(response.text || '{}');
            } catch (e) {
                // Simple regex fallback for demo
                const num = transcript.match(/\d+/);
                return { 
                    amount: num ? parseInt(num[0]) : 0, 
                    confidence: 0, 
                    note: transcript,
                    categoryId: 'exp_other'
                };
            }
        },

        // 4. Auto-Categorization
        suggestCategory: async (note: string, categories: Category[]): Promise<string> => {
             if (!apiKey) return 'exp_other';
             const catList = categories.map(c => `${c.id} (${c.name})`).join(', ');
             const prompt = `Classify this expense: "${note}". Choose ID from: ${catList}. Return ONLY the categoryId string.`;
             try {
                const response = await genAI.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                return response.text?.trim().replace(/['"]/g, '') || 'exp_other';
             } catch {
                 return 'exp_other';
             }
        },

        // 5. Smart Insights & Goals
        getSmartInsights: async (transactions: Transaction[]): Promise<SmartInsight[]> => {
            if (!apiKey) return [];
            const recent = transactions.slice(0, 30).map(t => `${t.date}: ${t.amount} ${t.type} (${t.note})`).join('\n');
            const prompt = `Analyze: ${recent}. Generate 1 JSON insight: { "type": "SENTIMENT"|"GAP_WARNING"|"GOAL_SUGGESTION", "title": "Short", "message": "RU", "icon": "Lucide", "color": "Tailwind" }`;
            try {
                 const response = await genAI.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { responseMimeType: "application/json" }
                });
                return [JSON.parse(response.text || '{}')];
            } catch (e) { return []; }
        },

        suggestGoal: async (transactions: Transaction[]): Promise<{title: string, amount: number, message: string}> => {
            if (!apiKey) return { title: 'Отпуск', amount: 100000, message: 'Демо: начните копить на отдых!' };
            const recent = transactions.slice(0, 50).map(t => `${t.amount} ${t.type} on ${t.note}`).join('\n');
            const prompt = `Based on these expenses, suggest a savings goal. E.g. "Cut coffee to save for Phone". Return JSON: { "title": "Goal Name", "amount": number (target), "message": "Reasoning" }.`;
            try {
                const response = await genAI.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { responseMimeType: "application/json" }
                });
                return JSON.parse(response.text || '{}');
            } catch (e) {
                return { title: 'Накопления', amount: 50000, message: 'Стандартная цель' };
            }
        }
    }
};
