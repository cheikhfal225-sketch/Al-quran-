import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Volume2,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Check,
  X,
  MessageSquare,
  Tag,
  Share2,
  Languages,
  Type,
  Sliders,
  Clock,
} from 'lucide-react';
import { AppLanguage, ThemeMode, ReciterId, VerseData, BookmarkItem } from '../types/quran';
import { getTranslation } from '../data/translations';
import {
  getPageMetadata,
  getMushafPageImageUrl,
  getVersesForPage,
  fetchVersesForPage,
  getSurahById,
  isPageBookmarked,
  getBookmarkForPage,
  addBookmark,
  removeBookmark,
  getBookmarks,
  saveReadingProgress,
  getAyahAudioUrl,
  getSurahAudioUrl,
  fetchFullSurahText,
} from '../services/quranService';

interface MushafReaderProps {
  initialPage: number;
  language: AppLanguage;
  theme: ThemeMode;
  onPageChange?: (page: number) => void;
  onPlayAudio: (track: {
    title: string;
    audioUrl: string;
    surahId?: number;
    ayahNumber?: number;
  }) => void;
  selectedReciter: ReciterId;
  onToggleFullscreen?: (active: boolean) => void;
}

export const MushafReader: React.FC<MushafReaderProps> = ({
  initialPage = 1,
  language,
  theme,
  onPageChange,
  onPlayAudio,
  selectedReciter,
  onToggleFullscreen,
}) => {
  const t = getTranslation(language);
  const [page, setPage] = useState<number>(Math.max(1, Math.min(604, initialPage)));
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [autoHideUI, setAutoHideUI] = useState<boolean>(false);
  const [isUiHidden, setIsUiHidden] = useState<boolean>(false);
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [showTafsirDrawer, setShowTafsirDrawer] = useState<boolean>(false);
  const [imageErrorIndex, setImageErrorIndex] = useState<number>(0);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [sliderValue, setSliderValue] = useState<number>(page);

  // Bookmark modal & toast state
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState<boolean>(false);
  const [bookmarkNote, setBookmarkNote] = useState<string>('');
  const [bookmarkCategory, setBookmarkCategory] = useState<BookmarkItem['category']>('general');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Verses on current page (full text support)
  const [pageVerses, setPageVerses] = useState<VerseData[]>(getVersesForPage(page));
  const [loadingPageVerses, setLoadingPageVerses] = useState<boolean>(false);

  // New Bilingual Mode States (Demande 6: Bouton « التفسير والترجمة – Tekki Wolof »)
  const [isBilingualView, setIsBilingualView] = useState<boolean>(false);
  const [showWolofTranslation, setShowWolofTranslation] = useState<boolean>(true);
  const [arabicFontSize, setArabicFontSize] = useState<number>(26); // px for Arabic calligraphy
  const [expandedTafsirId, setExpandedTafsirId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);

  const pageMeta = getPageMetadata(page);
  const pageImageUrls = getMushafPageImageUrl(page);

  // Sync bookmark state, reading progress, and load full text verses for this page
  useEffect(() => {
    const isBm = isPageBookmarked(page);
    setBookmarked(isBm);
    const existingBm = getBookmarkForPage(page);
    if (existingBm) {
      setBookmarkNote(existingBm.note || '');
      setBookmarkCategory(existingBm.category || 'general');
    } else {
      setBookmarkNote('');
      setBookmarkCategory('general');
    }

    saveReadingProgress(page, pageMeta.surah.id);
    setSliderValue(page);
    setImageErrorIndex(0);
    setImageLoading(true);
    if (onPageChange) onPageChange(page);

    // Initial local verses
    const local = getVersesForPage(page);
    setPageVerses(local);

    // Asynchronously fetch complete authentic verses for ANY of the 604 pages from AlQuran Cloud
    let isCancelled = false;
    setLoadingPageVerses(true);
    fetchVersesForPage(page).then((verses) => {
      if (!isCancelled && verses && verses.length > 0) {
        setPageVerses(verses);
        setLoadingPageVerses(false);
      }
    }).catch(() => {
      if (!isCancelled) setLoadingPageVerses(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [page]);

  // Reset inactivity timer to automatically hide UI during prolonged reading
  const resetInactivityTimer = useCallback(() => {
    if (isUiHidden) {
      setIsUiHidden(false);
    }

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Only auto-hide if in fullscreen OR if autoHideUI option is activated
    if (isFullscreen || autoHideUI) {
      if (showTafsirDrawer || isBookmarkModalOpen) return;

      inactivityTimerRef.current = setTimeout(() => {
        setIsUiHidden(true);
      }, 3500);
    }
  }, [isFullscreen, autoHideUI, isUiHidden, showTafsirDrawer, isBookmarkModalOpen]);

  // Activity listeners when auto-hide is active
  useEffect(() => {
    if (isFullscreen || autoHideUI) {
      resetInactivityTimer();
      const handleUserActivity = () => {
        resetInactivityTimer();
      };

      window.addEventListener('mousemove', handleUserActivity);
      window.addEventListener('touchstart', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);

      return () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        window.removeEventListener('mousemove', handleUserActivity);
        window.removeEventListener('touchstart', handleUserActivity);
        window.removeEventListener('keydown', handleUserActivity);
      };
    } else {
      setIsUiHidden(false);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    }
  }, [isFullscreen, autoHideUI, resetInactivityTimer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrevPage();
      } else if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'b') {
        openBookmarkModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, isFullscreen, bookmarked]);

  const goToNextPage = () => {
    if (page < 604) setPage((p) => p + 1);
  };

  const goToPrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  // Touch Swipe Handlers for mobile & tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndXRef.current = e.changedTouches[0].clientX;
    handleSwipeGesture();
  };

  const handleSwipeGesture = () => {
    const delta = touchStartXRef.current - touchEndXRef.current;
    const minDistance = 50;
    if (delta > minDistance) {
      goToNextPage();
    } else if (delta < -minDistance) {
      goToPrevPage();
    }
  };

  // Open modal to add or edit bookmark
  const openBookmarkModal = () => {
    const existing = getBookmarkForPage(page);
    if (existing) {
      setBookmarkNote(existing.note || '');
      setBookmarkCategory(existing.category || 'general');
    }
    setIsBookmarkModalOpen(true);
  };

  // Save Bookmark into database
  const handleSaveBookmark = () => {
    addBookmark({
      type: 'page',
      page_number: page,
      surah_id: pageMeta.surah.id,
      title: `${pageMeta.surah.name_simple} (${pageMeta.surah.name_arabic})`,
      preview_text: `Xët ${page} · Juz ${pageMeta.juz.juz_number} · ${pageMeta.surah.name_wolof}`,
      category: bookmarkCategory,
      note: bookmarkNote.trim() || undefined,
    });
    setBookmarked(true);
    setIsBookmarkModalOpen(false);
    showToast(`✓ Page ${page} (${pageMeta.surah.name_simple}) enregistrée dans vos signets !`);
  };

  // Remove bookmark from database
  const handleRemoveBookmark = () => {
    const all = getBookmarks();
    const target = all.find((b) => b.type === 'page' && b.page_number === page);
    if (target) {
      removeBookmark(target.id);
    }
    setBookmarked(false);
    setIsBookmarkModalOpen(false);
    showToast(`Signet de la page ${page} supprimé.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const toggleFullscreen = () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);
    setAutoHideUI(nextState);
    setIsUiHidden(false);

    if (onToggleFullscreen) {
      onToggleFullscreen(nextState);
    }

    if (nextState) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    setAutoHideUI(false);
    setIsUiHidden(false);
    if (onToggleFullscreen) onToggleFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Convert numbers to Arabic numerals
  const toArabicNumerals = (num: number) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num)
      .split('')
      .map((d) => arabicDigits[parseInt(d, 10)] ?? d)
      .join('');
  };

  // Current page background theme class
  const getThemeWrapperClass = () => {
    switch (theme) {
      case 'dark':
        return 'bg-[#181818] text-[#F8F5EA] border-[#333]';
      case 'sepia':
        return 'bg-[#F4EBD9] text-[#2C2416] border-[#D9C8A9]';
      case 'emerald':
        return 'bg-[#0E3A24] text-[#F8F5EA] border-[#1D5E3C]';
      default: // parchment
        return 'bg-[#F8F5EA] text-[#202020] border-[#E5DEC9]';
    }
  };

  const currentImageUrl = pageImageUrls[imageErrorIndex] || pageImageUrls[0];

  return (
    <div
      ref={containerRef}
      className={`relative w-full transition-all duration-300 select-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 overflow-y-auto bg-black flex flex-col items-center justify-center p-2 sm:p-4'
          : 'max-w-5xl mx-auto flex flex-col items-center pb-20 px-2 sm:px-4 pt-2'
      }`}
      onClick={() => {
        if (isFullscreen || autoHideUI) {
          setIsUiHidden(!isUiHidden);
        }
      }}
    >
      {/* ================= TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#176B45] text-white text-xs sm:text-sm font-semibold shadow-2xl border border-[#C5A45B] animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2">
          <BookmarkCheck className="w-4 h-4 text-[#C5A45B] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= FLOATING ZEN MODE DISCRETE HINT PILL ================= */}
      {(isFullscreen || autoHideUI) && (
        <div
          className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 text-white/90 text-xs backdrop-blur-md border border-[#C5A45B]/40 shadow-xl ${
            isUiHidden
              ? 'opacity-40 hover:opacity-100 scale-95'
              : 'opacity-100 scale-100'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setIsUiHidden(!isUiHidden);
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-[11px] sm:text-xs">
            {isUiHidden ? t.touchToReveal : t.zenMode}
          </span>
          {isFullscreen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                exitFullscreen();
              }}
              className="ml-2 pl-2 border-l border-white/20 hover:text-[#C5A45B] transition-colors"
              title={t.exitZenMode}
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ================= TOP MUSHAF CONTROLS & HEADER BAR ================= */}
      <div
        className={`w-full bg-[#176B45] text-[#F8F5EA] rounded-xl shadow-md border border-[#C5A45B]/30 px-3 sm:px-5 py-2.5 mb-3 flex flex-wrap items-center justify-between gap-3 transition-all duration-500 ${
          isUiHidden
            ? 'opacity-0 -translate-y-6 pointer-events-none'
            : 'opacity-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Surah Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#C5A45B] text-[#176B45] flex items-center justify-center font-bold text-xs shadow-inner">
            {pageMeta.surah.id}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold font-arabic tracking-wide flex items-center gap-2">
              <span>{pageMeta.surah.name_arabic}</span>
              <span className="text-xs font-normal text-[#C5A45B] font-sans">
                {pageMeta.surah.name_simple}
              </span>
            </h2>
            <p className="text-[11px] text-[#F8F5EA]/80 truncate max-w-[200px] sm:max-w-xs">
              {pageMeta.surah.name_wolof} · {pageMeta.surah.revelation_place === 'makkah' ? t.makkah : t.madinah}
            </p>
          </div>
        </div>

        {/* Center: Juz & Hizb Information */}
        <div className="hidden sm:flex items-center gap-3 text-xs bg-black/20 px-3 py-1.5 rounded-lg border border-[#C5A45B]/30">
          <span className="font-arabic text-[#C5A45B] font-semibold">
            {pageMeta.juz.name_arabic}
          </span>
          <span className="text-white/60">·</span>
          <span>
            {t.juz} {pageMeta.juz.juz_number}
          </span>
          <span className="text-white/60">·</span>
          <span>
            {t.hizb} {pageMeta.hizbNumber}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* PROMINENT "AJOUTER AUX SIGNETS" BUTTON (Demande 1) */}
          <button
            onClick={openBookmarkModal}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
              bookmarked
                ? 'bg-[#C5A45B] text-[#176B45] ring-2 ring-white/30'
                : 'bg-white/15 hover:bg-white/25 text-[#F8F5EA] border border-[#C5A45B]/50'
            }`}
            title="Enregistrer la page courante dans la base de données des signets"
          >
            {bookmarked ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 fill-current" />
                <span>Page {page} aux signets</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Ajouter aux signets</span>
              </>
            )}
          </button>

          {/* Auto-Hide UI Immersion Toggle Button */}
          <button
            onClick={() => {
              const next = !autoHideUI;
              setAutoHideUI(next);
              if (next) resetInactivityTimer();
              else setIsUiHidden(false);
            }}
            className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
              autoHideUI
                ? 'bg-[#C5A45B] text-[#176B45] font-bold shadow'
                : 'text-white/80 hover:text-[#C5A45B] hover:bg-black/20'
            }`}
            title={autoHideUI ? 'Désactiver le masquage auto' : 'Activer le masquage auto lors de la lecture'}
          >
            {autoHideUI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-[11px] hidden xl:inline">Immersion</span>
          </button>

          {/* Audio Page Recitation */}
          <button
            onClick={() =>
              onPlayAudio({
                title: `${pageMeta.surah.name_simple} - ${t.page} ${page}`,
                audioUrl: getSurahAudioUrl(pageMeta.surah.id, selectedReciter),
                surahId: pageMeta.surah.id,
              })
            }
            className="p-1.5 text-white/90 hover:text-[#C5A45B] hover:bg-black/20 rounded transition-colors"
            title={`${t.listenRecitation} (${pageMeta.surah.name_simple})`}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Zoom controls */}
          <div className="hidden md:flex items-center bg-black/20 rounded border border-[#C5A45B]/30">
            <button
              onClick={() => setZoomLevel((z) => Math.max(80, z - 15))}
              className="p-1.5 text-white/80 hover:text-white"
              title={t.zoomOut}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] px-1 text-[#C5A45B] tabular-nums font-mono">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(180, z + 15))}
              className="p-1.5 text-white/80 hover:text-white"
              title={t.zoomIn}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded transition-colors ${
              isFullscreen
                ? 'bg-[#C5A45B] text-[#176B45]'
                : 'text-white/80 hover:text-white hover:bg-black/20'
            }`}
            title={isFullscreen ? t.exitZenMode : t.zenMode}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* PROMINENT BUTTON: « التفسير والترجمة – Tekki Wolof » (Demande 6) */}
          <button
            onClick={() => setIsBilingualView(!isBilingualView)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
              isBilingualView
                ? 'bg-[#C5A45B] text-[#176B45] ring-2 ring-white/50'
                : 'bg-white/20 hover:bg-white/30 text-white border border-[#C5A45B]/60'
            }`}
            title="Basculer entre le Mushaf Madina calligraphique et la lecture bilingue Arabe & Wolof"
          >
            <Languages className="w-3.5 h-3.5 text-[#C5A45B] fill-current" />
            <span className="font-arabic font-bold text-sm">التفسير والترجمة</span>
            <span className="hidden sm:inline font-sans">– Tekki Wolof</span>
            {isBilingualView && <Check className="w-3.5 h-3.5 ml-0.5 text-[#176B45]" />}
          </button>

          {/* Tafsir Drawer Toggle */}
          <button
            onClick={() => setShowTafsirDrawer(!showTafsirDrawer)}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1 ${
              showTafsirDrawer
                ? 'bg-[#C5A45B] text-[#176B45]'
                : 'bg-white/10 hover:bg-white/20 text-[#F8F5EA]'
            }`}
            title="Ouvrir le panneau rétractable des versets et Tafsir"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Panneau Tafsir</span>
            {showTafsirDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* ================= MAIN MUSHAF DISPLAY AREA ================= */}
      <div
        className="relative w-full flex items-center justify-center min-h-[550px] sm:min-h-[700px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Invisible tap zones for turning pages */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/6 z-20 cursor-w-resize"
          onClick={(e) => {
            e.stopPropagation();
            goToPrevPage();
          }}
          title="Cliquer pour page précédente"
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1/6 z-20 cursor-e-resize"
          onClick={(e) => {
            e.stopPropagation();
            goToNextPage();
          }}
          title="Cliquer pour page suivante"
        />

        {/* Previous Page Button (Left) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevPage();
          }}
          disabled={page <= 1}
          className={`absolute left-0 sm:-left-3 z-30 p-2 sm:p-3 rounded-full bg-[#176B45] text-white shadow-lg border border-[#C5A45B]/50 hover:bg-[#1f8054] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
            isUiHidden ? 'opacity-15 hover:opacity-90' : 'opacity-100'
          }`}
          title={`${t.prevPage} (Page ${page - 1})`}
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Mushaf Book Frame with Ornate Golden Border & Spine */}
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className={`relative w-full max-w-2xl rounded-2xl p-3 sm:p-6 mushaf-shadow transition-all duration-300 ${getThemeWrapperClass()}`}
          onClick={() => {
            if (isFullscreen || autoHideUI) {
              setIsUiHidden(!isUiHidden);
            }
          }}
        >
          {/* Inner Golden Ornate Border */}
          <div className="relative w-full rounded-xl border-2 border-[#C5A45B]/60 p-2.5 sm:p-4 bg-inherit">
            {/* Top Page Header inside Border */}
            <div className="flex items-center justify-between border-b border-[#C5A45B]/40 pb-2 mb-3 text-xs sm:text-sm font-semibold text-[#176B45] dark:text-[#C5A45B]">
              <span className="font-arabic tracking-wide">{pageMeta.surah.name_arabic}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-normal text-muted-foreground">
                  {t.juz} {pageMeta.juz.juz_number}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A45B]"></span>
                <span className="font-arabic font-bold text-sm">
                  {toArabicNumerals(page)} ({page})
                </span>
              </div>
            </div>

            {/* Page Content: Either Mode Bilingue Arabe-Wolof OR High-Resolution Scanned Madinah Page */}
            {isBilingualView ? (
              <div className="w-full py-2 space-y-4 animate-in fade-in duration-300">
                {/* Bilingual Page Controls Sub-bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[#C5A45B]/30 text-xs">
                  {/* Toggle show / hide Wolof translation */}
                  <button
                    onClick={() => setShowWolofTranslation(!showWolofTranslation)}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                      showWolofTranslation
                        ? 'bg-[#176B45] text-white shadow-xs'
                        : 'bg-black/10 dark:bg-white/10 text-muted-foreground'
                    }`}
                    title={showWolofTranslation ? t.hideWolofTranslation : t.showWolofTranslation}
                  >
                    {showWolofTranslation ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{showWolofTranslation ? t.hideWolofTranslation : t.showWolofTranslation}</span>
                  </button>

                  {/* Arabic Font Size Controls */}
                  <div className="flex items-center gap-1 bg-black/10 dark:bg-white/10 px-2 py-1 rounded-lg">
                    <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
                      <Type className="w-3 h-3" />
                      <span>{t.fontSize}:</span>
                    </span>
                    <button
                      onClick={() => setArabicFontSize((s) => Math.max(18, s - 2))}
                      className="w-6 h-6 rounded bg-white dark:bg-black/30 text-xs font-bold flex items-center justify-center hover:bg-[#C5A45B] hover:text-[#176B45] transition-colors"
                      title={t.decreaseText}
                    >
                      A-
                    </button>
                    <span className="text-xs font-mono font-bold text-[#176B45] dark:text-[#C5A45B] px-1">
                      {arabicFontSize}px
                    </span>
                    <button
                      onClick={() => setArabicFontSize((s) => Math.min(42, s + 2))}
                      className="w-6 h-6 rounded bg-white dark:bg-black/30 text-xs font-bold flex items-center justify-center hover:bg-[#C5A45B] hover:text-[#176B45] transition-colors"
                      title={t.increaseText}
                    >
                      A+
                    </button>
                  </div>

                  {/* Page Translation Status Badge */}
                  <div className="text-[11px] font-semibold">
                    {pageVerses.length > 0 && pageVerses.every((v) => v.translation_wolof && v.validation_status !== 'missing' && v.validation_status !== 'pending') ? (
                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center gap-1 font-bold">
                        <Check className="w-3 h-3" />
                        <span>Xët mu mat (100% Wolof)</span>
                      </span>
                    ) : pageVerses.some((v) => v.translation_wolof) ? (
                      <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-lg flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Partielle ({pageVerses.filter((v) => v.translation_wolof).length}/{pageVerses.length} traduits)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                        ○ En attente de traduction
                      </span>
                    )}
                  </div>
                </div>

                {/* Loading indicator if online fetch is in progress */}
                {loadingPageVerses && (
                  <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#176B45] border-t-transparent rounded-full animate-spin"></div>
                    <span>Chargement des versets de la page {page}...</span>
                  </div>
                )}

                {/* All Verses on this Page in Exact Sequential Order */}
                {pageVerses.length > 0 ? (
                  <div className="space-y-6">
                    {pageVerses.map((v, idx) => {
                      const surah = getSurahById(v.surah_id) || pageMeta.surah;
                      const isFirstInSurah = v.ayah_number === 1;
                      const isPageFirstVerse = idx === 0;

                      return (
                        <div
                          key={v.id}
                          className="p-4 sm:p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#C5A45B]/30 hover:border-[#176B45] transition-all"
                        >
                          {/* Surah Header Banner if first verse of a Surah on this page */}
                          {(isFirstInSurah || (isPageFirstVerse && v.ayah_number === 1)) && (
                            <div className="mb-4 p-3 bg-[#176B45] text-white rounded-xl text-center border border-[#C5A45B]/40 shadow-xs">
                              <span className="font-arabic text-xl sm:text-2xl font-bold block mb-0.5">
                                سُورَةُ {surah.name_arabic}
                              </span>
                              <p className="text-xs text-[#C5A45B] font-bold">
                                Saar {surah.name_wolof} · {surah.name_simple} · {surah.verses_count} {t.verses}
                              </p>
                              {surah.id !== 9 && (
                                <p className="font-arabic text-lg sm:text-xl font-semibold mt-2 pt-2 border-t border-[#C5A45B]/30 text-[#F8F5EA]">
                                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                </p>
                              )}
                            </div>
                          )}

                          {/* Top Ayah Meta & Action Line */}
                          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-[#176B45] text-white flex items-center justify-center font-bold text-xs font-mono">
                                {v.ayah_number}
                              </span>
                              <span className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B]">
                                {surah.name_simple} ({v.id})
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Listen Ayah Audio */}
                              <button
                                onClick={() =>
                                  onPlayAudio({
                                    title: `${surah.name_simple} : Ayah ${v.ayah_number}`,
                                    audioUrl: getAyahAudioUrl(v.surah_id, v.ayah_number, selectedReciter),
                                    surahId: v.surah_id,
                                    ayahNumber: v.ayah_number,
                                  })
                                }
                                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#176B45] rounded transition-colors text-xs flex items-center gap-1"
                                title={t.listenRecitation}
                              >
                                <Volume2 className="w-3.5 h-3.5 text-[#176B45]" />
                              </button>
                            </div>
                          </div>

                          {/* Arabic Uthmani Text */}
                          <p
                            className="font-quran text-right leading-[2.4] text-[#176B45] dark:text-[#C5A45B] mb-3 select-text"
                            style={{ fontSize: `${arabicFontSize}px` }}
                            dir="rtl"
                          >
                            {v.text_uthmani}
                            <span className="inline-flex items-center justify-center w-8 h-8 mx-2 text-xs font-bold text-[#176B45] dark:text-[#C5A45B] border border-[#C5A45B] rounded-full shadow-xs bg-[#C5A45B]/10">
                              {toArabicNumerals(v.ayah_number)}
                            </span>
                          </p>

                          {/* Wolof Translation Box (Sous chaque verset) */}
                          {showWolofTranslation && (
                            <div className="mt-3 bg-[#176B45]/5 dark:bg-white/5 rounded-xl p-3.5 border-l-4 border-[#C5A45B]">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold text-[#176B45] dark:text-[#C5A45B] uppercase tracking-wider">
                                  Tekki ci Wolof:
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  v.translation_wolof
                                    ? v.validation_status === 'pending'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {v.translation_wolof
                                    ? v.validation_status === 'pending'
                                      ? '⏳ En attente de validation'
                                      : '✓ Validé'
                                    : '○ Non traduit'}
                                </span>
                              </div>

                              {v.translation_wolof ? (
                                <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed font-sans">
                                  {v.translation_wolof}
                                </p>
                              ) : (
                                <p className="text-sm italic text-amber-800/90 dark:text-amber-300/90 font-sans">
                                  {t.wolofUnavailable}
                                </p>
                              )}

                              {/* Source label */}
                              {v.source && (
                                <p className="text-[10px] text-muted-foreground mt-1.5 italic">
                                  Source : {v.source}
                                </p>
                              )}

                              {/* Wolof Tafsir if available */}
                              {v.tafsir_wolof && (
                                <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5">
                                  <button
                                    onClick={() => setExpandedTafsirId(expandedTafsirId === v.id ? null : v.id)}
                                    className="text-xs font-semibold text-[#176B45] dark:text-[#C5A45B] hover:underline flex items-center gap-1"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>{expandedTafsirId === v.id ? t.hideTafsir : t.showTafsir}</span>
                                    {expandedTafsirId === v.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>

                                  {expandedTafsirId === v.id && (
                                    <div className="mt-2 p-3 bg-[#F8F5EA] dark:bg-black/30 rounded-xl border border-[#C5A45B]/30 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed animate-in fade-in">
                                      {v.tafsir_wolof}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto text-[#C5A45B] mb-2 opacity-60" />
                    <p className="text-sm font-medium">Page {page} - {pageMeta.surah.name_simple}</p>
                    <p className="text-xs mt-1">
                      Connexion au corpus des 604 pages en cours...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Mode Calligraphique Scanné Authentique Madinah */
              <div className="relative min-h-[500px] sm:min-h-[660px] flex flex-col items-center justify-center overflow-hidden rounded-lg">
                {imageLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-black/40 z-10 backdrop-blur-[1px]">
                    <div className="w-10 h-10 border-3 border-[#176B45] border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-2 text-xs text-[#176B45] font-medium font-arabic">
                      جاري تحميل الصفحة {page}...
                    </span>
                  </div>
                )}

                {/* Scanned Madinah Mushaf Page Image */}
                <img
                  src={currentImageUrl}
                  alt={`Mushaf Page ${page} - Sourate ${pageMeta.surah.name_simple}`}
                  referrerPolicy="no-referrer"
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    if (imageErrorIndex < pageImageUrls.length - 1) {
                      setImageErrorIndex((prev) => prev + 1);
                    } else {
                      setImageLoading(false);
                    }
                  }}
                  className={`w-full h-auto max-h-[750px] object-contain rounded transition-opacity duration-300 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  } ${theme === 'dark' ? 'invert contrast-125 brightness-90 hue-rotate-180' : ''}`}
                />

                {/* Fallback in case of image failure */}
                {imageErrorIndex >= pageImageUrls.length - 1 && !imageLoading && (
                  <div className="w-full py-6 px-4 text-center">
                    <button
                      onClick={() => setIsBilingualView(true)}
                      className="px-4 py-2 bg-[#176B45] hover:bg-[#1f8054] text-white text-xs font-bold rounded-lg shadow"
                    >
                      Basculer en mode lecture Arabe & Wolof
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Page Footer inside Border */}
            <div className="flex items-center justify-between border-t border-[#C5A45B]/40 pt-2 mt-3 text-xs text-muted-foreground">
              <span className="font-arabic">{pageMeta.juz.name_arabic}</span>
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <span className="font-bold text-[#176B45] dark:text-[#C5A45B]">{page}</span>
                <span>/ 604</span>
              </div>
              <span>{pageMeta.surah.name_simple}</span>
            </div>
          </div>
        </div>

        {/* Next Page Button (Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNextPage();
          }}
          disabled={page >= 604}
          className={`absolute right-0 sm:-right-3 z-30 p-2 sm:p-3 rounded-full bg-[#176B45] text-white shadow-lg border border-[#C5A45B]/50 hover:bg-[#1f8054] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
            isUiHidden ? 'opacity-15 hover:opacity-90' : 'opacity-100'
          }`}
          title={`${t.nextPage} (Page ${page + 1})`}
          aria-label="Next Page"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* ================= FAST PAGE JUMP SLIDER & SIGNET QUICK ACTION ================= */}
      <div
        className={`w-full max-w-2xl mt-4 bg-white/80 dark:bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-[#C5A45B]/30 shadow-sm flex flex-col sm:flex-row items-center gap-3 transition-all duration-500 ${
          isUiHidden
            ? 'opacity-0 translate-y-6 pointer-events-none'
            : 'opacity-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="page-input" className="text-xs font-semibold text-[#176B45] dark:text-[#C5A45B] whitespace-nowrap">
            {t.page}:
          </label>
          <input
            id="page-input"
            type="number"
            min={1}
            max={604}
            value={sliderValue}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                setSliderValue(val);
                if (val >= 1 && val <= 604) setPage(val);
              }
            }}
            className="w-16 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-[#202020] rounded border border-[#C5A45B]/50 outline-none"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">/ 604</span>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={1}
          max={604}
          value={page}
          onChange={(e) => {
            const p = parseInt(e.target.value, 10);
            setPage(p);
            setSliderValue(p);
          }}
          className="flex-1 w-full h-2 bg-[#C5A45B]/30 rounded-lg appearance-none cursor-pointer accent-[#176B45]"
          title="Faire glisser pour changer de page"
        />

        {/* Secondary quick bookmark button */}
        <button
          onClick={openBookmarkModal}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
            bookmarked
              ? 'bg-[#C5A45B]/20 text-[#176B45] dark:text-[#C5A45B] border border-[#C5A45B]'
              : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 text-slate-700 dark:text-slate-200'
          }`}
          title="Gérer le signet de cette page"
        >
          <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-[#C5A45B] text-[#C5A45B]' : ''}`} />
          <span>{bookmarked ? 'Signet enregistré' : 'Ajouter aux signets'}</span>
        </button>
      </div>

      {/* ================= MODAL AJOUTER AUX SIGNETS (Demande 1) ================= */}
      {isBookmarkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsBookmarkModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border-2 border-[#C5A45B] max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#C5A45B] fill-[#C5A45B]" />
                <h3 className="font-bold text-base text-[#176B45] dark:text-[#C5A45B]">
                  {bookmarked ? 'Signet de la page' : 'Ajouter aux signets'}
                </h3>
              </div>
              <button
                onClick={() => setIsBookmarkModalOpen(false)}
                className="text-slate-400 hover:text-black dark:hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Page Info */}
            <div className="bg-[#176B45]/10 dark:bg-white/5 rounded-xl p-3 border border-[#C5A45B]/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#176B45] dark:text-[#C5A45B]">
                  Page {page} / 604
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sourate {pageMeta.surah.name_simple} ({pageMeta.surah.name_arabic}) · Juz {pageMeta.juz.juz_number}
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-[#C5A45B] text-[#176B45] px-2 py-1 rounded">
                Xët {page}
              </span>
            </div>

            {/* Note input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#176B45] dark:text-[#C5A45B]" />
                <span>Note personnelle (facultatif):</span>
              </label>
              <textarea
                rows={2}
                value={bookmarkNote}
                onChange={(e) => setBookmarkNote(e.target.value)}
                placeholder="Ex: J'en suis arrêté ici, verset à méditer, lecture du vendredi..."
                className="w-full bg-[#F8F5EA] dark:bg-[#222] border border-[#C5A45B]/40 rounded-xl p-2.5 text-xs sm:text-sm outline-none focus:border-[#176B45]"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-[#176B45] dark:text-[#C5A45B]" />
                <span>Catégorie:</span>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'general', label: 'Général' },
                  { id: 'meditation', label: 'Méditation' },
                  { id: 'doua', label: 'Doua / Ñaan' },
                  { id: 'revision', label: 'Révision' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setBookmarkCategory(c.id as any)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      bookmarkCategory === c.id
                        ? 'bg-[#176B45] text-white font-bold border-[#176B45]'
                        : 'bg-black/5 dark:bg-white/5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
              {bookmarked ? (
                <button
                  onClick={handleRemoveBookmark}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                >
                  Supprimer le signet
                </button>
              ) : (
                <button
                  onClick={() => setIsBookmarkModalOpen(false)}
                  className="px-3 py-2 text-xs text-muted-foreground hover:text-black dark:hover:text-white"
                >
                  Annuler
                </button>
              )}

              <button
                onClick={handleSaveBookmark}
                className="px-5 py-2.5 bg-[#176B45] hover:bg-[#1f8054] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow flex items-center gap-1.5"
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>{bookmarked ? 'Mettre à jour le signet' : 'Enregistrer dans la base'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAFSIR WOLOF & VERSETS DE LA PAGE ================= */}
      {showTafsirDrawer && (
        <div
          className={`w-full max-w-2xl mt-4 bg-[#F8F5EA] dark:bg-[#1E1E1E] rounded-xl p-4 sm:p-6 border-2 border-[#C5A45B] shadow-xl text-left animate-in fade-in duration-200 transition-all duration-500 ${
            isUiHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[#C5A45B]/40 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C5A45B]" />
              <h3 className="font-bold text-base text-[#176B45] dark:text-[#C5A45B]">
                Versets & Tafsiir – Xët {page} ({pageMeta.surah.name_simple})
              </h3>
            </div>
            <button
              onClick={() => setShowTafsirDrawer(false)}
              className="text-xs text-muted-foreground hover:text-black dark:hover:text-white"
            >
              Fermer ✕
            </button>
          </div>

          {pageVerses.length > 0 ? (
            <div className="space-y-6">
              {pageVerses.map((v) => (
                <div
                  key={v.id}
                  className="bg-white/80 dark:bg-black/30 rounded-lg p-4 border border-[#C5A45B]/30 shadow-sm"
                >
                  {/* Ayah Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#176B45] bg-[#C5A45B]/20 px-2 py-0.5 rounded">
                      Ayat {v.ayah_number} – Sourate {pageMeta.surah.name_simple}
                    </span>
                    <button
                      onClick={() =>
                        onPlayAudio({
                          title: `${pageMeta.surah.name_simple} : Ayah ${v.ayah_number}`,
                          audioUrl: getAyahAudioUrl(v.surah_id, v.ayah_number, selectedReciter),
                          surahId: v.surah_id,
                          ayahNumber: v.ayah_number,
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs text-[#176B45] hover:text-[#C5A45B] transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{t.listenRecitation}</span>
                    </button>
                  </div>

                  {/* Arabic Text */}
                  <p className="font-quran text-xl sm:text-2xl text-right leading-loose text-[#176B45] dark:text-[#C5A45B] mb-3" dir="rtl">
                    {v.text_uthmani}
                  </p>

                  {/* 1. WOLOF LANGUAGE: Show ONLY Wolof */}
                  {language === 'wo' && (
                    <>
                      <div className="bg-[#176B45]/5 dark:bg-white/5 p-3 rounded border-l-3 border-[#C5A45B] mb-3">
                        <p className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B] uppercase tracking-wider mb-1">
                          Tekki ci Wolof:
                        </p>
                        {v.translation_wolof ? (
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                            {v.translation_wolof}
                          </p>
                        ) : (
                          <p className="text-sm italic text-amber-800/80 dark:text-amber-300/80">
                            {t.wolofUnavailable}
                          </p>
                        )}
                      </div>

                      {/* Wolof Tafsir if available */}
                      {v.tafsir_wolof && (
                        <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-[#F8F5EA] dark:bg-black/20 p-3 rounded">
                          {v.tafsir_wolof}
                        </div>
                      )}
                    </>
                  )}

                  {/* 2. FRENCH LANGUAGE: Show ONLY French */}
                  {language === 'fr' && (
                    <div className="bg-[#176B45]/5 dark:bg-white/5 p-3 rounded border-l-3 border-[#176B45] mb-3">
                      <p className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B] uppercase tracking-wider mb-1">
                        Traduction française:
                      </p>
                      {v.translation_french ? (
                        <p className="text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                          « {v.translation_french} »
                        </p>
                      ) : (
                        <p className="text-sm italic text-slate-500">
                          {t.translationUnavailable}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 3. ENGLISH LANGUAGE: Show ONLY English */}
                  {language === 'en' && (
                    <div className="bg-[#176B45]/5 dark:bg-white/5 p-3 rounded border-l-3 border-[#176B45] mb-3">
                      <p className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B] uppercase tracking-wider mb-1">
                        English Translation:
                      </p>
                      {v.translation_english ? (
                        <p className="text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                          "{v.translation_english}"
                        </p>
                      ) : (
                        <p className="text-sm italic text-slate-500">
                          {t.translationUnavailable}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 4. ARABIC LANGUAGE: Pure Arabic only */}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              <Info className="w-8 h-8 mx-auto text-[#C5A45B] mb-2" />
              <p className="text-sm font-medium">
                Chargement des versets de la page {page}...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
