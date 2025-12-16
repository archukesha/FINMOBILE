
import { Transaction, Category, Goal, TransactionType, SubscriptionLevel, Subscription, Debt, Achievement, Theme } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_ACHIEVEMENTS } from '../constants';

const KEYS = {
  TRANSACTIONS: 'finbot_transactions',
  CATEGORIES: 'finbot_categories',
  GOALS: 'finbot_goals',
  USER_SETTINGS: 'finbot_settings',
  SUBSCRIPTION_LEVEL: 'finbot_sub_level',
  SUBSCRIPTIONS: 'finbot_subscriptions',
  DEBTS: 'finbot_debts',
  ACHIEVEMENTS: 'finbot_achievements',
  ARTICLES_READ: 'finbot_articles_read',
  THEME: 'finbot_theme'
};

// --- Initialization ---

const initialize = () => {
  if (!localStorage.getItem(KEYS.CATEGORIES)) {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.GOALS)) {
    localStorage.setItem(KEYS.GOALS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.SUBSCRIPTIONS)) {
    localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.DEBTS)) {
    localStorage.setItem(KEYS.DEBTS, JSON.stringify([]));
  }
  // We don't init achievements statically anymore to allow dynamic updates from constants
  if (!localStorage.getItem(KEYS.ARTICLES_READ)) {
    localStorage.setItem(KEYS.ARTICLES_READ, JSON.stringify([]));
  }
  
  // Theme Initialization - Default to DARK
  const savedTheme = localStorage.getItem(KEYS.THEME);
  if (!savedTheme) {
      localStorage.setItem(KEYS.THEME, 'DARK');
      document.documentElement.classList.add('dark');
  } else {
      if (savedTheme === 'DARK') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  }
};

initialize();

// --- Theme ---

export const getTheme = (): Theme => {
    // Default to DARK if not set
    return (localStorage.getItem(KEYS.THEME) as Theme) || 'DARK';
};

export const saveTheme = (theme: Theme) => {
    localStorage.setItem(KEYS.THEME, theme);
    if (theme === 'DARK') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

// --- Subscription Status ---

export const getSubscriptionLevel = (): SubscriptionLevel => {
  const legacyPremium = localStorage.getItem('finbot_is_premium');
  if (legacyPremium === 'true') {
    return 'PRO'; // Map old premium to PRO for now
  }
  const level = localStorage.getItem(KEYS.SUBSCRIPTION_LEVEL);
  return (level as SubscriptionLevel) || 'FREE';
};

export const setSubscriptionLevel = (level: SubscriptionLevel): void => {
  localStorage.setItem(KEYS.SUBSCRIPTION_LEVEL, level);
};

// --- Transactions ---

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
};

export const saveTransaction = (tx: Transaction): void => {
  const list = getTransactions();
  list.push(tx);
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(list));
  checkAchievements(); // Check milestones
};

export const updateTransaction = (tx: Transaction): void => {
  const list = getTransactions();
  const index = list.findIndex(t => t.id === tx.id);
  if (index !== -1) {
    list[index] = tx;
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(list));
  }
};

export const deleteTransaction = (id: string): void => {
  const list = getTransactions();
  const newList = list.filter(t => t.id !== id);
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(newList));
};

// --- Categories ---

export const getCategories = (): Category[] => {
  const data = localStorage.getItem(KEYS.CATEGORIES);
  return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
};

export const saveCategory = (category: Category): void => {
  const list = getCategories();
  const index = list.findIndex(c => c.id === category.id);
  if (index >= 0) {
    list[index] = category;
  } else {
    list.push(category);
  }
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(list));
};

// --- Goals ---

export const getGoals = (): Goal[] => {
  const data = localStorage.getItem(KEYS.GOALS);
  return data ? JSON.parse(data) : [];
};

export const saveGoal = (goal: Goal): void => {
  const list = getGoals();
  const index = list.findIndex(g => g.id === goal.id);
  if (index >= 0) {
    list[index] = goal;
  } else {
    list.push(goal);
  }
  localStorage.setItem(KEYS.GOALS, JSON.stringify(list));
  checkAchievements();
};

export const updateGoalProgress = (goalId: string, amountToAdd: number) => {
  const goals = getGoals();
  const goal = goals.find(g => g.id === goalId);
  if (goal) {
    goal.currentAmount += amountToAdd;
    saveGoal(goal);
  }
};

export const deleteGoal = (id: string): void => {
  const list = getGoals();
  const newList = list.filter(g => g.id !== id);
  localStorage.setItem(KEYS.GOALS, JSON.stringify(newList));
};

// --- Subscriptions ---

export const getSubscriptions = (): Subscription[] => {
  const data = localStorage.getItem(KEYS.SUBSCRIPTIONS);
  return data ? JSON.parse(data) : [];
};

export const saveSubscription = (sub: Subscription): void => {
  const list = getSubscriptions();
  const index = list.findIndex(s => s.id === sub.id);
  if (index >= 0) list[index] = sub;
  else list.push(sub);
  localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(list));
  checkAchievements();
};

export const deleteSubscription = (id: string): void => {
  const list = getSubscriptions();
  const newList = list.filter(s => s.id !== id);
  localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(newList));
};

// --- Debts ---

export const getDebts = (): Debt[] => {
  const data = localStorage.getItem(KEYS.DEBTS);
  return data ? JSON.parse(data) : [];
};

export const saveDebt = (debt: Debt): void => {
  const list = getDebts();
  const index = list.findIndex(d => d.id === debt.id);
  if (index >= 0) list[index] = debt;
  else list.push(debt);
  localStorage.setItem(KEYS.DEBTS, JSON.stringify(list));
  checkAchievements();
};

export const updateDebt = (debt: Debt): void => {
    const list = getDebts();
    const index = list.findIndex(d => d.id === debt.id);
    if (index !== -1) {
        list[index] = debt;
        localStorage.setItem(KEYS.DEBTS, JSON.stringify(list));
    }
};

export const deleteDebt = (id: string): void => {
  const list = getDebts();
  const newList = list.filter(d => d.id !== id);
  localStorage.setItem(KEYS.DEBTS, JSON.stringify(newList));
};

// --- Article Tracking ---

export const markArticleRead = (articleId: string) => {
    const data = localStorage.getItem(KEYS.ARTICLES_READ);
    const list: string[] = data ? JSON.parse(data) : [];
    if (!list.includes(articleId)) {
        list.push(articleId);
        localStorage.setItem(KEYS.ARTICLES_READ, JSON.stringify(list));
        checkAchievements();
    }
};

export const getReadArticlesCount = (): number => {
    const data = localStorage.getItem(KEYS.ARTICLES_READ);
    const list: string[] = data ? JSON.parse(data) : [];
    return list.length;
};

// --- Achievements / Gamification ---

export const getAchievements = (): Achievement[] => {
  const data = localStorage.getItem(KEYS.ACHIEVEMENTS);
  const current: Achievement[] = data ? JSON.parse(data) : [];
  
  // Merge constants with stored state to ensure new achievements exist
  // We use map to preserve the 'isUnlocked' status from storage
  const merged = DEFAULT_ACHIEVEMENTS.map(def => {
    const existing = current.find(c => c.id === def.id);
    return existing ? { ...def, isUnlocked: existing.isUnlocked, unlockedAt: existing.unlockedAt } : def;
  });

  return merged;
};

export const checkAchievements = () => {
  const txs = getTransactions();
  const goals = getGoals();
  const debts = getDebts();
  const subs = getSubscriptions();
  const achievements = getAchievements();
  const readCount = getReadArticlesCount();
  const categories = getCategories();
  
  let changed = false;

  const unlock = (id: string) => {
    const ach = achievements.find(a => a.id === id);
    if (ach && !ach.isUnlocked) {
      ach.isUnlocked = true;
      ach.unlockedAt = new Date().toISOString();
      changed = true;
    }
  };

  const totalIncome = txs.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTxCount = txs.length;

  // --- LOGIC FOR TIERED ACHIEVEMENTS ---
  
  // Savings Tiers
  if (totalSaved >= 1000) unlock('ach_save_1');
  if (totalSaved >= 10000) unlock('ach_save_2');
  if (totalSaved >= 50000) unlock('ach_save_3');
  if (totalSaved >= 100000) unlock('ach_save_4');
  if (totalSaved >= 500000) unlock('ach_save_5');
  if (totalSaved >= 1000000) unlock('ach_save_6');

  // Transaction Count Tiers
  if (totalTxCount >= 1) unlock('ach_tx_1');
  if (totalTxCount >= 10) unlock('ach_tx_2');
  if (totalTxCount >= 50) unlock('ach_tx_3');
  if (totalTxCount >= 100) unlock('ach_tx_4');
  if (totalTxCount >= 500) unlock('ach_tx_5');
  if (totalTxCount >= 1000) unlock('ach_tx_6');

  // Reading Tiers
  if (readCount >= 1) unlock('ach_read_1');
  if (readCount >= 5) unlock('ach_read_2');
  if (readCount >= 10) unlock('ach_read_3');

  // Subscriptions
  const activeSubs = subs.filter(s => s.isActive).length;
  if (activeSubs >= 1) unlock('ach_sub_1');
  if (activeSubs >= 5) unlock('ach_sub_2');
  if (activeSubs >= 10) unlock('ach_sub_3');

  // Income Tiers
  if (totalIncome >= 100000) unlock('ach_inc_1');
  if (totalIncome >= 500000) unlock('ach_inc_2');
  if (totalIncome >= 1000000) unlock('ach_inc_3');

  // Debt Freedom
  const hasDebts = debts.filter(d => d.remainingAmount > 0 && d.type === 'I_OWE').length > 0;
  const everHadDebts = localStorage.getItem('finbot_had_debts') === 'true';
  if (debts.length > 0) localStorage.setItem('finbot_had_debts', 'true');
  if (everHadDebts && !hasDebts) unlock('ach_debt_free');

  // Specific Actions
  if (goals.length > 0) unlock('ach_goal_setter');
  
  // Weekend Spender
  const hasWeekendSpend = txs.some(t => {
      const d = new Date(t.date);
      const day = d.getDay();
      return (day === 0 || day === 6) && t.type === TransactionType.EXPENSE;
  });
  if (hasWeekendSpend) unlock('ach_weekend');

  if (changed) {
    localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  }
};

// --- Helpers ---

export const getTransactionsByMonth = (date: Date): Transaction[] => {
  const txs = getTransactions();
  return txs.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
  });
};
