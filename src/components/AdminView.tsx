import React, { useState, useMemo } from 'react';
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
  FileSpreadsheet,
  FileJson,
  Filter,
  Users,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { SURAHS_LIST } from '../data/surahs';
import { VerseData, ExportFilterOptions } from '../types/quran';
import {
  getAllVerses,
  getSurahById,
  saveCustomVerse,
  getAyahAudioUrl,
  exportWolofDatabaseJson,
  exportWolofDatabaseCsv,
  triggerFileDownload,
  getFilteredVersesForExport,
} from '../services/quranService';

export const AdminView: React.FC = () => {
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const [ayahNumber, setAyahNumber] = useState<number>(1);
  const [arabicText, setArabicText] = useState<string>('');
  const [wolofTranslation, setWolofTranslation] = useState<string>('');
  const [wolofTafsir, setWolofTafsir] = useState<string>('');
  const [frenchTranslation, setFrenchTranslation] = useState<string>('');
  const [englishTranslation, setEnglishTranslation] = useState<string>('');
  const [source, setSource] = useState<string>('Commission des Oulémas du Sénégal - Traduction Wolof');
  const [validationStatus, setValidationStatus] = useState<'validated' | 'pending' | 'missing'>('validated');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Advanced Export States
  const [showExportPanel, setShowExportPanel] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportScope, setExportScope] = useState<'active_verses' | 'all_quran' | 'validated_only' | 'pending_only' | 'missing_only'>('active_verses');
  const [exportSurahFilter, setExportSurahFilter] = useState<number>(0); // 0 = all
  const [exportDelimiter, setExportDelimiter] = useState<';' | ','>(';');
  const [includeReviewColumns, setIncludeReviewColumns] = useState<boolean>(true);

  const surah = getSurahById(selectedSurahId) || SURAHS_LIST[0];
  const allVerses = getAllVerses();

  // Load existing verse if available
  const handleLoadVerse = (sId: number, aNum: number) => {
    setSelectedSurahId(sId);
    setAyahNumber(aNum);
    const existing = allVerses.find((v) => v.surah_id === sId && v.ayah_number === aNum);
    if (existing) {
      setArabicText(existing.text_uthmani);
      setWolofTranslation(existing.translation_wolof || '');
      setWolofTafsir(existing.tafsir_wolof || '');
      setFrenchTranslation(existing.translation_french || '');
      setEnglishTranslation(existing.translation_english || '');
      setSource(existing.source || 'Commission des Oulémas du Sénégal - Traduction Wolof');
      setValidationStatus(existing.validation_status || (existing.translation_wolof ? 'validated' : 'missing'));
    } else {
      setArabicText('');
      setWolofTranslation('');
      setWolofTafsir('');
      setFrenchTranslation('');
      setEnglishTranslation('');
      setSource('Commission des Oulémas du Sénégal - Traduction Wolof');
      setValidationStatus('missing');
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
      translation_wolof: wolofTranslation.trim() || undefined,
      tafsir_wolof: wolofTafsir.trim() || undefined,
      translation_french: frenchTranslation.trim() || undefined,
      translation_english: englishTranslation.trim() || undefined,
      source: source.trim() || 'Commission des Oulémas du Sénégal - Traduction Wolof',
      validation_status: validationStatus,
      page_number: surah.start_page,
      juz_number: surah.juz_start,
    };

    saveCustomVerse(verse);
    setSaveStatus('Traduction et statut de validation enregistrés avec succès!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Preview count of verses to be exported
  const exportPreviewVerses = useMemo(() => {
    const opts: ExportFilterOptions = {
      format: exportFormat,
      scope: exportScope,
      surahId: exportSurahFilter > 0 ? exportSurahFilter : undefined,
      delimiter: exportDelimiter,
      includeExpertReviewColumns: includeReviewColumns,
    };
    return getFilteredVersesForExport(opts);
  }, [exportFormat, exportScope, exportSurahFilter, exportDelimiter, includeReviewColumns, allVerses]);

  // Execute customizable export
  const handlePerformExport = (formatToUse?: 'csv' | 'json') => {
    const finalFormat = formatToUse || exportFormat;
    const opts: ExportFilterOptions = {
      format: finalFormat,
      scope: exportScope,
      surahId: exportSurahFilter > 0 ? exportSurahFilter : undefined,
      delimiter: exportDelimiter,
      includeExpertReviewColumns: includeReviewColumns,
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    const surahTag = exportSurahFilter > 0 ? `_sourate_${exportSurahFilter}` : '_114_sourates';

    if (finalFormat === 'csv') {
      const csvData = exportWolofDatabaseCsv(opts);
      const filename = `alquran_tafsir_wolof_audit_experts${surahTag}_${dateStr}.csv`;
      triggerFileDownload(csvData, filename, 'text/csv;charset=utf-8;');
      setSaveStatus(`✓ Export CSV réussi (${exportPreviewVerses.length} versets exportés pour révision externe).`);
    } else {
      const jsonData = exportWolofDatabaseJson(opts);
      const filename = `alquran_tafsir_wolof_base${surahTag}_${dateStr}.json`;
      triggerFileDownload(jsonData, filename, 'application/json;charset=utf-8;');
      setSaveStatus(`✓ Export JSON réussi (${exportPreviewVerses.length} versets exportés).`);
    }
    setTimeout(() => setSaveStatus(null), 4000);
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
            Gestion des traductions, commentaires en wolof et export de cohérence pour experts externes
          </p>
        </div>
      </div>

      {/* Backup and Export Banner */}
      <div className="bg-[#176B45]/10 dark:bg-white/5 rounded-2xl p-4 border border-[#C5A45B]/40 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#176B45] dark:text-[#C5A45B] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#176B45]" />
              <span>Export & Cohérence pour Experts Externes (Oulémas & Linguistes)</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Exportez la base au format <strong>JSON</strong> ou <strong>CSV (Excel / Google Sheets)</strong> pour faire relire et certifier les traductions.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handlePerformExport('json')}
              className="px-3 py-1.5 bg-[#176B45] hover:bg-[#1f8054] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow"
              title="Exporter au format JSON structuré"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => handlePerformExport('csv')}
              className="px-3 py-1.5 bg-[#C5A45B] hover:bg-[#d4b56c] text-[#176B45] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow"
              title="Exporter au format CSV pour Excel et tableurs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV (Excel)</span>
            </button>

            <button
              onClick={() => setShowExportPanel(!showExportPanel)}
              className="px-3 py-1.5 bg-white dark:bg-[#202020] border border-[#C5A45B]/60 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5 text-[#176B45]" />
              <span>Options avancées</span>
              {showExportPanel ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </button>

            <label className="px-3 py-1.5 bg-white dark:bg-black/30 border border-[#C5A45B]/50 hover:bg-slate-50 dark:hover:bg-black/50 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#176B45]" />
              <span>Importer JSON</span>
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>
        </div>

        {/* Expandable Advanced Export Panel */}
        {showExportPanel && (
          <div className="mt-4 pt-4 border-t border-[#C5A45B]/30 space-y-4">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Le fichier <strong>CSV</strong> inclut un préfixe <strong>UTF-8 BOM</strong> garantissant que les lettres arabes uthmani (ex: ٱلْحَمْدُ لِلَّهِ) et les caractères wolofs (ex: ñ, ó, é, à, ë) s'affichent sans aucune corruption dans Microsoft Excel et Google Sheets. Les colonnes <em>Avis_Expert_Externe</em> et <em>Commentaires_Corrections_Linguistiques</em> sont prévues pour la relecture externe.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Format selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Format du fichier :
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                      exportFormat === 'csv'
                        ? 'bg-[#176B45] text-white border-[#176B45]'
                        : 'bg-white dark:bg-[#202020] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>CSV (Tableur)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('json')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                      exportFormat === 'json'
                        ? 'bg-[#176B45] text-white border-[#176B45]'
                        : 'bg-white dark:bg-[#202020] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>JSON (Brut)</span>
                  </button>
                </div>
              </div>

              {/* Scope selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Périmètre des versets :
                </label>
                <select
                  value={exportScope}
                  onChange={(e) => setExportScope(e.target.value as any)}
                  className="w-full bg-white dark:bg-[#202020] border border-[#C5A45B]/40 rounded-lg px-2.5 py-1.5 text-xs outline-none font-medium"
                >
                  <option value="active_verses">Base active (Versets renseignés)</option>
                  <option value="all_quran">Mushaf complet (Les 6 236 versets)</option>
                  <option value="pending_only">Versets en attente de validation (Pending)</option>
                  <option value="validated_only">Versets validés uniquement (Validé)</option>
                  <option value="missing_only">Versets manquants (À traduire)</option>
                </select>
              </div>

              {/* Surah filter */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Filtrer par sourate :
                </label>
                <select
                  value={exportSurahFilter}
                  onChange={(e) => setExportSurahFilter(parseInt(e.target.value, 10))}
                  className="w-full bg-white dark:bg-[#202020] border border-[#C5A45B]/40 rounded-lg px-2.5 py-1.5 text-xs outline-none font-medium"
                >
                  <option value={0}>Toutes les sourates (1 à 114)</option>
                  {SURAHS_LIST.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id}. {s.name_simple} ({s.name_wolof})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Delimiter (for CSV) */}
              {exportFormat === 'csv' && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Séparateur CSV :
                  </span>
                  <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="delimiter"
                      checked={exportDelimiter === ';'}
                      onChange={() => setExportDelimiter(';')}
                      className="accent-[#176B45]"
                    />
                    <span>Point-virgule (;) [Recommandé Excel FR/SN]</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-xs cursor-pointer ml-2">
                    <input
                      type="radio"
                      name="delimiter"
                      checked={exportDelimiter === ','}
                      onChange={() => setExportDelimiter(',')}
                      className="accent-[#176B45]"
                    />
                    <span>Virgule (,) [Standard US]</span>
                  </label>
                </div>
              )}

              {/* Include review columns */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeReviewCols"
                  checked={includeReviewColumns}
                  onChange={(e) => setIncludeReviewColumns(e.target.checked)}
                  className="w-4 h-4 rounded text-[#176B45] accent-[#176B45]"
                />
                <label htmlFor="includeReviewCols" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Ajouter colonnes d'expertise (Avis, Corrections, Signature)
                </label>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[#C5A45B]/20">
              <span className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B]">
                {exportPreviewVerses.length} verset{exportPreviewVerses.length > 1 ? 's' : ''} sélectionné{exportPreviewVerses.length > 1 ? 's' : ''} pour l'exportation
              </span>

              <button
                onClick={() => handlePerformExport()}
                className="px-4 py-2 bg-[#176B45] hover:bg-[#1f8054] text-white text-xs font-bold rounded-xl transition-all shadow flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger le fichier ({exportFormat.toUpperCase()}) pour les experts</span>
              </button>
            </div>
          </div>
        )}
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
            Traduction française:
          </label>
          <input
            type="text"
            value={frenchTranslation}
            onChange={(e) => setFrenchTranslation(e.target.value)}
            placeholder="Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux."
            className="w-full bg-white dark:bg-[#202020] border border-[#C5A45B]/40 rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* English Translation */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            English Translation:
          </label>
          <input
            type="text"
            value={englishTranslation}
            onChange={(e) => setEnglishTranslation(e.target.value)}
            placeholder="In the name of Allah, the Entirely Merciful, the Especially Merciful."
            className="w-full bg-white dark:bg-[#202020] border border-[#C5A45B]/40 rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* Source de la traduction & Statut de validation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Source de la traduction Wolof:
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Ex: Commission des Oulémas du Sénégal - Traduction Wolof"
              className="w-full bg-white dark:bg-[#202020] border border-[#C5A45B]/40 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Statut de validation théologique:
            </label>
            <select
              value={validationStatus}
              onChange={(e) => setValidationStatus(e.target.value as any)}
              className="w-full bg-white dark:bg-[#202020] border border-[#C5A45B]/40 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none font-semibold cursor-pointer"
            >
              <option value="validated">✓ Validé (Approuvé par les Oulémas)</option>
              <option value="pending">⏳ En attente de validation (Revue en cours)</option>
              <option value="missing">○ Non traduit (Manquant)</option>
            </select>
          </div>
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
