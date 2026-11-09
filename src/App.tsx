import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { MushafReader } from './components/MushafReader';
import { Fahrasat } from './components/Fahrasat';
import { AyatSearch } from './components/AyatSearch';
import { TafsirWolofView } from './components/TafsirWolofView';
import { FavoritesView } from './components/FavoritesView';
import { CoverageReportView } from './components/CoverageReportView';
import { AdminView } from './components/AdminView';
import { AudioBar } from './components/AudioBar';
import { SettingsModal } from './components/SettingsModal';
import { AppLanguage, ThemeMode, ReciterId } from './types/quran';
import { getReadingProgress, getPageMetadata } from './services/quranService';
import { getTranslation } from './data/translations';
import { BookOpen, Sparkles, Search, Compass, Heart } from 'lucide-react';

const bannerImage = '/src/assets/images/islamic_banner_ornament_1794117782705.jpg';
const coverImage = '/src/assets/images/mushaf_cover_gold_1794117781882.jpg';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('mushaf');
  const [language, setLanguage] = useState<AppLanguage>('wo');
  const [theme, setTheme] = useState<ThemeMode>('parchment');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [selectedReciter, setSelectedReciter] = useState<ReciterId>('alafasy');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Quran Page & Surah State
  const initialProgress = getReadingProgress();
  const [currentPage, setCurrentPage] = useState<number>(initialProgress.last_page || 1);
  const [currentSurahId, setCurrentSurahId] = useState<number>(initialProgress.last_surah_id || 1);
  const [isReaderFullscreen, setIsReaderFullscreen] = useState<boolean>(false);

  // Audio Player State
  const [currentTrack, setCurrentTrack] = useState<{
    title: string;
    audioUrl: string;
    surahId?: number;
    ayahNumber?: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Apply dark mode class to root HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleOpenPage = (page: number) => {
    setCurrentPage(page);
    setActiveTab('mushaf');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTafsir = (surahId: number) => {
    setCurrentSurahId(surahId);
    setActiveTab('tafsir');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayAudio = (track: {
    title: string;
    audioUrl: string;
    surahId?: number;
    ayahNumber?: number;
  }) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const t = getTranslation(language);
  const meta = getPageMetadata(currentPage);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'dark'
        ? 'bg-[#141414] text-[#E0E0E0]'
        : theme === 'sepia'
        ? 'bg-[#F4EBD9] text-[#2C2416]'
        : theme === 'emerald'
        ? 'bg-[#0B2E1C] text-[#F8F5EA]'
        : 'bg-[#F8F5EA] text-[#202020]'
    }`}>
      {/* Universal Top Bar (Hidden in Fullscreen Immersion Mode) */}
      {!isReaderFullscreen && (
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          language={language}
          onLanguageChange={setLanguage}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'parchment' : 'dark')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          lastReadPage={currentPage}
        />
      )}

      {/* Hero Welcome Ribbon (Hidden in Fullscreen Immersion Mode) */}
      {!isReaderFullscreen && activeTab === 'mushaf' && (
        <section className="relative w-full max-w-5xl mx-auto px-4 pt-3 pb-1">
          <div className="relative rounded-2xl overflow-hidden border border-[#C5A45B]/40 shadow-sm bg-[#176B45] text-[#F8F5EA]">
            {/* Background Decorative Scrim */}
            <img
              src={bannerImage}
              alt="Islamic arabesque ornament"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
            />
            <div className="relative z-10 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-[#C5A45B] tracking-wider uppercase font-sans">
                  {t.tagline}
                </p>
                <h1 className="text-sm sm:text-base font-bold font-arabic tracking-wide">
                  الْمُصْحَفُ الشَّرِيفُ – طَبْعَةُ المَدِينَةِ المُنَوَّرَةِ (٦٠٤ صَفْحَة)
                </h1>
              </div>

              {/* Fast Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('fahrasat')}
                  className="px-3 py-1 bg-black/25 hover:bg-black/40 text-xs font-semibold rounded-lg border border-[#C5A45B]/40 transition-colors flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-[#C5A45B]" />
                  <span>Index des 114 sourates</span>
                </button>
                <button
                  onClick={() => handleOpenTafsir(meta.surah.id)}
                  className="px-3 py-1 bg-[#C5A45B] hover:bg-[#d8b76c] text-[#176B45] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tafsir {meta.surah.name_simple}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area Routing */}
      <main className="flex-1 w-full">
        {activeTab === 'mushaf' && (
          <MushafReader
            initialPage={currentPage}
            language={language}
            theme={theme}
            onPageChange={setCurrentPage}
            onPlayAudio={handlePlayAudio}
            selectedReciter={selectedReciter}
            onToggleFullscreen={setIsReaderFullscreen}
          />
        )}

        {activeTab === 'fahrasat' && (
          <Fahrasat
            language={language}
            onOpenPage={handleOpenPage}
            onOpenTafsir={handleOpenTafsir}
          />
        )}

        {activeTab === 'search' && (
          <AyatSearch
            language={language}
            onOpenPage={handleOpenPage}
            onPlayAudio={handlePlayAudio}
            selectedReciter={selectedReciter}
          />
        )}

        {activeTab === 'tafsir' && (
          <TafsirWolofView
            language={language}
            currentSurahId={currentSurahId}
            onSelectSurah={setCurrentSurahId}
            onOpenMushafPage={handleOpenPage}
            onPlayAudio={handlePlayAudio}
            selectedReciter={selectedReciter}
          />
        )}

        {activeTab === 'coverage' && (
          <CoverageReportView
            language={language}
            onOpenPage={handleOpenPage}
            onOpenSurahTafsir={handleOpenTafsir}
            onOpenAdmin={() => setActiveTab('admin')}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesView
            language={language}
            onOpenPage={handleOpenPage}
            onOpenTafsir={handleOpenTafsir}
          />
        )}

        {activeTab === 'admin' && <AdminView />}
      </main>

      {/* Floating Bottom Audio Bar */}
      <AudioBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onClose={() => {
          setIsPlaying(false);
          setCurrentTrack(null);
        }}
        selectedReciter={selectedReciter}
        onSelectReciter={setSelectedReciter}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeChange={setTheme}
        selectedReciter={selectedReciter}
        onReciterChange={setSelectedReciter}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />
    </div>
  );
}
