
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  SAVING_DEPOSIT = 'SAVING_DEPOSIT',
  SAVING_WITHDRAWAL = 'SAVING_WITHDRAWAL'
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'BOTH';
  color: string;
  icon: string;
  isArchived?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  subCategory?: string; // Article
  date: string; // ISO String
  note?: string;
  goalId?: string; // If tied to a goal
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

export interface FinancialStats {
  income: number;
  expense: number;
  savingsChange: number;
  balance: number;
}

export interface Subscription {
  id: string;
  name: string; // "provider" in API spec
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
  title: string; // Bank name or Person name
  totalAmount: number; // Total loan amount or debt
  remainingAmount: number;
  interestRate?: number; // % per year (for banks)
  monthlyPayment?: number; // Calculated or manual
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
  content: string[]; // Array of paragraphs
  readTime: number; // minutes
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
  | 'REMINDERS';

// 4 Levels as requested
export type SubscriptionLevel = 'FREE' | 'PLUS' | 'PRO' | 'MAX';

export type Theme = 'LIGHT' | 'DARK';

// --- API & Backend Types ---

export interface UserProfile {
    id: string;
    telegramId: number;
    firstName: string;
    subscriptionLevel: SubscriptionLevel;
    subscriptionExpiresAt?: string | null;
}

export interface AuthResponse {
    token: string;
    user: UserProfile;
}

export interface PaymentInitiateResponse {
    paymentId: string;
    providerPaymentId: string;
    confirmationUrl: string; // URL for Yookassa redirect
}

export interface PaymentStatusResponse {
    status: 'PENDING' | 'SUCCEEDED' | 'CANCELED';
}

export interface AiAdviceRequest {
    income: number;
    expense: number;
    balance: number;
    topCategory: string;
    month: string; // "YYYY-MM"
}

// --- REMINDER TYPES ---

export type RepeatType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type ReminderChannel = 'TELEGRAM'; // Removed PUSH as requested

export interface RepeatConfig {
    type: RepeatType;
    every?: number; // e.g., every 2 days
    weekDays?: number[]; // 1=Mon, 7=Sun
}

export interface Reminder {
    id: string;
    title: string;
    message?: string;
    scheduledAt: string; // ISO 8601 with timezone
    nextRun?: string;
    repeat: RepeatConfig;
    timezone: string; // e.g. "Europe/Moscow"
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
    defaultTime: string; // "09:00"
}

export interface ReminderListResponse {
    items: Reminder[];
    total: number;
}

// --- Telegram Types ---

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
    openLink: (url: string) => void;
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
}

declare global {
    interface Window {
        Telegram: {
            WebApp: TelegramWebApp;
        };
    }
}
