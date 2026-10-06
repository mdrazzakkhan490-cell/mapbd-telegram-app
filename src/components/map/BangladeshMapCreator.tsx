import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BANGLADESH_DISTRICTS, BANGLADESH_RIVERS, DIVISIONS, DISTRICT_MAP } from '../../data/bangladeshDistricts';
import { MAP_THEMES, FONT_OPTIONS } from '../../data/themes';
import { telegram } from '../../services/telegram';
import { api } from '../../services/api';
import { exportMap } from '../../services/export';
import { DistrictData, DivisionName } from '../../types';
import {
  Search,
  CheckSquare,
  Square,
  RotateCcw,
  Undo2,
  Redo2,
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
  FileText,
  Sliders,
  Compass,
  Waves,
  Eye,
  EyeOff
} from 'lucide-react';

export const BangladeshMapCreator: React.FC = () => {
  const { user, language, activeDesignToEdit, setActiveDesignToEdit, showToast, t } = useApp();

  // District selections
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    return activeDesignToEdit?.selectedIds || [
      'dhaka', 'gazipur', 'narayanganj', 'chattogram', 'coxsbazar', 'sylhet', 'moulvibazar', 'bogura', 'khulna', 'bagerhat'
    ];
  });

  // History stack for Undo / Redo
  const [history, setHistory] = useState<string[][]>([selectedIds]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDivisionFilter, setActiveDivisionFilter] = useState<DivisionName | 'all'>('all');

  // Themes & Colors
  const [activeThemeId, setActiveThemeId] = useState<string>(activeDesignToEdit?.themeId || 'classic');
  const [colors, setColors] = useState({
    selected: activeDesignToEdit?.customColors?.selected || '#059669',
    unselected: activeDesignToEdit?.customColors?.unselected || '#E2E8F0',
    background: activeDesignToEdit?.customColors?.background || '#FFFFFF',
    border: activeDesignToEdit?.customColors?.border || '#FFFFFF',
    text: activeDesignToEdit?.customColors?.text || '#0F172A'
  });
  const [borderWidth, setBorderWidth] = useState<number>(activeDesignToEdit?.borderWidth || 1.5);

  // Personalization
  const [title, setTitle] = useState(activeDesignToEdit?.title || 'My Bangladesh Journey');
  const [subtitle, setSubtitle] = useState(
    activeDesignToEdit?.subtitle || `Visited ${selectedIds.length} of 64 districts`
  );
  const [userName, setUserName] = useState(activeDesignToEdit?.userName || user?.first_name || 'Traveler');
  const [userPhoto, setUserPhoto] = useState(activeDesignToEdit?.userPhoto || user?.photo_url || '');
  const [showPhoto, setShowPhoto] = useState(true);
  const [fontFamily, setFontFamily] = useState(activeDesignToEdit?.fontFamily || 'Hind Siliguri');
  const [textPosition, setTextPosition] = useState<'top' | 'bottom'>(activeDesignToEdit?.textPosition || 'top');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');

  // Map Label Settings (Requested Feature: District names written directly on the map)
  const [showDistrictNames, setShowDistrictNames] = useState<boolean>(true);
  const [labelLanguage, setLabelLanguage] = useState<'bn' | 'en'>(language === 'bn' ? 'bn' : 'en');
  const [labelScale, setLabelScale] = useState<number>(1.0);
  const [showRivers, setShowRivers] = useState<boolean>(true);
  const [showBayOfBengal, setShowBayOfBengal] = useState<boolean>(true);
  const [showCompass, setShowCompass] = useState<boolean>(true);

  // UI Panels
  const [activeTab, setActiveTab] = useState<'districts' | 'theme' | 'text' | 'export'>('districts');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  // Sync subtitle automatically with district count
  useEffect(() => {
    if (subtitle.startsWith('Visited') || subtitle.includes('districts') || subtitle.includes('জেলা')) {
      const pct = Math.round((selectedIds.length / 64) * 100);
      setSubtitle(
        language === 'bn'
          ? `৬৪টি জেলার মধ্যে ${selectedIds.length}টি পরিদর্শিত (${pct}%)`
          : `Visited ${selectedIds.length} of 64 districts (${pct}% Explored)`
      );
    }
  }, [selectedIds.length, language]);

  // When a preset theme is picked
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

  // Push to undo/redo history
  const updateSelection = (newSelection: string[]) => {
    setSelectedIds(newSelection);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSelection);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      telegram.triggerHaptic('light');
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setSelectedIds(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      telegram.triggerHaptic('light');
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setSelectedIds(next);
    }
  };

  const handleToggleDistrict = (id: string) => {
    telegram.triggerHaptic('light');
    let next: string[];
    if (selectedIds.includes(id)) {
      next = selectedIds.filter(d => d !== id);
    } else {
      next = [...selectedIds, id];
    }
    updateSelection(next);
  };

  const handleSelectAll = () => {
    telegram.triggerHaptic('medium');
    updateSelection(BANGLADESH_DISTRICTS.map(d => d.id));
  };

  const handleClearAll = () => {
    telegram.triggerHaptic('medium');
    updateSelection([]);
  };

  const handleSelectDivision = (divName: DivisionName) => {
    telegram.triggerHaptic('light');
    const divDistricts = BANGLADESH_DISTRICTS.filter(d => d.division === divName).map(d => d.id);
    const allSelected = divDistricts.every(id => selectedIds.includes(id));
    let next: string[];
    if (allSelected) {
      next = selectedIds.filter(id => !divDistricts.includes(id));
    } else {
      next = Array.from(new Set([...selectedIds, ...divDistricts]));
    }
    updateSelection(next);
  };

  // Filtered districts list for quick search
  const filteredDistricts = BANGLADESH_DISTRICTS.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.nameBn.includes(searchQuery);
    const matchesDiv = activeDivisionFilter === 'all' || d.division === activeDivisionFilter;
    return matchesSearch && matchesDiv;
  });

  // Export handlers
  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
    if (!svgRef.current) return;
    setIsExporting(true);
    telegram.triggerHaptic('medium');
    try {
      const headerInfo = {
        title,
        subtitle,
        userName,
        userPhoto: showPhoto ? userPhoto : undefined,
        textPosition,
        textAlign,
        textColor: colors.text,
        fontFamily
      };

      await exportMap(
        svgRef.current,
        { format, fileName: `bangladesh_map_${Date.now()}` },
        headerInfo,
        colors.background
      );

      showToast(
        language === 'bn'
          ? `${format.toUpperCase()} ডাউনলোড সম্পন্ন হয়েছে!`
          : `${format.toUpperCase()} downloaded successfully!`
      );
    } catch (err) {
      console.error(err);
      showToast('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Save to backend database
  const handleSaveDesign = async () => {
    setIsSaving(true);
    telegram.triggerHaptic('success');
    try {
      const res = await api.saveDesign(
        {
          mapType: 'bangladesh',
          title,
          subtitle,
          userName,
          userPhoto,
          selectedIds,
          themeId: activeThemeId,
          customColors: colors,
          fontFamily,
          borderWidth,
          textPosition
        },
        user?.telegram_id,
        user?.id
      );

      if (res.design) {
        showToast(
          language === 'bn' ? 'ডিজাইন সফলভাবে সংরক্ষিত হয়েছে!' : 'Design saved successfully!'
        );
      }
    } catch (err) {
      showToast('Failed to save design');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTelegramShare = () => {
    telegram.triggerHaptic('medium');
    const msg = `🇧🇩 My Bangladesh Journey\n🗺️ Visited ${selectedIds.length} of 64 districts (${Math.round(
      (selectedIds.length / 64) * 100
    )}% explored)!\nCreate your own customized map with MapBD:`;
    telegram.shareToTelegram(msg);
  };

  // Helper for label coloring & halo
  const getLabelColors = (isSelected: boolean) => {
    if (isSelected) {
      return {
        fill: '#FFFFFF',
        halo: 'rgba(0,0,0,0.65)'
      };
    }
    // For unselected districts
    return {
      fill: activeThemeId === 'dark' ? '#F1F5F9' : '#0F172A',
      halo: activeThemeId === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)'
    };
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header & Stats Counter */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('map_selected')}:
            </h2>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {selectedIds.length} / 64
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {Math.round((selectedIds.length / 64) * 100)}% {language === 'bn' ? 'অন্বেষিত' : 'Explored'}
          </p>
        </div>

        {/* Undo, Redo, Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.25))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK MAP CONTROLS BAR: District Names Toggle, Language, Rivers */}
      <div className="flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-1.5">
          {/* Toggle District Names */}
          <button
            onClick={() => {
              telegram.triggerHaptic('light');
              setShowDistrictNames(!showDistrictNames);
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              showDistrictNames
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
            }`}
          >
            {showDistrictNames ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{language === 'bn' ? 'জেলার নাম' : 'District Names'}</span>
          </button>

          {/* Label Language Toggle: বাংলা / English */}
          {showDistrictNames && (
            <button
              onClick={() => {
                telegram.triggerHaptic('light');
                setLabelLanguage(labelLanguage === 'bn' ? 'en' : 'bn');
              }}
              className="px-2.5 py-1 rounded-lg font-bold bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 transition-colors"
              title="Toggle District Label Language"
            >
              {labelLanguage === 'bn' ? 'বাংলা' : 'English'}
            </button>
          )}

          {/* Toggle Rivers */}
          <button
            onClick={() => {
              telegram.triggerHaptic('light');
              setShowRivers(!showRivers);
            }}
            className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
              showRivers
                ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                : 'bg-white dark:bg-slate-700 text-slate-500'
            }`}
            title="Toggle Major Rivers"
          >
            <Waves className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'bn' ? 'নদী' : 'Rivers'}</span>
          </button>
        </div>

        {/* Font Size controls */}
        {showDistrictNames && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLabelScale(prev => Math.max(0.7, prev - 0.1))}
              className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-200"
              title="Smaller font"
            >
              A-
            </button>
            <span className="text-[10px] font-semibold text-slate-500 tabular-nums px-0.5">
              {Math.round(labelScale * 100)}%
            </span>
            <button
              onClick={() => setLabelScale(prev => Math.min(1.4, prev + 0.1))}
              className="w-6 h-6 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-200"
              title="Larger font"
            >
              A+
            </button>
          </div>
        )}
      </div>

      {/* Interactive Map Canvas Container */}
      <div
        className={`relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700 shadow-sm transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-4 z-50 bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between'
            : ''
        }`}
        style={{ backgroundColor: colors.background }}
      >
        {isFullscreen && (
          <div className="absolute top-3 right-3 z-20">
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Live Map Personalization Overlay */}
        <div
          className={`p-4 transition-all ${
            textPosition === 'top' ? 'order-first' : 'order-last'
          }`}
          style={{
            fontFamily,
            color: colors.text,
            textAlign
          }}
        >
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm font-medium opacity-80 mt-0.5">
            {subtitle}
          </p>
          {userName && (
            <div
              className={`flex items-center gap-2 mt-2 ${
                textAlign === 'center'
                  ? 'justify-center'
                  : textAlign === 'right'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              {showPhoto && userPhoto && (
                <img
                  src={userPhoto}
                  alt={userName}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-black/10"
                />
              )}
              <span className="text-xs font-semibold opacity-90">
                {userName}
              </span>
            </div>
          )}
        </div>

        {/* SVG Map Area */}
        <div className="relative overflow-auto flex items-center justify-center p-2 min-h-[380px] sm:min-h-[500px]">
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="w-full max-w-[580px]"
          >
            <svg
              ref={svgRef}
              viewBox="0 0 800 1000"
              className="w-full h-auto drop-shadow-xs"
              style={{ maxHeight: isFullscreen ? '75vh' : '520px' }}
            >
              <defs>
                <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.08" />
                </filter>
              </defs>

              {/* Major Rivers Layer (Padma, Jamuna, Meghna, Karnaphuli) */}
              {showRivers && (
                <g className="pointer-events-none opacity-45">
                  {BANGLADESH_RIVERS.map((river, idx) => (
                    <path
                      key={`river-${idx}`}
                      d={river.path}
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <title>{river.name} ({river.nameBn})</title>
                    </path>
                  ))}
                </g>
              )}

              {/* Render all 64 districts with boundaries */}
              {BANGLADESH_DISTRICTS.map((district) => {
                const isSelected = selectedIds.includes(district.id);
                const isHovered = hoveredDistrict?.id === district.id;

                return (
                  <path
                    key={district.id}
                    d={district.path}
                    fill={isSelected ? colors.selected : colors.unselected}
                    stroke={colors.border}
                    strokeWidth={borderWidth}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    onClick={() => handleToggleDistrict(district.id)}
                    onMouseEnter={() => setHoveredDistrict(district)}
                    onMouseLeave={() => setHoveredDistrict(null)}
                    className="cursor-pointer transition-colors duration-150 ease-out hover:opacity-90 active:scale-[0.99]"
                    style={{
                      transformOrigin: `${district.center[0]}px ${district.center[1]}px`,
                      filter: isHovered ? 'brightness(1.1)' : undefined
                    }}
                  >
                    <title>
                      {language === 'bn'
                        ? `${district.nameBn} (${district.divisionBn}) - ${district.highlightBn}`
                        : `${district.name} (${district.division}) - ${district.highlight}`}
                    </title>
                  </path>
                );
              })}

              {/* Render District Name Labels Directly on the Map */}
              {showDistrictNames && (
                <g className="pointer-events-none select-none">
                  {BANGLADESH_DISTRICTS.map((district) => {
                    const isSelected = selectedIds.includes(district.id);
                    const { fill, halo } = getLabelColors(isSelected);
                    const baseSize = district.fontSize || 10;
                    const calculatedFontSize = Math.round(baseSize * labelScale);
                    const labelText =
                      labelLanguage === 'bn'
                        ? district.shortNameBn || district.nameBn
                        : district.name;

                    return (
                      <text
                        key={`label-${district.id}`}
                        x={district.center[0]}
                        y={district.center[1]}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={calculatedFontSize}
                        fontWeight="700"
                        fontFamily="var(--font-bengali), var(--font-sans), sans-serif"
                        fill={fill}
                        stroke={halo}
                        strokeWidth="3.2"
                        paintOrder="stroke fill"
                        strokeLinejoin="round"
                        className="transition-colors duration-150"
                      >
                        {labelText}
                      </text>
                    );
                  })}
                </g>
              )}

              {/* North Compass Rose in top-right */}
              {showCompass && (
                <g transform="translate(735, 75)" className="pointer-events-none opacity-70">
                  <circle cx="0" cy="0" r="16" fill="none" stroke={colors.border} strokeWidth="1" />
                  <path d="M 0,-14 L 3.5,-2 L 14,0 L 3.5,2 L 0,14 L -3.5,2 L -14,0 L -3.5,-2 Z" fill={colors.selected} />
                  <text x="0" y="-18" textAnchor="middle" fontSize="11" fontWeight="bold" fill={colors.text}>N</text>
                </g>
              )}

              {/* Bay of Bengal (বঙ্গোপসাগর) Marker at south */}
              {showBayOfBengal && (
                <g transform="translate(390, 935)" className="pointer-events-none opacity-60">
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fontSize="15"
                    fontWeight="700"
                    fill={colors.text}
                    letterSpacing="3"
                    fontFamily="var(--font-bengali), var(--font-sans), sans-serif"
                  >
                    {labelLanguage === 'bn' ? 'বঙ্গোপসাগর' : 'BAY OF BENGAL'}
                  </text>
                  <path
                    d="M -110,12 Q -55,20 0,12 Q 55,4 110,12"
                    fill="none"
                    stroke={colors.text}
                    strokeWidth="1.2"
                    opacity="0.35"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* District Hover/Active Tooltip Badge */}
          {hoveredDistrict && (
            <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex justify-center">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 text-white backdrop-blur-md text-xs shadow-lg flex items-center gap-2">
                <span className="font-bold text-emerald-400">
                  {language === 'bn' ? hoveredDistrict.nameBn : hoveredDistrict.name}
                </span>
                <span className="opacity-70 text-[11px]">
                  ({language === 'bn' ? hoveredDistrict.divisionBn : hoveredDistrict.division})
                </span>
                <span className="text-[11px] text-slate-300 border-l border-white/20 pl-2">
                  {language === 'bn' ? hoveredDistrict.highlightBn : hoveredDistrict.highlight}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Sub-Tabs (Districts, Themes & Colors, Text, Export) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => setActiveTab('districts')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'districts'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'bn' ? 'জেলা' : 'Districts'}</span>
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'theme'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-indigo-500" />
          <span>{language === 'bn' ? 'রং ও থিম' : 'Themes'}</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'text'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Type className="w-3.5 h-3.5 text-amber-500" />
          <span>{language === 'bn' ? 'টেক্সট ও নাম' : 'Personalize'}</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'export'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-sky-500" />
          <span>{language === 'bn' ? 'ডাউনলোড' : 'Export'}</span>
        </button>
      </div>

      {/* TAB 1: DISTRICTS SELECTION PANEL */}
      {activeTab === 'districts' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-4">
          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{t('map_select_all')}</span>
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('map_clear_all')}</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('map_search_placeholder')}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Division Selector Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveDivisionFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                activeDivisionFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {language === 'bn' ? 'সব বিভাগ' : 'All'}
            </button>
            {DIVISIONS.map((div) => {
              const divDistricts = BANGLADESH_DISTRICTS.filter(d => d.division === div.id);
              const selectedCount = divDistricts.filter(d => selectedIds.includes(d.id)).length;
              const isFilterActive = activeDivisionFilter === div.id;

              return (
                <button
                  key={div.id}
                  onClick={() => setActiveDivisionFilter(div.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors ${
                    isFilterActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>{language === 'bn' ? div.nameBn : div.name}</span>
                  <span className="text-[10px] opacity-75 tabular-nums">
                    ({selectedCount}/{divDistricts.length})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Districts Checkbox List */}
          <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredDistricts.map((district) => {
              const isChecked = selectedIds.includes(district.id);
              return (
                <button
                  key={district.id}
                  onClick={() => handleToggleDistrict(district.id)}
                  className={`p-2 rounded-xl text-left border text-xs transition-all flex items-center justify-between gap-1 cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-semibold block truncate">
                      {language === 'bn' ? district.nameBn : district.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                      {district.division}
                    </span>
                  </div>
                  <div className="shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: THEMES & COLORS PANEL */}
      {activeTab === 'theme' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {language === 'bn' ? 'প্রিসেট থিমসমূহ' : 'Preset Themes'}
          </h4>

          {/* Theme Badges */}
          <div className="grid grid-cols-3 gap-2">
            {MAP_THEMES.map((theme) => {
              const isCurrent = activeThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => applyTheme(theme.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-slate-50 dark:bg-slate-700'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: theme.selectedColor }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: theme.unselectedColor }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                    {language === 'bn' ? theme.nameBn : theme.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Color Pickers */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {language === 'bn' ? 'কাস্টম কালার' : 'Custom Colors'}
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">
                  {language === 'bn' ? 'নির্বাচিত জেলা' : 'Selected'}
                </span>
                <input
                  type="color"
                  value={colors.selected}
                  onChange={(e) => setColors({ ...colors, selected: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">
                  {language === 'bn' ? 'অনির্বাচিত জেলা' : 'Unselected'}
                </span>
                <input
                  type="color"
                  value={colors.unselected}
                  onChange={(e) => setColors({ ...colors, unselected: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">
                  {language === 'bn' ? 'পটভূমি (Background)' : 'Background'}
                </span>
                <input
                  type="color"
                  value={colors.background}
                  onChange={(e) => setColors({ ...colors, background: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">
                  {language === 'bn' ? 'সীমানা (Border)' : 'Border'}
                </span>
                <input
                  type="color"
                  value={colors.border}
                  onChange={(e) => setColors({ ...colors, border: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                />
              </label>
            </div>

            {/* Border Width Slider */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                <span>{language === 'bn' ? 'সীমানার পুরুত্ব' : 'Border Width'}</span>
                <span className="font-semibold">{borderWidth}px</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.5"
                value={borderWidth}
                onChange={(e) => setBorderWidth(parseFloat(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PERSONALIZATION & TEXT PANEL */}
      {activeTab === 'text' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-4">
          {/* Map District Name Settings */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'ম্যাপে জেলার নাম প্রদর্শন' : 'District Name Labels on Map'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDistrictNames(!showDistrictNames)}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  showDistrictNames ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {showDistrictNames ? (language === 'bn' ? 'চালু' : 'ON') : (language === 'bn' ? 'বন্ধ' : 'OFF')}
              </button>
            </div>

            {showDistrictNames && (
              <div className="space-y-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60 text-xs">
                {/* Language for labels */}
                <div className="flex items-center justify-between">
                  <span className="text-emerald-800 dark:text-emerald-300">
                    {language === 'bn' ? 'লেবেল ভাষা' : 'Label Language'}:
                  </span>
                  <div className="flex rounded-lg bg-white dark:bg-slate-800 p-0.5 border border-emerald-200">
                    <button
                      type="button"
                      onClick={() => setLabelLanguage('bn')}
                      className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                        labelLanguage === 'bn' ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      বাংলা
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabelLanguage('en')}
                      className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                        labelLanguage === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Font size scale */}
                <div>
                  <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-1">
                    <span>{language === 'bn' ? 'জেলার নাম ফন্ট সাইজ' : 'Label Font Size'}:</span>
                    <span className="font-bold tabular-nums">{Math.round(labelScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.05"
                    value={labelScale}
                    onChange={(e) => setLabelScale(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'শিরোনাম' : 'Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'উপশিরোনাম' : 'Subtitle'}
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'আপনার নাম' : 'Your Name'}
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'ফন্ট' : 'Font Family'}
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text Position & Alignment */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'অবস্থান' : 'Position'}
              </span>
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                <button
                  onClick={() => setTextPosition('top')}
                  className={`flex-1 py-1 text-xs rounded-md font-medium ${
                    textPosition === 'top' ? 'bg-white dark:bg-slate-600 shadow-xs' : ''
                  }`}
                >
                  Top
                </button>
                <button
                  onClick={() => setTextPosition('bottom')}
                  className={`flex-1 py-1 text-xs rounded-md font-medium ${
                    textPosition === 'bottom' ? 'bg-white dark:bg-slate-600 shadow-xs' : ''
                  }`}
                >
                  Bottom
                </button>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'অ্যালাইনমেন্ট' : 'Alignment'}
              </span>
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => setTextAlign(align)}
                    className={`flex-1 py-1 text-xs rounded-md capitalize font-medium ${
                      textAlign === align ? 'bg-white dark:bg-slate-600 shadow-xs' : ''
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXPORT, SAVE & TELEGRAM SHARE PANEL */}
      {activeTab === 'export' && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {language === 'bn' ? 'ডাউনলোড ও সংরক্ষণ' : 'Download & Save'}
          </h4>

          {/* Download Options */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleExport('png')}
              disabled={isExporting}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-700/50 flex flex-col items-center text-center transition-all group"
            >
              <FileImage className="w-5 h-5 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">PNG</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">High-Res</span>
            </button>

            <button
              onClick={() => handleExport('jpg')}
              disabled={isExporting}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-700/50 flex flex-col items-center text-center transition-all group"
            >
              <FileImage className="w-5 h-5 text-sky-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">JPG</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Standard</span>
            </button>

            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-700/50 flex flex-col items-center text-center transition-all group"
            >
              <FileText className="w-5 h-5 text-rose-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">PDF</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Printable</span>
            </button>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleSaveDesign}
              disabled={isSaving}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : t('map_save_design')}</span>
            </button>

            <button
              onClick={handleTelegramShare}
              className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>{t('map_share_telegram')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
