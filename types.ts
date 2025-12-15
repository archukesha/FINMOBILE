
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
  type: 'I_OWE' | 'OWE_ME';
  person: string;
  amount: number; // Current remaining amount
  initialAmount: number;
  currency: string;
  dueDate?: string;
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

export type SubscriptionLevel = 'FREE' | 'PRO' | 'PREMIUM';

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
}

export interface Reminder {
    id: string;
    text: string;
    createdAt: string;
    sentAt?: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
}

export interface ReminderSettings {
    isEnabled: boolean;
    timezone: string;
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
