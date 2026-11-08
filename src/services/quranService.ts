import { SURAHS_LIST } from '../data/surahs';
import { JUZ_LIST } from '../data/juz';
import { AUTHENTIC_WOLOF_VERSES } from '../data/wolofTafsir';
import {
  SurahMeta,
  JuzMeta,
  VerseData,
  BookmarkItem,
  ReadingProgress,
  ReciterId,
  ReciterInfo,
} from '../types/quran';

export const RECITERS: ReciterInfo[] = [
  {
    id: 'alafasy',
    name_arabic: 'مشاري راشد العفاسي',
    name_french: 'Mishary Rashid Alafasy',
    subfolder: 'Alafasy_128kbps',
    format: 'mp3',
  },
  {
    id: 'abdulbasit',
    name_arabic: 'عبد الباسط عبد الصمد',
    name_french: 'Abdul Basit (Murattal)',
    subfolder: 'Abdul_Basit_Murattal_192kbps',
    format: 'mp3',
  },
  {
    id: 'husary',
    name_arabic: 'محمود خليل الحصري',
    name_french: 'Mahmoud Khalil Al-Husary',
    subfolder: 'Husary_128kbps',
    format: 'mp3',
  },
  {
    id: 'ghamadi',
    name_arabic: 'سعد الغامدي',
    name_french: 'Saad Al-Ghamdi',
    subfolder: 'Ghamadi_40kbps',
    format: 'mp3',
  },
];

const LOCAL_STORAGE_KEYS = {
  BOOKMARKS: 'alquran_bookmarks_v1',
  PROGRESS: 'alquran_progress_v1',
  CUSTOM_VERSES: 'alquran_custom_tafsir_v1',
  SETTINGS: 'alquran_settings_v1',
};

// Zero-padded helpers for Ayah audio URLs (e.g. 001001.mp3)
export function getAyahAudioUrl(surahNumber: number, ayahNumber: number, reciterId: ReciterId = 'alafasy'): string {
  const reciter = RECITERS.find((r) => r.id === reciterId) || RECITERS[0];
  const sStr = String(surahNumber).padStart(3, '0');
  const aStr = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${reciter.subfolder}/${sStr}${aStr}.mp3`;
}

// Full page audio (Recitation of the primary surah on this page)
export function getSurahAudioUrl(surahNumber: number, reciterId: ReciterId = 'alafasy'): string {
  const sStr = String(surahNumber).padStart(3, '0');
  return `https://server8.mp3quran.net/afs/${sStr}.mp3`;
}

// Mushaf Page Image URL from reliable verified Quran CDNs
export function getMushafPageImageUrl(pageNumber: number): string[] {
  const p = Math.max(1, Math.min(604, pageNumber));
  const pad3 = String(p).padStart(3, '0');
  
  // Return primary and fallback URLs
  return [
    `https://raw.githubusercontent.com/TheStandarddev/quran-mushaf-images/main/pages/page_${pad3}.png`,
    `https://images.quran.com/pages/page_${pad3}.png`,
    `https://raw.githubusercontent.com/Quranhub/mushaf-madinah/master/images/page_${pad3}.png`,
  ];
}

export function getSurahById(id: number): SurahMeta | undefined {
  return SURAHS_LIST.find((s) => s.id === id);
}

export function getSurahsByPage(pageNumber: number): SurahMeta[] {
  return SURAHS_LIST.filter((s) => s.start_page === pageNumber);
}

export function getPageMetadata(pageNumber: number): {
  pageNumber: number;
  juz: JuzMeta;
  surah: SurahMeta;
  hizbNumber: number;
} {
  const page = Math.max(1, Math.min(604, pageNumber));
  
  // Find matching Juz
  const juz = JUZ_LIST.find((j) => page >= j.start_page && page <= j.end_page) || JUZ_LIST[0];
  
  // Find current active Surah on this page
  // It's the highest surah whose start_page is <= page
  let currentSurah = SURAHS_LIST[0];
  for (const s of SURAHS_LIST) {
    if (s.start_page <= page) {
      currentSurah = s;
    } else {
      break;
    }
  }

  // Calculate approximate hizb (2 hizb per juz, 4 quarters per hizb)
  const pageInJuz = page - juz.start_page;
  const hizbNumber = (juz.juz_number - 1) * 2 + (pageInJuz > 10 ? 2 : 1);

  return {
    pageNumber: page,
    juz,
    surah: currentSurah,
    hizbNumber,
  };
}

export function getAllVerses(): VerseData[] {
  // Merge base authentic wolof verses with any user/admin saved custom verses
  const customStr = localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOM_VERSES);
  let customMap: Record<string, VerseData> = {};
  if (customStr) {
    try {
      customMap = JSON.parse(customStr);
    } catch {
      customMap = {};
    }
  }

  const map = new Map<string, VerseData>();
  for (const v of AUTHENTIC_WOLOF_VERSES) {
    map.set(v.id, v);
  }
  for (const [id, v] of Object.entries(customMap)) {
    map.set(id, v);
  }

  return Array.from(map.values());
}

export function getVerseById(id: string): VerseData | undefined {
  const verses = getAllVerses();
  return verses.find((v) => v.id === id);
}

export function getVersesForSurah(surahId: number): VerseData[] {
  const verses = getAllVerses();
  return verses.filter((v) => v.surah_id === surahId).sort((a, b) => a.ayah_number - b.ayah_number);
}

export function getVersesForPage(pageNumber: number): VerseData[] {
  const verses = getAllVerses();
  return verses.filter((v) => v.page_number === pageNumber).sort((a, b) => a.ayah_number - b.ayah_number);
}

export function saveCustomVerse(verse: VerseData): void {
  const customStr = localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOM_VERSES);
  let customMap: Record<string, VerseData> = {};
  if (customStr) {
    try {
      customMap = JSON.parse(customStr);
    } catch {
      customMap = {};
    }
  }
  customMap[verse.id] = verse;
  localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOM_VERSES, JSON.stringify(customMap));
}

export function searchAyat(query: string): VerseData[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  // Match "2:255" or "1 1"
  const refMatch = cleanQ.match(/^(\d{1,3})[:\s](\d{1,3})$/);
  if (refMatch) {
    const sId = parseInt(refMatch[1], 10);
    const aId = parseInt(refMatch[2], 10);
    const verses = getAllVerses();
    const exact = verses.filter((v) => v.surah_id === sId && v.ayah_number === aId);
    if (exact.length > 0) return exact;
  }

  // Search through all verses
  const all = getAllVerses();
  return all.filter((v) => {
    const s = getSurahById(v.surah_id);
    const inArabic = v.text_uthmani.includes(query);
    const inWolofTrans = v.translation_wolof.toLowerCase().includes(cleanQ);
    const inWolofTafsir = v.tafsir_wolof.toLowerCase().includes(cleanQ);
    const inFrench = v.translation_french.toLowerCase().includes(cleanQ);
    const inSurahName = s ? (
      s.name_simple.toLowerCase().includes(cleanQ) ||
      s.name_french.toLowerCase().includes(cleanQ) ||
      s.name_wolof.toLowerCase().includes(cleanQ) ||
      s.name_arabic.includes(query)
    ) : false;

    return inArabic || inWolofTrans || inWolofTafsir || inFrench || inSurahName;
  });
}

// Bookmarks
export function getBookmarks(): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.BOOKMARKS);
    if (!raw) {
      // Default initial bookmark: Al-Fatiha
      return [
        {
          id: 'default-1',
          type: 'page',
          page_number: 1,
          title: 'Sourate Al-Fatiha',
          preview_text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          created_at: new Date().toISOString(),
          category: 'meditation',
          note: 'Ubbi-bi (Al-Faatiha) - Première page du Mushaf',
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addBookmark(item: Omit<BookmarkItem, 'id' | 'created_at'>): BookmarkItem {
  const current = getBookmarks();
  const newItem: BookmarkItem = {
    ...item,
    id: 'bm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    created_at: new Date().toISOString(),
  };
  const updated = [newItem, ...current.filter((b) => !(b.type === item.type && b.page_number === item.page_number && b.ayah_number === item.ayah_number))];
  localStorage.setItem(LOCAL_STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
  return newItem;
}

export function removeBookmark(id: string): void {
  const current = getBookmarks();
  const updated = current.filter((b) => b.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
}

export function isPageBookmarked(pageNumber: number): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some((b) => b.type === 'page' && b.page_number === pageNumber);
}

export function isAyahBookmarked(surahId: number, ayahNumber: number): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some((b) => b.type === 'ayah' && b.surah_id === surahId && b.ayah_number === ayahNumber);
}

// Reading Progress
export function getReadingProgress(): ReadingProgress {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.PROGRESS);
    if (!raw) {
      return {
        last_page: 1,
        last_surah_id: 1,
        last_ayah_number: 1,
        updated_at: new Date().toISOString(),
        total_pages_read: 1,
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      last_page: 1,
      last_surah_id: 1,
      last_ayah_number: 1,
      updated_at: new Date().toISOString(),
      total_pages_read: 1,
    };
  }
}

export function saveReadingProgress(pageNumber: number, surahId?: number, ayahNumber?: number): void {
  const page = Math.max(1, Math.min(604, pageNumber));
  const current = getReadingProgress();
  const meta = getPageMetadata(page);

  const updated: ReadingProgress = {
    last_page: page,
    last_surah_id: surahId || meta.surah.id,
    last_ayah_number: ayahNumber || 1,
    updated_at: new Date().toISOString(),
    total_pages_read: Math.max(current.total_pages_read, page),
  };
  localStorage.setItem(LOCAL_STORAGE_KEYS.PROGRESS, JSON.stringify(updated));
}
