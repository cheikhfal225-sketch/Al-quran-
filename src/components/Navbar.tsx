import React from 'react';
import {
  BookOpen,
  List,
  Search,
  BookMarked,
  Heart,
  Settings,
  ShieldCheck,
  Moon,
  Sun,
  Globe,
} from 'lucide-react';
import { AppLanguage, ThemeMode } from '../types/quran';
import { getTranslation } from '../data/translations';

export type NavTab = 'mushaf' | 'fahrasat' | 'search' | 'tafsir' | 'favorites' | 'admin';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  lastReadPage: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  language,
  onLanguageChange,
  theme,
  onToggleTheme,
  onOpenSettings,
  lastReadPage,
}) => {
  const t = getTranslation(language);

  const navLinks: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'mushaf', label: t.readMushaf, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'fahrasat', label: t.fahrasat, icon: <List className="w-4 h-4" /> },
    { id: 'search', label: t.searchAyat, icon: <Search className="w-4 h-4" /> },
    { id: 'tafsir', label: t.tafsirWolof, icon: <BookMarked className="w-4 h-4" /> },
    { id: 'favorites', label: t.favorites, icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Bar Contract (1 row, 3 zones, gap-8) */}
      <header className="sticky top-0 z-40 bg-[#176B45] text-[#F8F5EA] border-b border-[#C5A45B]/40 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (single text element) */}
          <button
            onClick={() => onSelectTab('mushaf')}
            className="text-left flex items-center gap-2 group whitespace-nowrap shrink-0 focus:outline-none"
          >
            <span className="font-title tracking-wider text-lg font-bold text-[#F8F5EA] group-hover:text-[#C5A45B] transition-colors">
              AL QUR’AAN
            </span>
            <span className="text-[#C5A45B] text-sm font-arabic font-semibold opacity-95">
              الْقُرْآنُ الْكَرِيمُ
            </span>
          </button>

          {/* Zone 2: 4-5 single-line clean text nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`relative py-1 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-[#C5A45B] font-semibold border-b-2 border-[#C5A45B]'
                      : 'text-[#F8F5EA]/90 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action + Utility Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Resume Button */}
            <button
              onClick={() => onSelectTab('mushaf')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#C5A45B] hover:bg-[#d4b56c] text-[#176B45] rounded-md transition-all shadow-sm whitespace-nowrap shrink-0"
              title={`${t.resumeReading} (Page ${lastReadPage})`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Xët {lastReadPage}</span>
            </button>

            {/* Language Switcher */}
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-[#C5A45B] mr-1 hidden sm:inline-block" />
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as AppLanguage)}
                className="bg-black/20 text-[#F8F5EA] text-xs font-medium rounded border border-[#C5A45B]/40 px-2 py-1 outline-none cursor-pointer"
                title="Langue"
              >
                <option value="wo" className="bg-[#176B45] text-white">Wolof</option>
                <option value="fr" className="bg-[#176B45] text-white">Français</option>
                <option value="ar" className="bg-[#176B45] text-white">العربية</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 text-[#F8F5EA] hover:text-[#C5A45B] hover:bg-black/20 rounded transition-colors"
              title={theme === 'dark' ? 'Mode clair' : 'Mode nuit'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#C5A45B]" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Admin link */}
            <button
              onClick={() => onSelectTab('admin')}
              className={`p-1.5 rounded transition-colors ${
                activeTab === 'admin'
                  ? 'text-[#C5A45B] bg-black/30'
                  : 'text-[#F8F5EA]/80 hover:text-white hover:bg-black/20'
              }`}
              title={t.admin}
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            {/* Settings dialog button */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-[#F8F5EA]/80 hover:text-white hover:bg-black/20 rounded transition-colors"
              title={t.settings}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile-First Bottom Tab Bar (Ergonomic thumb zone, height 60px <= 15% viewport) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#176B45] text-[#F8F5EA] border-t border-[#C5A45B]/40 shadow-lg pb-safe">
        <div className="grid grid-cols-5 items-center h-15">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] px-1 transition-colors ${
                  isActive ? 'text-[#C5A45B] font-semibold' : 'text-[#F8F5EA]/70 hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-white/10' : ''}`}>
                  {link.icon}
                </div>
                <span className="text-[10px] tracking-tight truncate max-w-[64px]">
                  {link.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
