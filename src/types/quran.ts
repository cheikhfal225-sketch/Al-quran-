export type RevelationPlace = 'makkah' | 'madinah';

export interface SurahMeta {
  id: number;
  name_arabic: string;
  name_simple: string;
  name_french: string;
  name_wolof: string;
  verses_count: number;
  revelation_place: RevelationPlace;
  revelation_order: number;
  start_page: number;
  juz_start: number;
}

export interface JuzMeta {
  juz_number: number;
  name_arabic: string;
  name_french: string;
  name_wolof: string;
  start_page: number;
  end_page: number;
  start_surah_id: number;
  start_surah_name: string;
  start_ayah: number;
}

export type ValidationStatus = 'validated' | 'pending' | 'missing';

export interface ExportFilterOptions {
  format?: 'json' | 'csv';
  scope?: 'active_verses' | 'all_quran' | 'validated_only' | 'pending_only' | 'missing_only';
  surahId?: number;
  delimiter?: ',' | ';';
  includeExpertReviewColumns?: boolean;
}

export interface VerseData {
  id: string; // e.g. "1:1"
  surah_id: number;
  ayah_number: number;
  text_uthmani: string;
  text_indopak?: string;
  transliteration?: string;
  translation_wolof?: string;
  tafsir_wolof?: string;
  translation_french?: string;
  translation_english?: string;
  page_number: number;
  juz_number: number;
  audio_url?: string;
  source?: string; // Source de la traduction (ex: Oulémas du Sénégal, Commission Wolof)
  validation_status?: ValidationStatus; // Statut de validation de la traduction
}

export interface SurahCoverageItem {
  id: number;
  name_simple: string;
  name_arabic: string;
  name_wolof: string;
  verses_count: number;
  translated_count: number;
  pending_count: number;
  missing_count: number;
  coverage_percent: number;
  is_complete: boolean;
}

export interface PageCoverageItem {
  page_number: number;
  surah_name: string;
  total_verses: number;
  translated_verses: number;
  status: 'complete' | 'partial' | 'empty';
}

export interface QuranCoverageReport {
  totalVerses: number; // 6236
  translatedCount: number;
  pendingCount: number;
  missingCount: number;
  coveragePercent: number;
  totalPages: number; // 604
  completePagesCount: number;
  partialPagesCount: number;
  emptyPagesCount: number;
  surahs: SurahCoverageItem[];
}

export interface BookmarkItem {
  id: string;
  type: 'page' | 'ayah';
  surah_id?: number;
  ayah_number?: number;
  page_number: number;
  title: string;
  preview_text: string;
  created_at: string;
  note?: string;
  category?: 'meditation' | 'doua' | 'revision' | 'general';
}

export interface ReadingProgress {
  last_page: number;
  last_surah_id: number;
  last_ayah_number: number;
  updated_at: string;
  total_pages_read: number;
}

export type ThemeMode = 'parchment' | 'dark' | 'sepia' | 'emerald';
export type AppLanguage = 'wo' | 'fr' | 'ar' | 'en';
export type ReciterId = 'alafasy' | 'abdulbasit' | 'husary' | 'ghamadi';

export interface ReciterInfo {
  id: ReciterId;
  name_arabic: string;
  name_french: string;
  subfolder: string;
  format: string;
}
