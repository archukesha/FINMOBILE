
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  SAVING_DEPOSIT = 'SAVING_DEPOSIT',
  SAVING_WITHDRAWAL = 'SAVING_WITHDRAWAL'
}

export type Currency = 'RUB' | 'USD' | 'EUR' | 'KZT';

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'BOTH';
  color: string;
  icon: string;
  isArchived?: boolean;
  order?: number;
  budgetLimit?: number; // New: Monthly limit
}

export interface Transaction {
  id: string;
  amount: number;
  originalAmount?: number; // For multi-currency
  currency: Currency; // New
  type: TransactionType;
  categoryId: string;
  subCategory?: string; 
  date: string; 
  note?: string;
  goalId?: string;
}

export interface BudgetLimit {
    categoryId: string;
    limit: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  icon: string;
}

export interface Subscription {
  id: string;
  name: string; 
  amount: number;
  currency: string;
  billingPeriod: 'MONTHLY' | 'YEARLY';
  nextPaymentDate: string;
  categoryId: string;
  isActive: boolean;
}

export interface Debt {
  id: string;
  type: 'BANK_LOAN' | 'I_OWE' | 'OWE_ME';
  title: string; 
  totalAmount: number; 
  remainingAmount: number;
  interestRate?: number; 
  monthlyPayment?: number; 
  termMonths?: number; 
  startDate: string;
  nextPaymentDate?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  category: 'SAVINGS' | 'SPENDING' | 'LEARNING' | 'FUN';
}

export interface Article {
  id: string;
  title: string;
  category: 'BASICS' | 'INVESTING' | 'BUDGET' | 'DEBT';
  description: string;
  content: string[];
  readTime: number; 
  icon: string;
  color: string;
}

export type ViewState = 
  | 'DASHBOARD' 
  | 'ADD_TRANSACTION' 
  | 'ANALYTICS' 
  | 'GOALS' 
  | 'HUB' 
  | 'SUBSCRIPTIONS' 
  | 'DEBTS' 
  | 'EDUCATION'
  | 'SETTINGS'
  | 'REMINDERS'
  | 'CALENDAR' // New
  | 'SPLIT_BILL'; // New

export type SubscriptionLevel = 'FREE' | 'PLUS' | 'PRO' | 'MAX';

export type Theme = 'LIGHT' | 'DARK';
export type AccentColor = 'INDIGO' | 'PURPLE' | 'ORANGE' | 'EMERALD' | 'ROSE' | 'CYAN';

export const ACCENT_COLORS: Record<AccentColor, { primary: string, focus: string }> = {
    INDIGO: { primary: '#4f46e5', focus: '#4338ca' },
    PURPLE: { primary: '#9333ea', focus: '#7e22ce' },
    ORANGE: { primary: '#f97316', focus: '#ea580c' },
    EMERALD: { primary: '#10b981', focus: '#059669' },
    ROSE: { primary: '#e11d48', focus: '#be123c' },
    CYAN: { primary: '#06b6d4', focus: '#0891b2' },
};

// --- API & Backend Types ---

export interface UserProfile {
    id: string;
    telegramId: number;
    firstName: string;
    subscriptionLevel: SubscriptionLevel;
    subscriptionExpiresAt?: string | null;
    currency: Currency;
    privacyMode: boolean; // New
}

export interface AuthResponse {
    token: string;
    user: UserProfile;
}

export interface PaymentInitiateResponse {
    paymentId: string;
    providerPaymentId: string;
    confirmationUrl: string; 
}

export interface PaymentStatusResponse {
    status: 'PENDING' | 'SUCCEEDED' | 'CANCELED';
}

export interface AiAdviceRequest {
    income: number;
    expense: number;
    balance: number;
    topCategory: string;
    month: string; 
    transactions?: Transaction[]; 
}

export interface ParsedTransaction {
    amount: number;
    categoryId?: string;
    note?: string;
    date?: string;
    confidence: number;
}

export interface SmartInsight {
    type: 'SENTIMENT' | 'GAP_WARNING' | 'GOAL_SUGGESTION';
    title: string;
    message: string;
    icon: string;
    color: string; 
}

export type RepeatType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type ReminderChannel = 'TELEGRAM'; 

export interface RepeatConfig {
    type: RepeatType;
    every?: number; 
    weekDays?: number[]; 
}

export interface Reminder {
    id: string;
    title: string;
    message?: string;
    scheduledAt: string; 
    nextRun?: string;
    repeat: RepeatConfig;
    timezone: string; 
    channels: ReminderChannel[];
    isActive: boolean;
}

export interface ReminderHistoryItem {
    id: string;
    reminderId: string;
    title: string;
    scheduledAt: string;
    sentAt: string;
    status: 'SENT' | 'FAILED' | 'CANCELLED';
    providerInfo?: {
        provider: ReminderChannel;
        error?: string;
    };
}

export interface ReminderSettings {
    enabled: boolean;
    timezone: string;
    defaultChannels: ReminderChannel[];
    defaultTime: string; 
}

export interface ReminderListResponse {
    items: Reminder[];
    total: number;
}

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
}

export interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        user?: TelegramUser;
        start_param?: string;
    };
    ready: () => void;
    expand: () => void;
    close: () => void;
    isVersionAtLeast: (version: string) => boolean;
    openLink: (url: string) => void;
    openTelegramLink: (url: string) => void;
    openInvoice: (url: string) => void;
    colorScheme: 'light' | 'dark';
    themeParams: {
        bg_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
    };
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    onEvent: (eventType: string, eventHandler: () => void) => void;
    HapticFeedback: {
        impactOccurred: (style: string) => void;
        notificationOccurred: (type: string) => void;
        selectionChanged: () => void;
    };
    MainButton: {
        text: string;
        color: string;
        textColor: string;
        isVisible: boolean;
        isActive: boolean;
        show: () => void;
        hide: () => void;
        enable: () => void;
        disable: () => void;
        onClick: (callback: () => void) => void;
    };
    CloudStorage: {
        setItem: (key: string, value: string, callback?: (error: any, stored: boolean) => void) => void;
        getItem: (key: string, callback: (error: any, value: string) => void) => void;
        getItems: (keys: string[], callback: (error: any, values: Record<string, string>) => void) => void;
        removeItem: (key: string, callback?: (error: any, removed: boolean) => void) => void;
        removeItems: (keys: string[], callback?: (error: any, removed: boolean) => void) => void;
        getKeys: (callback: (error: any, keys: string[]) => void) => void;
    };
}

declare global {
    interface Window {
        Telegram: {
            WebApp: TelegramWebApp;
        };
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}
