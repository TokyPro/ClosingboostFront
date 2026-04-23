'use client';

import React, { useState, useEffect, useRef, useId, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles, Send, SkipForward, FileText, Calculator,
  CheckCircle2, Plus, X, Check, RotateCcw, History, Clock, Download,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Sidebar } from '../../../components/Sidebar';
import { copilotApi, opportunityApi, interactionApi } from '../../../lib/api';
import { Interaction } from '../../../lib/types';
import { cn } from '../../../lib/cn';
import { CURRENT_USER_ID } from '../../../lib/config';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message { role: 'assistant' | 'user'; content: string; }

interface Requirements {
  description?: string | null;
  platform?: string | null;
  features?: string | null;
  hosting?: string | null;
  data_volume?: string | null;
  users?: string | null;
  timeline?: string | null;
  integrations?: string | null;
}

interface CustomField { id: string; label: string; value: string; }

interface QuotePhase { name: string; duration_days: number; cost: number; description: string; }
interface QuoteResult {
  project_title: string;
  daily_rate: number;
  total_cost: number;
  total_duration_days: number;
  phases: QuotePhase[];
  assumptions: string[];
}

// ── Predefined fields ─────────────────────────────────────────────────────────

const REQUIREMENT_FIELDS: Array<{ key: keyof Requirements; icon: string; labelKey: string }> = [
  { key: 'description',  icon: 'description',             labelKey: 'reqDescription' },
  { key: 'platform',     icon: 'devices',                  labelKey: 'reqPlatform' },
  { key: 'features',     icon: 'featured_play_list',       labelKey: 'reqFeatures' },
  { key: 'hosting',      icon: 'dns',                      labelKey: 'reqHosting' },
  { key: 'data_volume',  icon: 'storage',                  labelKey: 'reqData' },
  { key: 'users',        icon: 'group',                    labelKey: 'reqUsers' },
  { key: 'timeline',     icon: 'schedule',                 labelKey: 'reqTimeline' },
  { key: 'integrations', icon: 'integration_instructions', labelKey: 'reqIntegrations' },
];

// ── Shared primitives ─────────────────────────────────────────────────────────

const inputClass = 'w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all';

function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/30 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full relative" style={{ maxWidth: '28rem' }}>
        <button onClick={onClose} className="absolute top-5 right-5 p-1 text-on-surface-variant hover:text-primary transition-colors">
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

// ── BriefingCreationModal ─────────────────────────────────────────────────────

function BriefingCreationModal({
  suggestedTitle,
  onClose,
}: {
  suggestedTitle: string;
  onClose: () => void;
}) {
  const t = useTranslations('Copilot');
  const router = useRouter();
  const [title, setTitle] = useState(suggestedTitle);
  const [company, setCompany] = useState('');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const opp = await opportunityApi.create(
        { title: title.trim(), company_name: company.trim(), value: parseFloat(value) || 0, priority: 'medium', win_probability: 0 },
        CURRENT_USER_ID,
      ) as { id: string };
      router.push(`/opportunities/${opp.id}/briefing`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorGeneric'));
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="p-8 pb-6">
        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
          <span className="w-4 h-0.5 bg-primary rounded-full" />
          {t('briefingModalTitle')}
        </div>
        <p className="text-on-surface-variant text-sm">{t('briefingModalSubtitle')}</p>
      </div>
      <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            {t('opportunityTitleLabel')} <span className="text-error">*</span>
          </label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="Ex. Application e-commerce B2B" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            {t('companyNameLabel')} <span className="text-error">*</span>
          </label>
          <input type="text" required value={company} onChange={e => setCompany(e.target.value)} className={inputClass} placeholder="Ex. Acme Corp" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{t('dealValueLabel')}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">$</span>
            <input type="number" min="0" value={value} onChange={e => setValue(e.target.value)} className={cn(inputClass, 'pl-7')} placeholder="0" />
          </div>
        </div>
        {error && <p className="text-sm text-error bg-error/10 px-4 py-3 rounded-xl">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-surface-container-low text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors text-sm">
            {t('cancel')}
          </button>
          <button type="submit" disabled={submitting} className="flex-1 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl disabled:opacity-60 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
            {submitting ? t('creating') : <><FileText className="w-4 h-4" />{t('createAndBriefing')}</>}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── QuoteResultModal ──────────────────────────────────────────────────────────

interface QuotePdfLabels {
  title: string;
  totalCost: string;
  duration: string;
  dailyRate: string;
  phases: string;
  assumptions: string;
  days: string;
}

async function generateQuotePdf(quote: QuoteResult, labels: QuotePdfLabels): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 18;

  const textPrimary: [number, number, number] = [26, 28, 31];
  const textMuted: [number, number, number] = [113, 120, 128];
  const surfaceLow: [number, number, number] = [243, 243, 247];

  const ensureSpace = (needed: number, cursorY: number): number => {
    if (cursorY + needed > bottomLimit) {
      doc.addPage();
      return 22;
    }
    return cursorY;
  };

  let y = 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text(labels.title.toUpperCase(), marginX, y, { charSpace: 1.2 });
  y += 7;

  doc.setFontSize(20);
  doc.setTextColor(...textPrimary);
  const titleLines = doc.splitTextToSize(quote.project_title, contentWidth);
  doc.text(titleLines, marginX, y);
  y += titleLines.length * 8 + 6;

  doc.setDrawColor(...textPrimary);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, marginX + 16, y);
  y += 10;

  const summaryItems = [
    { label: labels.totalCost, value: `${quote.total_cost.toLocaleString('fr-FR')} €` },
    { label: labels.duration, value: `${quote.total_duration_days} ${labels.days}` },
    { label: labels.dailyRate, value: `${quote.daily_rate} €` },
  ];
  const boxGap = 4;
  const boxWidth = (contentWidth - boxGap * 2) / 3;
  const boxHeight = 20;
  summaryItems.forEach((item, i) => {
    const x = marginX + i * (boxWidth + boxGap);
    doc.setFillColor(...surfaceLow);
    doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(item.label.toUpperCase(), x + 4, y + 6, { charSpace: 0.8 });
    doc.setFontSize(14);
    doc.setTextColor(...textPrimary);
    doc.text(item.value, x + 4, y + 15);
  });
  y += boxHeight + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(labels.phases.toUpperCase(), marginX, y, { charSpace: 1.2 });
  y += 6;

  doc.setFontSize(10);
  quote.phases.forEach((phase, i) => {
    const descLines = doc.splitTextToSize(phase.description, contentWidth - 14);
    const blockHeight = 10 + descLines.length * 4 + 4;
    y = ensureSpace(blockHeight, y);

    doc.setFillColor(...surfaceLow);
    doc.roundedRect(marginX, y, contentWidth, blockHeight, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...textPrimary);
    doc.text(`${i + 1}. ${phase.name}`, marginX + 5, y + 6);

    const rightLabel = `${phase.duration_days} ${labels.days}  ·  ${phase.cost.toLocaleString('fr-FR')} €`;
    doc.text(rightLabel, marginX + contentWidth - 5, y + 6, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textMuted);
    doc.text(descLines, marginX + 5, y + 11);

    y += blockHeight + 3;
  });

  y += 6;
  y = ensureSpace(12, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(labels.assumptions.toUpperCase(), marginX, y, { charSpace: 1.2 });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...textPrimary);
  quote.assumptions.forEach((a) => {
    const lines = doc.splitTextToSize(a, contentWidth - 6);
    const height = lines.length * 4.5 + 1;
    y = ensureSpace(height, y);
    doc.setTextColor(...textMuted);
    doc.text('•', marginX, y);
    doc.setTextColor(...textPrimary);
    doc.text(lines, marginX + 4, y);
    y += height;
  });

  const safeTitle = quote.project_title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'chiffrage';
  doc.save(`chiffrage-${safeTitle}.pdf`);
}

function QuoteResultModal({ quote, onClose }: { quote: QuoteResult; onClose: () => void }) {
  const t = useTranslations('Copilot');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateQuotePdf(quote, {
        title: t('quoteTitle'),
        totalCost: t('quoteTotalCost'),
        duration: t('quoteDuration'),
        dailyRate: t('quoteDailyRate'),
        phases: t('quotePhases'),
        assumptions: t('quoteAssumptions'),
        days: t('quoteDays'),
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/30 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-8 pb-4 flex items-start justify-between sticky top-0 bg-surface rounded-t-2xl z-10">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-1">
              <span className="w-4 h-0.5 bg-primary rounded-full" />{t('quoteTitle')}
            </div>
            <h2 className="font-headline font-extrabold text-xl text-primary leading-tight">{quote.project_title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary text-[11px] font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              <Download className="w-3.5 h-3.5" />
              {t('quoteDownloadPdf')}
            </button>
            <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-8 pb-6 grid grid-cols-3 gap-3">
          {[
            { label: t('quoteTotalCost'), value: `${quote.total_cost.toLocaleString('fr-FR')} €` },
            { label: t('quoteDuration'), value: `${quote.total_duration_days} ${t('quoteDays')}` },
            { label: t('quoteDailyRate'), value: `${quote.daily_rate} €` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-container-lowest rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
              <p className="text-xl font-headline font-extrabold text-primary">{value}</p>
            </div>
          ))}
        </div>

        <div className="px-8 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">{t('quotePhases')}</p>
          <div className="space-y-2">
            {quote.phases.map((phase, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-surface-container-lowest rounded-xl">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-extrabold text-primary">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-bold text-sm text-on-surface">{phase.name}</p>
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <span className="text-[11px] text-on-surface-variant">{phase.duration_days} {t('quoteDays')}</span>
                      <span className="font-bold text-sm text-primary">{phase.cost.toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">{t('quoteAssumptions')}</p>
          <ul className="space-y-1.5">
            {quote.assumptions.map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />{a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── EditableCard ──────────────────────────────────────────────────────────────

interface EditableCardProps {
  icon?: string; label: string; value?: string | null;
  onChange: (val: string) => void; onDelete?: () => void;
  placeholderKey?: string; highlight?: boolean; isUserEdited?: boolean;
}

const EditableCard = ({ icon, label, value, onChange, onDelete, placeholderKey = 'clickToAdd', highlight = false, isUserEdited = false }: EditableCardProps) => {
  const t = useTranslations('Copilot');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (!editing) setDraft(value ?? ''); }, [value, editing]);

  const confirm = () => { onChange(draft.trim()); setEditing(false); };
  const cancel = () => { setDraft(value ?? ''); setEditing(false); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirm(); }
    if (e.key === 'Escape') cancel();
  };

  return (
    <div
      className={cn(
        'group relative flex gap-3 p-3 rounded-xl transition-all duration-300',
        editing ? 'bg-surface-container-high ring-1 ring-primary/30'
          : highlight ? 'bg-primary/8 ring-1 ring-primary/40'
          : value ? 'bg-surface-container-low hover:bg-surface-container-high cursor-pointer'
          : 'hover:bg-surface-container-low/60 cursor-pointer opacity-60 hover:opacity-90',
      )}
      onClick={() => !editing && setEditing(true)}
    >
      {icon && (
        <span className={cn('material-symbols-outlined text-[18px] shrink-0 mt-0.5', value || editing ? 'text-primary' : 'text-on-surface-variant')}>
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
          {value && !isUserEdited && !editing && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container uppercase tracking-widest" title={t('aiFilledHint')}>AI</span>
          )}
          {value && isUserEdited && !editing && (
            <span className="material-symbols-outlined text-[12px] text-primary/60" title={t('userEditedHint')}>edit</span>
          )}
        </div>
        {editing ? (
          <textarea ref={inputRef} autoFocus value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={handleKeyDown} rows={2}
            className="w-full text-sm text-on-surface bg-transparent resize-none outline-none leading-snug placeholder:text-on-surface-variant/40"
            placeholder={t('typeHere')} onClick={e => e.stopPropagation()} />
        ) : value ? (
          <p className="text-sm text-on-surface font-medium leading-snug break-words">{value}</p>
        ) : (
          <p className="text-[11px] text-on-surface-variant/40 italic">{t(placeholderKey)}</p>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={confirm} className="w-6 h-6 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:scale-110 transition-transform"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={cancel} className="w-6 h-6 rounded-lg bg-surface-container-highest text-on-surface-variant flex items-center justify-center hover:scale-110 transition-transform"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/60 mt-0.5">edit</span>
          {onDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-on-surface-variant/60 hover:text-error transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── AddFieldForm ──────────────────────────────────────────────────────────────

const AddFieldForm = ({ onAdd }: { onAdd: (label: string, value: string) => void }) => {
  const t = useTranslations('Copilot');
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd(label.trim(), value.trim());
    setLabel(''); setValue(''); setOpen(false);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-outline-variant/30 text-on-surface-variant/50 hover:border-primary/40 hover:text-primary transition-all text-[11px] font-bold uppercase tracking-widest">
      <Plus className="w-3.5 h-3.5" />{t('addField')}
    </button>
  );

  return (
    <div className="p-3 rounded-xl bg-surface-container-high ring-1 ring-primary/20 space-y-2">
      <input autoFocus value={label} onChange={e => setLabel(e.target.value)} placeholder={t('fieldLabel')}
        className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
        onKeyDown={e => e.key === 'Escape' && setOpen(false)} />
      <textarea value={value} onChange={e => setValue(e.target.value)} placeholder={t('fieldValue')} rows={2}
        className="w-full bg-surface-container-lowest rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-primary/30"
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); } if (e.key === 'Escape') setOpen(false); }} />
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant text-[11px] font-bold hover:bg-surface-container-high transition-colors">{t('cancel')}</button>
        <button onClick={handleAdd} disabled={!label.trim()} className="flex-1 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-bold disabled:opacity-40 hover:opacity-90 transition-opacity">{t('add')}</button>
      </div>
    </div>
  );
};

// ── Chat bubbles ──────────────────────────────────────────────────────────────

const AiBubble = ({ content }: { content: string }) => (
  <div className="flex items-start gap-3 max-w-[85%]">
    <div className="shrink-0 w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
      <Sparkles className="w-4 h-4 text-on-primary" />
    </div>
    <div className="bg-inverse-surface text-inverse-on-surface px-5 py-4 rounded-2xl rounded-tl-sm leading-relaxed text-sm">{content}</div>
  </div>
);

const UserBubble = ({ content }: { content: string }) => (
  <div className="flex justify-end">
    <div className="bg-primary text-on-primary px-5 py-4 rounded-2xl rounded-tr-sm text-sm max-w-[80%] leading-relaxed">{content}</div>
  </div>
);

const SkippedBubble = ({ label }: { label: string }) => (
  <div className="flex justify-end">
    <div className="bg-surface-container-high text-on-surface-variant/60 px-4 py-2 rounded-2xl rounded-tr-sm text-[11px] font-bold uppercase tracking-widest italic">{label}</div>
  </div>
);

// ── SessionHistoryModal ───────────────────────────────────────────────────────

function SessionHistoryModal({
  sessions,
  opportunityTitle,
  onClose,
  onLoad,
}: {
  sessions: Interaction[];
  opportunityTitle: string;
  onClose: () => void;
  onLoad: (session: Interaction) => void;
}) {
  const t = useTranslations('Copilot');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/30 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-6 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-1">
              <span className="w-4 h-0.5 bg-primary rounded-full" />
              {t('sessionsTitle')}
            </div>
            <p className="text-sm text-on-surface-variant truncate max-w-xs">{opportunityTitle}</p>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-primary transition-colors shrink-0 ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar px-6 pb-6 space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-10">{t('noPastSessions')}</p>
          ) : (
            sessions.map(session => (
              <div key={session.id} className="flex items-start gap-4 p-4 bg-surface-container-lowest rounded-xl hover:bg-surface-container-low transition-colors">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-on-surface-variant" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface mb-1 truncate">
                    {session.summary || t('sessionDefaultTitle')}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    {new Date(session.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => onLoad(session)}
                  className="shrink-0 px-4 py-2 bg-primary text-on-primary rounded-xl text-[11px] font-bold hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {t('loadSession')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── ConfirmNewModal ───────────────────────────────────────────────────────────

function ConfirmNewModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const t = useTranslations('Copilot');
  return (
    <ModalShell onClose={onCancel}>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5 text-primary" />
          </div>
          <p className="font-headline font-black text-lg text-on-surface">{t('newConversation')}</p>
        </div>
        <p className="text-sm text-on-surface-variant mb-6">{t('confirmNewMessage')}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-surface-container-low text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors text-sm">
            {t('cancel')}
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" />
            {t('newConversation')}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── TacticalAdvice ──────────────────────────────────────────────────────────

const TacticalAdvice = ({ advice }: { advice: string }) => {
  const t = useTranslations('Copilot');
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t('tacticalAdvice')}</p>
      </div>
      <p className="text-sm text-on-surface font-medium italic leading-relaxed">
        "{advice}"
      </p>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

interface ChatState {
  messages: Message[];
  suggestions: string[];
  aiRequirements: Requirements;
  tacticalAdvice?: string | null;
  progress: number;
  isComplete: boolean;
  loading: boolean;
  error: string | null;
}

function CopilotInner() {
  const t = useTranslations('Copilot');
  const uid = useId();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const [state, setState] = useState<ChatState>({ messages: [], suggestions: [], aiRequirements: {}, tacticalAdvice: null, progress: 0, isComplete: false, loading: true, error: null });
  const [userRequirements, setUserRequirements] = useState<Requirements>({});
  const [userEditedKeys, setUserEditedKeys] = useState<Set<string>>(new Set());
  const [highlightedKeys, setHighlightedKeys] = useState<Set<string>>(new Set());
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [input, setInput] = useState('');

  // Session management state
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  // Session history state
  const [sessions, setSessions] = useState<Interaction[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);

  // Modal state
  const [briefingModalOpen, setBriefingModalOpen] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const requirements: Requirements = { ...state.aiRequirements, ...userRequirements };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    // Initial chat load
    copilotApi.chat([]).then(res => {
      setState(prev => ({ 
        ...prev, 
        messages: [{ role: 'assistant', content: res.message }], 
        suggestions: res.suggestions, 
        aiRequirements: res.requirements, 
        tacticalAdvice: res.tactical_advice,
        progress: res.progress, 
        isComplete: res.is_complete, 
        loading: false, 
        error: null 
      }));
    }).catch((err: unknown) => {
      setState(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : t('errorGeneric') }));
    });

    // Fetch opportunities
    opportunityApi.list(CURRENT_USER_ID).then(setOpportunities).catch(console.error);
  }, [t]);

  useEffect(() => { scrollToBottom(); }, [state.messages]);

  // Pre-fill from URL params when navigating from opportunity creation
  useEffect(() => {
    const opportunityId = searchParams.get('opportunity_id');
    const title = searchParams.get('title');
    const company = searchParams.get('company');
    if (opportunityId) setSelectedOpportunityId(opportunityId);
    if (title || company) {
      const description = [title, company ? `(${company})` : ''].filter(Boolean).join(' ');
      setUserRequirements(prev => ({ ...prev, description }));
      setUserEditedKeys(prev => { const next = new Set(prev); next.add('description'); return next; });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedOpportunityId) {
      setSessions([]);
      return;
    }
    setSessionsLoading(true);

    // Fetch both sessions and opportunity details/briefing
    Promise.all([
      interactionApi.listByOpportunity(selectedOpportunityId),
      opportunityApi.getOne(selectedOpportunityId),
      opportunityApi.getBriefing(selectedOpportunityId).catch(() => null),
    ])
      .then(([sessionsData, opportunity, briefing]) => {
        setSessions(sessionsData as Interaction[]);

        // Pre-fill requirements if they are mostly empty
        const filledCount = Object.values(userRequirements).filter(Boolean).length;
        if (filledCount === 0) {
          const newReqs: Requirements = {};
          
          // Use opportunity title and company as initial description
          newReqs.description = `${opportunity.company_name} — ${opportunity.title}`;
          
          // If we have a briefing, we could extract more, but let's start with basic info
          if (briefing && briefing.market_insights) {
             // Maybe map some market insights if applicable
          }
          
          setUserRequirements(prev => ({ ...prev, ...newReqs }));
          setUserEditedKeys(prev => {
            const next = new Set(prev);
            next.add('description');
            return next;
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load opportunity context:', err);
        setSessions([]);
      })
      .finally(() => setSessionsLoading(false));
  }, [selectedOpportunityId]);

  const toggleSuggestion = (index: number) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts: string[] = [];
    state.suggestions.forEach((s, i) => { if (selectedSuggestions.has(i)) parts.push(s); });
    if (input.trim()) parts.push(input.trim());
    if (parts.length > 0) sendMessage(parts.join(', '));
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || state.loading) return;
    const userMsg: Message = { role: 'user', content };
    const nextMessages = [...state.messages, userMsg];
    setState(prev => ({ ...prev, messages: nextMessages, suggestions: [], loading: true }));
    setSelectedSuggestions(new Set());
    setInput('');
    try {
      const res = await copilotApi.chat(nextMessages);
      setState(prev => {
        const newlyFilled = new Set<string>();
        (Object.keys(res.requirements) as Array<keyof Requirements>).forEach(k => {
          if (!prev.aiRequirements[k] && res.requirements[k] && !userEditedKeys.has(k)) newlyFilled.add(k);
        });
        if (newlyFilled.size > 0) { setHighlightedKeys(newlyFilled); setTimeout(() => setHighlightedKeys(new Set()), 1400); }
        return { 
          ...prev, 
          messages: [...nextMessages, { role: 'assistant', content: res.message }], 
          suggestions: res.suggestions, 
          aiRequirements: res.requirements, 
          tacticalAdvice: res.tactical_advice,
          progress: res.progress, 
          isComplete: res.is_complete, 
          loading: false, 
          error: null 
        };
      });
    } catch (err: unknown) {
      setState(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : t('errorGeneric') }));
    }
  };

  const handleGenerateQuote = async () => {
    setQuoteLoading(true);
    try {
      const result = await copilotApi.generateQuote(requirements as Record<string, string | null | undefined>) as QuoteResult;
      setQuote(result);
    } catch (err) {
      setState(prev => ({ ...prev, error: err instanceof Error ? err.message : t('errorGeneric') }));
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSaveSession = async () => {
    if (!selectedOpportunityId || isSaving || isSaved) return;
    setIsSaving(true);
    try {
      await copilotApi.save({
        opportunity_id: selectedOpportunityId,
        messages: state.messages,
        requirements: requirements as any,
      });
      setIsSaved(true);
    } catch (err) {
      setState(prev => ({ ...prev, error: err instanceof Error ? err.message : t('errorGeneric') }));
    } finally {
      setIsSaving(false);
    }
  };

  const doNewConversation = () => {
    setShowConfirmNew(false);
    setIsSaved(false);
    setInput('');
    setSelectedSuggestions(new Set());
    setCustomFields([]);
    setUserRequirements({});
    setUserEditedKeys(new Set());
    setState({ messages: [], suggestions: [], aiRequirements: {}, progress: 0, isComplete: false, loading: true, error: null });
    copilotApi.chat([]).then(res => {
      setState({ messages: [{ role: 'assistant', content: res.message }], suggestions: res.suggestions, aiRequirements: res.requirements, progress: res.progress, isComplete: res.is_complete, loading: false, error: null });
    }).catch((err: unknown) => {
      setState(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : t('errorGeneric') }));
    });
  };

  const handleNewConversation = () => {
    if (state.messages.length > 1 && !state.isComplete) {
      setShowConfirmNew(true);
    } else {
      doNewConversation();
    }
  };

  const handleLoadSession = (session: Interaction) => {
    let messages: Message[] = [];
    const restoredRequirements: Requirements = {};

    try {
      const parsed = JSON.parse(session.raw_transcript || '[]');
      if (Array.isArray(parsed)) {
        messages = parsed.filter((m: unknown) => {
          if (typeof m === 'object' && m !== null) {
            const msg = m as Record<string, unknown>;
            return typeof msg.role === 'string' && typeof msg.content === 'string';
          }
          return false;
        }) as Message[];
      }
    } catch {
      // Legacy text format — no messages to restore
    }

    if (session.requirements) {
      const r = session.requirements as Record<string, string | null>;
      (Object.keys(r) as Array<keyof Requirements>).forEach(k => {
        (restoredRequirements as Record<string, string | null>)[k] = r[k] ?? null;
      });
    }

    setState({
      messages: messages.length > 0
        ? [...messages, { role: 'assistant', content: t('loadedSession') }]
        : [{ role: 'assistant', content: t('loadedSession') }],
      suggestions: [],
      aiRequirements: restoredRequirements,
      progress: 100,
      isComplete: false,
      loading: false,
      error: null,
    });
    setUserRequirements({});
    setUserEditedKeys(new Set());
    setSelectedSuggestions(new Set());
    setIsSaved(true);
    setShowSessions(false);
  };

  const handleUserEdit = (key: keyof Requirements, value: string) => {
    setUserRequirements(prev => ({ ...prev, [key]: value || null }));
    setUserEditedKeys(prev => { const next = new Set(prev); next.add(key); return next; });
  };

  const handleAddCustomField = (label: string, value: string) => {
    setCustomFields(prev => [...prev, { id: `${uid}-${Date.now()}`, label, value }]);
  };

  const answeredCount = state.messages.filter(m => m.role === 'user').length;
  const filledCount = Object.values(requirements).filter(Boolean).length + customFields.filter(f => f.value).length;
  const suggestedTitle = (requirements.description ?? '').slice(0, 60) || '';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface">

        {/* Header */}
        <header className="w-full sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl shadow-sm border-b border-outline-variant/10">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <div className="bg-primary text-on-primary p-2 rounded-xl"><Sparkles className="w-5 h-5" /></div>
              <div>
                <h2 className="font-headline font-black text-xl tracking-tighter text-primary">{t('title')}</h2>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{state.progress}% {t('completed')}</span>
                <div className="w-32 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${state.progress}%` }} />
                </div>
              </div>
              <button
                onClick={handleGenerateQuote}
                disabled={filledCount === 0 || quoteLoading}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-headline font-bold text-sm transition-all',
                  filledCount > 0 && !quoteLoading
                    ? 'bg-surface-container-low text-on-surface border border-outline-variant/30 hover:bg-surface-container-high'
                    : 'bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed',
                )}
              >
                <Calculator className="w-4 h-4" />
                {quoteLoading ? t('generatingQuote') : t('generateQuote')}
              </button>
              <button
                onClick={() => setBriefingModalOpen(true)}
                disabled={filledCount === 0}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl font-headline font-bold text-sm transition-all',
                  filledCount > 0
                    ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95'
                    : 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed',
                )}
              >
                <FileText className="w-4 h-4" />
                {t('generateBriefing')}
              </button>
            </div>
          </div>

          {/* Selection Bar */}
          <div className="px-6 pb-3 flex items-center gap-4 border-t border-outline-variant/5 pt-3 flex-wrap">
            {/* New conversation */}
            <button
              onClick={handleNewConversation}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-all text-[11px] font-bold uppercase tracking-widest"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('newConversation')}
            </button>

            <div className="h-5 w-px bg-outline-variant/30 shrink-0" />

            {/* Opportunity selector */}
            <div className="flex items-center gap-2 flex-1 min-w-0 max-w-sm">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant whitespace-nowrap">
                {t('selectOpportunity')}
              </label>
              <select
                value={selectedOpportunityId}
                onChange={e => { setSelectedOpportunityId(e.target.value); setIsSaved(false); }}
                className="flex-1 min-w-0 bg-surface-container-low text-[12px] font-bold text-primary rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-surface-container-high transition-colors"
              >
                <option value="">-- {t('none')} --</option>
                {opportunities.map(opp => (
                  <option key={opp.id} value={opp.id}>{opp.company_name} — {opp.title}</option>
                ))}
              </select>
              {selectedOpportunityId && (
                <button
                  onClick={() => setShowSessions(true)}
                  disabled={sessionsLoading}
                  title={t('sessionsTitle')}
                  className={cn(
                    'shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all',
                    sessions.length > 0
                      ? 'bg-tertiary-container text-on-tertiary-container hover:scale-[1.05] active:scale-95'
                      : 'bg-surface-container-high text-on-surface-variant/50',
                  )}
                >
                  <History className="w-3.5 h-3.5" />
                  {sessionsLoading ? '…' : sessions.length}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Chat panel */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {state.messages.map((msg, i) =>
                msg.role === 'assistant' ? <AiBubble key={i} content={msg.content} />
                : msg.content === '[SKIP]' ? <SkippedBubble key={i} label={t('skipped')} />
                : <UserBubble key={i} content={msg.content} />
              )}
              {state.loading && (
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-surface-container-low px-5 py-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                    {[0, 1, 2].map(d => <span key={d} className="w-2 h-2 rounded-full bg-on-surface-variant/40 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />)}
                  </div>
                </div>
              )}
              {state.error && (
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-error-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px] text-on-error-container">error</span>
                  </div>
                  <div className="bg-error-container text-on-error-container px-5 py-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed">{state.error}</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {state.suggestions.length > 0 && (
              <div className="px-6 pb-2 flex flex-wrap gap-2">
                {state.suggestions.map((s, i) => {
                  const selected = selectedSuggestions.has(i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleSuggestion(i)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all',
                        selected
                          ? 'bg-primary text-on-primary shadow-md shadow-primary/20 scale-[1.02]'
                          : 'bg-tertiary-container text-on-tertiary-container hover:scale-[1.02] active:scale-95',
                      )}
                    >
                      {selected && <Check className="w-3 h-3 shrink-0" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="p-4 flex items-center gap-3 bg-surface-container-lowest/80 backdrop-blur-sm border-t border-outline-variant/10">
              <button type="button" onClick={() => sendMessage('[SKIP]')} disabled={state.loading} title={t('skipHint')}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors text-[11px] font-bold uppercase tracking-widest disabled:opacity-40">
                <SkipForward className="w-3.5 h-3.5" />{t('skip')}
              </button>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} disabled={state.loading}
                placeholder={selectedSuggestions.size > 0 ? t('additionalInput') : t('inputPlaceholder')}
                className="flex-1 bg-surface-container-low rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
              <button type="submit" disabled={(selectedSuggestions.size === 0 && !input.trim()) || state.loading}
                className="shrink-0 w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-40 disabled:scale-100">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Requirements panel */}
          <aside className="hidden lg:flex flex-col w-80 shrink-0 border-l border-outline-variant/10 bg-surface-container-lowest overflow-y-auto custom-scrollbar">
            <div className="p-5 sticky top-0 bg-surface-container-lowest z-10 border-b border-outline-variant/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('summaryTitle')}</p>
                <span className="text-[10px] font-black text-primary">{filledCount} {t('fieldsFilled')}</span>
              </div>
              <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${state.progress}%` }} />
              </div>
              <p className="text-[10px] text-on-surface-variant/60 mt-1.5">{t('editHint')}</p>
            </div>

            <div className="px-4 pt-4 space-y-2">
              {REQUIREMENT_FIELDS.map(({ key, icon, labelKey }) => (
                <EditableCard key={key} icon={icon} label={t(labelKey)} value={requirements[key]}
                  onChange={val => handleUserEdit(key, val)}
                  highlight={highlightedKeys.has(key)} isUserEdited={userEditedKeys.has(key)} />
              ))}
            </div>

            {customFields.length > 0 && (
              <div className="px-4 pt-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 px-1">{t('customFields')}</p>
                {customFields.map(field => (
                  <EditableCard key={field.id} label={field.label} value={field.value || null}
                    onChange={val => setCustomFields(prev => prev.map(f => f.id === field.id ? { ...f, value: val } : f))}
                    onDelete={() => setCustomFields(prev => prev.filter(f => f.id !== field.id))} />
                ))}
              </div>
            )}

            <div className="px-4 pt-3 pb-4">
              <AddFieldForm onAdd={handleAddCustomField} />
            </div>

            {state.tacticalAdvice && (
              <div className="px-4 pb-4">
                <TacticalAdvice advice={state.tacticalAdvice} />
              </div>
            )}

            <div className="px-4 pt-2 pb-4 mt-auto space-y-2">
              {/* Save session */}
              {!isSaved ? (
                <button
                  onClick={handleSaveSession}
                  disabled={!selectedOpportunityId || isSaving}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-all uppercase tracking-widest',
                    selectedOpportunityId && !isSaving
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed',
                  )}
                >
                  {isSaving ? t('creating') : <><Check className="w-3.5 h-3.5" />{t('saveSession')}</>}
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-green-500/10 text-green-600 font-bold text-xs uppercase tracking-widest">
                  <CheckCircle2 className="w-3.5 h-3.5" />{t('sessionSaved')}
                </div>
              )}
              {!selectedOpportunityId && !isSaved && (
                <p className="text-[10px] text-on-surface-variant/50 italic text-center">{t('noOpportunitySelected')}</p>
              )}

              {filledCount > 0 && (<>
                <button
                  onClick={handleGenerateQuote}
                  disabled={quoteLoading}
                  className="w-full py-2.5 bg-surface-container-low text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Calculator className="w-4 h-4" />
                  {quoteLoading ? t('generatingQuote') : t('generateQuote')}
                </button>
                <button
                  onClick={() => setBriefingModalOpen(true)}
                  className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {t('generateBriefing')}
                </button>
              </>)}
            </div>
          </aside>
        </div>
      </div>

      {briefingModalOpen && (
        <BriefingCreationModal suggestedTitle={suggestedTitle} onClose={() => setBriefingModalOpen(false)} />
      )}
      {quote && <QuoteResultModal quote={quote} onClose={() => setQuote(null)} />}
      {showConfirmNew && (
        <ConfirmNewModal onConfirm={doNewConversation} onCancel={() => setShowConfirmNew(false)} />
      )}
      {showSessions && (
        <SessionHistoryModal
          sessions={sessions}
          opportunityTitle={opportunities.find(o => o.id === selectedOpportunityId)?.title ?? ''}
          onClose={() => setShowSessions(false)}
          onLoad={handleLoadSession}
        />
      )}
    </div>
  );
}

export default function CopilotPage() {
  return (
    <Suspense>
      <CopilotInner />
    </Suspense>
  );
}
