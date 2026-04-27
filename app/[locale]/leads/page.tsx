'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Sidebar } from '../../../components/Sidebar';
import { TopBar } from '../../../components/TopBar';
import { LeadDrawer } from '../../../components/LeadDrawer';
import { leadsApi, scoringApi, outreachApi } from '../../../lib/api';
import { TierBadge } from '../../../components/TierBadge';
import {
  type LeadResult,
  type LeadSearchResponse,
  type LeadRecord,
  type LeadsListResponse,
} from '../../../lib/types';
import { toast } from '../../../lib/toast';
import { cn, generateUUID } from '../../../lib/cn';
import { useAuth } from '../../../lib/auth';
import { LinkedInIcon, NotionIcon, AirtableIcon } from '../../../components/icons/BrandIcons';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  'bg-primary/10 text-primary',
  'bg-tertiary/10 text-tertiary',
  'bg-secondary/10 text-secondary',
  'bg-[#0A66C2]/10 text-[#0A66C2]',
  'bg-outline/10 text-on-surface-variant',
];
function avatarColor(initials: string): string {
  if (!initials || initials === '?') return 'bg-surface-container-high text-on-surface-variant';
  return AVATAR_PALETTES[initials.charCodeAt(0) % AVATAR_PALETTES.length];
}
function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return parts[0]?.[0]?.toUpperCase() ?? '?';
}

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';

// ─── Shared badge components ─────────────────────────────────────────────────

function SourceBadge({ source }: { source: string }) {
  const t = useTranslations('Leads');
  if (source === 'linkedin_profile') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0A66C2]/10 text-[#0A66C2]">
        <span className="material-symbols-outlined text-[11px]">person</span>
        {t('linkedinProfile')}
      </span>
    );
  }
  if (source === 'linkedin_company') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0A66C2]/10 text-[#0A66C2]">
        <span className="material-symbols-outlined text-[11px]">business</span>
        {t('linkedinCompany')}
      </span>
    );
  }
  if (source === 'datagouv') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-[11px]">account_balance</span>
        {t('sourceDataGouv')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface-variant">
      <span className="material-symbols-outlined text-[11px]">language</span>
      {t('web')}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const cls =
    pct >= 85 ? 'text-green-600 bg-green-500/10'
    : pct >= 70 ? 'text-yellow-600 bg-yellow-500/10'
    : 'text-on-surface-variant bg-surface-container';
  return <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', cls)}>{pct}%</span>;
}

const STATUS_STYLES: Record<string, string> = {
  new:       'bg-primary/10 text-primary',
  contacted: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  qualified: 'bg-green-500/10 text-green-700 dark:text-green-400',
  converted: 'bg-tertiary/10 text-tertiary',
  rejected:  'bg-surface-container text-on-surface-variant',
};

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('Leads');
  const labels: Record<string, string> = {
    new: t('statusNew'), contacted: t('statusContacted'),
    qualified: t('statusQualified'), converted: t('statusConverted'), rejected: t('statusRejected'),
  };
  return (
    <span className={cn('inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide', STATUS_STYLES[status] ?? STATUS_STYLES.new)}>
      {labels[status] ?? status}
    </span>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-surface-container-high shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-surface-container-high rounded-full w-3/4" />
          <div className="h-3 bg-surface-container-high rounded-full w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 bg-surface-container-high rounded-full" />
        <div className="h-5 w-20 bg-surface-container-high rounded-full" />
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="h-3 bg-surface-container-high rounded-full w-full" />
        <div className="h-3 bg-surface-container-high rounded-full w-4/5" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-surface-container-high rounded-xl" />
        <div className="flex-1 h-10 bg-surface-container-high rounded-xl" />
      </div>
    </div>
  );
}

// ─── Search result card ────────────────────────────────────────────────────────

interface SearchCardProps {
  lead: LeadResult;
  savedDbId: string | null;
  saving: boolean;
  onSave: (lead: LeadResult) => void;
  onOpen: (lead: LeadResult) => void;
}

function SearchCard({ lead, savedDbId, saving, onSave, onOpen }: SearchCardProps) {
  const t = useTranslations('Leads');
  const initials = lead.avatar_initials;
  const displayName = lead.name ?? lead.company ?? '—';
  const isSaved = savedDbId !== null;

  return (
    <article
      onClick={() => onOpen(lead)}
      className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col gap-3.5 cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center font-headline font-black text-base shrink-0', avatarColor(initials))}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-sm text-on-surface truncate leading-tight group-hover:text-primary transition-colors">{displayName}</p>
            <ScoreBadge score={lead.relevance_score} />
          </div>
          {lead.job_title && <p className="text-xs text-on-surface-variant mt-0.5 truncate">{lead.job_title}</p>}
          {lead.company && lead.name && <p className="text-xs text-primary/80 font-semibold mt-0.5 truncate">{lead.company}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <SourceBadge source={lead.source} />
        {lead.location && (
          <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant">
            <span className="material-symbols-outlined text-[11px]">location_on</span>
            {lead.location}
          </span>
        )}
      </div>
      {lead.summary && <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 flex-1">{lead.summary}</p>}
      <div className="flex gap-2 mt-auto pt-1">
        <a
          href={lead.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] font-bold rounded-xl text-xs transition-colors"
        >
          <LinkedInIcon size={14} />
          LinkedIn
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); !isSaved && !saving && onSave(lead); }}
          disabled={isSaved || saving}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 font-bold rounded-xl text-xs transition-all',
            isSaved
              ? 'bg-green-500/10 text-green-600 dark:text-green-400 cursor-default'
              : saving
                ? 'bg-primary/10 text-primary opacity-60 cursor-wait'
                : 'bg-primary/10 hover:bg-primary/20 text-primary active:scale-95',
          )}
        >
          <span className="material-symbols-outlined text-[13px]">
            {isSaved ? 'bookmark' : saving ? 'autorenew' : 'bookmark_add'}
          </span>
          {isSaved ? t('savedBtn') : t('saveBtn')}
        </button>
      </div>
    </article>
  );
}

// ─── Search Lead Detail Panel ─────────────────────────────────────────────────

interface SearchLeadDetailProps {
  lead: LeadResult;
  savedDbId: string | null;
  saving: boolean;
  onSave: (lead: LeadResult) => void;
  onClose: () => void;
}

function SearchLeadDetail({ lead, savedDbId, saving, onSave, onClose }: SearchLeadDetailProps) {
  const t = useTranslations('Leads');
  const initials = lead.avatar_initials;
  const displayName = lead.name ?? lead.company ?? '—';
  const isSaved = savedDbId !== null;
  const pct = Math.round(lead.relevance_score * 100);

  const scoreColor =
    pct >= 70 ? 'text-green-600 bg-green-500/10'
    : pct >= 40 ? 'text-yellow-600 bg-yellow-500/10'
    : 'text-on-surface-variant bg-surface-container';

  const barColor =
    pct >= 70 ? 'bg-green-500'
    : pct >= 40 ? 'bg-yellow-500'
    : 'bg-outline/40';

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-on-surface/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col bg-surface-container-lowest shadow-[0px_24px_48px_rgba(26,28,31,0.12)] animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-start gap-3 bg-surface-container-low px-5 py-4 shrink-0">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center font-headline font-black text-lg shrink-0', avatarColor(initials))}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-on-surface leading-tight truncate">{displayName}</p>
            {lead.job_title && <p className="text-sm text-on-surface-variant truncate mt-0.5">{lead.job_title}</p>}
            {lead.company && lead.name && (
              <p className="text-xs text-primary font-semibold mt-0.5 truncate">{lead.company}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Relevance score */}
          <section className="rounded-xl bg-surface-container p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Correspondance</span>
              <span className={cn('text-sm font-black px-2.5 py-0.5 rounded-full', scoreColor)}>{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-on-surface-variant">
              {pct >= 70 ? 'Correspondance élevée — lead très pertinent.'
                : pct >= 40 ? 'Correspondance modérée — lead potentiellement intéressant.'
                : 'Correspondance faible — à qualifier manuellement.'}
            </p>
          </section>

          {/* Informations */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Informations</h3>
            <div className="space-y-2">
              {lead.company && (
                <div className="flex items-center gap-2.5 text-sm">
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant shrink-0">business</span>
                  <span className="text-on-surface font-medium">{lead.company}</span>
                </div>
              )}
              {lead.location && (
                <div className="flex items-center gap-2.5 text-sm">
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant shrink-0">location_on</span>
                  <span className="text-on-surface">{lead.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm">
                <span className="material-symbols-outlined text-[17px] text-on-surface-variant shrink-0">category</span>
                <SourceBadge source={lead.source} />
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <span className="material-symbols-outlined text-[17px] text-on-surface-variant shrink-0 mt-0.5">link</span>
                <a
                  href={lead.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all text-xs leading-relaxed"
                >
                  {lead.url.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          </section>

          {/* Summary */}
          {lead.summary && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Résumé</h3>
              <p className="text-sm leading-relaxed text-on-surface bg-surface-container rounded-xl p-3">
                {lead.summary}
              </p>
            </section>
          )}

          {/* Hint to save */}
          {!isSaved && (
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">info</span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Sauvegardez ce lead pour accéder à l'enrichissement IA, au scoring et aux séquences d'outreach.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 bg-surface-container-low px-5 py-3 shrink-0">
          <a
            href={lead.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] font-bold rounded-xl text-sm transition-colors"
          >
            <LinkedInIcon size={15} />
            Voir le profil
          </a>
          <button
            onClick={() => !isSaved && !saving && onSave(lead)}
            disabled={isSaved || saving}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 font-bold rounded-xl text-sm transition-all',
              isSaved
                ? 'bg-green-500/10 text-green-600 cursor-default'
                : saving
                  ? 'bg-primary/10 text-primary opacity-60 cursor-wait'
                  : 'bg-primary text-on-primary hover:opacity-90 active:scale-95 shadow-sm shadow-primary/20',
            )}
          >
            <span className="material-symbols-outlined text-[15px]">
              {isSaved ? 'bookmark' : saving ? 'autorenew' : 'bookmark_add'}
            </span>
            {isSaved ? t('savedBtn') : t('saveBtn')}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Import modal ─────────────────────────────────────────────────────────────

interface ImportModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

const LS_AIRTABLE = 'avv_airtable_cfg';
const LS_NOTION   = 'avv_notion_cfg';

function loadAirtableCfg() {
  try { return JSON.parse(localStorage.getItem(LS_AIRTABLE) ?? '{}'); } catch { return {}; }
}
function loadNotionCfg() {
  try { return JSON.parse(localStorage.getItem(LS_NOTION) ?? '{}'); } catch { return {}; }
}

function ImportModal({ onClose, onImportSuccess }: ImportModalProps) {
  const [tab, setTab] = useState<'airtable' | 'notion'>('airtable');
  const [airtableKey, setAirtableKey] = useState('');
  const [airtableBase, setAirtableBase] = useState('');
  const [airtableTable, setAirtableTable] = useState('Leads');
  const [notionToken, setNotionToken] = useState('');
  const [notionDb, setNotionDb] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);

  useEffect(() => {
    const a = loadAirtableCfg();
    const n = loadNotionCfg();
    if (a.api_key)    setAirtableKey(a.api_key);
    if (a.base_id)    setAirtableBase(a.base_id);
    if (a.table_name) setAirtableTable(a.table_name);
    if (n.token)       setNotionToken(n.token);
    if (n.database_id) setNotionDb(n.database_id);
  }, []);

  const handleAirtableImport = async () => {
    if (!airtableKey || !airtableBase) return;
    setLoading(true); setResult(null);
    try {
      const res = await leadsApi.importAirtable({
        api_key: airtableKey,
        base_id: airtableBase,
        table_name: airtableTable || 'Leads',
      }) as { imported: number; errors: string[] };
      setResult(res);
      if (res.imported > 0) onImportSuccess();
    } catch (err: unknown) {
      setResult({ imported: 0, errors: [err instanceof Error ? err.message : 'Erreur inconnue'] });
    } finally { setLoading(false); }
  };

  const handleNotionImport = async () => {
    if (!notionToken || !notionDb) return;
    setLoading(true); setResult(null);
    try {
      const res = await leadsApi.importNotion({
        token: notionToken,
        database_id: notionDb,
      }) as { imported: number; errors: string[] };
      setResult(res);
      if (res.imported > 0) onImportSuccess();
    } catch (err: unknown) {
      setResult({ imported: 0, errors: [err instanceof Error ? err.message : 'Erreur inconnue'] });
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/20 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
          <div>
            <h2 className="font-headline font-bold text-on-surface">Importer des leads</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Synchronisation bidirectionnelle</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          <button onClick={() => { setTab('airtable'); setResult(null); }}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
              tab === 'airtable' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant')}>
            <AirtableIcon size={16} />
            Airtable
          </button>
          <button onClick={() => { setTab('notion'); setResult(null); }}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
              tab === 'notion' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant')}>
            <NotionIcon size={16} />
            Notion
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {tab === 'airtable' ? (
            <div className="space-y-3">
              <ExportField label="API Key" placeholder="pat..." value={airtableKey} onChange={setAirtableKey} secret />
              <ExportField label="Base ID" placeholder="app..." value={airtableBase} onChange={setAirtableBase} />
              <ExportField label="Table" value={airtableTable} onChange={setAirtableTable} placeholder="Leads" />
              {result && <ImportResultBanner result={result} />}
              <button onClick={handleAirtableImport} disabled={loading}
                className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl text-sm transition-all">
                {loading ? 'Importation...' : 'Lancer l\'importation'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <ExportField label="Token" placeholder="secret_..." value={notionToken} onChange={setNotionToken} secret />
              <ExportField label="Database ID" placeholder="..." value={notionDb} onChange={setNotionDb} />
              {result && <ImportResultBanner result={result} />}
              <button onClick={handleNotionImport} disabled={loading}
                className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl text-sm transition-all">
                {loading ? 'Importation...' : 'Lancer l\'importation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImportResultBanner({ result }: { result: { imported: number; errors: string[] } }) {
  return (
    <div className={cn('rounded-xl p-3 text-xs bg-surface-container-low', result.errors.length > 0 ? 'text-error' : 'text-green-600')}>
      <p className="font-bold">{result.imported} lead(s) importé(s) ou mis à jour.</p>
      {result.errors.map((e, i) => <p key={i} className="opacity-70 mt-1">{e}</p>)}
    </div>
  );
}

// ─── Export modal ─────────────────────────────────────────────────────────────

type ExportTab = 'csv' | 'airtable' | 'notion';

interface ExportModalProps {
  leads: LeadRecord[];
  selectedIds: Set<string>;
  onClose: () => void;
}

function ExportModal({ leads, selectedIds, onClose }: ExportModalProps) {
  const [tab, setTab] = useState<ExportTab>('csv');
  const [airtableKey, setAirtableKey] = useState('');
  const [airtableBase, setAirtableBase] = useState('');
  const [airtableTable, setAirtableTable] = useState('Leads');
  const [notionToken, setNotionToken] = useState('');
  const [notionDb, setNotionDb] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ exported: number; errors: string[] } | null>(null);

  useEffect(() => {
    const a = loadAirtableCfg();
    const n = loadNotionCfg();
    if (a.api_key)    setAirtableKey(a.api_key);
    if (a.base_id)    setAirtableBase(a.base_id);
    if (a.table_name) setAirtableTable(a.table_name);
    if (n.token)       setNotionToken(n.token);
    if (n.database_id) setNotionDb(n.database_id);
  }, []);

  const targets = selectedIds.size > 0
    ? leads.filter((l) => selectedIds.has(l.id))
    : leads;

  const handleCsvExport = () => {
    const headers = [
      'Entreprise', 'Contact', 'Poste', 'Email', 'Téléphone',
      'LinkedIn', 'Site Web', 'Localisation', 'Secteur',
      'Score', 'Palier', 'Statut', 'Source', 'Résumé', 'Notes',
    ];
    const rows = targets.map((l) => [
      l.company_name ?? '',
      l.contact_name ?? '',
      l.contact_title ?? '',
      l.contact_email ?? '',
      l.contact_phone ?? '',
      l.linkedin_url ?? '',
      l.website_url ?? '',
      l.location ?? '',
      l.activity_sector ?? '',
      l.score ?? l.relevance_score ?? '',
      l.tier ?? '',
      l.status ?? '',
      l.source ?? '',
      (l.summary ?? '').replace(/"/g, '""'),
      (l.notes ?? '').replace(/"/g, '""'),
    ].map((v) => `"${v}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleAirtableExport = async () => {
    if (!airtableKey || !airtableBase) return;
    setLoading(true); setResult(null);
    try {
      const res = await leadsApi.exportAirtable({
        lead_ids: targets.map((l) => l.id),
        api_key: airtableKey,
        base_id: airtableBase,
        table_name: airtableTable || 'Leads',
      }) as { exported: number; errors: string[] };
      setResult(res);
    } catch (err: unknown) {
      setResult({ exported: 0, errors: [err instanceof Error ? err.message : 'Erreur inconnue'] });
    } finally { setLoading(false); }
  };

  const handleNotionExport = async () => {
    if (!notionToken || !notionDb) return;
    setLoading(true); setResult(null);
    try {
      const res = await leadsApi.exportNotion({
        lead_ids: targets.map((l) => l.id),
        token: notionToken,
        database_id: notionDb,
      }) as { exported: number; errors: string[] };
      setResult(res);
    } catch (err: unknown) {
      setResult({ exported: 0, errors: [err instanceof Error ? err.message : 'Erreur inconnue'] });
    } finally { setLoading(false); }
  };

  const TABS: { id: ExportTab; icon: string | null; label: string }[] = [
    { id: 'csv', icon: 'table_view', label: 'CSV' },
    { id: 'airtable', icon: null, label: 'Airtable' },
    { id: 'notion', icon: null, label: 'Notion' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/20 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
          <div>
            <h2 className="font-headline font-bold text-on-surface">Exporter les leads</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {targets.length} lead{targets.length > 1 ? 's' : ''}
              {selectedIds.size > 0 ? ' sélectionnés' : ' (tous)'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-6 pt-4">
          {TABS.map(({ id, icon, label }) => (
            <button key={id} onClick={() => { setTab(id); setResult(null); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                tab === id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high',
              )}>
              {icon
                ? <span className="material-symbols-outlined text-[14px]">{icon}</span>
                : id === 'airtable'
                  ? <AirtableIcon size={14} />
                  : <NotionIcon size={14} />
              }
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {tab === 'csv' && (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Télécharge un fichier <strong>.csv</strong> compatible Excel / Google Sheets avec tous les champs du lead (nom, email, score, palier, notes…).
              </p>
              <div className="bg-surface-container-low rounded-xl p-3 text-xs text-on-surface-variant font-mono">
                Entreprise, Contact, Poste, Email, Téléphone, LinkedIn, Site Web, Localisation, Secteur, Score, Palier, Statut, Source, Résumé, Notes
              </div>
              <button onClick={handleCsvExport}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Télécharger le CSV
              </button>
            </div>
          )}

          {tab === 'airtable' && (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">
                Envoie les leads directement dans une table Airtable.{' '}
                <span className="text-primary font-semibold">La table doit exister</span> avec les colonnes correspondantes.
              </p>
              <ExportField label="API Key" placeholder="patXXXXXXXXXXXXXX.XXXXXXX" value={airtableKey} onChange={setAirtableKey} secret />
              <ExportField label="Base ID" placeholder="appXXXXXXXXXXXXXX" value={airtableBase} onChange={setAirtableBase} />
              <ExportField label="Nom de la table" placeholder="Leads" value={airtableTable} onChange={setAirtableTable} />
              {result && <ExportResultBanner result={result} />}
              <button onClick={handleAirtableExport} disabled={!airtableKey || !airtableBase || loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-60 disabled:scale-100">
                {loading ? <><span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>Export en cours…</>
                  : <><AirtableIcon size={18} />Envoyer vers Airtable</>}
              </button>
            </div>
          )}

          {tab === 'notion' && (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">
                Crée une page par lead dans une base de données Notion.{' '}
                <span className="text-primary font-semibold">L'intégration doit avoir accès</span> à la base cible.
              </p>
              <ExportField label="Integration Token" placeholder="secret_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" value={notionToken} onChange={setNotionToken} secret />
              <ExportField label="Database ID" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={notionDb} onChange={setNotionDb} />
              {result && <ExportResultBanner result={result} />}
              <button onClick={handleNotionExport} disabled={!notionToken || !notionDb || loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-60 disabled:scale-100">
                {loading ? <><span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>Export en cours…</>
                  : <><NotionIcon size={18} />Envoyer vers Notion</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExportField({ label, placeholder, value, onChange, secret }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; secret?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
      <input
        type={secret ? 'password' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/40"
      />
    </div>
  );
}

function ExportResultBanner({ result }: { result: { exported: number; errors: string[] } }) {
  const ok = result.errors.length === 0;
  return (
    <div className={cn('rounded-xl p-3 text-xs font-medium flex items-start gap-2',
      ok ? 'bg-green-500/10 text-green-700' : 'bg-error/10 text-error')}>
      <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">
        {ok ? 'check_circle' : 'warning'}
      </span>
      <div>
        <p className="font-bold">{result.exported} lead{result.exported > 1 ? 's' : ''} exporté{result.exported > 1 ? 's' : ''}</p>
        {result.errors.length > 0 && (
          <ul className="mt-1 space-y-0.5 opacity-80">
            {result.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Saved leads table ────────────────────────────────────────────────────────

interface NotesEditorProps {
  lead: LeadRecord;
  onSave: (notes: string) => void;
}
function NotesEditor({ lead, onSave }: NotesEditorProps) {
  const t = useTranslations('Leads');
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(lead.notes ?? '');

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-left text-xs text-on-surface-variant hover:text-primary transition-colors line-clamp-2 max-w-[160px]"
      >
        {lead.notes || <span className="italic opacity-50">{t('editNotes')}</span>}
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-1 min-w-[200px]">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        className="w-full text-xs bg-surface-container-low rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        placeholder={t('notesPlaceholder')}
      />
      <div className="flex gap-1">
        <button
          onClick={() => { onSave(value); setEditing(false); }}
          className="flex-1 py-1 bg-primary text-on-primary text-[10px] font-bold rounded-lg"
        >
          {t('saveNotes')}
        </button>
        <button
          onClick={() => { setValue(lead.notes ?? ''); setEditing(false); }}
          className="flex-1 py-1 bg-surface-container text-on-surface-variant text-[10px] font-bold rounded-lg"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}

interface SavedTableProps {
  leads: LeadRecord[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onStatusChange: (id: string, status: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onConvert: (lead: LeadRecord) => void;
  onDelete: (id: string) => void;
  onScoreLead: (id: string) => void;
  onEnrichLead: (id: string) => void;
  onStartSequence: (id: string) => void;
  onOpenDrawer: (lead: LeadRecord) => void;
  converting: string | null;
  scoringLeadId: string | null;
  enrichingLeadId: string | null;
  sequencingLeadId: string | null;
}

const EMAIL_STATUS_STYLES: Record<string, string> = {
  valid:     'text-emerald-600 bg-emerald-500/10',
  invalid:   'text-red-600 bg-red-500/10',
  suggested: 'text-yellow-600 bg-yellow-500/10',
  unknown:   '',
};

function SavedTable({ leads, selectedIds, onToggleSelect, onToggleAll, onStatusChange, onNotesChange, onConvert, onDelete, onScoreLead, onEnrichLead, onStartSequence, onOpenDrawer, converting, scoringLeadId, enrichingLeadId, sequencingLeadId }: SavedTableProps) {
  const t = useTranslations('Leads');
  const STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'rejected'];
  const statusLabels: Record<LeadStatus, string> = {
    new: t('statusNew'), contacted: t('statusContacted'),
    qualified: t('statusQualified'), converted: t('statusConverted'), rejected: t('statusRejected'),
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-24">
        <span className="material-symbols-outlined text-[52px] text-outline/40 block mb-4">bookmark</span>
        <p className="font-bold text-on-surface mb-1">{t('emptyState')}</p>
        <p className="text-xs text-on-surface-variant">{t('emptyStateHint')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-outline-variant/10">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-bold uppercase tracking-widest">
            <th className="px-4 py-3">
              <input type="checkbox"
                checked={leads.length > 0 && selectedIds.size === leads.length}
                onChange={onToggleAll}
                className="rounded accent-primary cursor-pointer"
              />
            </th>
            <th className="text-left px-4 py-3 whitespace-nowrap">{t('colCompany')}</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">{t('colContact')}</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">{t('colActivity')}</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">{t('colWebsite')}</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">{t('colLinkedin')}</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">{t('colLocation')}</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">{t('colStatus')}</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">{t('colScore')}</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">Palier</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">Email</th>
            <th className="text-left px-4 py-3 whitespace-nowrap min-w-[180px]">{t('colNotes')}</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">{t('colActions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/5">
          {leads.map((lead) => (
            <tr key={lead.id}
              className={cn(
                'hover:bg-surface-container transition-colors group cursor-pointer',
                selectedIds.has(lead.id) ? 'bg-primary/5' : 'bg-surface-container-lowest',
              )}
              onClick={() => onOpenDrawer(lead)}
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox"
                  checked={selectedIds.has(lead.id)}
                  onChange={() => onToggleSelect(lead.id)}
                  className="rounded accent-primary cursor-pointer"
                />
              </td>
              {/* Company */}
              <td className="px-4 py-3 max-w-[160px]">
                <div className="flex items-center gap-2">
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0', avatarColor(getInitials(lead.contact_name ?? lead.company_name)))}>
                    {getInitials(lead.contact_name ?? lead.company_name)}
                  </div>
                  <p className="font-bold text-xs text-on-surface truncate">{lead.company_name ?? '—'}</p>
                </div>
              </td>
              {/* Contact */}
              <td className="px-4 py-3 max-w-[160px]">
                {lead.contact_name ? (
                  <div>
                    <p className="text-xs font-semibold text-on-surface truncate">{lead.contact_name}</p>
                    {lead.contact_title && <p className="text-[10px] text-on-surface-variant truncate">{lead.contact_title}</p>}
                    {lead.contact_email && (
                      <a href={`mailto:${lead.contact_email}`} className="text-[10px] text-primary hover:underline truncate block">
                        {lead.contact_email}
                      </a>
                    )}
                  </div>
                ) : <span className="text-on-surface-variant/40 text-xs">—</span>}
              </td>
              {/* Activity sector */}
              <td className="px-4 py-3 max-w-[120px]">
                <span className="text-xs text-on-surface-variant truncate block">{lead.activity_sector ?? '—'}</span>
              </td>
              {/* Website */}
              <td className="px-4 py-3">
                {lead.website_url ? (
                  <a href={lead.website_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    Site
                  </a>
                ) : <span className="text-on-surface-variant/40 text-xs">—</span>}
              </td>
              {/* LinkedIn */}
              <td className="px-4 py-3">
                {lead.linkedin_url ? (
                  <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#0A66C2] hover:underline text-xs font-medium">
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    LinkedIn
                  </a>
                ) : <span className="text-on-surface-variant/40 text-xs">—</span>}
              </td>
              {/* Location */}
              <td className="px-4 py-3 max-w-[100px]">
                <span className="text-xs text-on-surface-variant truncate block">{lead.location ?? '—'}</span>
              </td>
              {/* Status (editable dropdown) */}
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <select
                  value={lead.status}
                  onChange={(e) => onStatusChange(lead.id, e.target.value)}
                  disabled={lead.status === 'converted'}
                  className={cn(
                    'text-[10px] font-bold rounded-full px-2.5 py-1 border-none outline-none cursor-pointer uppercase tracking-wide',
                    STATUS_STYLES[lead.status] ?? STATUS_STYLES.new,
                    lead.status === 'converted' && 'opacity-70 cursor-default',
                  )}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{statusLabels[s]}</option>
                  ))}
                </select>
              </td>
              {/* Score */}
              <td className="px-4 py-3">
                <ScoreBadge score={lead.relevance_score} />
              </td>
              {/* Tier */}
              <td className="px-4 py-3">
                <TierBadge tier={(lead.tier ?? 'cold') as 'cold' | 'warm' | 'hot'} />
              </td>
              {/* Email status */}
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                {lead.email_status && lead.email_status !== 'unknown' ? (
                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', EMAIL_STATUS_STYLES[lead.email_status] ?? '')}>
                    <span className="material-symbols-outlined text-[10px]">
                      {lead.email_status === 'valid' ? 'check_circle' : lead.email_status === 'invalid' ? 'cancel' : 'help'}
                    </span>
                    {lead.email_status}
                  </span>
                ) : (
                  <span className="text-on-surface-variant/40 text-xs">—</span>
                )}
              </td>
              {/* Notes */}
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <NotesEditor lead={lead} onSave={(notes) => onNotesChange(lead.id, notes)} />
              </td>
              {/* Actions */}
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5">
                  {lead.status === 'converted' ? (
                    <span className="text-[10px] text-tertiary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      {t('alreadyConverted')}
                    </span>
                  ) : (
                    <button
                      onClick={() => onConvert(lead)}
                      disabled={converting === lead.id}
                      title={t('convertBtn')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                    >
                      {converting === lead.id ? (
                        <span className="material-symbols-outlined text-[13px] animate-spin">autorenew</span>
                      ) : (
                        <span className="material-symbols-outlined text-[13px]">trending_up</span>
                      )}
                      Pipeline
                    </button>
                  )}
                  <button
                    onClick={() => onEnrichLead(lead.id)}
                    disabled={enrichingLeadId === lead.id}
                    title="Enrichir IA"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                  >
                    {enrichingLeadId === lead.id ? (
                      <span className="material-symbols-outlined text-[13px] animate-spin">autorenew</span>
                    ) : (
                      <span className="material-symbols-outlined text-[13px]">auto_fix</span>
                    )}
                    Enrichir
                  </button>
                  <button
                    onClick={() => onStartSequence(lead.id)}
                    disabled={sequencingLeadId === lead.id}
                    title="Démarrer Séquence"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                  >
                    {sequencingLeadId === lead.id ? (
                      <span className="material-symbols-outlined text-[13px] animate-spin">autorenew</span>
                    ) : (
                      <span className="material-symbols-outlined text-[13px]">mail</span>
                    )}
                    Séquence
                  </button>
                  <button
                    onClick={() => onScoreLead(lead.id)}
                    disabled={scoringLeadId === lead.id}
                    title="Score IA"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-tertiary/10 hover:bg-tertiary/20 text-tertiary rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                  >
                    {scoringLeadId === lead.id ? (
                      <span className="material-symbols-outlined text-[13px] animate-spin">autorenew</span>
                    ) : (
                      <span className="material-symbols-outlined text-[13px]">analytics</span>
                    )}
                    Score IA
                  </button>
                  <button
                    onClick={() => onDelete(lead.id)}
                    title={t('deleteConfirm')}
                    className="p-1.5 text-error/60 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Search tab (chat interface) ──────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  leads?: LeadResult[];
  queryUsed?: string;
  demoMode?: boolean;
}

interface SearchTabProps {
  savedUrlMap: Map<string, string>;
  onLeadSaved: (lead: LeadResult, dbId: string) => void;
}

function SearchTab({ savedUrlMap, onLeadSaved }: SearchTabProps) {
  const t = useTranslations('Leads');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sources, setSources] = useState<string[]>(['linkedin']);
  const [loading, setLoading] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [detailLead, setDetailLead] = useState<LeadResult | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const toggleSource = (src: string) => {
    setSources((prev) => prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]);
  };

  const ALL_SOURCES = ['linkedin', 'datagouv', 'web'];

  const handleSave = async (lead: LeadResult, searchQuery: string) => {
    setSavingIds((prev) => { const n = new Set(prev); n.add(lead.id); return n; });
    try {
      const saved = await leadsApi.save({
        company_name: lead.company,
        contact_name: lead.name,
        contact_title: lead.job_title,
        activity_sector: null,
        linkedin_url: lead.source.startsWith('linkedin') ? lead.url : null,
        website_url: (lead.source === 'web' || lead.source === 'datagouv') ? lead.url : null,
        location: lead.location,
        summary: lead.summary,
        source: lead.source,
        relevance_score: lead.relevance_score,
        search_query: searchQuery || null,
        search_location: null,
      }) as LeadRecord;
      toast.success(t('saveSuccess'));
      onLeadSaved(lead, saved.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSavingIds((prev) => { const n = new Set(prev); n.delete(lead.id); return n; });
    }
  };

  const handleSend = async () => {
    const msg = inputMessage.trim();
    if (!msg || loading) return;

    setInputMessage('');
    const msgId = generateUUID();
    setMessages((prev) => [...prev, { id: msgId, role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await leadsApi.search({
        message: msg,
        sources: sources.length > 0 ? sources : ALL_SOURCES,
      }) as LeadSearchResponse;

      const aiContent = res.ai_response
        || (res.leads.length > 0
          ? `J'ai trouvé ${res.leads.length} lead${res.leads.length > 1 ? 's' : ''} pour votre recherche.`
          : 'Aucun résultat trouvé pour cette recherche. Essayez d\'affiner votre demande.');

      setMessages((prev) => [...prev, {
        id: generateUUID(),
        role: 'ai',
        content: aiContent,
        leads: res.leads,
        queryUsed: res.query_used,
        demoMode: res.demo_mode,
      }]);
    } catch (err: unknown) {
      setMessages((prev) => [...prev, {
        id: generateUUID(),
        role: 'ai',
        content: err instanceof Error ? err.message : 'Erreur de recherche. Veuillez réessayer.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="px-8 pb-8 flex flex-col gap-4" style={{ minHeight: 'calc(100vh - 280px)' }}>
      {detailLead && (
        <SearchLeadDetail
          lead={detailLead}
          savedDbId={savedUrlMap.get(detailLead.url) ?? null}
          saving={savingIds.has(detailLead.id)}
          onSave={(l) => void handleSave(l, messages.find((m) => m.leads?.some((ld) => ld.id === l.id))?.queryUsed ?? '')}
          onClose={() => setDetailLead(null)}
        />
      )}
      {/* Source controls */}
      <div className="bg-surface-container-lowest rounded-2xl px-5 py-3 shadow-sm flex items-center gap-4 flex-wrap">
        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant shrink-0">{t('sourcesLabel')}</span>
        <div className="flex items-center gap-2">
          {([
            { id: 'linkedin', icon: 'group', label: t('sourceLinkedin') },
            { id: 'datagouv', icon: 'account_balance', label: t('sourceDataGouv') },
            { id: 'web', icon: 'language', label: t('sourceWeb') },
          ] as const).map(({ id, icon, label }) => (
            <button key={id} type="button" onClick={() => toggleSource(id)}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all',
                sources.includes(id) ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high')}>
              <span className="material-symbols-outlined text-[14px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px] text-primary">smart_toy</span>
            </div>
            <p className="font-headline font-bold text-on-surface text-lg mb-2">Recherche intelligente de leads</p>
            <p className="text-sm text-on-surface-variant max-w-md">
              Décrivez les leads que vous cherchez en langage naturel. Gemini va analyser votre demande et chercher sur les sources sélectionnées.
            </p>
            <div className="flex flex-col gap-2 mt-6 w-full max-w-sm">
              {[
                'Directeurs commerciaux SaaS B2B en Île-de-France',
                'CTOs de startups tech à Lyon',
                'Responsables RH dans les PME industrielles',
              ].map((example) => (
                <button key={example} onClick={() => setInputMessage(example)}
                  className="text-left px-4 py-3 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-xs text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/10">
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mr-3 mt-1">
                <span className="material-symbols-outlined text-[16px] text-primary">smart_toy</span>
              </div>
            )}
            <div className={cn('flex flex-col gap-3 max-w-[80%]', msg.role === 'user' ? 'items-end' : 'items-start')}>
              <div className={cn(
                'px-4 py-3 rounded-2xl text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary text-on-primary rounded-tr-sm'
                  : 'bg-surface-container-lowest shadow-sm text-on-surface rounded-tl-sm',
              )}>
                {msg.content}
              </div>

              {msg.demoMode && (
                <div className="flex items-center gap-1.5 bg-surface-container-low rounded-xl px-3 py-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px] text-primary">info</span>
                  {t('demoNotice')}
                </div>
              )}

              {msg.leads && msg.leads.length > 0 && (
                <div className="w-full">
                  <p className="text-xs font-bold text-on-surface-variant mb-2">
                    <span className="text-primary">{msg.leads.length}</span> lead{msg.leads.length > 1 ? 's' : ''} trouvé{msg.leads.length > 1 ? 's' : ''}
                    {msg.queryUsed && <span className="font-normal"> · {msg.queryUsed}</span>}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {msg.leads.map((lead) => (
                      <SearchCard
                        key={lead.id}
                        lead={lead}
                        savedDbId={savedUrlMap.get(lead.url) ?? null}
                        saving={savingIds.has(lead.id)}
                        onSave={(l) => void handleSave(l, msg.queryUsed ?? '')}
                        onOpen={(l) => setDetailLead(l)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {msg.leads && msg.leads.length === 0 && msg.role === 'ai' && (
                <div className="text-center py-8 px-6 bg-surface-container-lowest rounded-2xl shadow-sm w-full">
                  <span className="material-symbols-outlined text-[40px] text-outline/50 block mb-3">person_search</span>
                  <p className="text-on-surface-variant text-sm">{t('noResults')}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mr-3 mt-1">
              <span className="material-symbols-outlined text-[16px] text-primary animate-spin">autorenew</span>
            </div>
            <div className="bg-surface-container-lowest shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-on-surface-variant">
              Gemini analyse votre demande et recherche des leads...
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm px-4 py-3 flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: Directeurs commerciaux dans les PME tech à Paris..."
          rows={1}
          className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none resize-none leading-relaxed py-1"
          style={{ maxHeight: '120px', overflowY: 'auto' }}
          disabled={loading}
        />
        <button
          onClick={() => void handleSend()}
          disabled={loading || !inputMessage.trim()}
          className="shrink-0 w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </div>
    </div>
  );
}

// ─── Saved leads tab ──────────────────────────────────────────────────────────

function SavedTab() {
  const t = useTranslations('Leads');
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [converting, setConverting] = useState<string | null>(null);
  const [scoringLeadId, setScoringLeadId] = useState<string | null>(null);
  const [enrichingLeadId, setEnrichingLeadId] = useState<string | null>(null);
  const [sequencingLeadId, setSequencingLeadId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [drawerLead, setDrawerLead] = useState<LeadRecord | null>(null);
  const [batchEnriching, setBatchEnriching] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadsApi.listSaved({ status: statusFilter || undefined, limit: 100 }) as LeadsListResponse;
      setLeads(res.leads);
      setTotal(res.total);
    } catch {
      toast.error('Erreur lors du chargement des leads');
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { void reload(); }, [reload]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updated = await leadsApi.updateSaved(id, { status }) as LeadRecord;
      setLeads((prev) => prev.map((l) => l.id === id ? updated : l));
    } catch { toast.error('Erreur lors de la mise à jour'); }
  };

  const handleNotesChange = async (id: string, notes: string) => {
    try {
      const updated = await leadsApi.updateSaved(id, { notes }) as LeadRecord;
      setLeads((prev) => prev.map((l) => l.id === id ? updated : l));
    } catch { toast.error('Erreur lors de la sauvegarde des notes'); }
  };

  const handleConvert = async (lead: LeadRecord) => {
    setConverting(lead.id);
    try {
      await leadsApi.convert(lead.id, user?.id ?? '');
      toast.success(t('convertSuccess'));
      await reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la conversion');
    } finally { setConverting(null); }
  };

  const handleDelete = async (id: string) => {
    try {
      await leadsApi.deleteSaved(id);
      toast.success(t('deleteSuccess'));
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      setTotal((prev) => prev - 1);
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleToggleAll = () => {
    setSelectedIds((prev) => prev.size === leads.length ? new Set() : new Set(leads.map((l) => l.id)));
  };

  const handleScoreLead = async (id: string) => {
    setScoringLeadId(id);
    try {
      const updated = await scoringApi.scoreLead(id) as LeadRecord;
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...updated } : l));
      toast.success('Score IA mis à jour');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du scoring');
    } finally {
      setScoringLeadId(null);
    }
  };

  const handleEnrichLead = async (id: string) => {
    setEnrichingLeadId(id);
    try {
      await leadsApi.enrich(id);
      await reload();
      toast.success('Lead enrichi avec succès');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enrichissement');
    } finally {
      setEnrichingLeadId(null);
    }
  };

  // Sync drawer when leads list refreshes
  React.useEffect(() => {
    if (drawerLead) {
      const refreshed = leads.find((l) => l.id === drawerLead.id);
      if (refreshed) setDrawerLead(refreshed);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads]);

  const handleStartSequence = async (id: string) => {
    setSequencingLeadId(id);
    try {
      await outreachApi.startSequence(id);
      toast.success('Séquence d\'outreach démarrée');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du démarrage de la séquence');
    } finally {
      setSequencingLeadId(null);
    }
  };

  const handleBatchEnrich = async () => {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : leads.map((l) => l.id);
    if (ids.length === 0) return;
    setBatchEnriching(true);
    try {
      const res = await leadsApi.batchEnrich(ids) as { enriched: number; total: number };
      toast.success(`${res.enriched}/${res.total} lead(s) enrichi(s)`);
      await reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enrichissement en lot');
    } finally {
      setBatchEnriching(false);
    }
  };

  const handleOpenDrawer = (lead: LeadRecord) => setDrawerLead(lead);
  const handleCloseDrawer = () => setDrawerLead(null);

  const STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'rejected'];
  const statusLabels: Record<string, string> = {
    '': t('filterAll'),
    new: t('statusNew'), contacted: t('statusContacted'),
    qualified: t('statusQualified'), converted: t('statusConverted'), rejected: t('statusRejected'),
  };

  return (
    <div className="px-8 pb-8 space-y-5">
      {showExport && (
        <ExportModal leads={leads} selectedIds={selectedIds} onClose={() => setShowExport(false)} />
      )}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImportSuccess={reload} />
      )}
      {drawerLead && (
        <LeadDrawer
          lead={drawerLead}
          onClose={handleCloseDrawer}
          onEnrich={handleEnrichLead}
          onScore={handleScoreLead}
        />
      )}
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-on-surface">
            <span className="text-primary">{total}</span> lead{total > 1 ? 's' : ''}
            {selectedIds.size > 0 && (
              <span className="ml-2 text-xs text-primary/70 font-medium">· {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
            )}
          </span>
          <div className="flex gap-1 bg-surface-container-low rounded-xl p-1">
            {(['', ...STATUSES] as string[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all',
                  statusFilter === s
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleBatchEnrich()}
            disabled={batchEnriching || leads.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl text-xs font-bold transition-all disabled:opacity-40"
          >
            <span className={cn('material-symbols-outlined text-[15px]', batchEnriching && 'animate-spin')}>auto_awesome</span>
            {batchEnriching ? 'Enrichissement…' : `Enrichir${selectedIds.size > 0 ? ` (${selectedIds.size})` : ' tout'}`}
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-xl text-xs font-bold transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            Importer
          </button>
          <button
            onClick={() => setShowExport(true)}
            disabled={leads.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-xl text-xs font-bold transition-all disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[15px]">upload</span>
            Exporter{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
          </button>
          <button onClick={reload} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Actualiser
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface-container-low rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <SavedTable
          leads={leads}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleAll={handleToggleAll}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          onConvert={handleConvert}
          onDelete={handleDelete}
          onScoreLead={handleScoreLead}
          onEnrichLead={handleEnrichLead}
          onStartSequence={handleStartSequence}
          onOpenDrawer={handleOpenDrawer}
          converting={converting}
          scoringLeadId={scoringLeadId}
          enrichingLeadId={enrichingLeadId}
          sequencingLeadId={sequencingLeadId}
        />
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const t = useTranslations('Leads');
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [savedCount, setSavedCount] = useState(0);
  // Map: source URL → db ID (for dedup indicator on search cards)
  const [savedUrlMap, setSavedUrlMap] = useState<Map<string, string>>(new Map());

  const handleLeadSaved = (lead: LeadResult, dbId: string) => {
    setSavedUrlMap((prev) => { const n = new Map(prev); n.set(lead.url, dbId); return n; });
    setSavedCount((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface">
        <TopBar />
        <section className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Page header */}
          <div className="px-8 pt-8 pb-5">
            <div className="flex items-center gap-3 text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-4">
              <span className="w-6 h-1 bg-primary rounded-full" />
              Lead Intelligence
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-headline text-4xl font-black text-primary tracking-tight">{t('title')}</h1>
                <p className="text-on-surface-variant font-medium mt-1">{t('subtitle')}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-widest shrink-0">
                <span className="material-symbols-outlined text-[14px] text-primary">bolt</span>
                {t('tagline')}
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <div className="px-8 mb-6">
            <div className="flex gap-1 bg-surface-container-low rounded-2xl p-1 w-fit">
              {([
                { key: 'search' as 'search' | 'saved', icon: 'person_search', label: t('tabSearch'), count: undefined as number | undefined },
                { key: 'saved' as 'search' | 'saved', icon: 'bookmark', label: t('tabSaved'), count: savedCount as number | undefined },
              ]).map(({ key, icon, label, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
                    activeTab === key
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: activeTab === key ? "'FILL' 1" : "'FILL' 0" }}>
                    {icon}
                  </span>
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className="bg-primary text-on-primary text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'search' ? (
            <SearchTab
              savedUrlMap={savedUrlMap}
              onLeadSaved={handleLeadSaved}
            />
          ) : (
            <SavedTab />
          )}
        </section>
      </main>
    </div>
  );
}

