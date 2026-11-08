import React from 'react';
import { X, Moon, Sun, Volume2, Type, Globe, Check } from 'lucide-react';
import { AppLanguage, ThemeMode, ReciterId } from '../types/quran';
import { getTranslation } from '../data/translations';
import { RECITERS } from '../services/quranService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  selectedReciter: ReciterId;
  onReciterChange: (reciter: ReciterId) => void;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  onFontSizeChange: (size: 'sm' | 'md' | 'lg' | 'xl') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  selectedReciter,
  onReciterChange,
  fontSize,
  onFontSizeChange,
}) => {
  const t = getTranslation(language);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-3xl max-w-lg w-full p-6 border-2 border-[#C5A45B]/60 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-[#176B45] dark:text-[#C5A45B] flex items-center gap-2">
            <span>{t.settings}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Theme Selection */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2.5">
            {t.readingMode}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'parchment', label: t.parchmentMode, bg: 'bg-[#F8F5EA] text-[#202020]' },
              { id: 'dark', label: t.nightMode, bg: 'bg-[#181818] text-[#F8F5EA]' },
              { id: 'sepia', label: t.sepiaMode, bg: 'bg-[#F4EBD9] text-[#2C2416]' },
              { id: 'emerald', label: t.emeraldMode, bg: 'bg-[#0E3A24] text-[#F8F5EA]' },
            ].map((th) => (
              <button
                key={th.id}
                onClick={() => onThemeChange(th.id as ThemeMode)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${th.bg} ${
                  theme === th.id
                    ? 'border-[#C5A45B] ring-2 ring-[#C5A45B]'
                    : 'border-slate-200 dark:border-slate-700 opacity-80'
                }`}
              >
                <span>{th.label}</span>
                {theme === th.id && <Check className="w-3.5 h-3.5 text-[#C5A45B]" />}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Language Selection */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Langue de l'application (Làmmiñ)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'wo', label: 'Wolof (Senegaal)' },
              { id: 'fr', label: 'Français' },
              { id: 'ar', label: 'العربية' },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => onLanguageChange(l.id as AppLanguage)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  language === l.id
                    ? 'bg-[#176B45] text-white border-[#176B45]'
                    : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Reciter Selection */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-[#176B45] dark:text-[#C5A45B]" />
            <span>{t.reciter}</span>
          </label>
          <div className="space-y-2">
            {RECITERS.map((r) => (
              <button
                key={r.id}
                onClick={() => onReciterChange(r.id)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                  selectedReciter === r.id
                    ? 'bg-[#176B45]/10 dark:bg-[#C5A45B]/15 border-[#176B45] dark:border-[#C5A45B] font-bold text-[#176B45] dark:text-[#C5A45B]'
                    : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <span className="font-semibold block">{r.name_french}</span>
                  <span className="font-arabic text-muted-foreground">{r.name_arabic}</span>
                </div>
                {selectedReciter === r.id && <Check className="w-4 h-4 text-[#176B45] dark:text-[#C5A45B]" />}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Font Size Controls */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2 flex items-center gap-1.5">
            <Type className="w-4 h-4 text-[#176B45] dark:text-[#C5A45B]" />
            <span>{t.fontSize}</span>
          </label>
          <div className="grid grid-cols-4 gap-2 text-xs font-medium">
            {[
              { id: 'sm', label: 'Petit' },
              { id: 'md', label: 'Moyen' },
              { id: 'lg', label: 'Grand' },
              { id: 'xl', label: 'Très grand' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => onFontSizeChange(f.id as any)}
                className={`py-2 rounded-xl border transition-all ${
                  fontSize === f.id
                    ? 'bg-[#176B45] text-white border-[#176B45] font-bold'
                    : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-[#176B45] hover:bg-[#1f8054] text-white font-bold text-sm rounded-xl transition-all shadow"
        >
          Valider mes choix
        </button>
      </div>
    </div>
  );
};
