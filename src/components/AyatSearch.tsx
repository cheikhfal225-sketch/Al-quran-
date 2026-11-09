import React, { useState } from 'react';
import { Search, BookOpen, Volume2, Bookmark, Check, Sparkles, Copy } from 'lucide-react';
import { AppLanguage, VerseData, ReciterId } from '../types/quran';
import { getTranslation } from '../data/translations';
import {
  searchAyat,
  getSurahById,
  getAyahAudioUrl,
  isAyahBookmarked,
  addBookmark,
  removeBookmark,
  getBookmarks,
} from '../services/quranService';

interface AyatSearchProps {
  language: AppLanguage;
  onOpenPage: (page: number) => void;
  onPlayAudio: (track: {
    title: string;
    audioUrl: string;
    surahId?: number;
    ayahNumber?: number;
  }) => void;
  selectedReciter: ReciterId;
}

export const AyatSearch: React.FC<AyatSearchProps> = ({
  language,
  onOpenPage,
  onPlayAudio,
  selectedReciter,
}) => {
  const t = getTranslation(language);
  const [query, setQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTafsirId, setExpandedTafsirId] = useState<string | null>(null);

  const results = searchAyat(query);

  const handleCopy = (verse: VerseData) => {
    let textToCopy = `${verse.text_uthmani}\n\nAyat ${verse.ayah_number} (${verse.id})`;
    if (language === 'wo') {
      textToCopy += `\nTekki ci Wolof:\n${verse.translation_wolof || t.wolofUnavailable}\n\n${verse.tafsir_wolof || ''}`;
    } else if (language === 'fr') {
      textToCopy += `\nTraduction française:\n${verse.translation_french || t.translationUnavailable}`;
    } else if (language === 'en') {
      textToCopy += `\nEnglish Translation:\n${verse.translation_english || t.translationUnavailable}`;
    }
    navigator.clipboard?.writeText(textToCopy.trim());
    setCopiedId(verse.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleBookmarkAyah = (verse: VerseData) => {
    const isBookmarked = isAyahBookmarked(verse.surah_id, verse.ayah_number);
    if (isBookmarked) {
      const all = getBookmarks();
      const target = all.find(
        (b) => b.type === 'ayah' && b.surah_id === verse.surah_id && b.ayah_number === verse.ayah_number
      );
      if (target) removeBookmark(target.id);
    } else {
      const surah = getSurahById(verse.surah_id);
      addBookmark({
        type: 'ayah',
        surah_id: verse.surah_id,
        ayah_number: verse.ayah_number,
        page_number: verse.page_number,
        title: `${surah?.name_simple || 'Sourate'} [${verse.id}]`,
        preview_text: verse.text_uthmani.slice(0, 70) + '...',
        category: 'meditation',
      });
    }
  };

  // Preset search chips to guide users
  const quickSearches = [
    { label: 'Aayatal Kursiyu (2:255)', q: '2:255' },
    { label: 'Al-Faatiha (1:1)', q: '1:1' },
    { label: 'Sellal gi (Al-Ikhlas)', q: '112:1' },
    { label: 'Yërmande (Miséricorde)', q: 'yërmande' },
    { label: 'Yàlla (Allah)', q: 'Yàlla' },
    { label: 'Guddi Daraja (97:1)', q: '97:1' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-arabic text-[#176B45] dark:text-[#C5A45B]">
          بَحْثُ الآيَاتِ الْقُرْآنِيَّةِ
        </h1>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
          {t.searchAyat} · Recherchez par référence (ex: 2:255), mot arabe ou wolof
        </p>
      </div>

      {/* Main Search Input */}
      <div className="relative w-full mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#176B45]" />
        <input
          type="text"
          placeholder="Entrez un verset (ex: 2:255) ou un mot: Yàlla, yërmande, الله, jullit..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-10 py-3 text-sm sm:text-base bg-white dark:bg-[#1f1f1f] border-2 border-[#C5A45B]/50 focus:border-[#176B45] rounded-2xl outline-none shadow-sm text-slate-900 dark:text-white"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-black dark:hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Preset Quick Suggestions (Functional filter tags) */}
      <div className="flex items-center gap-1.5 flex-wrap mb-6">
        <span className="text-xs text-muted-foreground mr-1">Exemples:</span>
        {quickSearches.map((item) => (
          <button
            key={item.q}
            onClick={() => setQuery(item.q)}
            className="px-2.5 py-1 text-xs bg-[#176B45]/10 hover:bg-[#176B45]/20 text-[#176B45] dark:bg-[#C5A45B]/15 dark:text-[#C5A45B] rounded-lg transition-colors border border-[#C5A45B]/30"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      {query.trim() && (
        <div className="mb-4 text-xs text-muted-foreground flex items-center justify-between">
          <span>{results.length} verset(s) trouvé(s) pour "{query}"</span>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-4">
        {results.map((verse) => {
          const surah = getSurahById(verse.surah_id);
          const isBookmarked = isAyahBookmarked(verse.surah_id, verse.ayah_number);
          const isTafsirExpanded = expandedTafsirId === verse.id;

          return (
            <div
              key={verse.id}
              className="bg-white/95 dark:bg-[#1a1a1a] rounded-2xl p-4 sm:p-5 border border-[#C5A45B]/50 shadow-sm hover:border-[#176B45] transition-all"
            >
              {/* Header: Surah & Ayah reference + Action icons */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#176B45] text-white text-xs font-bold font-mono">
                    {verse.id}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {surah?.name_simple} ({surah?.name_arabic})
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    · {surah?.name_wolof}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Play audio */}
                  <button
                    onClick={() =>
                      onPlayAudio({
                        title: `${surah?.name_simple} : Ayah ${verse.ayah_number}`,
                        audioUrl: getAyahAudioUrl(verse.surah_id, verse.ayah_number, selectedReciter),
                        surahId: verse.surah_id,
                        ayahNumber: verse.ayah_number,
                      })
                    }
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#176B45] rounded-lg transition-colors"
                    title={t.listenRecitation}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  {/* Copy */}
                  <button
                    onClick={() => handleCopy(verse)}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#176B45] rounded-lg transition-colors"
                    title="Copier le verset"
                  >
                    {copiedId === verse.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Bookmark Ayah */}
                  <button
                    onClick={() => toggleBookmarkAyah(verse)}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#C5A45B] rounded-lg transition-colors"
                    title="Marquer ce verset"
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#C5A45B] text-[#C5A45B]' : ''}`} />
                  </button>

                  {/* Jump directly to Mushaf Page */}
                  <button
                    onClick={() => onOpenPage(verse.page_number)}
                    className="px-2.5 py-1 bg-[#176B45] hover:bg-[#1f8054] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    title={`Aller à la page ${verse.page_number} du Mushaf`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Xët {verse.page_number}</span>
                  </button>
                </div>
              </div>

              {/* Arabic Uthmani Calligraphy */}
              <p
                className="font-quran text-xl sm:text-2xl text-right leading-loose text-[#176B45] dark:text-[#C5A45B] mb-3"
                dir="rtl"
              >
                {verse.text_uthmani}
              </p>

              {/* 1. WOLOF LANGUAGE: Show ONLY Wolof */}
              {language === 'wo' && (
                <div className="bg-[#176B45]/5 dark:bg-white/5 rounded-xl p-3 border-l-3 border-[#C5A45B] mb-2.5">
                  <p className="text-[11px] font-bold text-[#176B45] dark:text-[#C5A45B] uppercase tracking-wider mb-1">
                    Tekki ci Wolof:
                  </p>
                  {verse.translation_wolof ? (
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {verse.translation_wolof}
                    </p>
                  ) : (
                    <p className="text-sm italic text-amber-800/80 dark:text-amber-300/80">
                      {t.wolofUnavailable}
                    </p>
                  )}
                </div>
              )}

              {/* 2. FRENCH LANGUAGE: Show ONLY French */}
              {language === 'fr' && (
                <div className="bg-[#176B45]/5 dark:bg-white/5 rounded-xl p-3 border-l-3 border-[#176B45] mb-2.5">
                  <p className="text-[11px] font-bold text-[#176B45] dark:text-[#C5A45B] uppercase tracking-wider mb-1">
                    Traduction française:
                  </p>
                  {verse.translation_french ? (
                    <p className="text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                      « {verse.translation_french} »
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
                <div className="bg-[#176B45]/5 dark:bg-white/5 rounded-xl p-3 border-l-3 border-[#176B45] mb-2.5">
                  <p className="text-[11px] font-bold text-[#176B45] dark:text-[#C5A45B] uppercase tracking-wider mb-1">
                    English Translation:
                  </p>
                  {verse.translation_english ? (
                    <p className="text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                      "{verse.translation_english}"
                    </p>
                  ) : (
                    <p className="text-sm italic text-slate-500">
                      {t.translationUnavailable}
                    </p>
                  )}
                </div>
              )}

              {/* Expandable Wolof Tafsir */}
              {verse.tafsir_wolof && (
                <div>
                  <button
                    onClick={() =>
                      setExpandedTafsirId(isTafsirExpanded ? null : verse.id)
                    }
                    className="text-xs font-semibold text-[#176B45] dark:text-[#C5A45B] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isTafsirExpanded ? t.hideTafsir : t.showTafsir}</span>
                  </button>

                  {isTafsirExpanded && (
                    <div className="mt-2.5 p-3.5 bg-[#F8F5EA] dark:bg-black/30 rounded-xl border border-[#C5A45B]/30 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed animate-in fade-in">
                      {verse.tafsir_wolof}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {query.trim() && results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-white/50 dark:bg-black/20 rounded-2xl border border-dashed border-[#C5A45B]/40">
          <Search className="w-10 h-10 mx-auto text-[#C5A45B] mb-2 opacity-60" />
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Amul benn aayé bu mengoo ak sa gëstu.
          </p>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            Essayez avec des termes plus simples (ex: "Yàlla", "2:255", "112:1") ou consultez l'index des 114 sourates.
          </p>
        </div>
      )}
    </div>
  );
};
