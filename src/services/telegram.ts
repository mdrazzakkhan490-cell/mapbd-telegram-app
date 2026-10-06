import { TelegramUser } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: TelegramUser;
          auth_date?: number;
          hash?: string;
          start_param?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
        switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
      };
    };
  }
}

export class TelegramService {
  private static instance: TelegramService;
  public isInsideTelegram: boolean = false;
  public webApp: any = null;

  private constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      // If initData is present or platform is mobile/desktop Telegram
      if (this.webApp.initData || this.webApp.platform !== 'unknown') {
        this.isInsideTelegram = true;
      }
      try {
        this.webApp.ready();
        this.webApp.expand();
      } catch (e) {
        // Ignore initialization error
      }
    }
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  public getUser(): TelegramUser {
    if (this.webApp?.initDataUnsafe?.user) {
      return this.webApp.initDataUnsafe.user;
    }
    // Saved in localStorage or default demo user
    const saved = localStorage.getItem('mapbd_simulated_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }

    return {
      id: 970532,
      first_name: 'MD Razzak',
      last_name: 'Khan',
      username: 'razzak_bd',
      photo_url: '',
      language_code: 'bn'
    };
  }

  public setSimulatedUser(user: TelegramUser) {
    localStorage.setItem('mapbd_simulated_user', JSON.stringify(user));
  }

  public getInitData(): string {
    return this.webApp?.initData || '';
  }

  public triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error') {
    try {
      if (this.webApp?.HapticFeedback) {
        if (type === 'selection') {
          this.webApp.HapticFeedback.selectionChanged();
        } else if (type === 'success' || type === 'error') {
          this.webApp.HapticFeedback.notificationOccurred(type);
        } else {
          this.webApp.HapticFeedback.impactOccurred(type);
        }
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        if (type === 'light') navigator.vibrate(10);
        else if (type === 'medium') navigator.vibrate(25);
        else if (type === 'heavy') navigator.vibrate(50);
        else if (type === 'success') navigator.vibrate([20, 50, 30]);
      }
    } catch (e) {}
  }

  public shareToTelegram(text: string, url?: string) {
    const fullText = encodeURIComponent(text);
    const fullUrl = encodeURIComponent(url || window.location.href);

    if (this.webApp?.switchInlineQuery) {
      try {
        this.webApp.switchInlineQuery(text);
        return;
      } catch (e) {}
    }

    // Direct Telegram share link
    const shareLink = `https://t.me/share/url?url=${fullUrl}&text=${fullText}`;
    if (this.webApp?.openTelegramLink) {
      this.webApp.openTelegramLink(shareLink);
    } else {
      window.open(shareLink, '_blank');
    }
  }
}

export const telegram = TelegramService.getInstance();
