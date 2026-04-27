'use client';

import { useState } from 'react';
import { TierBadge } from './TierBadge';
import { cn } from '../lib/cn';
import { apiClient } from '../lib/api';
import { toast } from '../lib/toast';
import type { LeadRecord } from '../lib/types';

// LeadRecord already contains company_news and enriched_at
type EnrichedLead = LeadRecord;

interface LeadSignal {
  signal_type: string;
  confidence: number;
  recommended_outreach_angle: string;
}

interface LeadDrawerProps {
  lead: LeadRecord | null;
  onClose: () => void;
  onEnrich: (id: string) => Promise<void>;
  onScore: (id: string) => Promise<void>;
}

const EMAIL_STATUS_CLASS: Record<string, string> = {
  valid: 'text-emerald-600',
  invalid: 'text-red-600',
  suggested: 'text-yellow-600',
  unknown: 'text-on-surface-variant',
};

function ScoreBar({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-primary/20', className)}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function InfoRow({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="material-symbols-outlined mt-0.5 text-[16px] text-on-surface-variant">{icon}</span>
      <span className="text-on-surface">{children}</span>
    </div>
  );
}

export function LeadDrawer({ lead, onClose, onEnrich, onScore }: LeadDrawerProps) {
  const [loadingEnrich, setLoadingEnrich] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [signals, setSignals] = useState<LeadSignal | null>(null);
  const [signalsFetched, setSignalsFetched] = useState(false);

  if (!lead) return null;
  const el = lead as EnrichedLead;

  const handleEnrich = async () => {
    setLoadingEnrich(true);
    try {
      await onEnrich(lead.id);
      toast.success('Lead enrichi avec succès.');
    } catch {
      toast.error('Échec de l\'enrichissement.');
    } finally {
      setLoadingEnrich(false);
    }
  };

  const handleScore = async () => {
    setLoadingScore(true);
    try {
      await onScore(lead.id);
      toast.success('Score mis à jour.');
    } catch {
      toast.error('Échec du scoring.');
    } finally {
      setLoadingScore(false);
    }
  };

  const handleSignals = async () => {
    setLoadingSignals(true);
    try {
      const data = await apiClient.get<LeadSignal | null>(`/leads/saved/${lead.id}/signals`);
      setSignals(data);
      setSignalsFetched(true);
    } catch {
      toast.error('Impossible de récupérer les signaux.');
    } finally {
      setLoadingSignals(false);
    }
  };

  const enrichedDate = el.enriched_at
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(el.enriched_at))
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-on-surface/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col bg-surface-container-lowest shadow-[0px_24px_48px_rgba(26,28,31,0.12)]">

        {/* Header */}
        <div className="flex items-start gap-3 bg-surface-container-low px-5 py-4">
          <div className="flex-1 min-w-0">
            <p className="truncate text-base font-semibold text-on-surface">
              {el.company_name ?? '—'}
            </p>
            <p className="truncate text-sm text-on-surface-variant">
              {[el.contact_name, el.contact_title].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
          <TierBadge tier={lead.tier} score={lead.score} size="md" />
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="ml-1 rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Scores */}
          <section className="rounded-xl bg-surface-container p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Score global</span>
              <span className="text-lg font-bold text-on-surface">{lead.score}</span>
            </div>
            <ScoreBar value={lead.score} />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">Fit</span>
                  <span className="text-xs font-semibold text-on-surface">{lead.fit_score}</span>
                </div>
                <ScoreBar value={lead.fit_score} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">Intent</span>
                  <span className="text-xs font-semibold text-on-surface">{lead.intent_score}</span>
                </div>
                <ScoreBar value={lead.intent_score} />
              </div>
            </div>
          </section>

          {/* Contact info */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Contact</h3>
            {el.contact_email && (
              <InfoRow icon="mail">
                <a
                  href={`mailto:${el.contact_email}`}
                  className={cn('hover:underline', EMAIL_STATUS_CLASS[lead.email_status] ?? EMAIL_STATUS_CLASS.unknown)}
                >
                  {el.contact_email}
                </a>
                {lead.email_status !== 'unknown' && (
                  <span className={cn('ml-2 text-xs', EMAIL_STATUS_CLASS[lead.email_status])}>
                    ({lead.email_status})
                  </span>
                )}
              </InfoRow>
            )}
            {el.contact_phone && <InfoRow icon="call">{el.contact_phone}</InfoRow>}
            {el.linkedin_url && (
              <InfoRow icon="link">
                <a href={el.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                  LinkedIn
                </a>
              </InfoRow>
            )}
            {el.website_url && (
              <InfoRow icon="language">
                <a href={el.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                  {el.website_url.replace(/^https?:\/\//, '')}
                </a>
              </InfoRow>
            )}
            {el.location && <InfoRow icon="location_on">{el.location}</InfoRow>}
            {el.activity_sector && <InfoRow icon="category">{el.activity_sector}</InfoRow>}
          </section>

          {/* Summary */}
          {el.summary && (
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Résumé</h3>
              <p className="text-sm leading-relaxed text-on-surface">{el.summary}</p>
            </section>
          )}

          {/* Enrichment */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Enrichissement IA</h3>
            {enrichedDate && (
              <p className="text-xs text-on-surface-variant">Enrichi le {enrichedDate}</p>
            )}
            {el.company_news && el.company_news.length > 0 && (
              <ul className="space-y-1">
                {el.company_news.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                    <span className="material-symbols-outlined mt-0.5 text-[14px] text-on-surface-variant">fiber_manual_record</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={handleEnrich}
              disabled={loadingEnrich}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              {loadingEnrich ? 'Enrichissement…' : 'Enrichir IA'}
            </button>
          </section>

          {/* Signals */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Signaux d'achat</h3>
            {signalsFetched && signals && (
              <div className="rounded-xl bg-surface-container p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-tertiary/10 px-2 py-0.5 text-xs font-semibold text-tertiary">
                    {signals.signal_type}
                  </span>
                  <span className="text-xs text-on-surface-variant">Confiance</span>
                  <span className="text-xs font-semibold text-on-surface">{Math.round(signals.confidence)}%</span>
                </div>
                <ScoreBar value={signals.confidence} />
                <p className="text-sm text-on-surface leading-relaxed">{signals.recommended_outreach_angle}</p>
              </div>
            )}
            {signalsFetched && !signals && (
              <p className="text-sm text-on-surface-variant">Aucun signal détecté.</p>
            )}
            <button
              onClick={handleSignals}
              disabled={loadingSignals}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">radar</span>
              {loadingSignals ? 'Analyse…' : 'Détecter les signaux'}
            </button>
          </section>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 bg-surface-container-low px-5 py-3">
          <button
            onClick={handleScore}
            disabled={loadingScore}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">model_training</span>
            {loadingScore ? 'Scoring…' : 'Score IA'}
          </button>
          {el.enriched_at && (
            <p className="text-xs text-on-surface-variant">
              Dernière analyse: {enrichedDate}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
