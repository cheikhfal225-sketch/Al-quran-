import React, { useState, useEffect } from 'react';
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
  Search,
  BookText,
  Loader2,
} from 'lucide-react';
import { SURAHS_LIST } from '../data/surahs';
import { AppLanguage, VerseData, ReciterId } from '../types/quran';
import { getTranslation } from '../data/translations';
import {
  fetchFullSurahText,
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
  const [displayMode, setDisplayMode] = useState<'individual' | 'continuous' | 'compiled'>('individual');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collapsedVerses, setCollapsedVerses] = useState<Record<string, boolean>>({});
  const [filterQuery, setFilterQuery] = useState<string>('');

  // Complete verses state for the selected surah
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const surah = getSurahById(currentSurahId) || SURAHS_LIST[0];

  // Load ALL verses for the selected Surah (Full Quran text for all 114 Surahs)
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    fetchFullSurahText(surah.id).then((fullVerses) => {
      if (!isCancelled) {
        setVerses(fullVerses);
        setLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [surah.id]);

  const toggleVerseTafsir = (id: string) => {
    setCollapsedVerses((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (verse: VerseData) => {
    let textToCopy = `${verse.text_uthmani}\n\nAyat ${verse.ayah_number} - ${surah.name_simple} (${surah.name_arabic})`;
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

  // Convert numbers to Arabic numerals
  const toArabicNumerals = (num: number) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num)
      .split('')
      .map((d) => arabicDigits[parseInt(d, 10)] ?? d)
      .join('');
  };

  // Filter verses if user searches within the surah
  const displayedVerses = verses.filter((v) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase().trim();
    return (
      v.ayah_number.toString() === q ||
      v.text_uthmani.includes(q) ||
      (v.translation_wolof && v.translation_wolof.toLowerCase().includes(q)) ||
      (v.translation_french && v.translation_french.toLowerCase().includes(q)) ||
      (v.translation_english && v.translation_english.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Surah Selector & Display Mode Header */}
      <div className="bg-white/95 dark:bg-[#1a1a1a] rounded-2xl p-4 sm:p-6 border border-[#C5A45B]/40 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Surah Dropdown Picker (1 to 114) */}
          <div className="w-full md:w-auto flex-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176B45] text-[#F8F5EA] flex items-center justify-center font-bold text-sm shadow">
              {surah.id}
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="surah-select" className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-0.5">
                Choisir une sourate (1 à 114):
              </label>
              <select
                id="surah-select"
                value={surah.id}
                onChange={(e) => onSelectSurah(parseInt(e.target.value, 10))}
                className="w-full bg-[#F8F5EA] dark:bg-[#252525] text-slate-900 dark:text-white font-semibold text-sm rounded-lg border border-[#C5A45B]/50 px-3 py-2 outline-none cursor-pointer"
              >
                {SURAHS_LIST.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}. {s.name_simple} ({s.name_arabic}) – {s.name_wolof} [{s.verses_count} versets]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Display Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-black/5 dark:bg-white/10 rounded-xl border border-[#C5A45B]/30 self-stretch md:self-auto justify-center">
            <button
              onClick={() => setDisplayMode('individual')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                displayMode === 'individual'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-black'
              }`}
              title="Afficher chaque verset individuellement avec traduction & Tafsir"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Verset par verset</span>
            </button>
            <button
              onClick={() => setDisplayMode('continuous')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                displayMode === 'continuous'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-black'
              }`}
              title="Afficher tout le texte arabe continu de la sourate (écriture Mushaf)"
            >
              <BookText className="w-3.5 h-3.5" />
              <span>Texte intégral continu</span>
            </button>
            <button
              onClick={() => setDisplayMode('compiled')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                displayMode === 'compiled'
                  ? 'bg-[#176B45] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-black'
              }`}
              title="Afficher le texte complet et le Tafsir condensé"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tafsir condensé</span>
            </button>
          </div>

          {/* Quick jump to Mushaf page */}
          <button
            onClick={() => onOpenMushafPage(surah.start_page)}
            className="w-full md:w-auto px-4 py-2 bg-[#C5A45B] hover:bg-[#d4b56c] text-[#176B45] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4" />
            <span>Mushaf Page {surah.start_page}</span>
          </button>
        </div>
      </div>

      {/* Surah Banner Card with Bismillah */}
      <div className="bg-[#176B45] text-[#F8F5EA] rounded-2xl p-6 sm:p-8 text-center border-2 border-[#C5A45B]/60 shadow-lg mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <span className="font-arabic text-3xl sm:text-4xl font-bold tracking-wide text-[#F8F5EA] drop-shadow-md block mb-1">
            سُورَةُ {surah.name_arabic}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-[#C5A45B] mb-1 font-sans">
            {surah.name_simple} – {surah.name_french}
          </h2>
          <p className="text-xs sm:text-sm text-[#F8F5EA]/90 max-w-lg mx-auto mb-4">
            {surah.name_wolof} · {surah.verses_count} {t.verses} (Texte complet) · {surah.revelation_place === 'makkah' ? t.makkah : t.madinah} · Xët {surah.start_page}
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

      {/* Search / Filter within this Surah */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#176B45]" />
          <input
            type="text"
            placeholder={`Filtrer dans la sourate ${surah.name_simple} (n° verset, mot arabe ou wolof)...`}
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm bg-white dark:bg-[#1e1e1e] border border-[#C5A45B]/40 rounded-xl outline-none focus:border-[#176B45]"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-black"
            >
              ✕
            </button>
          )}
        </div>

        <span className="text-xs font-semibold text-[#176B45] dark:text-[#C5A45B] bg-[#C5A45B]/15 px-3 py-2 rounded-xl whitespace-nowrap">
          {displayedVerses.length} / {surah.verses_count} versets
        </span>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#176B45] animate-spin" />
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 font-arabic">
            جاري تحميل النص القرآني الكامل لسورة {surah.name_arabic}...
          </p>
          <p className="text-xs text-muted-foreground">
            Chargement des {surah.verses_count} versets en texte Uthmani authentique.
          </p>
        </div>
      )}

      {/* ================= MODE 1 : VERSET PAR VERSET ================= */}
      {!loading && displayMode === 'individual' && (
        <div className="space-y-6">
          {displayedVerses.map((verse) => {
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
                {/* Arabic Uthmani Text */}
                <p
                  className="font-quran text-2xl sm:text-3xl text-right leading-loose text-[#176B45] dark:text-[#C5A45B] mb-4 select-text"
                  dir="rtl"
                >
                  {verse.text_uthmani}
                </p>

                {/* 1. WOLOF LANGUAGE SELECTED: Show ONLY Wolof */}
                {language === 'wo' && (
                  <>
                    <div className="bg-[#176B45]/5 dark:bg-white/5 rounded-xl p-3.5 border-l-4 border-[#C5A45B] mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B] uppercase tracking-wider">
                          Tekki ci Wolof:
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                          {verse.translation_wolof ? (verse.tafsir_wolof ? 'Traduction vérifiée' : 'Tekki dëggu') : 'Ñàkk tekki'}
                        </span>
                      </div>
                      {verse.translation_wolof ? (
                        <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                          {verse.translation_wolof}
                        </p>
                      ) : (
                        <p className="text-sm italic text-amber-800/80 dark:text-amber-300/80 font-sans">
                          {t.wolofUnavailable}
                        </p>
                      )}
                    </div>

                    {/* Collapsible Wolof Tafsir if available */}
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
                  </>
                )}

                {/* 2. FRENCH LANGUAGE SELECTED: Show ONLY French */}
                {language === 'fr' && (
                  <div className="bg-[#176B45]/5 dark:bg-white/5 rounded-xl p-3.5 border-l-4 border-[#176B45] mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B] uppercase tracking-wider">
                        Traduction française:
                      </p>
                    </div>
                    {verse.translation_french ? (
                      <p className="text-sm sm:text-base font-normal text-slate-800 dark:text-slate-100 leading-relaxed">
                        « {verse.translation_french} »
                      </p>
                    ) : (
                      <p className="text-sm italic text-slate-500">
                        {t.translationUnavailable}
                      </p>
                    )}
                  </div>
                )}

                {/* 3. ENGLISH LANGUAGE SELECTED: Show ONLY English */}
                {language === 'en' && (
                  <div className="bg-[#176B45]/5 dark:bg-white/5 rounded-xl p-3.5 border-l-4 border-[#176B45] mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B] uppercase tracking-wider">
                        English Translation:
                      </p>
                    </div>
                    {verse.translation_english ? (
                      <p className="text-sm sm:text-base font-normal text-slate-800 dark:text-slate-100 leading-relaxed">
                        "{verse.translation_english}"
                      </p>
                    ) : (
                      <p className="text-sm italic text-slate-500">
                        {t.translationUnavailable}
                      </p>
                    )}
                  </div>
                )}

                {/* 4. ARABIC LANGUAGE SELECTED: Pure Arabic text without foreign translations */}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODE 2 : TEXTE INTÉGRAL CONTINU (Lecture continue de la sourate) ================= */}
      {!loading && displayMode === 'continuous' && (
        <div className="bg-[#F8F5EA] dark:bg-[#1a1a1a] rounded-2xl p-6 sm:p-10 border-2 border-[#C5A45B]/60 shadow-lg text-right">
          {/* Header */}
          <div className="border-b border-[#C5A45B]/30 pb-4 mb-6 text-center">
            <h3 className="font-arabic text-2xl font-bold text-[#176B45] dark:text-[#C5A45B]">
              قِرَاءَةُ سُورَةِ {surah.name_arabic} كَامِلَةً ({surah.verses_count} آيَةً)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Lecture continue du texte coranique original ( طبعة المدينة المنورة )
            </p>
          </div>

          {/* Continuous Uthmani verses */}
          <div className="leading-loose text-justify text-[#202020] dark:text-[#F8F5EA]" dir="rtl">
            <p className="font-quran text-2xl sm:text-3xl leading-[2.6]">
              {displayedVerses.map((v) => (
                <span key={v.id} className="hover:text-[#176B45] transition-colors cursor-pointer group" onClick={() => onOpenMushafPage(v.page_number)}>
                  {v.text_uthmani}
                  <span className="inline-flex items-center justify-center w-8 h-8 mx-1 text-xs sm:text-sm font-bold text-[#176B45] dark:text-[#C5A45B] border border-[#C5A45B] rounded-full shadow-xs bg-black/5 dark:bg-white/5">
                    {toArabicNumerals(v.ayah_number)}
                  </span>{' '}
                </span>
              ))}
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-[#C5A45B]/40 text-center flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onOpenMushafPage(surah.start_page)}
              className="px-4 py-2 bg-[#176B45] hover:bg-[#1f8054] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow"
            >
              <BookOpen className="w-4 h-4" />
              <span>Ouvrir dans le Mushaf papier (Page {surah.start_page})</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MODE 3 : TAFSIR CONDENSÉ ================= */}
      {!loading && displayMode === 'compiled' && (
        <div className="bg-white/95 dark:bg-[#1a1a1a] rounded-2xl p-6 sm:p-8 border border-[#C5A45B]/40 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-[#176B45] dark:text-[#C5A45B] mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C5A45B]" />
            <span>
              {language === 'wo'
                ? `Tafsiir & Tekki ci Wolof – Saar ${surah.name_wolof} (Aayé 1 ba ${surah.verses_count})`
                : language === 'fr'
                ? `Traduction française – Sourate ${surah.name_simple} (Versets 1 à ${surah.verses_count})`
                : language === 'en'
                ? `English Translation – Surah ${surah.name_simple} (Verses 1 to ${surah.verses_count})`
                : `قراءة وتدبر سورة ${surah.name_arabic}`}
            </span>
          </h3>

          <div className="space-y-4">
            {displayedVerses.map((v) => (
              <div key={v.id} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#176B45] dark:text-[#C5A45B]">
                    Ayat {v.ayah_number}:
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Page {v.page_number}
                  </span>
                </div>
                <p className="font-quran text-xl text-right text-[#176B45] dark:text-[#C5A45B] mb-2" dir="rtl">
                  {v.text_uthmani}
                </p>

                {language === 'wo' && (
                  <>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                      Tekki: {v.translation_wolof || <span className="text-amber-800/80 dark:text-amber-300/80 italic font-normal">{t.wolofUnavailable}</span>}
                    </p>
                    {v.tafsir_wolof && (
                      <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed bg-[#F8F5EA] dark:bg-black/20 p-3 rounded-lg">
                        {v.tafsir_wolof}
                      </p>
                    )}
                  </>
                )}

                {language === 'fr' && (
                  <p className="text-sm text-slate-800 dark:text-slate-100 mb-2">
                    Traduction: {v.translation_french ? `« ${v.translation_french} »` : <span className="text-slate-500 italic">{t.translationUnavailable}</span>}
                  </p>
                )}

                {language === 'en' && (
                  <p className="text-sm text-slate-800 dark:text-slate-100 mb-2">
                    Translation: {v.translation_english ? `"${v.translation_english}"` : <span className="text-slate-500 italic">{t.translationUnavailable}</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
