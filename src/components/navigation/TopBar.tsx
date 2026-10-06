import React from 'react';
import { useApp } from '../../context/AppContext';
import { telegram } from '../../services/telegram';
import { Sparkles, Globe, Sun, Moon, ShieldCheck } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { user, language, setLanguage, themeMode, setThemeMode, currentTab, setCurrentTab, t } = useApp();

  const toggleLanguage = () => {
    telegram.triggerHaptic('selection');
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const toggleTheme = () => {
    telegram.triggerHaptic('light');
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Zone 1: Single Brand Title */}
        <button
          onClick={() => {
            telegram.triggerHaptic('selection');
            setCurrentTab('home');
          }}
          className="flex items-center gap-2 group text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-tighter">
            BD
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
              MapBD
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block leading-none">
              Telegram Web App
            </span>
          </div>
        </button>

        {/* Zone 2: Telegram User & Points Info */}
        <div className="flex items-center gap-2">
          {/* Points Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-xs font-semibold tabular-nums">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{user?.points ?? 100}</span>
            <span className="text-[10px] font-normal opacity-75">{language === 'bn' ? 'পয়েন্ট' : 'pts'}</span>
          </div>

          {/* Language Switch */}
          <button
            onClick={toggleLanguage}
            className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'bn' ? 'বাং' : 'EN'}</span>
          </button>

          {/* Theme Switch */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
            title="Toggle Dark/Light Mode"
          >
            {themeMode === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Admin link shortcut if admin */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`h-8 px-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                currentTab === 'admin'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Telegram User Avatar / Profile Button */}
          <button
            onClick={() => {
              telegram.triggerHaptic('selection');
              setCurrentTab('profile');
            }}
            className="flex items-center gap-2 pl-1 group"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs overflow-hidden">
              {user?.photo_url ? (
                <img src={user.photo_url} alt={user.first_name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.first_name?.charAt(0) || 'U'}</span>
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
