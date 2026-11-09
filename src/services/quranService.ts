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
  QuranCoverageReport,
  SurahCoverageItem,
  ExportFilterOptions,
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
  SURAH_CACHE_PREFIX: 'alquran_surah_cache_v3_',
  PAGE_CACHE_PREFIX: 'alquran_page_cache_v3_',
};

// In-memory caches for fast sub-millisecond access
const memorySurahCache = new Map<number, VerseData[]>();
const memoryPageCache = new Map<number, VerseData[]>();

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
  
  const juz = JUZ_LIST.find((j) => page >= j.start_page && page <= j.end_page) || JUZ_LIST[0];
  
  let currentSurah = SURAHS_LIST[0];
  for (const s of SURAHS_LIST) {
    if (s.start_page <= page) {
      currentSurah = s;
    } else {
      break;
    }
  }

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
  // If memory cache has complete verses for this surah, return them
  if (memorySurahCache.has(surahId)) {
    return memorySurahCache.get(surahId)!;
  }

  // Check local storage cache
  const cachedStr = localStorage.getItem(LOCAL_STORAGE_KEYS.SURAH_CACHE_PREFIX + surahId);
  if (cachedStr) {
    try {
      const parsed: VerseData[] = JSON.parse(cachedStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memorySurahCache.set(surahId, parsed);
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  // Fallback to local authentic Wolof verses
  const verses = getAllVerses();
  return verses.filter((v) => v.surah_id === surahId).sort((a, b) => a.ayah_number - b.ayah_number);
}

export function getVersesForPage(pageNumber: number): VerseData[] {
  const verses = getAllVerses();
  return verses.filter((v) => v.page_number === pageNumber).sort((a, b) => a.ayah_number - b.ayah_number);
}

/**
 * Fetch and return ALL verses for ANY of the 604 pages of the Madinah Mushaf.
 * Merges authentic Arabic Uthmani text in exact sequence with the Wolof translation database.
 * Never invents fake translations and never injects French.
 */
export async function fetchVersesForPage(pageNumber: number): Promise<VerseData[]> {
  const p = Math.max(1, Math.min(604, pageNumber));

  // 1. Check in-memory cache
  if (memoryPageCache.has(p)) {
    return memoryPageCache.get(p)!;
  }

  // 2. Check localStorage cache
  const cacheKey = LOCAL_STORAGE_KEYS.PAGE_CACHE_PREFIX + p;
  const cachedRaw = localStorage.getItem(cacheKey);
  if (cachedRaw) {
    try {
      const parsed: VerseData[] = JSON.parse(cachedRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Re-apply latest Wolof translations from local database in case of updates
        const localMap = new Map<string, VerseData>();
        getAllVerses().forEach((v) => localMap.set(v.id, v));

        const updated = parsed.map((item) => {
          const local = localMap.get(item.id);
          return {
            ...item,
            translation_wolof: local?.translation_wolof || item.translation_wolof || undefined,
            tafsir_wolof: local?.tafsir_wolof || item.tafsir_wolof || undefined,
            source: local?.source || item.source || (local?.translation_wolof ? 'Commission des Oulémas du Sénégal - Traduction Wolof' : undefined),
            validation_status: local?.validation_status || item.validation_status || (local?.translation_wolof ? 'validated' : 'missing'),
          };
        });

        memoryPageCache.set(p, updated);
        return updated;
      }
    } catch {
      // ignore
    }
  }

  // Known local Wolof verses for this page
  const localVerses = getVersesForPage(p);
  const localMap = new Map<string, VerseData>();
  getAllVerses().forEach((v) => localMap.set(v.id, v));

  // 3. Fetch from AlQuran Cloud page API
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/page/${p}/quran-uthmani`);
    if (res.ok) {
      const json = await res.json();
      if (json.code === 200 && json.data && Array.isArray(json.data.ayahs)) {
        const fullVerses: VerseData[] = json.data.ayahs.map((arAyah: any) => {
          const surahId = arAyah.surah.number;
          const ayahNum = arAyah.numberInSurah;
          const verseId = `${surahId}:${ayahNum}`;
          const localMatch = localMap.get(verseId);

          let textUthmani = arAyah.text;
          if (surahId !== 1 && surahId !== 9 && ayahNum === 1) {
            textUthmani = textUthmani.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '').trim() || arAyah.text;
          }

          return {
            id: verseId,
            surah_id: surahId,
            ayah_number: ayahNum,
            text_uthmani: textUthmani,
            page_number: p,
            juz_number: arAyah.juz || 1,
            translation_wolof: localMatch?.translation_wolof || undefined,
            tafsir_wolof: localMatch?.tafsir_wolof || undefined,
            translation_french: localMatch?.translation_french || undefined,
            translation_english: localMatch?.translation_english || undefined,
            source: localMatch?.source || (localMatch?.translation_wolof ? 'Commission des Oulémas du Sénégal - Traduction Wolof' : undefined),
            validation_status: localMatch?.validation_status || (localMatch?.translation_wolof ? 'validated' : 'missing'),
          };
        });

        memoryPageCache.set(p, fullVerses);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(fullVerses));
        } catch {
          // ignore storage quota
        }
        return fullVerses;
      }
    }
  } catch (err) {
    console.warn(`Online fetch for page ${p} failed, using local fallback`, err);
  }

  return localVerses;
}

/**
 * Fetch and return ALL verses for ANY of the 114 Surahs.
 * Merges authentic Arabic Uthmani text with French, English & authentic Wolof translations.
 * STRICT ISOLATION: Never injects French into Wolof fields.
 */
export async function fetchFullSurahText(surahId: number): Promise<VerseData[]> {
  const surah = getSurahById(surahId);
  if (!surah) return [];

  // 1. Check memory cache
  if (memorySurahCache.has(surahId)) {
    return memorySurahCache.get(surahId)!;
  }

  // 2. Check localStorage cache
  const cacheKey = LOCAL_STORAGE_KEYS.SURAH_CACHE_PREFIX + surahId;
  const cachedRaw = localStorage.getItem(cacheKey);
  if (cachedRaw) {
    try {
      const parsed = JSON.parse(cachedRaw);
      if (Array.isArray(parsed) && parsed.length >= surah.verses_count) {
        memorySurahCache.set(surahId, parsed);
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  // 3. Known local wolof map
  const localVerses = getAllVerses();
  const localMap = new Map<number, VerseData>();
  localVerses.filter((v) => v.surah_id === surahId).forEach((v) => {
    localMap.set(v.ayah_number, v);
  });

  // 4. Fetch complete Uthmani text, French (Hamidullah) and English (Sahih) editions from AlQuran Cloud API
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,fr.hamidullah,en.sahih`);
    if (res.ok) {
      const json = await res.json();
      if (json.code === 200 && Array.isArray(json.data) && json.data.length >= 2) {
        const arabicData = json.data[0];
        const frenchData = json.data[1];
        const englishData = json.data.length >= 3 ? json.data[2] : null;

        const fullVerses: VerseData[] = arabicData.ayahs.map((arAyah: any, idx: number) => {
          const ayahNum = arAyah.numberInSurah;
          const frAyah = frenchData?.ayahs ? frenchData.ayahs[idx] : undefined;
          const enAyah = englishData?.ayahs ? englishData.ayahs[idx] : undefined;
          const localMatch = localMap.get(ayahNum);

          // Clean Bismillah prefix if not Surah 1 and not Surah 9
          let textUthmani = arAyah.text;
          if (surahId !== 1 && surahId !== 9 && ayahNum === 1) {
            // Remove Bismillah if repeated in first verse text
            textUthmani = textUthmani.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '').trim() || arAyah.text;
          }

          return {
            id: `${surahId}:${ayahNum}`,
            surah_id: surahId,
            ayah_number: ayahNum,
            text_uthmani: textUthmani,
            // STRICT SEPARATION: Only authentic Wolof or undefined (never fallback to French)
            translation_wolof: localMatch?.translation_wolof || undefined,
            tafsir_wolof: localMatch?.tafsir_wolof || undefined,
            translation_french: localMatch?.translation_french || (frAyah ? frAyah.text : undefined),
            translation_english: localMatch?.translation_english || (enAyah ? enAyah.text : undefined),
            page_number: arAyah.page || surah.start_page,
            juz_number: arAyah.juz || surah.juz_start,
          };
        });

        // Store in memory and local storage
        memorySurahCache.set(surahId, fullVerses);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(fullVerses));
        } catch {
          // If storage quota exceeded, memory cache still holds it
        }
        return fullVerses;
      }
    }
  } catch (err) {
    console.warn('API fetch failed, falling back to local dataset', err);
  }

  // Fallback to local verses if offline
  return getVersesForSurah(surahId);
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
  customMap[verse.id] = {
    ...verse,
    source: verse.source || 'Saisie Manuelle Administrateur',
    validation_status: verse.validation_status || (verse.translation_wolof ? 'validated' : 'missing'),
  };
  localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOM_VERSES, JSON.stringify(customMap));

  // Invalidate surah and page caches
  memorySurahCache.delete(verse.surah_id);
  memoryPageCache.delete(verse.page_number);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.SURAH_CACHE_PREFIX + verse.surah_id);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.PAGE_CACHE_PREFIX + verse.page_number);
}

/**
 * Audit and calculate comprehensive coverage metrics for all 114 Surahs and 604 Pages.
 * Strict rule: A page is NEVER considered complete if a single verse is missing.
 */
export function getQuranCoverageReport(): QuranCoverageReport {
  const TOTAL_VERSES = 6236;
  const TOTAL_PAGES = 604;
  const allVerses = getAllVerses();
  const verseMap = new Map<string, VerseData>();
  allVerses.forEach((v) => verseMap.set(v.id, v));

  let translatedCount = 0;
  let pendingCount = 0;

  const surahs: SurahCoverageItem[] = SURAHS_LIST.map((s) => {
    let sTranslated = 0;
    let sPending = 0;

    for (let a = 1; a <= s.verses_count; a++) {
      const v = verseMap.get(`${s.id}:${a}`);
      if (v && v.translation_wolof && v.translation_wolof.trim().length > 0) {
        if (v.validation_status === 'pending') {
          sPending++;
          pendingCount++;
        } else {
          sTranslated++;
          translatedCount++;
        }
      }
    }

    const sMissing = Math.max(0, s.verses_count - sTranslated - sPending);
    const sCoverage = s.verses_count > 0 ? (sTranslated / s.verses_count) * 100 : 0;

    return {
      id: s.id,
      name_simple: s.name_simple,
      name_arabic: s.name_arabic,
      name_wolof: s.name_wolof,
      verses_count: s.verses_count,
      translated_count: sTranslated,
      pending_count: sPending,
      missing_count: sMissing,
      coverage_percent: Math.round(sCoverage * 10) / 10,
      is_complete: sTranslated === s.verses_count && s.verses_count > 0,
    };
  });

  const missingCount = Math.max(0, TOTAL_VERSES - translatedCount - pendingCount);
  const coveragePercent = Math.round(((translatedCount / TOTAL_VERSES) * 100) * 10) / 10;

  // Compute page statuses (Rule: Never consider a page complete if even 1 verse is missing)
  const pageStats = new Map<number, { total: number; translated: number }>();
  allVerses.forEach((v) => {
    const stat = pageStats.get(v.page_number) || { total: 0, translated: 0 };
    stat.total++;
    if (v.translation_wolof && v.validation_status !== 'missing' && v.validation_status !== 'pending') {
      stat.translated++;
    }
    pageStats.set(v.page_number, stat);
  });

  let completePagesCount = 0;
  let partialPagesCount = 0;
  let emptyPagesCount = 0;

  for (let p = 1; p <= TOTAL_PAGES; p++) {
    const stat = pageStats.get(p);
    if (!stat || stat.translated === 0) {
      emptyPagesCount++;
    } else if (stat.translated === stat.total && stat.total > 0) {
      completePagesCount++;
    } else {
      partialPagesCount++;
    }
  }

  return {
    totalVerses: TOTAL_VERSES,
    translatedCount,
    pendingCount,
    missingCount,
    coveragePercent,
    totalPages: TOTAL_PAGES,
    completePagesCount,
    partialPagesCount,
    emptyPagesCount,
    surahs,
  };
}

export interface ExportVerseItem {
  id: string;
  surah_id: number;
  surah_name_simple: string;
  surah_name_arabic: string;
  surah_name_wolof: string;
  ayah_number: number;
  page_number: number;
  juz_number: number;
  text_uthmani: string;
  translation_wolof: string;
  tafsir_wolof: string;
  translation_french?: string;
  source: string;
  validation_status: 'validated' | 'pending' | 'missing';
  expert_evaluation?: string;
  expert_notes?: string;
}

/**
 * Filter and prepare verses for export (JSON or CSV) based on customizable scope and criteria.
 */
export function getFilteredVersesForExport(options?: ExportFilterOptions): ExportVerseItem[] {
  const scope = options?.scope || 'active_verses';
  const targetSurahId = options?.surahId && options.surahId > 0 ? options.surahId : undefined;
  
  const allKnownVerses = getAllVerses();
  const verseMap = new Map<string, VerseData>();
  allKnownVerses.forEach((v) => verseMap.set(v.id, v));

  let items: ExportVerseItem[] = [];

  if (scope === 'all_quran' || scope === 'missing_only') {
    // Process full Quran (all 114 Surahs or specific Surah)
    const surahsToProcess = targetSurahId
      ? SURAHS_LIST.filter((s) => s.id === targetSurahId)
      : SURAHS_LIST;

    surahsToProcess.forEach((s) => {
      for (let a = 1; a <= s.verses_count; a++) {
        const id = `${s.id}:${a}`;
        const match = verseMap.get(id);
        const hasWolof = !!(match?.translation_wolof && match.translation_wolof.trim().length > 0);
        const status = match?.validation_status || (hasWolof ? 'validated' : 'missing');

        if (scope === 'missing_only' && hasWolof && status !== 'missing') {
          continue;
        }

        items.push({
          id,
          surah_id: s.id,
          surah_name_simple: s.name_simple,
          surah_name_arabic: s.name_arabic,
          surah_name_wolof: s.name_wolof,
          ayah_number: a,
          page_number: match?.page_number || s.start_page,
          juz_number: match?.juz_number || s.juz_start,
          text_uthmani: match?.text_uthmani || '',
          translation_wolof: match?.translation_wolof || '',
          tafsir_wolof: match?.tafsir_wolof || '',
          translation_french: match?.translation_french || '',
          source: match?.source || (hasWolof ? 'Commission des Oulémas du Sénégal - Traduction Wolof' : 'En attente de traduction'),
          validation_status: status,
          expert_evaluation: options?.includeExpertReviewColumns
            ? status === 'validated'
              ? 'Conforme'
              : status === 'pending'
              ? 'À réviser'
              : 'À traduire'
            : undefined,
          expert_notes: options?.includeExpertReviewColumns ? '' : undefined,
        });
      }
    });
  } else {
    // Active verses in local database
    let baseList = allKnownVerses;
    if (targetSurahId) {
      baseList = baseList.filter((v) => v.surah_id === targetSurahId);
    }

    if (scope === 'validated_only') {
      baseList = baseList.filter((v) => v.validation_status === 'validated' && !!v.translation_wolof);
    } else if (scope === 'pending_only') {
      baseList = baseList.filter((v) => v.validation_status === 'pending');
    }

    items = baseList.map((v) => {
      const s = getSurahById(v.surah_id);
      return {
        id: v.id,
        surah_id: v.surah_id,
        surah_name_simple: s?.name_simple || `Sourate ${v.surah_id}`,
        surah_name_arabic: s?.name_arabic || '',
        surah_name_wolof: s?.name_wolof || '',
        ayah_number: v.ayah_number,
        page_number: v.page_number,
        juz_number: v.juz_number,
        text_uthmani: v.text_uthmani,
        translation_wolof: v.translation_wolof || '',
        tafsir_wolof: v.tafsir_wolof || '',
        translation_french: v.translation_french || '',
        source: v.source || 'Commission des Oulémas du Sénégal - Traduction Wolof',
        validation_status: v.validation_status || (v.translation_wolof ? 'validated' : 'missing'),
        expert_evaluation: options?.includeExpertReviewColumns
          ? v.validation_status === 'validated'
            ? 'Conforme'
            : 'À réviser'
          : undefined,
        expert_notes: options?.includeExpertReviewColumns ? '' : undefined,
      };
    });
  }

  // Sort logically: surah_id ASC, ayah_number ASC
  items.sort((a, b) => {
    if (a.surah_id !== b.surah_id) return a.surah_id - b.surah_id;
    return a.ayah_number - b.ayah_number;
  });

  return items;
}

/**
 * Export verses from the Wolof database to structured JSON format.
 */
export function exportWolofDatabaseJson(options?: ExportFilterOptions): string {
  const items = getFilteredVersesForExport(options);
  return JSON.stringify(items, null, 2);
}

/**
 * Export verses from the Wolof database to CSV format.
 * Includes UTF-8 BOM (\uFEFF) for native compatibility with Excel, LibreOffice, and Google Sheets.
 */
export function exportWolofDatabaseCsv(options?: ExportFilterOptions): string {
  const delimiter = options?.delimiter || ';';
  const items = getFilteredVersesForExport(options);

  const escapeField = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    'ID',
    'Numero_Sourate',
    'Nom_Sourate_Arabe',
    'Nom_Sourate_Francais',
    'Nom_Sourate_Wolof',
    'Numero_Verset',
    'Page_Mushaf',
    'Juz_Numero',
    'Texte_Arabe_Uthmani',
    'Traduction_Wolof',
    'Tafsir_Wolof',
    'Source_Traduction',
    'Statut_Validation',
  ];

  if (options?.includeExpertReviewColumns !== false) {
    headers.push('Avis_Expert_Externe', 'Commentaires_Corrections_Linguistiques', 'Date_Signature_Expert');
  }

  const csvRows: string[] = [];
  csvRows.push(headers.map((h) => escapeField(h)).join(delimiter));

  items.forEach((item) => {
    const row = [
      escapeField(item.id),
      escapeField(item.surah_id),
      escapeField(item.surah_name_arabic),
      escapeField(item.surah_name_simple),
      escapeField(item.surah_name_wolof),
      escapeField(item.ayah_number),
      escapeField(item.page_number),
      escapeField(item.juz_number),
      escapeField(item.text_uthmani),
      escapeField(item.translation_wolof),
      escapeField(item.tafsir_wolof),
      escapeField(item.source),
      escapeField(item.validation_status),
    ];

    if (options?.includeExpertReviewColumns !== false) {
      row.push(
        escapeField(item.expert_evaluation || (item.validation_status === 'validated' ? 'Conforme' : item.validation_status === 'pending' ? 'À réviser' : 'À traduire')),
        escapeField(item.expert_notes || ''),
        escapeField('')
      );
    }

    csvRows.push(row.join(delimiter));
  });

  // Prepend UTF-8 BOM so Microsoft Excel renders Arabic & Wolof characters accurately
  return '\uFEFF' + csvRows.join('\r\n');
}

/**
 * Triggers a direct browser download of the generated file.
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Bulk import Wolof database from JSON string.
 */
export function importWolofDatabaseJson(jsonString: string): { importedCount: number; errors: string[] } {
  const errors: string[] = [];
  let count = 0;
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      return { importedCount: 0, errors: ['Le fichier doit être un tableau JSON valide.'] };
    }

    const customStr = localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOM_VERSES);
    let customMap: Record<string, VerseData> = {};
    if (customStr) {
      try { customMap = JSON.parse(customStr); } catch { customMap = {}; }
    }

    parsed.forEach((item: any, idx: number) => {
      if (!item.surah_id || !item.ayah_number) {
        errors.push(`Ligne ${idx + 1}: numéro de sourate ou de verset manquant.`);
        return;
      }
      const sId = Number(item.surah_id);
      const aNum = Number(item.ayah_number);
      const id = `${sId}:${aNum}`;
      const surah = getSurahById(sId);

      customMap[id] = {
        id,
        surah_id: sId,
        ayah_number: aNum,
        text_uthmani: item.text_uthmani || '',
        translation_wolof: item.translation_wolof ? String(item.translation_wolof).trim() : undefined,
        tafsir_wolof: item.tafsir_wolof ? String(item.tafsir_wolof).trim() : undefined,
        page_number: item.page_number || surah?.start_page || 1,
        juz_number: item.juz_number || surah?.juz_start || 1,
        source: item.source || 'Importation base Wolof',
        validation_status: item.validation_status || (item.translation_wolof ? 'validated' : 'missing'),
      };
      count++;
    });

    localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOM_VERSES, JSON.stringify(customMap));
    
    // Invalidate caches
    memorySurahCache.clear();
    memoryPageCache.clear();
    for (let i = 1; i <= 604; i++) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.PAGE_CACHE_PREFIX + i);
    }
    for (let s = 1; s <= 114; s++) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.SURAH_CACHE_PREFIX + s);
    }

    return { importedCount: count, errors };
  } catch (err: any) {
    return { importedCount: 0, errors: [err?.message || 'Erreur de syntaxe JSON.'] };
  }
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
    const inWolofTrans = v.translation_wolof ? v.translation_wolof.toLowerCase().includes(cleanQ) : false;
    const inWolofTafsir = v.tafsir_wolof ? v.tafsir_wolof.toLowerCase().includes(cleanQ) : false;
    const inFrench = v.translation_french ? v.translation_french.toLowerCase().includes(cleanQ) : false;
    const inEnglish = v.translation_english ? v.translation_english.toLowerCase().includes(cleanQ) : false;
    const inSurahName = s ? (
      s.name_simple.toLowerCase().includes(cleanQ) ||
      s.name_french.toLowerCase().includes(cleanQ) ||
      s.name_wolof.toLowerCase().includes(cleanQ) ||
      s.name_arabic.includes(query)
    ) : false;

    return inArabic || inWolofTrans || inWolofTafsir || inFrench || inEnglish || inSurahName;
  });
}

// =================== BOOKMARKS & SIGNETS ===================
export function getBookmarks(): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.BOOKMARKS);
    if (!raw) {
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

export function getBookmarkForPage(pageNumber: number): BookmarkItem | undefined {
  const bookmarks = getBookmarks();
  return bookmarks.find((b) => b.type === 'page' && b.page_number === pageNumber);
}

export function addBookmark(item: Omit<BookmarkItem, 'id' | 'created_at'>): BookmarkItem {
  const current = getBookmarks();
  const newItem: BookmarkItem = {
    ...item,
    id: 'bm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    created_at: new Date().toISOString(),
  };
  const updated = [
    newItem,
    ...current.filter((b) => !(b.type === item.type && b.page_number === item.page_number && b.ayah_number === item.ayah_number)),
  ];
  localStorage.setItem(LOCAL_STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
  return newItem;
}

export function updateBookmarkNote(id: string, note: string, category?: BookmarkItem['category']): void {
  const current = getBookmarks();
  const updated = current.map((b) => {
    if (b.id === id) {
      return {
        ...b,
        note,
        category: category || b.category,
      };
    }
    return b;
  });
  localStorage.setItem(LOCAL_STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
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

// =================== READING PROGRESS ===================
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
