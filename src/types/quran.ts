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

export interface VerseData {
  id: string; // e.g. "1:1"
  surah_id: number;
  ayah_number: number;
  text_uthmani: string;
  text_indopak?: string;
  transliteration?: string;
  translation_wolof: string;
  tafsir_wolof: string;
  translation_french: string;
  page_number: number;
  juz_number: number;
  audio_url?: string;
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
export type AppLanguage = 'wo' | 'fr' | 'ar';
export type ReciterId = 'alafasy' | 'abdulbasit' | 'husary' | 'ghamadi';

export interface ReciterInfo {
  id: ReciterId;
  name_arabic: string;
  name_french: string;
  subfolder: string;
  format: string;
}
