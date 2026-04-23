'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Sidebar } from '../../../components/Sidebar';
import { TopBar } from '../../../components/TopBar';
import { leadsApi, scoringApi } from '../../../lib/api';
import { TierBadge } from '../../../components/TierBadge';
import {
  type LeadResult,
  type LeadSearchResponse,
  type LeadRecord,
  type LeadsListResponse,
} from '../../../lib/types';
import { toast } from '../../../lib/toast';
import { cn } from '../../../lib/cn';
import { CURRENT_USER_ID } from '../../../lib/config';

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
}

function SearchCard({ lead, savedDbId, saving, onSave }: SearchCardProps) {
  const t = useTranslations('Leads');
  const initials = lead.avatar_initials;
  const displayName = lead.name ?? lead.company ?? '—';
  const isSaved = savedDbId !== null;

  return (
    <article className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3.5">
      <div className="flex items-start gap-3">
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center font-headline font-black text-base shrink-0', avatarColor(initials))}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-sm text-on-surface truncate leading-tight">{displayName}</p>
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
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] font-bold rounded-xl text-xs transition-colors"
        >
          <span className="material-symbols-outlined text-[13px]">open_in_new</span>
          LinkedIn
        </a>
        <button
          onClick={() => !isSaved && !saving && onSave(lead)}
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

// ─── Import modal ─────────────────────────────────────────────────────────────

interface ImportModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
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
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all',
              tab === 'airtable' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant')}>
            Airtable
          </button>
          <button onClick={() => { setTab('notion'); setResult(null); }}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all',
              tab === 'notion' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant')}>
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

  const TABS: { id: ExportTab; icon: string; label: string }[] = [
    { id: 'csv', icon: 'table_view', label: 'CSV' },
    { id: 'airtable', icon: 'grid_on', label: 'Airtable' },
    { id: 'notion', icon: 'article', label: 'Notion' },
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
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                tab === id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high',
              )}>
              <span className="material-symbols-outlined text-[14px]">{icon}</span>
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
                  : <><span className="material-symbols-outlined text-[18px]">upload</span>Envoyer vers Airtable</>}
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
                  : <><span className="material-symbols-outlined text-[18px]">upload</span>Envoyer vers Notion</>}
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
  converting: string | null;
  scoringLeadId: string | null;
}

function SavedTable({ leads, selectedIds, onToggleSelect, onToggleAll, onStatusChange, onNotesChange, onConvert, onDelete, onScoreLead, converting, scoringLeadId }: SavedTableProps) {
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
            <th className="text-left px-4 py-3 whitespace-nowrap min-w-[180px]">{t('colNotes')}</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">{t('colActions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/5">
          {leads.map((lead) => (
            <tr key={lead.id} className={cn(
              'hover:bg-surface-container transition-colors group',
              selectedIds.has(lead.id) ? 'bg-primary/5' : 'bg-surface-container-lowest',
            )}>
              <td className="px-4 py-3">
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
              <td className="px-4 py-3">
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
              {/* Notes */}
              <td className="px-4 py-3">
                <NotesEditor lead={lead} onSave={(notes) => onNotesChange(lead.id, notes)} />
              </td>
              {/* Actions */}
              <td className="px-4 py-3">
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

// ─── Search tab ────────────────────────────────────────────────────────────────

interface SearchTabProps {
  savedUrlMap: Map<string, string>;
  onLeadSaved: (lead: LeadResult, dbId: string) => void;
  searchQuery: string;
  searchLocation: string;
}

function SearchTab({ savedUrlMap, onLeadSaved, searchQuery, searchLocation }: SearchTabProps) {
  const t = useTranslations('Leads');
  const [query, setQuery] = useState(searchQuery);
  const [location, setLocation] = useState(searchLocation);
  const [activitySector, setActivitySector] = useState('');
  const [sources, setSources] = useState<string[]>(['linkedin']);
  const [maxResults, setMaxResults] = useState(20);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<LeadSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const toggleSource = (src: string) => {
    setSources((prev) => prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]);
  };

  const ALL_SOURCES = ['linkedin', 'datagouv', 'web'];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResponse(null);
    try {
      const res = await leadsApi.search({
        query: query.trim() || undefined,
        location: location.trim() || undefined,
        activity_sector: activitySector.trim() || undefined,
        sources: sources.length > 0 ? sources : ALL_SOURCES,
        max_results: maxResults
      }) as LeadSearchResponse;
      setResponse(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de recherche');
    } finally { setLoading(false); }
  };

  const handleSave = async (lead: LeadResult) => {
    setSavingIds((prev) => { const n = new Set(prev); n.add(lead.id); return n; });
    try {
      const saved = await leadsApi.save({
        company_name: lead.company,
        contact_name: lead.name,
        contact_title: lead.job_title,
        activity_sector: query.trim() || null,
        linkedin_url: lead.source.startsWith('linkedin') ? lead.url : null,
        website_url: (lead.source === 'web' || lead.source === 'datagouv') ? lead.url : null,
        location: lead.location,
        summary: lead.summary,
        source: lead.source,
        relevance_score: lead.relevance_score,
        search_query: query.trim() || null,
        search_location: location.trim() || null,
      }) as LeadRecord;
      toast.success(t('saveSuccess'));
      onLeadSaved(lead, saved.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSavingIds((prev) => { const n = new Set(prev); n.delete(lead.id); return n; });
    }
  };

  return (
    <div className="px-8 pb-8 space-y-6">
      {/* Form */}
      <form onSubmit={handleSearch} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchField label={t('queryLabel')} icon="work" value={query} onChange={setQuery} placeholder={t('queryPlaceholder')} />
          <SearchField label={t('sectorLabel')} icon="category" value={activitySector} onChange={setActivitySector} placeholder={t('sectorPlaceholder')} />
          <SearchField label={t('locationLabel')} icon="location_on" value={location} onChange={setLocation} placeholder={t('locationPlaceholder')} />
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant shrink-0">{t('sourcesLabel')}</span>
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
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{t('maxResultsLabel')}</span>
            <select value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))}
              className="bg-surface-container-low rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
              <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="ml-auto flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:scale-100 text-sm">
            {loading ? (<><span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>{t('searching')}</>)
              : (<><span className="material-symbols-outlined text-[18px]">person_search</span>{t('searchBtn')}</>)}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-error/10 text-error rounded-2xl px-5 py-4 text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>{error}
        </div>
      )}

      {/* Demo notice */}
      {response?.demo_mode && (
        <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-primary">info</span>
          {t('demoNotice')}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Results */}
      {!loading && response !== null && (
        response.leads.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-on-surface">
                <span className="text-primary">{response.leads.length}</span> lead{response.leads.length > 1 ? 's' : ''} trouvé{response.leads.length > 1 ? 's' : ''}
                {response.query_used && <span className="text-on-surface-variant font-normal"> · {response.query_used}</span>}
              </p>
              <span className="text-xs text-on-surface-variant">{t('tagline')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {response.leads.map((lead) => (
                <SearchCard
                  key={lead.id}
                  lead={lead}
                  savedDbId={savedUrlMap.get(lead.url) ?? null}
                  saving={savingIds.has(lead.id)}
                  onSave={handleSave}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-[52px] text-outline/50 block mb-4">person_search</span>
            <p className="text-on-surface-variant font-medium">{t('noResults')}</p>
          </div>
        )
      )}
    </div>
  );
}

// ─── Saved leads tab ──────────────────────────────────────────────────────────

function SavedTab() {
  const t = useTranslations('Leads');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [converting, setConverting] = useState<string | null>(null);
  const [scoringLeadId, setScoringLeadId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

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
      await leadsApi.convert(lead.id, CURRENT_USER_ID);
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
          converting={converting}
          scoringLeadId={scoringLeadId}
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
              searchQuery=""
              searchLocation=""
            />
          ) : (
            <SavedTab />
          )}
        </section>
      </main>
    </div>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function SearchField({ label, icon, value, onChange, placeholder, required }: {
  label: string; icon: string; value: string; onChange: (v: string) => void;
  placeholder: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}{required && <span className="text-error ml-1">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">{icon}</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
          className="w-full bg-surface-container-low rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50" />
      </div>
    </div>
  );
}
