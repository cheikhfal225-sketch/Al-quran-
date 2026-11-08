import React, { useState } from 'react';
import { Search, BookOpen, BookMarked, Filter, Compass } from 'lucide-react';
import { SURAHS_LIST } from '../data/surahs';
import { JUZ_LIST } from '../data/juz';
import { AppLanguage, RevelationPlace } from '../types/quran';
import { getTranslation } from '../data/translations';

interface FahrasatProps {
  language: AppLanguage;
  onOpenPage: (page: number) => void;
  onOpenTafsir: (surahId: number) => void;
}

export const Fahrasat: React.FC<FahrasatProps> = ({
  language,
  onOpenPage,
  onOpenTafsir,
}) => {
  const t = getTranslation(language);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'surahs' | 'juz'>('surahs');
  const [placeFilter, setPlaceFilter] = useState<'all' | RevelationPlace>('all');

  const filteredSurahs = SURAHS_LIST.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.id.toString() === q ||
      s.name_simple.toLowerCase().includes(q) ||
      s.name_french.toLowerCase().includes(q) ||
      s.name_wolof.toLowerCase().includes(q) ||
      s.name_arabic.includes(searchQuery);

    const matchesFilter = placeFilter === 'all' || s.revelation_place === placeFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 pb-24">
      {/* Title & Tagline */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-arabic text-[#176B45] dark:text-[#C5A45B]">
          فِهْرِسُ السُّوَرِ وَالأَجْزَاءِ
        </h1>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
          {t.allSurahs} · {t.tagline}
        </p>
      </div>

      {/* Tabs: Surahs (114) vs Juz (30) */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="p-1 bg-black/5 dark:bg-white/10 rounded-xl flex items-center border border-[#C5A45B]/30">
          <button
            onClick={() => setActiveTab('surahs')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'surahs'
                ? 'bg-[#176B45] text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
            }`}
          >
            114 Saar yi (Sourates)
          </button>
          <button
            onClick={() => setActiveTab('juz')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'juz'
                ? 'bg-[#176B45] text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
            }`}
          >
            30 Juz yi (Sections)
          </button>
        </div>
      </div>

      {activeTab === 'surahs' ? (
        <>
          {/* Search bar & Type filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#176B45]" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-[#1f1f1f] border border-[#C5A45B]/40 rounded-xl outline-none focus:border-[#176B45] shadow-sm text-slate-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-black"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter buttons: All / Meccan / Medinan */}
            <div className="flex items-center gap-1.5 p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-[#C5A45B]/30 shrink-0">
              <button
                onClick={() => setPlaceFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  placeFilter === 'all'
                    ? 'bg-[#C5A45B] text-[#176B45] font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-black'
                }`}
              >
                Toutes ({SURAHS_LIST.length})
              </button>
              <button
                onClick={() => setPlaceFilter('makkah')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  placeFilter === 'makkah'
                    ? 'bg-[#C5A45B] text-[#176B45] font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-black'
                }`}
              >
                {t.makkah}
              </button>
              <button
                onClick={() => setPlaceFilter('madinah')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  placeFilter === 'madinah'
                    ? 'bg-[#C5A45B] text-[#176B45] font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-black'
                }`}
              >
                {t.madinah}
              </button>
            </div>
          </div>

          {/* Surahs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredSurahs.map((surah) => (
              <div
                key={surah.id}
                className="bg-white/90 dark:bg-[#1a1a1a] rounded-xl p-3.5 border border-[#C5A45B]/40 hover:border-[#176B45] hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Header: Number, Simple Name, Arabic Calligraphy */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#176B45]/10 text-[#176B45] dark:bg-[#C5A45B]/20 dark:text-[#C5A45B] flex items-center justify-center font-bold text-xs font-mono border border-[#C5A45B]/30 group-hover:bg-[#176B45] group-hover:text-white transition-colors">
                      {surah.id}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#176B45] transition-colors">
                        {surah.name_simple}
                      </h3>
                      <p className="text-xs text-[#176B45] dark:text-[#C5A45B] font-medium truncate max-w-[170px]">
                        {surah.name_wolof}
                      </p>
                    </div>
                  </div>
                  <span className="font-arabic text-xl font-bold text-[#176B45] dark:text-[#C5A45B] shrink-0" dir="rtl">
                    {surah.name_arabic}
                  </span>
                </div>

                {/* Subtitle / Metadata (Zero-pill discipline) */}
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-3">
                  <span>{surah.name_french}</span>
                  <span aria-hidden="true">·</span>
                  <span>{surah.verses_count} {t.verses}</span>
                  <span aria-hidden="true">·</span>
                  <span>{surah.revelation_place === 'makkah' ? t.makkah : t.madinah}</span>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onOpenPage(surah.start_page)}
                    className="flex-1 py-1.5 px-2 bg-[#176B45] hover:bg-[#1f8054] text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                    title={`Ouvrir le Mushaf à la page ${surah.start_page}`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Xët {surah.start_page}</span>
                  </button>

                  <button
                    onClick={() => onOpenTafsir(surah.id)}
                    className="py-1.5 px-3 bg-[#C5A45B]/15 hover:bg-[#C5A45B]/30 text-[#176B45] dark:text-[#C5A45B] text-xs font-semibold rounded-lg border border-[#C5A45B]/40 transition-colors flex items-center gap-1"
                    title="Voir le Tafsir Wolof"
                  >
                    <BookMarked className="w-3.5 h-3.5" />
                    <span>Tafsir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredSurahs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-base font-medium">Benn saar mengoowul ak li nga seet.</p>
              <p className="text-xs mt-1">Vérifiez l'orthographe ou cherchez par numéro (ex: 36 pour Ya-Sin).</p>
            </div>
          )}
        </>
      ) : (
        /* Juz Index (30 Juz) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {JUZ_LIST.map((j) => (
            <div
              key={j.juz_number}
              className="bg-white/90 dark:bg-[#1a1a1a] rounded-xl p-4 border border-[#C5A45B]/40 hover:border-[#176B45] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#C5A45B] text-[#176B45] flex items-center justify-center font-bold text-xs">
                    {j.juz_number}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {j.name_french}
                    </h4>
                    <p className="text-xs text-muted-foreground">{j.name_wolof}</p>
                  </div>
                </div>
                <span className="font-arabic font-bold text-base text-[#176B45] dark:text-[#C5A45B]">
                  {j.name_arabic}
                </span>
              </div>

              <div className="text-xs text-muted-foreground my-2 flex items-center gap-1.5">
                <span>Début: {j.start_surah_name}</span>
                <span aria-hidden="true">·</span>
                <span>Pages {j.start_page} à {j.end_page}</span>
              </div>

              <button
                onClick={() => onOpenPage(j.start_page)}
                className="w-full mt-2 py-2 bg-[#176B45] hover:bg-[#1f8054] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ouvrir à la page {j.start_page}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
