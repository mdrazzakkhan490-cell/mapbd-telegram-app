import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { telegram } from '../../services/telegram';
import { api } from '../../services/api';
import { DesignConfig, SavedTrip } from '../../types';
import {
  User,
  MapPin,
  Compass,
  Brain,
  Puzzle,
  Settings,
  FolderOpen,
  Trash2,
  Moon,
  Sun,
  Globe,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    user,
    setUser,
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    setCurrentTab,
    setActiveDesignToEdit,
    showToast
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'designs' | 'trips' | 'settings'>('designs');
  const [designs, setDesigns] = useState<any[]>([]);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable name for simulated Telegram user
  const [editFirstName, setEditFirstName] = useState(user?.first_name || 'MD Razzak');
  const [editUsername, setEditUsername] = useState(user?.username || 'razzak_bd');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, tRes] = await Promise.all([
        api.getDesigns(false, user?.telegram_id, user?.id),
        api.getTrips(user?.telegram_id, user?.id)
      ]);
      if (dRes.designs) setDesigns(dRes.designs);
      if (tRes.trips) setTrips(tRes.trips);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDesign = (d: any) => {
    telegram.triggerHaptic('light');
    const config: DesignConfig = {
      id: d.id,
      mapType: d.map_type,
      selectedIds: d.selected_ids || [],
      themeId: d.theme_name || 'classic',
      customColors: d.colors,
      borderWidth: d.border_width || 1.5,
      title: d.title,
      subtitle: d.subtitle,
      userName: d.user_name,
      userPhoto: d.photo_url,
      showPhoto: !!d.photo_url,
      showWatermark: true,
      fontFamily: d.font_family || 'Plus Jakarta Sans',
      textPosition: d.text_position || 'top',
      textAlign: 'center',
      thumbnail: d.thumbnail
    };
    setActiveDesignToEdit(config);
    setCurrentTab(d.map_type === 'world' ? 'world' : 'bangladesh');
  };

  const handleDeleteDesign = async (id: string) => {
    telegram.triggerHaptic('medium');
    try {
      await api.deleteDesign(id, user?.telegram_id, user?.id);
      setDesigns(designs.filter(d => d.id !== id));
      showToast(language === 'bn' ? 'ডিজাইন মুছে ফেলা হয়েছে' : 'Design deleted');
    } catch (e) {
      showToast('Failed to delete');
    }
  };

  const handleSaveProfile = async () => {
    telegram.triggerHaptic('success');
    try {
      const res = await api.updateUserProfile(
        { first_name: editFirstName, username: editUsername },
        user?.telegram_id,
        user?.id
      );
      if (res.user) {
        setUser(res.user);
        telegram.setSimulatedUser({
          id: user?.telegram_id || 970532,
          first_name: editFirstName,
          username: editUsername
        });
        showToast(language === 'bn' ? 'প্রোফাইল আপডেট হয়েছে!' : 'Profile updated!');
      }
    } catch (e) {
      showToast('Update failed');
    }
  };

  const handleClearCache = () => {
    telegram.triggerHaptic('heavy');
    localStorage.removeItem('mapbd_simulated_user');
    showToast(language === 'bn' ? 'ক্যাশ পরিষ্কার করা হয়েছে' : 'Local cache cleared');
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500/30 flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
          {user?.photo_url ? (
            <img src={user.photo_url} alt={user.first_name} className="w-full h-full object-cover" />
          ) : (
            <span>{user?.first_name?.charAt(0) || 'U'}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {user?.first_name} {user?.last_name || ''}
            </h2>
            {user?.role === 'admin' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold uppercase">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            @{user?.username || 'traveler_bd'}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            <span>Telegram ID: {user?.telegram_id || 970532}</span>
            <span>•</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {user?.points ?? 100} Points
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => setActiveSubTab('designs')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'designs'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'bn' ? 'আমার ডিজাইন' : 'My Designs'}</span>
          <span className="text-[10px] opacity-75">({designs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('trips')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'trips'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-amber-600" />
          <span>{language === 'bn' ? 'ভ্রমণসমূহ' : 'My Trips'}</span>
          <span className="text-[10px] opacity-75">({trips.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'settings'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>{language === 'bn' ? 'সেটিংস' : 'Settings'}</span>
        </button>
      </div>

      {/* SUB-TAB 1: MY DESIGNS */}
      {activeSubTab === 'designs' && (
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading designs...</div>
          ) : designs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
              <MapPin className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">
                {language === 'bn' ? 'কোনো সংরক্ষিত ডিজাইন নেই।' : 'No saved designs yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {designs.map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleOpenDesign(d)}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      {d.map_type === 'world' ? 'World Map' : 'Bangladesh Map'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {d.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {d.subtitle}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenDesign(d)}
                      className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                      title="Open / Edit"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDesign(d.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
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
      )}

      {/* SUB-TAB 2: MY TRIPS */}
      {activeSubTab === 'trips' && (
        <div className="space-y-3">
          {trips.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
              <Compass className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">
                {language === 'bn' ? 'কোনো ভ্রমণ পরিকল্পনা নেই।' : 'No trips planned.'}
              </p>
            </div>
          ) : (
            trips.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs"
              >
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {t.title}
                </h4>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  <span>{t.start_location}</span> → <span>{t.destinations?.join(', ')}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  📅 {t.travel_date} • 🚀 {t.travel_mode}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUB-TAB 3: SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {language === 'bn' ? 'অ্যাপ সেটিংস ও পছন্দসমূহ' : 'Preferences & Profile'}
          </h3>

          {/* Edit User Info */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'নাম' : 'Display Name'}
              </label>
              <input
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'ইউজারনেম' : 'Username'}
              </label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
            >
              {language === 'bn' ? 'তথ্য আপডেট করুন' : 'Update Profile'}
            </button>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
            {/* Language */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                {language === 'bn' ? 'ভাষা (Language)' : 'Language'}
              </span>
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-0.5">
                <button
                  onClick={() => setLanguage('bn')}
                  className={`px-3 py-1 rounded-md text-xs font-medium ${
                    language === 'bn' ? 'bg-white dark:bg-slate-600 shadow-xs font-bold' : ''
                  }`}
                >
                  বাংলা
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-md text-xs font-medium ${
                    language === 'en' ? 'bg-white dark:bg-slate-600 shadow-xs font-bold' : ''
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                {themeMode === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-slate-400" />}
                {language === 'bn' ? 'ডার্ক মোড' : 'Dark Mode'}
              </span>
              <button
                onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
              >
                {themeMode === 'dark' ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Clear Cache */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">
                {language === 'bn' ? 'স্থানীয় ক্যাশ মুছুন' : 'Clear Local Cache'}
              </span>
              <button
                onClick={handleClearCache}
                className="px-3 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Admin link */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Admin Console</span>
            </span>
            <button
              onClick={() => setCurrentTab('admin')}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold"
            >
              Open Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
