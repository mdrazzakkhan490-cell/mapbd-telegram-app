import React from 'react';
import { useApp } from '../../context/AppContext';
import { telegram } from '../../services/telegram';
import { Home, MapPin, Globe, Compass, Brain, User } from 'lucide-react';
import { MainTab } from '../../types';

interface NavItem {
  id: MainTab;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', labelKey: 'nav_home', icon: Home },
  { id: 'bangladesh', labelKey: 'nav_bd', icon: MapPin },
  { id: 'world', labelKey: 'nav_world', icon: Globe },
  { id: 'trips', labelKey: 'nav_trips', icon: Compass },
  { id: 'quiz', labelKey: 'nav_quiz', icon: Brain },
  { id: 'profile', labelKey: 'nav_profile', icon: User },
];

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, t } = useApp();

  const handleSelectTab = (tab: MainTab) => {
    telegram.triggerHaptic('selection');
    setCurrentTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-6 h-16 items-center px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-all relative group cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {/* Active top pill indicator */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-emerald-500 rounded-b-full shadow-sm" />
              )}
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'scale-100 stroke-[1.8]'
                }`}
              />
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-[54px] select-none">
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
