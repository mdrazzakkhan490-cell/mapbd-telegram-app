import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { WORLD_COUNTRIES, WORLD_CONTINENTS, COUNTRY_MAP } from '../../data/worldCountries';
import { MAP_THEMES, FONT_OPTIONS } from '../../data/themes';
import { telegram } from '../../services/telegram';
import { api } from '../../services/api';
import { exportMap } from '../../services/export';
import { CountryData } from '../../types';
import {
  Search,
  CheckSquare,
  Square,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Palette,
  Type,
  Download,
  Share2,
  BookmarkCheck,
  FileImage,
  FileText
} from 'lucide-react';

export const WorldMapCreator: React.FC = () => {
  const { user, language, activeDesignToEdit, showToast, t } = useApp();

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    return activeDesignToEdit?.selectedIds || ['bangladesh', 'saudi_arabia', 'turkey', 'malaysia', 'japan'];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeContinent, setActiveContinent] = useState('all');

  const [activeThemeId, setActiveThemeId] = useState<string>(activeDesignToEdit?.themeId || 'ocean');
  const [colors, setColors] = useState({
    selected: activeDesignToEdit?.customColors?.selected || '#0284C7',
    unselected: activeDesignToEdit?.customColors?.unselected || '#E0F2FE',
    background: activeDesignToEdit?.customColors?.background || '#F8FAFC',
    border: activeDesignToEdit?.customColors?.border || '#BAE6FD',
    text: activeDesignToEdit?.customColors?.text || '#0C4A6E'
  });

  const [title, setTitle] = useState(activeDesignToEdit?.title || 'My Global Travel Map');
  const [subtitle, setSubtitle] = useState(
    activeDesignToEdit?.subtitle || `Visited ${selectedIds.length} countries around the world`
  );
  const [userName, setUserName] = useState(activeDesignToEdit?.userName || user?.first_name || 'Traveler');
  const [fontFamily, setFontFamily] = useState(activeDesignToEdit?.fontFamily || 'Plus Jakarta Sans');

  const [activeTab, setActiveTab] = useState<'countries' | 'theme' | 'text' | 'export'>('countries');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setSubtitle(
      language === 'bn'
        ? `বিশ্বের ${selectedIds.length} টি দেশ পরিদর্শিত`
        : `Visited ${selectedIds.length} countries around the world`
    );
  }, [selectedIds.length, language]);

  const applyTheme = (themeId: string) => {
    telegram.triggerHaptic('selection');
    setActiveThemeId(themeId);
    const theme = MAP_THEMES.find(t => t.id === themeId);
    if (theme) {
      setColors({
        selected: theme.selectedColor,
        unselected: theme.unselectedColor,
        background: theme.backgroundColor,
        border: theme.borderColor,
        text: theme.textColor
      });
    }
  };

  const handleToggleCountry = (id: string) => {
    telegram.triggerHaptic('light');
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(c => c !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const filteredCountries = WORLD_COUNTRIES.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nameBn.includes(searchQuery);
    const matchesContinent = activeContinent === 'all' || c.continent === activeContinent;
    return matchesSearch && matchesContinent;
  });

  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
    if (!svgRef.current) return;
    setIsExporting(true);
    telegram.triggerHaptic('medium');
    try {
      await exportMap(
        svgRef.current,
        { format, fileName: `world_map_${Date.now()}` },
        {
          title,
          subtitle,
          userName,
          textPosition: 'top',
          textAlign: 'center',
          textColor: colors.text,
          fontFamily
        },
        colors.background
      );
      showToast(`${format.toUpperCase()} downloaded successfully!`);
    } catch (e) {
      showToast('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveDesign = async () => {
    setIsSaving(true);
    telegram.triggerHaptic('success');
    try {
      await api.saveDesign(
        {
          mapType: 'world',
          title,
          subtitle,
          userName,
          selectedIds,
          themeId: activeThemeId,
          customColors: colors,
          fontFamily
        },
        user?.telegram_id,
        user?.id
      );
      showToast(language === 'bn' ? 'ডিজাইন সংরক্ষিত হয়েছে!' : 'Design saved!');
    } catch (e) {
      showToast('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'নির্বাচিত দেশ' : 'Selected Countries'}:
            </h2>
            <span className="text-base font-extrabold text-sky-600 dark:text-sky-400 tabular-nums">
              {selectedIds.length} / {WORLD_COUNTRIES.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'bn' ? 'বিশ্ব মানচিত্রে দেশ চিহ্নিত করুন' : 'Mark your international journeys'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.0))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* World Map SVG Container */}
      <div
        className={`relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700 shadow-sm transition-all duration-300 ${
          isFullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between' : ''
        }`}
        style={{ backgroundColor: colors.background }}
      >
        {isFullscreen && (
          <div className="absolute top-3 right-3 z-20">
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-full bg-slate-900/70 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Text Header */}
        <div
          className="p-4 text-center"
          style={{ fontFamily, color: colors.text }}
        >
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm font-medium opacity-80 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* World SVG Map */}
        <div className="relative overflow-auto flex items-center justify-center p-3 min-h-[300px]">
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="w-full max-w-[650px]"
          >
            <svg
              ref={svgRef}
              viewBox="0 0 1000 500"
              className="w-full h-auto drop-shadow-xs"
            >
              {WORLD_COUNTRIES.map((country) => {
                const isSelected = selectedIds.includes(country.id);
                const isHovered = hoveredCountry?.id === country.id;
                return (
                  <path
                    key={country.id}
                    d={country.path}
                    fill={isSelected ? colors.selected : colors.unselected}
                    stroke={colors.border}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                    onClick={() => handleToggleCountry(country.id)}
                    onMouseEnter={() => setHoveredCountry(country)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                    style={{
                      filter: isHovered ? 'brightness(1.15)' : undefined
                    }}
                  >
                    <title>{country.name} ({country.nameBn})</title>
                  </path>
                );
              })}

              {/* Pins for selected countries */}
              {selectedIds.map((id) => {
                const c = COUNTRY_MAP.get(id);
                if (!c) return null;
                return (
                  <circle
                    key={`pin-${id}`}
                    cx={c.center[0]}
                    cy={c.center[1]}
                    r="4"
                    fill="#FFFFFF"
                    stroke={colors.selected}
                    strokeWidth="2"
                    className="pointer-events-none"
                  />
                );
              })}
            </svg>
          </div>

          {hoveredCountry && (
            <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex justify-center">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white backdrop-blur-md text-xs shadow-lg flex items-center gap-2">
                <span className="font-bold text-sky-400">
                  {language === 'bn' ? hoveredCountry.nameBn : hoveredCountry.name}
                </span>
                <span className="opacity-70 text-[11px] uppercase">
                  {hoveredCountry.code}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => setActiveTab('countries')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg ${
            activeTab === 'countries' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600'
          }`}
        >
          {language === 'bn' ? 'দেশসমূহ' : 'Countries'}
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg ${
            activeTab === 'theme' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600'
          }`}
        >
          {language === 'bn' ? 'রং ও থিম' : 'Themes'}
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg ${
            activeTab === 'text' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600'
          }`}
        >
          {language === 'bn' ? 'শিরোনাম' : 'Title'}
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg ${
            activeTab === 'export' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600'
          }`}
        >
          {language === 'bn' ? 'এক্সপোর্ট' : 'Export'}
        </button>
      </div>

      {/* Countries Tab */}
      {activeTab === 'countries' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds(WORLD_COUNTRIES.map(c => c.id))}
              className="flex-1 py-1.5 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 text-sky-700 text-xs font-semibold"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="flex-1 py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 text-slate-700 text-xs font-semibold"
            >
              Clear All
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
            />
          </div>

          <div className="max-h-52 overflow-y-auto grid grid-cols-2 gap-2">
            {filteredCountries.map((c) => {
              const isChecked = selectedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => handleToggleCountry(c.id)}
                  className={`p-2 rounded-xl text-left border text-xs flex items-center justify-between ${
                    isChecked
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 text-sky-900'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="font-semibold truncate">
                    {language === 'bn' ? c.nameBn : c.name}
                  </span>
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {MAP_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => applyTheme(theme.id)}
                className={`p-2 rounded-xl border text-left text-xs ${
                  activeThemeId === theme.id ? 'border-sky-500 bg-sky-50 dark:bg-slate-700' : 'border-slate-200'
                }`}
              >
                <div className="flex gap-1 mb-1">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.selectedColor }} />
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.unselectedColor }} />
                </div>
                <span className="font-medium truncate block">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Tab */}
      {activeTab === 'text' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Map Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-xs"
            />
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleExport('png')}
              disabled={isExporting}
              className="p-3 rounded-xl border flex flex-col items-center text-xs font-bold"
            >
              <FileImage className="w-5 h-5 text-sky-600 mb-1" />
              PNG
            </button>
            <button
              onClick={() => handleExport('jpg')}
              disabled={isExporting}
              className="p-3 rounded-xl border flex flex-col items-center text-xs font-bold"
            >
              <FileImage className="w-5 h-5 text-emerald-600 mb-1" />
              JPG
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="p-3 rounded-xl border flex flex-col items-center text-xs font-bold"
            >
              <FileText className="w-5 h-5 text-rose-600 mb-1" />
              PDF
            </button>
          </div>

          <button
            onClick={handleSaveDesign}
            disabled={isSaving}
            className="w-full py-3 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            <BookmarkCheck className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save World Map Design'}
          </button>
        </div>
      )}
    </div>
  );
};
