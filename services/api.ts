
import { 
    AuthResponse, PaymentInitiateResponse, PaymentStatusResponse, AiAdviceRequest, 
    SubscriptionLevel, UserProfile, Subscription, 
    Reminder, ReminderSettings, ReminderListResponse, ReminderHistoryItem 
} from '../types';
import { getSubscriptions as getLocalSubs, saveSubscription as saveLocalSub, deleteSubscription as deleteLocalSub } from './storage';

/**
 * MOCK API SERVICE
 * 
 * В реальном проекте здесь будут fetch запросы к вашему бэкенду.
 */

const API_BASE_URL = 'https://api.your-backend.com/v1'; 

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data Store
let mockReminders: Reminder[] = [
    { 
        id: 'r_1', 
        title: 'Заполнить расходы', 
        message: 'Не забудь внести траты за сегодня!', 
        scheduledAt: new Date().toISOString(), 
        nextRun: new Date(Date.now() + 86400000).toISOString(),
        repeat: { type: 'DAILY', every: 1 }, 
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        channels: ['TELEGRAM'],
        isActive: true 
    },
    { 
        id: 'r_2', 
        title: 'Оплатить интернет', 
        message: 'Списание 500р', 
        scheduledAt: new Date(Date.now() + 100000000).toISOString(), 
        nextRun: new Date(Date.now() + 100000000).toISOString(),
        repeat: { type: 'MONTHLY', every: 1 }, 
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        channels: ['TELEGRAM'],
        isActive: false 
    }
];

let mockHistory: ReminderHistoryItem[] = [
    { 
        id: 'h_1', 
        reminderId: 'r_1', 
        title: 'Заполнить расходы', 
        scheduledAt: new Date(Date.now() - 86400000).toISOString(), 
        sentAt: new Date(Date.now() - 86395000).toISOString(), 
        status: 'SENT',
        providerInfo: { provider: 'TELEGRAM' }
    },
    { 
        id: 'h_2', 
        reminderId: 'r_1', 
        title: 'Заполнить расходы', 
        scheduledAt: new Date(Date.now() - 172800000).toISOString(), 
        sentAt: new Date(Date.now() - 172800000).toISOString(), 
        status: 'FAILED',
        providerInfo: { provider: 'TELEGRAM', error: 'User blocked bot' }
    }
];

let mockReminderSettings: ReminderSettings = { 
    enabled: true, 
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    defaultChannels: ['TELEGRAM'],
    defaultTime: "09:00"
};

export const api = {
    auth: {
        login: async (initData: string): Promise<AuthResponse> => {
            console.log('[API] Logging in...');
            await delay(800); 
            return {
                token: 'mock_jwt_token_xyz123',
                user: {
                    id: 'user_001',
                    telegramId: 12345678,
                    firstName: 'User',
                    subscriptionLevel: (localStorage.getItem('finbot_sub_level') as SubscriptionLevel) || 'FREE',
                    subscriptionExpiresAt: localStorage.getItem('finbot_sub_expiry') || null
                }
            };
        },
        getMe: async (): Promise<UserProfile> => {
             await delay(400);
             return {
                id: 'user_001',
                telegramId: 12345678,
                firstName: 'User',
                subscriptionLevel: (localStorage.getItem('finbot_sub_level') as SubscriptionLevel) || 'FREE',
                subscriptionExpiresAt: localStorage.getItem('finbot_sub_expiry') || null
             };
        }
    },

    payment: {
        createPayment: async (plan: string): Promise<PaymentInitiateResponse> => {
            console.log(`[API] POST /payment/create { plan: ${plan} }`);
            await delay(1500);
            return {
                paymentId: `pay_${Date.now()}`,
                providerPaymentId: `yoo_${Date.now()}`,
                confirmationUrl: 'https://yoomoney.ru/checkout/payments/v2/contract?orderId=test_order' 
            };
        },
        checkStatus: async (providerPaymentId: string): Promise<PaymentStatusResponse> => {
            await delay(800);
            return { status: 'SUCCEEDED' };
        }
    },

    subscriptions: {
        list: async (): Promise<Subscription[]> => {
            await delay(600);
            return getLocalSubs();
        },
        create: async (sub: Subscription): Promise<Subscription> => {
            await delay(600);
            saveLocalSub(sub);
            return sub;
        },
        update: async (id: string, updates: Partial<Subscription>): Promise<Subscription> => {
            await delay(600);
            const subs = getLocalSubs();
            const existing = subs.find(s => s.id === id);
            if (existing) {
                const updated = { ...existing, ...updates };
                saveLocalSub(updated);
                return updated;
            }
            throw new Error('Subscription not found');
        },
        delete: async (id: string): Promise<void> => {
            await delay(600);
            deleteLocalSub(id);
        }
    },

    reminders: {
        list: async (limit = 20, offset = 0): Promise<ReminderListResponse> => {
            console.log(`[API] GET /reminders?limit=${limit}`);
            await delay(500);
            return {
                items: mockReminders.slice(offset, offset + limit),
                total: mockReminders.length
            };
        },
        create: async (reminder: Omit<Reminder, 'id' | 'nextRun'>): Promise<Reminder> => {
            console.log('[API] POST /reminders', reminder);
            await delay(800);
            const newReminder: Reminder = {
                ...reminder,
                id: `r_${Date.now()}`,
                nextRun: reminder.scheduledAt // Simplified logic for mock
            };
            mockReminders.push(newReminder);
            return newReminder;
        },
        update: async (id: string, updates: Partial<Reminder>): Promise<Reminder> => {
            console.log(`[API] PATCH /reminders/${id}`, updates);
            await delay(500);
            const idx = mockReminders.findIndex(r => r.id === id);
            if (idx === -1) throw new Error('Reminder not found');
            mockReminders[idx] = { ...mockReminders[idx], ...updates };
            return mockReminders[idx];
        },
        delete: async (id: string): Promise<void> => {
            console.log(`[API] DELETE /reminders/${id}`);
            await delay(500);
            mockReminders = mockReminders.filter(r => r.id !== id);
        },
        run: async (id: string): Promise<{ status: string }> => {
            console.log(`[API] POST /reminders/${id}/run`);
            await delay(1500);
            const r = mockReminders.find(rem => rem.id === id);
            if (r) {
                mockHistory.unshift({
                    id: `h_${Date.now()}`,
                    reminderId: r.id,
                    title: r.title,
                    scheduledAt: new Date().toISOString(),
                    sentAt: new Date().toISOString(),
                    status: 'SENT',
                    providerInfo: { provider: 'TELEGRAM' }
                });
            }
            return { status: 'OK' };
        },
        getHistory: async (limit = 20, offset = 0): Promise<ReminderHistoryItem[]> => {
            console.log(`[API] GET /reminders/history`);
            await delay(500);
            return mockHistory.slice(offset, offset + limit);
        },
        getSettings: async (): Promise<ReminderSettings> => {
            await delay(300);
            return mockReminderSettings;
        },
        updateSettings: async (settings: Partial<ReminderSettings>): Promise<ReminderSettings> => {
            console.log('[API] PATCH /reminders/prefs', settings);
            await delay(500);
            mockReminderSettings = { ...mockReminderSettings, ...settings };
            return mockReminderSettings;
        }
    },

    ai: {
        getAdvice: async (context: AiAdviceRequest): Promise<string> => {
            console.log('[API] Requesting AI advice...');
            await delay(2000); 
            if (context.balance < 0) {
                return "Внимание! Расходы превышают доходы. Рекомендую проанализировать подписки и мелкие траты.";
            } else if (context.balance > 50000) {
                return "Отличный профицит! Рассмотрите открытие вклада или ИИС для пассивного дохода.";
            } else {
                return "Бюджет сбалансирован. Попробуйте откладывать 10% от любого поступления.";
            }
        }
    }
};
