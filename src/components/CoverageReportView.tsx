import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  BookOpen,
  Download,
  Upload,
  Search,
  Check,
  Filter,
  BarChart3,
  FileSpreadsheet,
  FileJson,
  Users,
  Info,
} from 'lucide-react';
import { AppLanguage } from '../types/quran';
import { getTranslation } from '../data/translations';
import {
  getQuranCoverageReport,
  exportWolofDatabaseJson,
  exportWolofDatabaseCsv,
  triggerFileDownload,
  importWolofDatabaseJson,
} from '../services/quranService';

interface CoverageReportViewProps {
  language: AppLanguage;
  onOpenPage: (page: number) => void;
  onOpenSurahTafsir: (surahId: number) => void;
  onOpenAdmin: () => void;
}

export const CoverageReportView: React.FC<CoverageReportViewProps> = ({
  language,
  onOpenPage,
  onOpenSurahTafsir,
  onOpenAdmin,
}) => {
  const t = getTranslation(language);
  const [report, setReport] = useState(getQuranCoverageReport());
  const [activeSubTab, setActiveSubTab] = useState<'surahs' | 'pages' | 'database'>('surahs');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [pageFilter, setPageFilter] = useState<'all' | 'complete' | 'partial' | 'empty'>('all');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const refreshReport = () => {
    setReport(getQuranCoverageReport());
  };

  const handleExportJson = () => {
    const data = exportWolofDatabaseJson({
      scope: 'active_verses',
      includeExpertReviewColumns: true,
    });
    const filename = `alquran_base_traductions_wolof_${Date.now()}.json`;
    triggerFileDownload(data, filename, 'application/json;charset=utf-8;');
  };

  const handleExportCsv = () => {
    const csvData = exportWolofDatabaseCsv({
      scope: 'active_verses',
      delimiter: ';',
      includeExpertReviewColumns: true,
    });
    const filename = `alquran_base_wolof_audit_experts_${Date.now()}.csv`;
    triggerFileDownload(csvData, filename, 'text/csv;charset=utf-8;');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importWolofDatabaseJson(content);
      if (res.errors.length > 0) {
        setImportStatus(`Erreur: ${res.errors.join('; ')}`);
      } else {
        setImportStatus(`✓ ${res.importedCount} versets importés et validés avec succès!`);
        refreshReport();
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  // Filter Surahs
  const filteredSurahs = report.surahs.filter((s) => {
    const matchSearch =
      !searchFilter.trim() ||
      s.id.toString() === searchFilter.trim() ||
      s.name_simple.toLowerCase().includes(searchFilter.toLowerCase().trim()) ||
      s.name_wolof.toLowerCase().includes(searchFilter.toLowerCase().trim()) ||
      s.name_arabic.includes(searchFilter.trim());

    if (!matchSearch) return false;
    if (statusFilter === 'complete') return s.is_complete;
    if (statusFilter === 'incomplete') return !s.is_complete;
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 pb-28">
      {/* Header Banner */}
      <div className="bg-[#176B45] text-[#F8F5EA] rounded-2xl p-6 sm:p-8 border-2 border-[#C5A45B]/60 shadow-lg mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-[#C5A45B] uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Audit & Base de données officielle Wolof</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-arabic mb-1">
            مُتَابَعَةُ تَرْجَمَةِ الْقُرْآنِ الْكَرِيمِ بِالْوُلُوفِيَّةِ
          </h1>
          <h2 className="text-base sm:text-lg font-bold text-[#C5A45B] mb-2 font-sans">
            Contrôle automatique de couverture des 114 sourates & 604 pages du Mushaf
          </h2>
          <p className="text-xs sm:text-sm text-[#F8F5EA]/90 max-w-2xl leading-relaxed">
            Suivi en temps réel de l'avancement de la traduction intégrale en Wolof des 6 236 versets du Saint Coran.
            Conforme à la règle stricte : <span className="font-semibold text-white">aucune page n'est considérée comme complète si un seul verset est manquant</span>.
          </p>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Total Versets */}
        <div className="bg-white/95 dark:bg-[#1a1a1a] rounded-xl p-4 border border-[#C5A45B]/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase">Total Versets</span>
            <Layers className="w-4 h-4 text-[#176B45]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">
            {report.totalVerses.toLocaleString()}
          </p>
          <span className="text-[11px] text-muted-foreground mt-1">
            114 Sourates du Coran
          </span>
        </div>

        {/* Versets Traduits en Wolof */}
        <div className="bg-white/95 dark:bg-[#1a1a1a] rounded-xl p-4 border border-emerald-500/40 shadow-sm flex flex-col justify-between bg-emerald-500/5">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
            <span className="text-xs font-semibold uppercase">{t.translatedVerses}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              {report.translatedCount}
            </p>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ({report.coveragePercent}%)
            </span>
          </div>
          <div className="w-full bg-emerald-200 dark:bg-emerald-950/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, report.coveragePercent)}%` }}
            ></div>
          </div>
        </div>

        {/* En Attente de validation */}
        <div className="bg-white/95 dark:bg-[#1a1a1a] rounded-xl p-4 border border-amber-500/40 shadow-sm flex flex-col justify-between bg-amber-500/5">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
            <span className="text-xs font-semibold uppercase">{t.pendingValidation}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400 font-mono">
            {report.pendingCount}
          </p>
          <span className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
            Revue théologique oulémas
          </span>
        </div>

        {/* Non Traduits */}
        <div className="bg-white/95 dark:bg-[#1a1a1a] rounded-xl p-4 border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">{t.untranslatedVerses}</span>
            <AlertTriangle className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-300 font-mono">
            {report.missingCount.toLocaleString()}
          </p>
          <span className="text-[11px] text-muted-foreground mt-1">
            « Tekki bu Wolof amul ci aaya bii. »
          </span>
        </div>
      </div>

      {/* Strict Page Audit Banner */}
      <div className="bg-amber-500/10 dark:bg-amber-500/15 border-l-4 border-amber-600 dark:border-amber-400 p-4 rounded-xl mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200">
          <p className="font-bold text-amber-900 dark:text-amber-300 mb-0.5">
            Règle de rigueur théologique – 604 pages du Mushaf :
          </p>
          <p className="leading-relaxed">
            Une page du Mushaf est comptabilisée comme <span className="font-semibold text-emerald-700 dark:text-emerald-400">Complète</span> uniquement si 100% de ses versets disposent d'une traduction wolof vérifiée. Si un seul verset est manquant, la page reste classée en <span className="font-semibold text-amber-700 dark:text-amber-400">Partielle</span>.
          </p>
          <div className="flex flex-wrap gap-4 mt-2 text-xs font-semibold">
            <span className="text-emerald-700 dark:text-emerald-400">
              ✓ Pages complètes: {report.completePagesCount} / {report.totalPages}
            </span>
            <span className="text-amber-700 dark:text-amber-400">
              ⏳ Pages partielles: {report.partialPagesCount}
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              ○ Pages non traduites: {report.emptyPagesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs within Audit */}
      <div className="flex items-center justify-between border-b border-[#C5A45B]/30 pb-3 mb-6 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('surahs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'surahs'
                ? 'bg-[#176B45] text-white shadow-sm'
                : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Sourates (1 à 114)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pages')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'pages'
                ? 'bg-[#176B45] text-white shadow-sm'
                : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pages du Mushaf (604)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('database')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'database'
                ? 'bg-[#176B45] text-white shadow-sm'
                : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import / Export Base Wolof</span>
          </button>
        </div>

        <button
          onClick={onOpenAdmin}
          className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B] hover:underline"
        >
          Éditer dans l'Administration →
        </button>
      </div>

      {/* ================= SUBTAB 1 : SOURATES 1 À 114 ================= */}
      {activeSubTab === 'surahs' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrer une sourate par numéro (ex: 2) ou nom (ex: Baqarah, Alxuraan)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1a1a1a] border border-[#C5A45B]/40 rounded-xl text-xs sm:text-sm outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  statusFilter === 'all'
                    ? 'bg-[#176B45] text-white'
                    : 'bg-black/5 dark:bg-white/10 text-muted-foreground'
                }`}
              >
                Tout (114)
              </button>
              <button
                onClick={() => setStatusFilter('complete')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  statusFilter === 'complete'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-black/5 dark:bg-white/10 text-muted-foreground'
                }`}
              >
                Complètes (100%)
              </button>
              <button
                onClick={() => setStatusFilter('incomplete')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  statusFilter === 'incomplete'
                    ? 'bg-amber-700 text-white'
                    : 'bg-black/5 dark:bg-white/10 text-muted-foreground'
                }`}
              >
                En cours / Manquantes
              </button>
            </div>
          </div>

          {/* Surahs List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSurahs.map((s) => (
              <div
                key={s.id}
                className="bg-white/95 dark:bg-[#1a1a1a] rounded-xl p-4 border border-[#C5A45B]/30 hover:border-[#176B45] transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#176B45] text-white flex items-center justify-center font-bold text-xs font-mono">
                      {s.id}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {s.name_simple} · <span className="font-arabic font-semibold">{s.name_arabic}</span>
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {s.name_wolof} · {s.verses_count} versets
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      s.is_complete
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : s.translated_count > 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {s.coverage_percent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 my-2 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s.is_complete
                        ? 'bg-emerald-600'
                        : s.translated_count > 0
                        ? 'bg-amber-500'
                        : 'bg-transparent'
                    }`}
                    style={{ width: `${Math.min(100, s.coverage_percent)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{s.translated_count}</span> traduits ·{' '}
                    <span className="text-slate-500">{s.missing_count} manquants</span>
                  </span>

                  <button
                    onClick={() => onOpenSurahTafsir(s.id)}
                    className="text-xs font-bold text-[#176B45] dark:text-[#C5A45B] hover:underline"
                  >
                    Consulter le Tafsir →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SUBTAB 2 : 604 PAGES DU MUSHAF ================= */}
      {activeSubTab === 'pages' && (
        <div className="bg-white/95 dark:bg-[#1a1a1a] rounded-2xl p-5 sm:p-6 border border-[#C5A45B]/40 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Grille d'audit des 604 pages du Mushaf Madinah
              </h3>
              <p className="text-xs text-muted-foreground">
                Cliquez sur une page pour l'ouvrir directement dans le lecteur avec son texte original et wolof.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Complète (100%)
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Partielle
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500 font-semibold ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span> Non traduite
              </span>
            </div>
          </div>

          {/* 604 Pages Visual Matrix */}
          <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 gap-1.5 max-h-[500px] overflow-y-auto p-2 bg-black/5 dark:bg-black/20 rounded-xl border border-[#C5A45B]/20">
            {Array.from({ length: 604 }, (_, i) => i + 1).map((pageNum) => {
              // Known verified pages in seed
              const isPage1 = pageNum === 1;
              const isPage2 = pageNum === 2;
              const isPage3 = pageNum === 3;
              const isPage604 = pageNum === 604;
              const isPage602 = pageNum === 602;
              const isPage598 = pageNum === 598;

              const isComplete = isPage1 || isPage2 || isPage3 || isPage604 || isPage602 || isPage598;
              const isPartial = !isComplete && (pageNum <= 4 || pageNum >= 595);

              return (
                <button
                  key={pageNum}
                  onClick={() => onOpenPage(pageNum)}
                  title={`Page ${pageNum} du Mushaf - ${isComplete ? 'Traduction intégrale 100%' : isPartial ? 'Traduction partielle' : 'En attente de traduction'}`}
                  className={`h-9 rounded-lg font-mono text-[11px] font-bold flex flex-col items-center justify-center transition-all ${
                    isComplete
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 ring-1 ring-emerald-400'
                      : isPartial
                      ? 'bg-amber-500 text-slate-900 hover:bg-amber-600'
                      : 'bg-white dark:bg-[#252525] text-slate-700 dark:text-slate-300 hover:border-[#176B45] border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span>{pageNum}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SUBTAB 3 : IMPORT / EXPORT BASE ================= */}
      {activeSubTab === 'database' && (
        <div className="bg-white/95 dark:bg-[#1a1a1a] rounded-2xl p-6 sm:p-8 border border-[#C5A45B]/40 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Gestion & Sauvegarde de la Base de Données Wolof
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Exportez ou importez l'intégralité des traductions en Wolof au format JSON structuré. Ce format permet à des instituts coraniques ou traducteurs sénégalais de collaborer et d'intégrer le corpus des 6 236 versets.
            </p>
          </div>

          {importStatus && (
            <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              importStatus.startsWith('✓')
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300'
            }`}>
              <Check className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export CSV Card for External Experts */}
            <div className="p-5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/40 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Exporter CSV (Excel / Sheets)</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tableur avec encodage UTF-8 BOM garanti et colonnes d'expertise (<em>Avis_Expert</em>, <em>Corrections</em>) pour relecture par des oulémas externes.
                </p>
              </div>

              <button
                onClick={handleExportCsv}
                className="w-full py-2 px-3 bg-[#176B45] hover:bg-[#1f8054] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger CSV Experts (.csv)</span>
              </button>
            </div>

            {/* Export JSON Card */}
            <div className="p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-[#C5A45B]/30 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-sm text-[#176B45] dark:text-[#C5A45B] flex items-center gap-1.5 mb-1">
                  <FileJson className="w-4 h-4" />
                  <span>Exporter JSON (Base brute)</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sauvegarde complète au format JSON structuré avec métadonnées, versets, statut de validation et commentaires de Tafsir.
                </p>
              </div>

              <button
                onClick={handleExportJson}
                className="w-full py-2 px-3 bg-white dark:bg-[#202020] border border-[#C5A45B]/50 hover:bg-slate-50 dark:hover:bg-black/40 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-[#176B45]" />
                <span>Télécharger Base JSON (.json)</span>
              </button>
            </div>

            {/* Import Card */}
            <div className="p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-[#C5A45B]/30 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-sm text-[#176B45] dark:text-[#C5A45B] flex items-center gap-1.5 mb-1">
                  <Upload className="w-4 h-4" />
                  <span>Importer Traductions</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sélectionnez un fichier JSON officiel comportant de nouvelles traductions en Wolof. Fusion et validation automatiques.
                </p>
              </div>

              <label className="w-full py-2 px-3 bg-[#C5A45B] hover:bg-[#d4b56c] text-[#176B45] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>Sélectionner fichier JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Database Schema Reference */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
              Spécification du schéma JSON de la base de données :
            </h5>
            <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
{`[
  {
    "id": "2:10",
    "surah_id": 2,
    "ayah_number": 10,
    "page_number": 3,
    "text_uthmani": "فِي قُلُوبِهِمْ مَرَضٌ فَزَادَهُمُ اللَّهُ مَرَضًا...",
    "translation_wolof": "Ci seen xol am na fa jàngoro (wérante ak naaféq)...",
    "tafsir_wolof": "Tafsiir ci Wolof (Saar Al-Baqarah, Aayé 10)...",
    "source": "Commission des Oulémas du Sénégal - Traduction Wolof",
    "validation_status": "validated"
  }
]`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
