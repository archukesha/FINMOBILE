
import { Transaction, Category, Goal, TransactionType, SubscriptionLevel, Subscription, Debt, Achievement, Theme, AccentColor, ACCENT_COLORS, Currency } from '../types';
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
  THEME: 'finbot_theme',
  ACCENT_COLOR: 'finbot_accent',
  CURRENCY: 'finbot_currency',
  SHARED_WALLET: 'finbot_shared_wallet_id',
  SEEN_ONBOARDING: 'finbot_seen_onboarding',
  LAST_SYNC: 'finbot_last_sync'
};

const applyAccentColor = (color: AccentColor) => {
    const palette = ACCENT_COLORS[color] || ACCENT_COLORS.INDIGO;
    document.documentElement.style.setProperty('--color-primary', palette.primary);
    document.documentElement.style.setProperty('--color-primary-focus', palette.focus);
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
  // Theme & Accent
  const savedTheme = localStorage.getItem(KEYS.THEME);
  if (!savedTheme) {
      localStorage.setItem(KEYS.THEME, 'DARK');
      document.documentElement.classList.add('dark');
  } else {
      if (savedTheme === 'DARK') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  }

  const savedAccent = localStorage.getItem(KEYS.ACCENT_COLOR) as AccentColor;
  applyAccentColor(savedAccent || 'INDIGO');
};

initialize();

// --- Cloud Sync ---

const isCloudSupported = () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return false;
    // CloudStorage was introduced in 6.9
    // Use isVersionAtLeast if available, otherwise check raw version string if needed (though isVersionAtLeast is standard since 6.0)
    if (tg.isVersionAtLeast && !tg.isVersionAtLeast('6.9')) return false;
    // Extra safety: check if object exists
    if (!tg.CloudStorage) return false;
    return true;
};

export const syncWithCloud = async () => {
    if (!isCloudSupported()) return;
    const tg = window.Telegram.WebApp;

    try {
        const dataToSync = {
            transactions: localStorage.getItem(KEYS.TRANSACTIONS),
            goals: localStorage.getItem(KEYS.GOALS),
            subscriptions: localStorage.getItem(KEYS.SUBSCRIPTIONS),
            debts: localStorage.getItem(KEYS.DEBTS)
        };

        await new Promise<void>((resolve, reject) => {
            tg.CloudStorage.setItem('finbot_backup', JSON.stringify(dataToSync), (err, stored) => {
                if (err) reject(err);
                else resolve();
            });
        });
        localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
    } catch (e) {
        console.error("Cloud Sync Failed", e);
    }
};

export const restoreFromCloud = async () => {
    if (!isCloudSupported()) return;
    const tg = window.Telegram.WebApp;

    try {
        await new Promise<void>((resolve, reject) => {
            tg.CloudStorage.getItem('finbot_backup', (err, value) => {
                if (!err && value) {
                    const data = JSON.parse(value);
                    if (data.transactions) localStorage.setItem(KEYS.TRANSACTIONS, data.transactions);
                    if (data.goals) localStorage.setItem(KEYS.GOALS, data.goals);
                    if (data.subscriptions) localStorage.setItem(KEYS.SUBSCRIPTIONS, data.subscriptions);
                    if (data.debts) localStorage.setItem(KEYS.DEBTS, data.debts);
                }
                resolve();
            });
        });
    } catch (e) {
        console.error("Restore Failed", e);
    }
};

// Wrappers that trigger sync
const saveDataAndSync = (key: string, value: string) => {
    localStorage.setItem(key, value);
    // Debounce sync or just call it (fire and forget)
    syncWithCloud();
};

// --- Onboarding ---
export const hasSeenOnboarding = (): boolean => {
    return localStorage.getItem(KEYS.SEEN_ONBOARDING) === 'true';
}

export const setSeenOnboarding = () => {
    localStorage.setItem(KEYS.SEEN_ONBOARDING, 'true');
}

// --- Shared Wallet ---
export const getSharedWalletId = (): string | null => {
    return localStorage.getItem(KEYS.SHARED_WALLET);
}

export const setSharedWalletId = (id: string) => {
    localStorage.setItem(KEYS.SHARED_WALLET, id);
}

// --- Currency ---
export const getCurrency = (): Currency => {
    return (localStorage.getItem(KEYS.CURRENCY) as Currency) || 'RUB';
};

export const saveCurrency = (curr: Currency) => {
    localStorage.setItem(KEYS.CURRENCY, curr);
};

// --- Theme ---
export const getTheme = (): Theme => {
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

export const getAccentColor = (): AccentColor => {
    return (localStorage.getItem(KEYS.ACCENT_COLOR) as AccentColor) || 'INDIGO';
};

export const saveAccentColor = (color: AccentColor) => {
    localStorage.setItem(KEYS.ACCENT_COLOR, color);
    applyAccentColor(color);
};

// --- Subscription ---
export const getSubscriptionLevel = (): SubscriptionLevel => {
  const legacyPremium = localStorage.getItem('finbot_is_premium');
  if (legacyPremium === 'true') {
    return 'PRO';
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
  saveDataAndSync(KEYS.TRANSACTIONS, JSON.stringify(list));
  checkAchievements(); 
};

export const updateTransaction = (tx: Transaction): void => {
  const list = getTransactions();
  const index = list.findIndex(t => t.id === tx.id);
  if (index !== -1) {
    list[index] = tx;
    saveDataAndSync(KEYS.TRANSACTIONS, JSON.stringify(list));
  }
};

export const deleteTransaction = (id: string): void => {
  const list = getTransactions();
  const newList = list.filter(t => t.id !== id);
  saveDataAndSync(KEYS.TRANSACTIONS, JSON.stringify(newList));
};

// --- Categories & Budgets ---

export const getCategories = (): Category[] => {
  const data = localStorage.getItem(KEYS.CATEGORIES);
  let cats: Category[] = data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  return cats.sort((a, b) => (a.order || 999) - (b.order || 999));
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

export const saveAllCategories = (categories: Category[]): void => {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
}

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
  saveDataAndSync(KEYS.GOALS, JSON.stringify(list));
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
  saveDataAndSync(KEYS.GOALS, JSON.stringify(newList));
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
  saveDataAndSync(KEYS.SUBSCRIPTIONS, JSON.stringify(list));
  checkAchievements();
};

export const deleteSubscription = (id: string): void => {
  const list = getSubscriptions();
  const newList = list.filter(s => s.id !== id);
  saveDataAndSync(KEYS.SUBSCRIPTIONS, JSON.stringify(newList));
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
  saveDataAndSync(KEYS.DEBTS, JSON.stringify(list));
  checkAchievements();
};

export const updateDebt = (debt: Debt): void => {
    const list = getDebts();
    const index = list.findIndex(d => d.id === debt.id);
    if (index !== -1) {
        list[index] = debt;
        saveDataAndSync(KEYS.DEBTS, JSON.stringify(list));
    }
};

export const deleteDebt = (id: string): void => {
  const list = getDebts();
  const newList = list.filter(d => d.id !== id);
  saveDataAndSync(KEYS.DEBTS, JSON.stringify(newList));
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

// --- Achievements ---

export const getAchievements = (): Achievement[] => {
  const data = localStorage.getItem(KEYS.ACHIEVEMENTS);
  const current: Achievement[] = data ? JSON.parse(data) : [];
  
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

  if (totalSaved >= 1000) unlock('ach_save_1');
  if (totalSaved >= 10000) unlock('ach_save_2');
  if (totalSaved >= 50000) unlock('ach_save_3');
  if (totalSaved >= 100000) unlock('ach_save_4');
  if (totalSaved >= 500000) unlock('ach_save_5');
  if (totalSaved >= 1000000) unlock('ach_save_6');

  if (totalTxCount >= 1) unlock('ach_tx_1');
  if (totalTxCount >= 10) unlock('ach_tx_2');
  if (totalTxCount >= 50) unlock('ach_tx_3');
  if (totalTxCount >= 100) unlock('ach_tx_4');
  if (totalTxCount >= 500) unlock('ach_tx_5');
  if (totalTxCount >= 1000) unlock('ach_tx_6');

  if (readCount >= 1) unlock('ach_read_1');
  if (readCount >= 5) unlock('ach_read_2');
  if (readCount >= 10) unlock('ach_read_3');

  const activeSubs = subs.filter(s => s.isActive).length;
  if (activeSubs >= 1) unlock('ach_sub_1');
  if (activeSubs >= 5) unlock('ach_sub_2');
  if (activeSubs >= 10) unlock('ach_sub_3');

  if (totalIncome >= 100000) unlock('ach_inc_1');
  if (totalIncome >= 500000) unlock('ach_inc_2');
  if (totalIncome >= 1000000) unlock('ach_inc_3');

  const hasDebts = debts.filter(d => d.remainingAmount > 0 && d.type === 'I_OWE').length > 0;
  const everHadDebts = localStorage.getItem('finbot_had_debts') === 'true';
  if (debts.length > 0) localStorage.setItem('finbot_had_debts', 'true');
  if (everHadDebts && !hasDebts) unlock('ach_debt_free');

  if (goals.length > 0) unlock('ach_goal_setter');
  
  // Safe date check for weekends
  const hasWeekendSpend = txs.some(t => {
      // Manual parsing to avoid timezone shift on day of week
      if(!t.date) return false;
      const parts = t.date.split('-');
      if(parts.length !== 3) return false;
      // Create date at local midnight
      const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
      const day = d.getDay();
      return (day === 0 || day === 6) && t.type === TransactionType.EXPENSE;
  });
  if (hasWeekendSpend) unlock('ach_weekend');

  if (changed) {
    localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  }
};

export const getTransactionsByMonth = (date: Date): Transaction[] => {
  const txs = getTransactions();
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth(); // 0-11

  return txs.filter(t => {
    // t.date is stored as "YYYY-MM-DD"
    // We split it to avoid timezone issues with `new Date(string)`
    if (!t.date) return false;
    const parts = t.date.split('-');
    if (parts.length !== 3) return false;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-11
    
    return year === targetYear && month === targetMonth;
  });
};
