import React, { useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Trash2,
  Calendar,
  Sparkles,
  ArrowRight,
  Share2,
  Check,
} from 'lucide-react';
import { AppLanguage, BookmarkItem, ReadingProgress } from '../types/quran';
import { getTranslation } from '../data/translations';
import {
  getBookmarks,
  removeBookmark,
  getReadingProgress,
  getPageMetadata,
  getSurahById,
} from '../services/quranService';

interface FavoritesViewProps {
  language: AppLanguage;
  onOpenPage: (page: number) => void;
  onOpenTafsir: (surahId: number) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  language,
  onOpenPage,
  onOpenTafsir,
}) => {
  const t = getTranslation(language);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(getBookmarks());
  const [filterType, setFilterType] = useState<'all' | 'page' | 'ayah'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const progress: ReadingProgress = getReadingProgress();
  const lastPageMeta = getPageMetadata(progress.last_page);

  const handleDelete = (id: string) => {
    removeBookmark(id);
    setBookmarks(getBookmarks());
  };

  const filtered = bookmarks.filter((b) => {
    if (filterType === 'all') return true;
    return b.type === filterType;
  });

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'fr-SN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Page Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-arabic text-[#176B45] dark:text-[#C5A45B]">
          العَلَامَاتُ وَالمُفَضَّلَةُ
        </h1>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
          {t.favorites} · Suivi de progression et versets sauvegardés
        </p>
      </div>

      {/* ================= READING PROGRESS HERO CARD ================= */}
      <div className="bg-gradient-to-r from-[#176B45] to-[#1e8054] text-[#F8F5EA] rounded-2xl p-5 sm:p-7 border border-[#C5A45B]/50 shadow-lg mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-[#C5A45B] mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t.lastRead} : {formatDate(progress.updated_at)}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-arabic">
              {lastPageMeta.surah.name_arabic}
            </h2>
            <p className="text-sm text-[#F8F5EA]/90 mt-0.5">
              {lastPageMeta.surah.name_simple} · {lastPageMeta.surah.name_wolof}
            </p>
            <div className="text-xs text-[#C5A45B] mt-2 flex items-center gap-2">
              <span>Xët {progress.last_page} / 604</span>
              <span>·</span>
              <span>Juz {lastPageMeta.juz.juz_number}</span>
              <span>·</span>
              <span>Progression: {Math.round((progress.last_page / 604) * 100)}%</span>
            </div>
          </div>

          <button
            onClick={() => onOpenPage(progress.last_page)}
            className="w-full sm:w-auto px-5 py-3 bg-[#C5A45B] hover:bg-[#d4b56c] text-[#176B45] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.resumeReading} (Xët {progress.last_page})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-black/20 rounded-full h-1.5 mt-5 overflow-hidden">
          <div
            className="bg-[#C5A45B] h-full transition-all duration-500 rounded-full"
            style={{ width: `${(progress.last_page / 604) * 100}%` }}
          />
        </div>
      </div>

      {/* ================= BOOKMARKS FILTER & LIST ================= */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
          Signets enregistrés ({bookmarks.length})
        </h3>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/10 rounded-xl border border-[#C5A45B]/30 text-xs font-medium">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterType === 'all' ? 'bg-[#176B45] text-white shadow-sm' : 'text-muted-foreground hover:text-black'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilterType('page')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterType === 'page' ? 'bg-[#176B45] text-white shadow-sm' : 'text-muted-foreground hover:text-black'
            }`}
          >
            Pages
          </button>
          <button
            onClick={() => setFilterType('ayah')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterType === 'ayah' ? 'bg-[#176B45] text-white shadow-sm' : 'text-muted-foreground hover:text-black'
            }`}
          >
            Ayat
          </button>
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white/90 dark:bg-[#1a1a1a] rounded-xl p-4 border border-[#C5A45B]/40 hover:border-[#176B45] shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#176B45]/10 text-[#176B45] dark:bg-[#C5A45B]/20 dark:text-[#C5A45B] flex items-center justify-center shrink-0 border border-[#C5A45B]/30">
                <Bookmark className="w-5 h-5 fill-current" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    · {formatDate(item.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-arabic mt-1 line-clamp-1">
                  {item.preview_text}
                </p>
                {item.note && (
                  <p className="text-[11px] text-[#176B45] dark:text-[#C5A45B] italic mt-0.5">
                    Note: {item.note}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => onOpenPage(item.page_number)}
                className="px-3 py-1.5 bg-[#176B45] hover:bg-[#1f8054] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ouvrir page {item.page_number}</span>
              </button>

              {item.surah_id && (
                <button
                  onClick={() => onOpenTafsir(item.surah_id!)}
                  className="px-2.5 py-1.5 bg-[#C5A45B]/15 hover:bg-[#C5A45B]/30 text-[#176B45] dark:text-[#C5A45B] text-xs font-semibold rounded-lg transition-colors border border-[#C5A45B]/30"
                  title="Voir le Tafsir Wolof"
                >
                  Tafsir
                </button>
              )}

              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                title="Supprimer ce signet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-white/40 dark:bg-black/20 rounded-2xl border border-dashed border-[#C5A45B]/30 p-6">
          <Bookmark className="w-8 h-8 mx-auto text-[#C5A45B] mb-2 opacity-50" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Aucun favori enregistré dans cette catégorie.
          </p>
          <p className="text-xs mt-1">
            Cliquez sur l'icône signet pendant la lecture d'une page ou d'un verset pour le sauvegarder ici.
          </p>
        </div>
      )}
    </div>
  );
};
