import React, { useState } from 'react';
import {
  ShieldCheck,
  Save,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { SURAHS_LIST } from '../data/surahs';
import { VerseData } from '../types/quran';
import {
  getAllVerses,
  getSurahById,
  saveCustomVerse,
  getAyahAudioUrl,
} from '../services/quranService';

export const AdminView: React.FC = () => {
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const [ayahNumber, setAyahNumber] = useState<number>(1);
  const [arabicText, setArabicText] = useState<string>('');
  const [wolofTranslation, setWolofTranslation] = useState<string>('');
  const [wolofTafsir, setWolofTafsir] = useState<string>('');
  const [frenchTranslation, setFrenchTranslation] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const surah = getSurahById(selectedSurahId) || SURAHS_LIST[0];
  const allVerses = getAllVerses();

  // Load existing verse if available
  const handleLoadVerse = (sId: number, aNum: number) => {
    setSelectedSurahId(sId);
    setAyahNumber(aNum);
    const existing = allVerses.find((v) => v.surah_id === sId && v.ayah_number === aNum);
    if (existing) {
      setArabicText(existing.text_uthmani);
      setWolofTranslation(existing.translation_wolof);
      setWolofTafsir(existing.tafsir_wolof || '');
      setFrenchTranslation(existing.translation_french || '');
    } else {
      setArabicText('');
      setWolofTranslation('');
      setWolofTafsir('');
      setFrenchTranslation('');
    }
  };

  const handleSave = () => {
    if (!wolofTranslation.trim()) {
      setSaveStatus('Erreur: Veuillez saisir au moins la traduction wolof.');
      return;
    }

    const verse: VerseData = {
      id: `${selectedSurahId}:${ayahNumber}`,
      surah_id: selectedSurahId,
      ayah_number: ayahNumber,
      text_uthmani: arabicText.trim() || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      translation_wolof: wolofTranslation.trim(),
      tafsir_wolof: wolofTafsir.trim(),
      translation_french: frenchTranslation.trim(),
      page_number: surah.start_page,
      juz_number: surah.juz_start,
    };

    saveCustomVerse(verse);
    setSaveStatus('Traduction et Tafsir wolof enregistrés avec succès!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleExportData = () => {
    const data = JSON.stringify(allVerses, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alquran_wolof_tafsir_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          parsed.forEach((v) => saveCustomVerse(v));
          setSaveStatus(`Importation réussie de ${parsed.length} versets!`);
        }
      } catch {
        setSaveStatus('Erreur: Format JSON invalide.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Title */}
      <div className="flex items-center gap-3 mb-6 border-b border-[#C5A45B]/40 pb-4">
        <div className="w-12 h-12 rounded-2xl bg-[#176B45] text-[#C5A45B] flex items-center justify-center shadow">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Espace Éditorial & Administration</span>
            <span className="text-xs bg-[#C5A45B]/20 text-[#176B45] dark:text-[#C5A45B] px-2 py-0.5 rounded font-mono">
              Vérifié
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gestion des traductions et commentaires en wolof selon la tradition théologique authentique
          </p>
        </div>
      </div>

      {/* Backup and restore banner */}
      <div className="bg-[#176B45]/10 dark:bg-white/5 rounded-2xl p-4 border border-[#C5A45B]/40 flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-bold text-[#176B45] dark:text-[#C5A45B]">
            Sauvegarde & Exportation des données
          </h3>
          <p className="text-xs text-muted-foreground">
            {allVerses.length} versets et commentaires wolof dans la base locale.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportData}
            className="px-3 py-1.5 bg-[#176B45] hover:bg-[#1f8054] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter JSON</span>
          </button>
          <label className="px-3 py-1.5 bg-white dark:bg-black/30 border border-[#C5A45B]/50 hover:bg-slate-50 dark:hover:bg-black/50 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[#176B45]" />
            <span>Importer JSON</span>
            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
          </label>
        </div>
      </div>

      {/* Editor Form Card */}
      <div className="bg-white/95 dark:bg-[#1a1a1a] rounded-2xl p-5 sm:p-7 border border-[#C5A45B]/50 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C5A45B]" />
          <span>Éditer ou ajouter un verset & Tafsir</span>
        </h2>

        {/* Surah & Ayah Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Sourate:
            </label>
            <select
              value={selectedSurahId}
              onChange={(e) => handleLoadVerse(parseInt(e.target.value, 10), ayahNumber)}
              className="w-full bg-[#F8F5EA] dark:bg-[#252525] border border-[#C5A45B]/40 rounded-xl px-3 py-2 text-sm outline-none font-semibold"
            >
              {SURAHS_LIST.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. {s.name_simple} ({s.name_arabic}) – {s.name_wolof} ({s.verses_count} versets)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Numéro de l'Ayat (1 à {surah.verses_count}):
            </label>
            <input
              type="number"
              min={1}
              max={surah.verses_count}
              value={ayahNumber}
              onChange={(e) => handleLoadVerse(selectedSurahId, parseInt(e.target.value, 10) || 1)}
              className="w-full bg-[#F8F5EA] dark:bg-[#252525] border border-[#C5A45B]/40 rounded-xl px-3 py-2 text-sm outline-none font-semibold font-mono"
            />
          </div>
        </div>

        {/* Arabic Text (Uthmani) */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Texte arabe original (Uthmani):
          </label>
          <textarea
            rows={2}
            value={arabicText}
            onChange={(e) => setArabicText(e.target.value)}
            dir="rtl"
            placeholder="بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
            className="w-full bg-[#F8F5EA] dark:bg-[#252525] border border-[#C5A45B]/40 rounded-xl p-3 text-lg font-quran text-[#176B45] dark:text-[#C5A45B] outline-none"
          />
        </div>

        {/* Wolof Translation */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Tekki ci Wolof (Traduction claire en wolof):
          </label>
          <textarea
            rows={2}
            value={wolofTranslation}
            onChange={(e) => setWolofTranslation(e.target.value)}
            placeholder="Def ci turu Yàlla, Boroom yërmande ju yaa ji, Boroom yërmande ju sax ji."
            className="w-full bg-white dark:bg-[#202020] border border-[#C5A45B]/40 rounded-xl p-3 text-sm font-medium outline-none"
          />
        </div>

        {/* Wolof Tafsir (Detailed) */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Tafsiir ci Wolof (Commentaires théologiques authentiques):
          </label>
          <textarea
            rows={4}
            value={wolofTafsir}
            onChange={(e) => setWolofTafsir(e.target.value)}
            placeholder="Tafsiir ci Wolof:\nLeeral yi ak maanaa yu am solo ci aayé bi..."
            className="w-full bg-white dark:bg-[#202020] border border-[#C5A45B]/40 rounded-xl p-3 text-sm outline-none font-sans"
          />
        </div>

        {/* French Translation */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Traduction française de référence:
          </label>
          <input
            type="text"
            value={frenchTranslation}
            onChange={(e) => setFrenchTranslation(e.target.value)}
            placeholder="Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux."
            className="w-full bg-white dark:bg-[#202020] border border-[#C5A45B]/40 rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* Status Feedback */}
        {saveStatus && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Save CTA */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            Verset ciblé: Sourate {selectedSurahId}:{ayahNumber}
          </span>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#176B45] hover:bg-[#1f8054] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer la traduction wolof</span>
          </button>
        </div>
      </div>
    </div>
  );
};
