
// Service for interacting with Telegram WebApp features

export const haptic = {
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
        const tg = window.Telegram?.WebApp;
        if (tg?.HapticFeedback && (!tg.isVersionAtLeast || tg.isVersionAtLeast('6.1'))) {
            tg.HapticFeedback.impactOccurred(style);
        }
    },
    notification: (type: 'error' | 'success' | 'warning') => {
        const tg = window.Telegram?.WebApp;
        if (tg?.HapticFeedback && (!tg.isVersionAtLeast || tg.isVersionAtLeast('6.1'))) {
            tg.HapticFeedback.notificationOccurred(type);
        }
    },
    selection: () => {
        const tg = window.Telegram?.WebApp;
        if (tg?.HapticFeedback && (!tg.isVersionAtLeast || tg.isVersionAtLeast('6.1'))) {
            tg.HapticFeedback.selectionChanged();
        }
    }
};

export const expandApp = () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.expand();
    }
};

export const setMainButton = (text: string, onClick: () => void, isVisible: boolean = true) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.MainButton) {
        tg.MainButton.text = text;
        tg.MainButton.isVisible = isVisible;
        tg.MainButton.onClick(onClick);
    }
};
