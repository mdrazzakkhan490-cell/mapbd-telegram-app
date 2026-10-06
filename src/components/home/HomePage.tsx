import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { telegram } from '../../services/telegram';
import { api } from '../../services/api';
import { DesignConfig } from '../../types';
import {
  MapPin,
  Globe,
  Compass,
  Brain,
  Puzzle,
  Download,
  Trash2,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Share2
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, language, setCurrentTab, setActiveDesignToEdit, showToast, t } = useApp();
  const [recentDesigns, setRecentDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(true);

  useEffect(() => {
    loadDesigns();
  }, [user]);

  const loadDesigns = async () => {
    setLoadingDesigns(true);
    try {
      const data = await api.getDesigns(false, user?.telegram_id, user?.id);
      if (data.designs) {
        setRecentDesigns(data.designs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDesigns(false);
    }
  };

  const handleOpenDesign = (design: any) => {
    telegram.triggerHaptic('light');
    const config: DesignConfig = {
      id: design.id,
      mapType: design.map_type,
      selectedIds: design.selected_ids || [],
      themeId: design.theme_name || 'classic',
      customColors: design.colors,
      borderWidth: design.border_width || 1.5,
      title: design.title,
      subtitle: design.subtitle,
      userName: design.user_name,
      userPhoto: design.photo_url,
      showPhoto: !!design.photo_url,
      showWatermark: true,
      fontFamily: design.font_family || 'Plus Jakarta Sans',
      textPosition: design.text_position || 'top',
      textAlign: 'center',
      thumbnail: design.thumbnail
    };
    setActiveDesignToEdit(config);
    setCurrentTab(design.map_type === 'world' ? 'world' : 'bangladesh');
  };

  const handleDeleteDesign = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    telegram.triggerHaptic('medium');
    try {
      await api.deleteDesign(id, user?.telegram_id, user?.id);
      setRecentDesigns(prev => prev.filter(d => d.id !== id));
      showToast(language === 'bn' ? 'ডিজাইন মুছে ফেলা হয়েছে' : 'Design deleted');
    } catch (err) {
      showToast('Failed to delete');
    }
  };

  const handleQuickDownload = async (design: any, e: React.MouseEvent) => {
    e.stopPropagation();
    telegram.triggerHaptic('success');
    showToast(language === 'bn' ? 'ডিজাইন ওপেন হচ্ছে...' : 'Opening design...');
    handleOpenDesign(design);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Premium Hero Profile Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white p-5 shadow-sm">
        {/* Decorative subtle map lines */}
        <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 w-60 h-60 rounded-full border border-white/5 pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-full ring-2 ring-emerald-300/40 bg-emerald-950/80 overflow-hidden flex items-center justify-center text-emerald-200 font-bold text-lg shadow-inner">
              {user?.photo_url ? (
                <img src={user.photo_url} alt={user.first_name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.first_name?.charAt(0) || 'M'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white">
                  {user?.first_name} {user?.last_name || ''}
                </h1>
                {user?.role === 'admin' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/30 text-emerald-200 font-semibold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100/80">
                @{user?.username || 'traveler_bd'}
              </p>
            </div>
          </div>

          {/* Points Capsule */}
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{user?.points ?? 100}</span>
              <span className="text-[10px] text-emerald-100 font-normal">pts</span>
            </div>
            <div className="text-[10px] text-emerald-200/70 mt-1">
              Telegram ID: {user?.telegram_id || 970532}
            </div>
          </div>
        </div>

        {/* Quick App Intro */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-emerald-100">
          <span>{t('home_tagline')}</span>
          <button
            onClick={() => {
              telegram.triggerHaptic('light');
              telegram.shareToTelegram(
                'Check out MapBD Telegram Web App - create custom 64-district Bangladesh & World travel maps!'
              );
            }}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'শেয়ার' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bangladesh Map Card (Flagship) */}
        <div
          onClick={() => {
            telegram.triggerHaptic('selection');
            setActiveDesignToEdit(null);
            setCurrentTab('bangladesh');
          }}
          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <div className="relative h-36 w-full rounded-xl overflow-hidden mb-3 bg-emerald-950">
            <img
              src="/src/assets/images/bd_map_showcase_1791284538754.jpg"
              alt="Bangladesh Map"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-sm">
              <MapPin className="w-3 h-3" />
              <span>{language === 'bn' ? 'প্রধান ফিচার' : 'Featured'}</span>
            </div>
            <div className="absolute bottom-2.5 left-2.5 right-2.5">
              <span className="text-xs text-emerald-300 font-medium block">
                {language === 'bn' ? '৬৪ টি সম্পূর্ণ জেলা' : '64 Interactive Districts'}
              </span>
              <h3 className="text-base font-bold text-white leading-tight">
                {t('home_bd_title')}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            {t('home_bd_sub')}
          </p>

          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>{language === 'bn' ? 'মানচিত্র তৈরি করুন' : 'Create Your Map'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* World Map Card */}
        <div
          onClick={() => {
            telegram.triggerHaptic('selection');
            setActiveDesignToEdit(null);
            setCurrentTab('world');
          }}
          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <div className="relative h-36 w-full rounded-xl overflow-hidden mb-3 bg-slate-900">
            <img
              src="/src/assets/images/world_travel_art_1791284549776.jpg"
              alt="World Map"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-sky-600/90 text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-sm">
              <Globe className="w-3 h-3" />
              <span>Global</span>
            </div>
            <div className="absolute bottom-2.5 left-2.5 right-2.5">
              <span className="text-xs text-sky-300 font-medium block">
                {language === 'bn' ? 'মহাদেশ ও রাষ্ট্রসমূহ' : 'Continents & Countries'}
              </span>
              <h3 className="text-base font-bold text-white leading-tight">
                {t('home_world_title')}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            {t('home_world_sub')}
          </p>

          <div className="flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
            <span>{language === 'bn' ? 'ওয়ার্ল্ড ম্যাপ তৈরি করুন' : 'Design World Map'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Secondary Quick Action Cards (Trip Planner, Quiz, Puzzle) */}
      <div className="grid grid-cols-3 gap-3">
        {/* Trip Planner */}
        <button
          onClick={() => {
            telegram.triggerHaptic('selection');
            setCurrentTab('trips');
          }}
          className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-500 transition-all group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate w-full">
            {t('home_trips_title')}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate w-full">
            {language === 'bn' ? 'রুট প্ল্যান' : 'Route & Notes'}
          </span>
        </button>

        {/* Quiz */}
        <button
          onClick={() => {
            telegram.triggerHaptic('selection');
            setCurrentTab('quiz');
          }}
          className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-400 dark:hover:border-purple-500 transition-all group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform">
            <Brain className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate w-full">
            {t('home_quiz_title')}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate w-full">
            {language === 'bn' ? 'জ্ঞান যাচাই' : 'Trivia'}
          </span>
        </button>

        {/* Map Puzzle */}
        <button
          onClick={() => {
            telegram.triggerHaptic('selection');
            setCurrentTab('puzzle');
          }}
          className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-400 dark:hover:border-rose-500 transition-all group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-2 group-hover:scale-110 transition-transform">
            <Puzzle className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate w-full">
            {t('home_puzzle_title')}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate w-full">
            {language === 'bn' ? 'খেলা খেলুন' : 'Game'}
          </span>
        </button>
      </div>

      {/* Recent Designs Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t('home_recent_designs')}</span>
            {recentDesigns.length > 0 && (
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                ({recentDesigns.length})
              </span>
            )}
          </h2>
          {recentDesigns.length > 0 && (
            <button
              onClick={() => setCurrentTab('profile')}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {language === 'bn' ? 'সব দেখুন' : 'View all'}
            </button>
          )}
        </div>

        {loadingDesigns ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading...</div>
        ) : recentDesigns.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
            <MapPin className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {t('home_no_recent')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentDesigns.slice(0, 4).map((design) => (
              <div
                key={design.id}
                onClick={() => handleOpenDesign(design)}
                className="group relative flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-emerald-500 transition-all cursor-pointer shadow-xs"
              >
                {/* Thumbnail / Mini Graphic */}
                <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0 flex items-center justify-center relative">
                  {design.thumbnail ? (
                    <img src={design.thumbnail} alt={design.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-1">
                      <MapPin className="w-4 h-4 mx-auto text-emerald-600" />
                      <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 block">
                        {design.selected_ids?.length || 0}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {design.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {design.subtitle || `${design.selected_ids?.length || 0} locations`}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                    {new Date(design.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleQuickDownload(design, e)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                    title="Open / Download"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteDesign(design.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
