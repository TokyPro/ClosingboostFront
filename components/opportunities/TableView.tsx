'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Opportunity } from '@/lib/types';
import { cn } from '@/lib/cn';
import { Link } from '@/i18n/navigation';

const PAGE_SIZE = 10;

const formatCurrency = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `$${(v / 1_000).toFixed(0)}k`
  : `$${v}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const priorityClass = (p: string) => {
  if (p === 'high')   return 'bg-tertiary-container text-on-tertiary-container';
  if (p === 'medium') return 'bg-surface-container-high text-on-surface-variant';
  return 'bg-surface-container-low text-on-surface-variant/70';
};

const stageClass = (s: string) => {
  if (s === 'signed')      return 'bg-on-primary-container/15 text-on-primary-container';
  if (s === 'waiting_signature' || s === 'offer_sent') return 'bg-primary/10 text-primary';
  if (s === 'first_meeting' || s === 'quote_needed')    return 'bg-on-tertiary-container/15 text-on-tertiary-container';
  return 'bg-surface-container-high text-on-surface-variant';
};

function buildHref(view: string, page: number, query: string) {
  const p = new URLSearchParams();
  if (query) p.set('q', query);
  p.set('view', view);
  if (view === 'table') p.set('page', String(page));
  return `/opportunities?${p.toString()}`;
}

interface TableViewProps {
  opportunities: Opportunity[];
  page: number;
  query: string;
}

export function TableView({ opportunities, page, query }: TableViewProps) {
  const t = useTranslations('Dashboard');
  const total = opportunities.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const rows = opportunities.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const stageLabels: Record<string, string> = {
    creation:          t('creation'),
    qualification:     t('qualification'),
    first_meeting:     t('first_meeting'),
    quote_needed:      t('quote_needed'),
    offer_sent:        t('offer_sent'),
    waiting_signature: t('waiting_signature'),
    signed:            t('signed'),
  };

  return (
    <div>
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/10">
              {[
                t('colCompany'), t('colTitle'), t('colStage'),
                t('colValue'), t('colWinProb'), t('colPriority'),
                t('colCreated'), t('colActions'),
              ].map(col => (
                <th key={col} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-on-surface-variant text-sm">
                  {t('tableEmpty')}
                </td>
              </tr>
            ) : (
              rows.map((opp, i) => (
                <tr
                  key={opp.id}
                  className={cn(
                    'border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors group',
                    i % 2 === 0 ? '' : 'bg-surface-container-lowest/50',
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                        {opp.company_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-on-surface text-xs whitespace-nowrap">{opp.company_name}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 max-w-[200px]">
                    <Link href={`/opportunities/${opp.id}/briefing`} className="font-bold text-on-surface group-hover:text-primary transition-colors truncate block">
                      {opp.title}
                    </Link>
                  </td>

                  <td className="px-4 py-3">
                    <span className={cn('text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest whitespace-nowrap', stageClass(opp.stage))}>
                      {stageLabels[opp.stage] ?? opp.stage}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-headline font-black text-sm text-primary">{formatCurrency(opp.value)}</span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="flex-1 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${opp.win_probability * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant whitespace-nowrap">
                        {(opp.win_probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={cn('text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest', priorityClass(opp.priority))}>
                      {opp.priority === 'high' ? t('highPriority') : opp.priority === 'medium' ? t('qualified') : opp.priority}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-[11px] text-on-surface-variant whitespace-nowrap">{formatDate(opp.created_at)}</span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/opportunities/${opp.id}/briefing`}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Briefing"
                      >
                        <span className="material-symbols-outlined text-[16px]">description</span>
                      </Link>
                      <Link
                        href={`/opportunities/${opp.id}/edit`}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} total={total} view="table" query={query} />
    </div>
  );
}

function Pagination({
  page, total, view, query,
}: {
  page: number; total: number; view: string; query: string;
}) {
  const t = useTranslations('Dashboard');
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (totalPages <= 1) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, total);

  const pageNumbers: (number | '…')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pageNumbers.push(i);
    else if (pageNumbers[pageNumbers.length - 1] !== '…') pageNumbers.push('…');
  }

  return (
    <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
      <p className="text-[11px] text-on-surface-variant font-bold">
        {t('showing', { from, to, total })}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(view, page - 1, query)}
          aria-disabled={page <= 1}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all',
            page <= 1
              ? 'pointer-events-none text-on-surface-variant/30 bg-surface-container-low'
              : 'text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high',
          )}
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          {t('prevPage')}
        </Link>

        {pageNumbers.map((n, i) =>
          n === '…' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-[11px] text-on-surface-variant/40 select-none">…</span>
          ) : (
            <Link
              key={n}
              href={buildHref(view, n, query)}
              className={cn(
                'w-8 h-8 rounded-xl text-[11px] font-bold flex items-center justify-center transition-all',
                n === page
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              {n}
            </Link>
          )
        )}

        <Link
          href={buildHref(view, page + 1, query)}
          aria-disabled={page >= totalPages}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all',
            page >= totalPages
              ? 'pointer-events-none text-on-surface-variant/30 bg-surface-container-low'
              : 'text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high',
          )}
        >
          {t('nextPage')}
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </Link>
      </div>
    </div>
  );
}
