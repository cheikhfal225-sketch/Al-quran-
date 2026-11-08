import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Sparkles,
  Share2,
  Copy,
  Check,
  Bookmark,
  ChevronDown,
  ChevronUp,
  LayoutList,
  Layers,
} from 'lucide-react';
import { SURAHS_LIST } from '../data/surahs';
import { AppLanguage, VerseData, ReciterId } from '../types/quran';
import { getTranslation } from '../data/translations';
import {
  getVersesForSurah,
  getSurahById,
  getAyahAudioUrl,
  isAyahBookmarked,
  addBookmark,
  removeBookmark,
  getBookmarks,
} from '../services/quranService';

interface TafsirWolofViewProps {
  language: AppLanguage;
  currentSurahId: number;
  onSelectSurah: (id: number) => void;
  onOpenMushafPage: (page: number) => void;
  onPlayAudio: (track: {
    title: string;
    audioUrl: string;
    surahId?: number;
    ayahNumber?: number;
  }) => void;
  selectedReciter: ReciterId;
}

export const TafsirWolofView: React.FC<TafsirWolofViewProps> = ({
  language,
  currentSurahId,
  onSelectSurah,
  onOpenMushafPage,
  onPlayAudio,
  selectedReciter,
}) => {
  const t = getTranslation(language);
  const [displayMode, setDisplayMode] = useState<'individual' | 'compiled'>('individual');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collapsedVerses, setCollapsedVerses] = useState<Record<string, boolean>>({});

  const surah = getSurahById(currentSurahId) || SURAHS_LIST[0];
  const verses = getVersesForSurah(surah.id);

  const toggleVerseTafsir = (id: string) => {
    setCollapsedVerses((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (verse: VerseData) => {
    const textToCopy = `${verse.text_uthmani}\n\nAyat ${verse.ayah_number} - ${surah.name_simple} (${surah.name_arabic})\nTekki ci Wolof:\n${verse.translation_wolof}\n\n${verse.tafsir_wolof || ''}`;
    navigator.clipboard?.writeText(textToCopy);
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
      addBookmark({
        type: 'ayah',
        surah_id: verse.surah_id,
        ayah_number: verse.ayah_number,
        page_number: verse.page_number,
        title: `${surah.name_simple} [${verse.id}]`,
        preview_text: verse.text_uthmani.slice(0, 70) + '...',
        category: 'meditation',
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Surah Selector & Display Mode Header */}
      <div className="bg-white/90 dark:bg-[#1a1a1a] rounded-2xl p-4 sm:p-6 border border-[#C5A45B]/40 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Surah Dropdown Picker */}
          <div className="w-full md:w-auto flex-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176B45] text-[#F8F5EA] flex items-center justify-center font-bold text-sm shadow">
              {surah.id}
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="surah-select" className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-0.5">
                Choisir une sourate:
              </label>
              <select
                id="surah-select"
                value={surah.id}
                onChange={(e) => onSelectSurah(parseInt(e.target.value, 10))}
                className="w-full bg-[#F8F5EA] dark:bg-[#252525] text-slate-900 dark:text-white font-semibold text-sm rounded-lg border border-[#C5A45B]/50 px-3 py-2 outline-none cursor-pointer"
              >
                {SURAHS_LIST.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}. {s.name_simple} ({s.name_arabic}) – {s.name_wolof}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Display Mode Switcher (Under Ayah vs Compiled end-of-surah) */}
          <div className="flex items-center gap-1.5 p-1 bg-black/5 dark:bg-white/10 rounded-xl border border-[#C5A45B]/30 self-stretch md:self-auto justify-center">
            <button
              onClick={() => setDisplayMode('individual')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                displayMode === 'individual'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-black'
              }`}
              title="Afficher le Tafsir sous chaque verset individuellement"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Sous chaque Ayat</span>
            </button>
            <button
              onClick={() => setDisplayMode('compiled')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                displayMode === 'compiled'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-black'
              }`}
              title="Afficher la récitation continue avec Tafsir condensé"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vue globale</span>
            </button>
          </div>

          {/* Quick jump to Mushaf button */}
          <button
            onClick={() => onOpenMushafPage(surah.start_page)}
            className="w-full md:w-auto px-4 py-2 bg-[#C5A45B] hover:bg-[#d4b56c] text-[#176B45] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
          >
            <BookOpen className="w-4 h-4" />
            <span>Lire page {surah.start_page}</span>
          </button>
        </div>
      </div>

      {/* Surah Banner Card with Bismillah */}
      <div className="bg-[#176B45] text-[#F8F5EA] rounded-2xl p-6 sm:p-8 text-center border-2 border-[#C5A45B]/60 shadow-lg mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <span className="font-arabic text-3xl sm:text-4xl font-bold tracking-wide text-[#F8F5EA] drop-shadow-md block mb-1">
            سُورَةُ {surah.name_arabic}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-[#C5A45B] mb-2 font-sans">
            {surah.name_simple} – {surah.name_french}
          </h2>
          <p className="text-xs sm:text-sm text-[#F8F5EA]/90 max-w-lg mx-auto mb-4">
            {surah.name_wolof} · {surah.verses_count} {t.verses} · {surah.revelation_place === 'makkah' ? t.makkah : t.madinah} · Xët {surah.start_page}
          </p>

          {/* Bismillah Header (except Surah 9 At-Tawbah) */}
          {surah.id !== 9 && (
            <div className="pt-3 border-t border-[#C5A45B]/30">
              <p className="font-arabic text-2xl sm:text-3xl font-semibold text-[#F8F5EA]">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <p className="text-xs text-[#C5A45B] mt-1 font-sans">
                Def ci turu Yàlla, Boroom yërmande ju yaa ji, Boroom yërmande ju sax ji.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Display Mode A: Under Each Ayat Individually */}
      {displayMode === 'individual' ? (
        <div className="space-y-6">
          {verses.map((verse) => {
            const isBookmarked = isAyahBookmarked(verse.surah_id, verse.ayah_number);
            const isCollapsed = collapsedVerses[verse.id] ?? false;

            return (
              <div
                key={verse.id}
                className="bg-white/95 dark:bg-[#1a1a1a] rounded-2xl p-5 sm:p-6 border border-[#C5A45B]/40 shadow-sm hover:border-[#176B45] transition-all"
              >
                {/* Ayah Label & Control Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#176B45] text-white flex items-center justify-center font-bold text-xs font-mono">
                      {verse.ayah_number}
                    </span>
                    <span className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B]">
                      Ayat {verse.ayah_number} – Sourate {surah.name_simple}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Audio Play */}
                    <button
                      onClick={() =>
                        onPlayAudio({
                          title: `${surah.name_simple} : Ayah ${verse.ayah_number}`,
                          audioUrl: getAyahAudioUrl(verse.surah_id, verse.ayah_number, selectedReciter),
                          surahId: verse.surah_id,
                          ayahNumber: verse.ayah_number,
                        })
                      }
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#176B45] rounded-lg transition-colors flex items-center gap-1 text-xs"
                      title={t.listenRecitation}
                    >
                      <Volume2 className="w-4 h-4 text-[#176B45]" />
                      <span className="hidden sm:inline">{t.listenRecitation}</span>
                    </button>

                    {/* Copy */}
                    <button
                      onClick={() => handleCopy(verse)}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#176B45] rounded-lg transition-colors"
                      title="Copier le verset"
                    >
                      {copiedId === verse.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Bookmark */}
                    <button
                      onClick={() => toggleBookmarkAyah(verse)}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#C5A45B] rounded-lg transition-colors"
                      title="Marquer ce verset"
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#C5A45B] text-[#C5A45B]' : ''}`} />
                    </button>

                    {/* Open In Mushaf Page */}
                    <button
                      onClick={() => onOpenMushafPage(verse.page_number)}
                      className="px-2.5 py-1 bg-[#176B45]/10 hover:bg-[#176B45]/20 text-[#176B45] dark:bg-[#C5A45B]/15 dark:text-[#C5A45B] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      title={`Aller à la page ${verse.page_number} du Mushaf`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Xët {verse.page_number}</span>
                    </button>
                  </div>
                </div>

                {/* Arabic Uthmani Text */}
                <p
                  className="font-quran text-2xl sm:text-3xl text-right leading-loose text-[#176B45] dark:text-[#C5A45B] mb-4 select-text"
                  dir="rtl"
                >
                  {verse.text_uthmani}
                </p>

                {/* Wolof Translation Card */}
                <div className="bg-[#176B45]/5 dark:bg-white/5 rounded-xl p-3.5 border-l-4 border-[#C5A45B] mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B] uppercase tracking-wider">
                      Tekki ci Wolof:
                    </p>
                    <span className="text-[11px] text-muted-foreground">Traduction vérifiée</span>
                  </div>
                  <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    {verse.translation_wolof}
                  </p>
                </div>

                {/* Collapsible Wolof Tafsir */}
                {verse.tafsir_wolof && (
                  <div>
                    <button
                      onClick={() => toggleVerseTafsir(verse.id)}
                      className="text-xs font-semibold text-[#176B45] dark:text-[#C5A45B] hover:underline flex items-center gap-1.5 py-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A45B]" />
                      <span>{isCollapsed ? t.showTafsir : t.hideTafsir}</span>
                      {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>

                    {!isCollapsed && (
                      <div className="mt-2 p-4 bg-[#F8F5EA] dark:bg-black/30 rounded-xl border border-[#C5A45B]/30 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed animate-in fade-in">
                        {verse.tafsir_wolof}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Display Mode B: Global Continuous Ayahs + Compiled Tafsir */
        <div className="bg-white/95 dark:bg-[#1a1a1a] rounded-2xl p-6 sm:p-8 border border-[#C5A45B]/40 shadow-sm">
          <div className="text-right leading-loose mb-8 p-4 bg-[#F8F5EA] dark:bg-black/20 rounded-xl border border-[#C5A45B]/30" dir="rtl">
            <p className="font-quran text-2xl sm:text-3xl text-justify text-[#176B45] dark:text-[#C5A45B]">
              {verses.map((v) => (
                <span key={v.id}>
                  {v.text_uthmani}
                  <span className="inline-flex items-center justify-center w-7 h-7 mx-1.5 text-xs font-bold text-[#176B45] dark:text-[#C5A45B] border border-[#C5A45B] rounded-full">
                    {v.ayah_number}
                  </span>
                </span>
              ))}
            </p>
          </div>

          <div className="border-t border-[#C5A45B]/40 pt-6">
            <h3 className="font-bold text-lg text-[#176B45] dark:text-[#C5A45B] mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C5A45B]" />
              <span>Tafsiir condensé ci Wolof – Sourate {surah.name_simple}</span>
            </h3>
            <div className="space-y-4">
              {verses.map((v) => (
                <div key={v.id} className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                  <p className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B] mb-1">
                    Ayat {v.ayah_number}:
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                    {v.translation_wolof}
                  </p>
                  {v.tafsir_wolof && (
                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                      {v.tafsir_wolof}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {verses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-white/50 dark:bg-black/20 rounded-2xl border border-dashed border-[#C5A45B]/40 p-6">
          <BookOpen className="w-10 h-10 mx-auto text-[#C5A45B] mb-2 opacity-60" />
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Tafsir wolof en cours d'intégration pour cette sourate.
          </p>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            Vous pouvez lire la sourate directement dans le Mushaf 604 pages ou utiliser l'espace Administration pour ajouter des traductions wolof vérifiées.
          </p>
          <button
            onClick={() => onOpenMushafPage(surah.start_page)}
            className="mt-4 px-4 py-2 bg-[#176B45] text-white text-xs font-semibold rounded-lg hover:bg-[#1f8054] transition-colors inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Lire le Mushaf (Page {surah.start_page})</span>
          </button>
        </div>
      )}
    </div>
  );
};
