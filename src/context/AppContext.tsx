import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, MainTab, UserProfile, DesignConfig } from '../types';
import { telegram } from '../services/telegram';
import { api } from '../services/api';

interface AppContextType {
  currentTab: MainTab;
  setCurrentTab: (tab: MainTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  toast: string | null;
  showToast: (msg: string) => void;
  activeDesignToEdit: DesignConfig | null;
  setActiveDesignToEdit: (design: DesignConfig | null) => void;
  isTelegramWebApp: boolean;
  refreshProfile: () => Promise<void>;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Bilingual dictionary
const TRANSLATIONS: Record<string, { bn: string; en: string }> = {
  // Navigation
  nav_home: { bn: 'হোম', en: 'Home' },
  nav_bd: { bn: 'বাংলাদেশ', en: 'Bangladesh' },
  nav_world: { bn: 'বিশ্ব মানচিত্র', en: 'World' },
  nav_trips: { bn: 'ভ্রমণ পরিকল্পনা', en: 'Trip Planner' },
  nav_quiz: { bn: 'কুইজ', en: 'Quiz' },
  nav_puzzle: { bn: 'ধাঁধা', en: 'Puzzle' },
  nav_profile: { bn: 'প্রোফাইল', en: 'Profile' },
  nav_admin: { bn: 'অ্যাডমিন', en: 'Admin' },

  // Home
  home_welcome: { bn: 'স্বাগতম', en: 'Welcome' },
  home_tagline: { bn: 'আপনার ব্যক্তিগত ভ্রমণ মানচিত্র তৈরি ও শেয়ার করুন', en: 'Design & share your custom travel maps' },
  home_bd_title: { bn: 'বাংলাদেশ মানচিত্র', en: 'Bangladesh Map' },
  home_bd_sub: { bn: '৬৪ জেলার মধ্যে আপনার ভ্রমণ চিহ্নিত করুন', en: 'Create & style your 64-district journey' },
  home_world_title: { bn: 'বিশ্ব মানচিত্র', en: 'World Map' },
  home_world_sub: { bn: 'বিশ্বের বিভিন্ন দেশে ভ্রমণ তালিকা তৈরি করুন', en: 'Mark your global adventures' },
  home_trips_title: { bn: 'ভ্রমণ প্ল্যানার', en: 'Trip Planner' },
  home_trips_sub: { bn: 'নতুন ট্যুর রুট ও বাজেট সাজান', en: 'Plan itinerary, routes & budget' },
  home_quiz_title: { bn: 'ভূগোল কুইজ', en: 'Geography Quiz' },
  home_quiz_sub: { bn: 'বাংলাদেশের জেলা ও ইতিহাস নিয়ে জানুন', en: 'Test your knowledge on BD districts' },
  home_puzzle_title: { bn: 'ম্যাপ পাজল', en: 'Map Puzzle' },
  home_puzzle_sub: { bn: 'জেলাভিত্তিক মজার খেলা খেলুন', en: 'Interactive district placement game' },
  home_recent_designs: { bn: 'সর্বশেষ ডিজাইনসমূহ', en: 'Recent Designs' },
  home_no_recent: { bn: 'এখনও কোনো ডিজাইন তৈরি করেননি। শুরু করতে ওপরের কার্ডে চাপ দিন!', en: 'No designs created yet. Tap a card above to start!' },

  // Map Creator
  map_selected: { bn: 'নির্বাচিত জেলা', en: 'Selected' },
  map_of_64: { bn: '৬৪ টির মধ্যে', en: 'of 64 Districts' },
  map_select_all: { bn: 'সব নির্বাচন', en: 'Select All' },
  map_clear_all: { bn: 'সব মুছুন', en: 'Clear All' },
  map_search_placeholder: { bn: 'জেলা অনুসন্ধান করুন...', en: 'Search district...' },
  map_themes: { bn: 'থিম ও রং', en: 'Themes & Colors' },
  map_personalize: { bn: 'ব্যক্তিগতকরণ', en: 'Personalize' },
  map_preview: { bn: 'প্রিভিউ', en: 'Live Preview' },
  map_download_png: { bn: 'PNG ডাউনলোড', en: 'Download PNG' },
  map_download_jpg: { bn: 'JPG ডাউনলোড', en: 'Download JPG' },
  map_download_pdf: { bn: 'PDF ডাউনলোড', en: 'Download PDF' },
  map_save_design: { bn: 'ডিজাইন সেভ করুন', en: 'Save Design' },
  map_share_telegram: { bn: 'টেলিগ্রামে শেয়ার', en: 'Share to Telegram' },

  // General
  btn_cancel: { bn: 'বাতিল', en: 'Cancel' },
  btn_save: { bn: 'সংরক্ষণ', en: 'Save' },
  btn_delete: { bn: 'মুছুন', en: 'Delete' },
  btn_edit: { bn: 'সম্পাদনা', en: 'Edit' },
  btn_open: { bn: 'খুলুন', en: 'Open' },
  points: { bn: 'পয়েন্ট', en: 'Points' }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<MainTab>('home');
  const [language, setLanguageState] = useState<Language>('bn');
  const [themeMode, setThemeModeState] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeDesignToEdit, setActiveDesignToEdit] = useState<DesignConfig | null>(null);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState<boolean>(false);

  useEffect(() => {
    // Detect Telegram WebApp
    const tgUser = telegram.getUser();
    setIsTelegramWebApp(telegram.isInsideTelegram);

    // Initial server authentication
    api.authenticateTelegram(telegram.getInitData(), tgUser)
      .then(res => {
        if (res.user) {
          setUser(res.user);
          if (res.user.language) setLanguageState(res.user.language);
        }
      })
      .catch(() => {
        // Fallback default user
        setUser({
          id: `user_${tgUser.id}`,
          telegram_id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name || '',
          username: tgUser.username || '',
          photo_url: tgUser.photo_url || '',
          language: 'bn',
          points: 150,
          is_blocked: false,
          role: 'user',
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        });
      });

    // Load theme preference
    const savedTheme = localStorage.getItem('mapbd_theme_mode');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setThemeModeState(savedTheme);
    } else if (window.Telegram?.WebApp?.colorScheme) {
      setThemeModeState(window.Telegram.WebApp.colorScheme);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (user) {
      api.updateUserProfile({ language: lang }, user.telegram_id, user.id);
    }
  };

  const setThemeMode = (mode: 'light' | 'dark') => {
    setThemeModeState(mode);
    localStorage.setItem('mapbd_theme_mode', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const data = await api.getUserProfile(user.telegram_id, user.id);
        if (data.user) setUser(data.user);
      } catch (e) {}
    }
  };

  const t = (key: string): string => {
    if (TRANSLATIONS[key]) {
      return TRANSLATIONS[key][language] || TRANSLATIONS[key].en;
    }
    return key;
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        language,
        setLanguage,
        user,
        setUser,
        themeMode,
        setThemeMode,
        toast,
        showToast,
        activeDesignToEdit,
        setActiveDesignToEdit,
        isTelegramWebApp,
        refreshProfile,
        t
      }}
    >
      <div className={themeMode === 'dark' ? 'dark' : ''}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
