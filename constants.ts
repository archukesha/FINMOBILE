
import { Category, Article, Achievement } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { id: 'inc_salary', name: 'Зарплата', type: 'INCOME', color: '#10b981', icon: 'wallet' },
  { id: 'inc_freelance', name: 'Фриланс', type: 'INCOME', color: '#34d399', icon: 'laptop' },
  { id: 'inc_gift', name: 'Подарки', type: 'INCOME', color: '#6ee7b7', icon: 'gift' },
  
  // Expense
  { id: 'exp_food', name: 'Продукты', type: 'EXPENSE', color: '#f87171', icon: 'shopping-cart' },
  { id: 'exp_cafe', name: 'Кафе', type: 'EXPENSE', color: '#f43f5e', icon: 'coffee' },
  { id: 'exp_transport', name: 'Транспорт', type: 'EXPENSE', color: '#fb923c', icon: 'bus' },
  { id: 'exp_housing', name: 'Дом', type: 'EXPENSE', color: '#60a5fa', icon: 'home' },
  { id: 'exp_entertainment', name: 'Развлечения', type: 'EXPENSE', color: '#a78bfa', icon: 'clapperboard' },
  { id: 'exp_health', name: 'Здоровье', type: 'EXPENSE', color: '#f472b6', icon: 'heart-pulse' },
  { id: 'exp_shopping', name: 'Шопинг', type: 'EXPENSE', color: '#818cf8', icon: 'shopping-bag' },
  { id: 'exp_regular', name: 'Платежи', type: 'EXPENSE', color: '#fbbf24', icon: 'receipt' },
  { id: 'exp_debt', name: 'Кредиты/Долги', type: 'EXPENSE', color: '#ef4444', icon: 'hand-coins' }, 
  { id: 'exp_other', name: 'Прочее', type: 'EXPENSE', color: '#94a3b8', icon: 'box' },

  // Savings (Internal)
  { id: 'sav_transfer', name: 'В копилку', type: 'BOTH', color: '#f59e0b', icon: 'piggy-bank' },
];

export const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#64748b', '#f97316'
];

export const AVAILABLE_ICONS = [
  'wallet', 'laptop', 'gift', 'shopping-cart', 'coffee', 'bus', 'home', 
  'clapperboard', 'heart-pulse', 'shopping-bag', 'receipt', 'box', 
  'piggy-bank', 'plane', 'car', 'gamepad-2', 'graduation-cap', 'dumbbell', 
  'utensils', 'wrench', 'briefcase', 'credit-card', 'banknote', 'coins',
  'rocket', 'smile', 'sun', 'moon', 'music', 'camera', 'hand-coins', 'landmark',
  'crown', 'gem', 'zap', 'star', 'flag', 'anchor', 'armchair', 'baby', 'bath',
  'beer', 'bike', 'book', 'brush', 'bus-front', 'cake', 'cat', 'cigarette',
  'club', 'cookie', 'dog', 'droplet', 'drumstick', 'fan', 'fish', 'flower',
  'fuel', 'gamepad', 'ghost', 'glasses', 'hammer', 'headphones', 'hotel',
  'ice-cream', 'key', 'library', 'lightbulb', 'martini', 'microwave', 'monitor',
  'mouse', 'palette', 'parking-circle', 'phone', 'pizza', 'plug', 'printer',
  'radio', 'scissors', 'shirt', 'shovel', 'smartphone', 'snowflake', 'sofa',
  'speaker', 'stamp', 'ticket', 'train', 'truck', 'tv', 'umbrella', 'utensils-crossed',
  'video', 'watch', 'wifi', 'wine'
];

// --- GENERATING 100+ ACHIEVEMENTS ---

const generateTieredAchievements = () => {
  const tiers: Achievement[] = [];
  
  // 1. SAVINGS TIERS (Level 1-10)
  const savingsLevels = [
    { amount: 1000, title: 'Копилка: Начало' },
    { amount: 10000, title: 'Копилка: Бронза' },
    { amount: 50000, title: 'Копилка: Серебро' },
    { amount: 100000, title: 'Копилка: Золото' },
    { amount: 250000, title: 'Копилка: Платина' },
    { amount: 500000, title: 'Копилка: Изумруд' },
    { amount: 1000000, title: 'Миллионер' },
    { amount: 5000000, title: 'Мультимиллионер' },
    { amount: 10000000, title: 'Магнат' },
  ];
  savingsLevels.forEach((lvl, i) => {
    tiers.push({
      id: `ach_save_${i+1}`,
      title: lvl.title,
      description: `Накопить ${lvl.amount.toLocaleString()} ₽`,
      icon: 'piggy-bank',
      isUnlocked: false,
      category: 'SAVINGS'
    });
  });

  // 2. TRANSACTION COUNTS (Level 1-10)
  const txLevels = [1, 10, 50, 100, 250, 500, 1000, 2500, 5000];
  txLevels.forEach((count, i) => {
    tiers.push({
      id: `ach_tx_${i+1}`,
      title: `Активный юзер ${i+1}`,
      description: `Создать ${count} операций`,
      icon: 'zap',
      isUnlocked: false,
      category: 'SPENDING'
    });
  });

  // 3. READING (Level 1-5)
  const readLevels = [1, 5, 10, 20, 50];
  readLevels.forEach((count, i) => {
    tiers.push({
      id: `ach_read_${i+1}`,
      title: `Эрудит ${i+1}`,
      description: `Прочитать ${count} статей`,
      icon: 'book-open',
      isUnlocked: false,
      category: 'LEARNING'
    });
  });

  // 4. SUBSCRIPTIONS (Level 1-3)
  const subLevels = [1, 5, 10];
  subLevels.forEach((count, i) => {
    tiers.push({
      id: `ach_sub_${i+1}`,
      title: `Менеджер подписок ${i+1}`,
      description: `Иметь ${count} активных подписок`,
      icon: 'calendar',
      isUnlocked: false,
      category: 'SPENDING'
    });
  });

  // 5. INCOME LEVELS
  const incLevels = [100000, 500000, 1000000];
  incLevels.forEach((amt, i) => {
     tiers.push({
      id: `ach_inc_${i+1}`,
      title: `Добытчик ${i+1}`,
      description: `Заработать суммарно ${amt.toLocaleString()} ₽`,
      icon: 'briefcase',
      isUnlocked: false,
      category: 'SAVINGS'
     });
  });

  return tiers;
};

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  ...generateTieredAchievements(),
  // UNIQUE ACHIEVEMENTS
  { id: 'ach_debt_free', title: 'Свобода', description: 'Закройте все долги', icon: 'dove', isUnlocked: false, category: 'SAVINGS' },
  { id: 'ach_goal_setter', title: 'Мечтатель', description: 'Создайте свою первую цель', icon: 'target', isUnlocked: false, category: 'SAVINGS' },
  { id: 'ach_weekend', title: 'Тусовщик', description: 'Трата в выходной день', icon: 'party-popper', isUnlocked: false, category: 'FUN' },
  { id: 'ach_early_bird', title: 'Жаворонок', description: 'Добавление операции утром (до 9:00)', icon: 'sunrise', isUnlocked: false, category: 'FUN' },
  { id: 'ach_night_owl', title: 'Сова', description: 'Добавление операции ночью (после 23:00)', icon: 'moon', isUnlocked: false, category: 'FUN' },
  { id: 'ach_big_buy', title: 'Крупная рыба', description: 'Разовая покупка более 10 000 ₽', icon: 'whale', isUnlocked: false, category: 'SPENDING' },
];

export const ARTICLES: Article[] = [
  {
    id: 'safety_net',
    title: 'Финансовая подушка безопасности',
    category: 'BASICS',
    description: 'Зачем она нужна, сколько откладывать и где хранить деньги на "черный день".',
    content: [
      'Финансовая подушка — это запас денег, на который вы сможете прожить без дохода 3–6 месяцев. Это база финансовой грамотности.',
      'Зачем она нужна? Увольнение, болезнь, поломка техники или срочный ремонт — подушка спасает от кредитов в таких ситуациях.',
      'Сколько нужно? Посчитайте свои обязательные расходы (еда, жилье, кредиты) в месяц. Умножьте на 3 (минимум) или на 6 (комфорт).',
      'Где хранить? Деньги должны быть доступны быстро. Идеально подходят накопительные счета с процентом на остаток или дебетовые карты с процентом. Не вкладывайте подушку в акции — рынок может упасть именно тогда, когда вам понадобятся деньги.'
    ],
    readTime: 3,
    icon: 'shield',
    color: 'bg-emerald-500'
  },
  {
    id: '50_30_20',
    title: 'Правило 50/30/20',
    category: 'BUDGET',
    description: 'Классический метод распределения бюджета, который подходит почти всем.',
    content: [
      'Суть метода проста: вы делите весь свой чистый доход на три категории.',
      '50% — Нужды. Это обязательные траты: аренда, коммуналка, продукты, транспорт, лекарства. То, без чего нельзя прожить.',
      '30% — Желания. Это развлечения, кафе, подписки, новая одежда (не первой необходимости), хобби.',
      '20% — Сбережения и долги. Откладывайте эти деньги на финансовую подушку, инвестиции или досрочное погашение кредитов.'
    ],
    readTime: 4,
    icon: 'pie-chart',
    color: 'bg-indigo-500'
  },
  {
    id: 'compound_interest',
    title: 'Магия сложного процента',
    category: 'INVESTING',
    description: 'Как заставить деньги работать на вас в долгосрочной перспективе.',
    content: [
      'Сложный процент — это начисление процентов на проценты. Чем дольше вы не снимаете доход, тем быстрее растет капитал.',
      'Пример: Вы вложили 100 000 ₽ под 10% годовых. Через год у вас 110 000 ₽. Еще через год 10% начислятся уже на 110 000 ₽, и у вас будет 121 000 ₽.',
      'Главный секрет — время. Начните инвестировать как можно раньше, даже небольшими суммами.'
    ],
    readTime: 5,
    icon: 'trending-up',
    color: 'bg-purple-500'
  },
  {
    id: 'snowball_debt',
    title: 'Метод "Снежный ком"',
    category: 'DEBT',
    description: 'Психологически комфортный способ закрытия нескольких кредитов.',
    content: [
      'Если у вас несколько долгов, выпишите их в список от меньшего к большему по остатку долга (процентную ставку пока игнорируем).',
      'Платите минимальные платежи по всем долгам, а все свободные деньги направляйте на самый маленький долг.',
      'Когда маленький долг закрыт, вы чувствуете победу! Теперь освободившиеся деньги направляйте на следующий по размеру долг.',
      'Это создает эффект снежного кома: сумма погашения растет с каждым закрытым кредитом.'
    ],
    readTime: 4,
    icon: 'snowflake',
    color: 'bg-blue-400'
  }
];
