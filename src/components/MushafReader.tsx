import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Bookmark,
  BookOpen,
  Volume2,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Compass,
} from 'lucide-react';
import { AppLanguage, ThemeMode, ReciterId } from '../types/quran';
import { getTranslation } from '../data/translations';
import {
  getPageMetadata,
  getMushafPageImageUrl,
  getVersesForPage,
  isPageBookmarked,
  addBookmark,
  removeBookmark,
  getBookmarks,
  saveReadingProgress,
  getAyahAudioUrl,
  getSurahAudioUrl,
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);

  const pageMeta = getPageMetadata(page);
  const versesOnPage = getVersesForPage(page);
  const pageImageUrls = getMushafPageImageUrl(page);

  // Sync bookmark state and reading progress
  useEffect(() => {
    setBookmarked(isPageBookmarked(page));
    saveReadingProgress(page, pageMeta.surah.id);
    setSliderValue(page);
    setImageErrorIndex(0);
    setImageLoading(true);
    if (onPageChange) onPageChange(page);
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
      // Don't auto-hide if Tafsir drawer is open
      if (showTafsirDrawer) return;

      inactivityTimerRef.current = setTimeout(() => {
        setIsUiHidden(true);
      }, 3500); // Hide after 3.5 seconds of quiet reading
    }
  }, [isFullscreen, autoHideUI, isUiHidden, showTafsirDrawer]);

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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, isFullscreen]);

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

  const toggleBookmark = () => {
    if (bookmarked) {
      const all = getBookmarks();
      const target = all.find((b) => b.type === 'page' && b.page_number === page);
      if (target) removeBookmark(target.id);
      setBookmarked(false);
    } else {
      addBookmark({
        type: 'page',
        page_number: page,
        surah_id: pageMeta.surah.id,
        title: `${pageMeta.surah.name_simple} (${pageMeta.surah.name_arabic})`,
        preview_text: `Xët ${page} · Juz ${pageMeta.juz.juz_number} · ${pageMeta.surah.name_wolof}`,
        category: 'general',
      });
      setBookmarked(true);
    }
  };

  const toggleFullscreen = () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);
    setAutoHideUI(nextState); // Automatically enable auto-hide in fullscreen mode
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
      onClick={(e) => {
        // Clicking directly on the background or page toggles UI visibility
        if (isFullscreen || autoHideUI) {
          setIsUiHidden(!isUiHidden);
        }
      }}
    >
      {/* ================= FLOATING ZEN MODE DISCRETE HINT PILL ================= */}
      {(isFullscreen || autoHideUI) && (
        <div
          className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 text-white/90 text-xs backdrop-blur-md border border-[#C5A45B]/40 shadow-xl ${
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

        {/* Right: Actions (Immersion Toggle, Audio, Bookmark, Zoom, Fullscreen, Tafsir) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
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

          {/* Bookmark */}
          <button
            onClick={toggleBookmark}
            className={`p-1.5 rounded transition-colors ${
              bookmarked
                ? 'text-[#C5A45B] bg-black/30'
                : 'text-white/80 hover:text-[#C5A45B] hover:bg-black/20'
            }`}
            title={bookmarked ? t.bookmarked : t.bookmarkPage}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-[#C5A45B]' : ''}`} />
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

          {/* Fullscreen Button with auto-hide */}
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

          {/* Tafsir Drawer Toggle */}
          <button
            onClick={() => setShowTafsirDrawer(!showTafsirDrawer)}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1 ${
              showTafsirDrawer
                ? 'bg-[#C5A45B] text-[#176B45]'
                : 'bg-white/10 hover:bg-white/20 text-[#F8F5EA]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tafsir Wolof</span>
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
        {/* Invisible tap zones for turning pages without clicking buttons */}
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
          onClick={(e) => {
            // Tapping on the frame resets timer or toggles UI
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

            {/* Page Content: High-Resolution Authentic Madinah Mushaf Page */}
            <div className="relative min-h-[500px] sm:min-h-[660px] flex flex-col items-center justify-center overflow-hidden rounded-lg">
              {/* Spinner while image is fetching */}
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

              {/* Offline / Typographic Canvas Fallback if image network fails */}
              {imageErrorIndex >= pageImageUrls.length - 1 && !imageLoading && (
                <div className="w-full py-6 px-4 text-center">
                  <div className="p-3 bg-[#176B45]/10 rounded-lg border border-[#C5A45B]/40 mb-4">
                    <p className="font-arabic text-xl text-[#176B45] font-bold">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </p>
                    <p className="text-xs text-[#C5A45B] mt-1">
                      {pageMeta.surah.name_simple} · {pageMeta.surah.name_wolof}
                    </p>
                  </div>

                  {versesOnPage.length > 0 ? (
                    <div className="space-y-4 text-right" dir="rtl">
                      {versesOnPage.map((v) => (
                        <div
                          key={v.id}
                          className="p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-transparent hover:border-[#C5A45B]/40 transition-colors"
                        >
                          <p className="font-quran text-xl sm:text-2xl leading-loose text-justify text-[#202020] dark:text-[#F8F5EA]">
                            {v.text_uthmani}
                            <span className="inline-flex items-center justify-center w-7 h-7 mx-2 text-xs font-bold text-[#176B45] dark:text-[#C5A45B] border border-[#C5A45B] rounded-full">
                              {toArabicNumerals(v.ayah_number)}
                            </span>
                          </p>
                          <p className="text-left text-xs font-sans text-muted-foreground mt-2" dir="ltr">
                            <span className="font-semibold text-[#176B45]">{v.id}</span>: {v.translation_wolof}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <BookOpen className="w-10 h-10 mx-auto text-[#C5A45B] mb-2 opacity-60" />
                      <p className="text-sm font-medium">Page {page} - {pageMeta.surah.name_simple}</p>
                      <p className="text-xs mt-1">
                        Utilisez le visualiseur ou connectez-vous pour précharger les 604 pages en haute définition.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

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

      {/* ================= FAST PAGE JUMP SLIDER & INPUT ================= */}
      <div
        className={`w-full max-w-2xl mt-4 bg-white/70 dark:bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-[#C5A45B]/30 shadow-sm flex flex-col sm:flex-row items-center gap-3 transition-all duration-500 ${
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

        <div className="text-[11px] text-[#176B45] dark:text-[#C5A45B] font-semibold whitespace-nowrap">
          {pageMeta.surah.name_simple} (Juz {pageMeta.juz.juz_number})
        </div>
      </div>

      {/* ================= TAFSIR WOLOF DRAWER / ACCORDION ================= */}
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
                Tafsiir ci Wolof – Xët {page} ({pageMeta.surah.name_simple})
              </h3>
            </div>
            <button
              onClick={() => setShowTafsirDrawer(false)}
              className="text-xs text-muted-foreground hover:text-black dark:hover:text-white"
            >
              Fermer ✕
            </button>
          </div>

          {versesOnPage.length > 0 ? (
            <div className="space-y-6">
              {versesOnPage.map((v) => (
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

                  {/* Wolof Translation */}
                  <div className="bg-[#176B45]/5 dark:bg-white/5 p-3 rounded border-l-3 border-[#C5A45B] mb-3">
                    <p className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B] uppercase tracking-wider mb-1">
                      Tekki ci Wolof:
                    </p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {v.translation_wolof}
                    </p>
                  </div>

                  {/* Wolof Tafsir */}
                  {v.tafsir_wolof && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-[#F8F5EA] dark:bg-black/20 p-3 rounded">
                      {v.tafsir_wolof}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              <Info className="w-8 h-8 mx-auto text-[#C5A45B] mb-2" />
              <p className="text-sm font-medium">
                Tafsir wolof pour cette page disponible dans la section Tafsir.
              </p>
              <p className="text-xs mt-1">
                Vous pouvez également enrichir les traductions wolof dans l'espace Administration.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
