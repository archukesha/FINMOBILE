
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
  | 'SETTINGS';

export type SubscriptionLevel = 'FREE' | 'PRO' | 'PREMIUM';

export type Theme = 'LIGHT' | 'DARK';