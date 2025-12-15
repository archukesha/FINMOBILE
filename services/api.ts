
import { AuthResponse, PaymentInitiateResponse, PaymentStatusResponse, AiAdviceRequest, SubscriptionLevel, UserProfile, Subscription, Reminder, ReminderSettings } from '../types';
import { getSubscriptions as getLocalSubs, saveSubscription as saveLocalSub, deleteSubscription as deleteLocalSub } from './storage';

/**
 * MOCK API SERVICE
 * 
 * В реальном проекте здесь будут fetch запросы к вашему бэкенду.
 */

const API_BASE_URL = 'https://api.your-backend.com/v1'; 

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data Store (in-memory for session)
let mockReminders: Reminder[] = [
    { id: 'rem_1', text: 'Пора внести расходы за сегодня', createdAt: new Date(Date.now() - 86400000).toISOString(), sentAt: new Date(Date.now() - 40000000).toISOString(), status: 'SENT' },
    { id: 'rem_2', text: 'Оплата подписки Netflix', createdAt: new Date().toISOString(), status: 'PENDING' }
];
let mockReminderSettings: ReminderSettings = { isEnabled: true, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };

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
             console.log('[API] GET /user/me');
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
            console.log(`[API] GET /payments/status/${providerPaymentId}`);
            await delay(800);
            return { status: 'SUCCEEDED' };
        }
    },

    subscriptions: {
        list: async (): Promise<Subscription[]> => {
            console.log('[API] GET /subscriptions');
            await delay(600);
            // In a real app, fetch from server. For now, sync with local storage for demo continuity.
            return getLocalSubs();
        },
        create: async (sub: Subscription): Promise<Subscription> => {
            console.log('[API] POST /subscriptions', sub);
            await delay(600);
            saveLocalSub(sub);
            return sub;
        },
        update: async (id: string, updates: Partial<Subscription>): Promise<Subscription> => {
            console.log(`[API] PATCH /subscriptions/${id}`, updates);
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
            console.log(`[API] DELETE /subscriptions/${id}`);
            await delay(600);
            deleteLocalSub(id);
        }
    },

    reminders: {
        getHistory: async (limit = 10, offset = 0): Promise<Reminder[]> => {
            console.log(`[API] GET /reminders/history?limit=${limit}`);
            await delay(500);
            return mockReminders.slice(offset, offset + limit);
        },
        getSettings: async (): Promise<ReminderSettings> => {
            console.log('[API] GET /reminders/prefs');
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
            console.log('[API] Requesting AI advice...', context);
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
