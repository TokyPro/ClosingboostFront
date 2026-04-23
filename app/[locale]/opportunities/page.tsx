import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Sidebar } from '../../../components/Sidebar';
import { TopBar } from '../../../components/TopBar';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { cn } from '../../../lib/cn';
import { opportunityApi, usersApi } from '../../../lib/api';
import { Opportunity, User } from '../../../lib/types';
import { Link } from '@/i18n/navigation';
import { CURRENT_USER_ID } from '../../../lib/config';

const PAGE_SIZE = 10;

// ── Formatters ────────────────────────────────────────────────────────────────

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

// ── URL builder ───────────────────────────────────────────────────────────────

function buildHref(view: string, page: number, query: string) {
  const p = new URLSearchParams();
  if (query) p.set('q', query);
  p.set('view', view);
  if (view === 'table') p.set('page', String(page));
  return `/opportunities?${p.toString()}`;
}

// ── Pagination ────────────────────────────────────────────────────────────────

type TFn = Awaited<ReturnType<typeof getTranslations>>;

function Pagination({
  page, total, view, query, t,
}: {
  page: number; total: number; view: string; query: string; t: TFn;
}) {
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

// ── Kanban view ───────────────────────────────────────────────────────────────

const STAGES = [
  { id: 'creation',          dotClass: 'bg-surface-container-highest' },
  { id: 'qualification',     dotClass: 'bg-surface-container-high' },
  { id: 'first_meeting',     dotClass: 'bg-tertiary-container' },
  { id: 'quote_needed',      dotClass: 'bg-on-tertiary-container' },
  { id: 'offer_sent',        dotClass: 'bg-primary-container' },
  { id: 'waiting_signature', dotClass: 'bg-primary' },
  { id: 'signed',            dotClass: 'bg-on-primary-container' },
] as const;

function KanbanView({
  opportunities, t,
}: {
  opportunities: Opportunity[];
  t: TFn;
}) {
  const stageLabels: Record<string, string> = {
    creation:          t('creation'),
    qualification:     t('qualification'),
    first_meeting:     t('first_meeting'),
    quote_needed:      t('quote_needed'),
    offer_sent:        t('offer_sent'),
    waiting_signature: t('waiting_signature'),
    signed:            t('signed'),
  };

  const byStage = STAGES.reduce<Record<string, Opportunity[]>>((acc, s) => {
    acc[s.id] = opportunities.filter(o => o.stage === s.id);
    return acc;
  }, {});

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
      {STAGES.map(({ id, dotClass }) => {
        const opps = byStage[id];
        return (
          <div key={id} className="flex-none w-72 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                {stageLabels[id]} ({opps.length})
              </span>
              <span className={cn('h-2 w-2 rounded-full', dotClass)} />
            </div>
            <div className="space-y-4">
              {opps.map(opp => (
                <Link key={opp.id} href={`/opportunities/${opp.id}/briefing`}>
                  {id === 'signed' ? (
                    <div className="bg-on-primary-container/8 p-4 rounded-2xl hover:bg-on-primary-container/12 transition-colors cursor-pointer group">
                      <h4 className="text-sm font-bold text-primary mb-3 group-hover:text-primary-container transition-colors">{opp.title}</h4>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-on-primary-container/15 text-on-primary-container uppercase tracking-widest">
                          {t('completed')}
                        </span>
                        <span className="text-[10px] font-bold text-primary">{formatCurrency(opp.value)}</span>
                      </div>
                      <div className="flex items-center text-xs text-on-primary-container font-medium">
                        <span className="material-symbols-outlined text-[16px] mr-1">check_circle</span>
                        {t('onboardedToday')}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                          {opp.title}
                        </h4>
                        <span className="material-symbols-outlined text-[16px] text-outline/50 shrink-0 ml-2">more_horiz</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        {opp.priority !== 'low' && (
                          <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest', priorityClass(opp.priority))}>
                            {opp.priority === 'high' ? t('highPriority') : t('qualified')}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-on-surface-variant">{formatCurrency(opp.value)}</span>
                      </div>
                      {id === 'waiting_signature' && (
                        <div className="w-full bg-surface-container-high h-1 rounded-full mb-3 overflow-hidden">
                          <div className="bg-primary h-1 rounded-full" style={{ width: `${opp.win_probability * 100}%` }} />
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <div className="h-6 w-6 rounded-full bg-surface-container-high flex items-center justify-center text-[9px] font-bold text-on-surface outline outline-2 outline-surface-container-lowest">
                          {opp.company_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        {id === 'waiting_signature' ? (
                          <span className="text-[10px] text-on-tertiary-container font-bold uppercase tracking-wider">
                            {(opp.win_probability * 100).toFixed(0)}% {t('winProb')}
                          </span>
                        ) : (
                          <span className="text-[9px] text-on-surface-variant flex items-center gap-1 font-bold">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {t('daysLeft')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Table view ────────────────────────────────────────────────────────────────

function TableView({
  opportunities, page, query, t,
}: {
  opportunities: Opportunity[];
  page: number;
  query: string;
  t: TFn;
}) {
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
                  {/* Company */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                        {opp.company_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-on-surface text-xs whitespace-nowrap">{opp.company_name}</span>
                    </div>
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3 max-w-[200px]">
                    <Link href={`/opportunities/${opp.id}/briefing`} className="font-bold text-on-surface group-hover:text-primary transition-colors truncate block">
                      {opp.title}
                    </Link>
                  </td>

                  {/* Stage */}
                  <td className="px-4 py-3">
                    <span className={cn('text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest whitespace-nowrap', stageClass(opp.stage))}>
                      {stageLabels[opp.stage] ?? opp.stage}
                    </span>
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3">
                    <span className="font-headline font-black text-sm text-primary">{formatCurrency(opp.value)}</span>
                  </td>

                  {/* Win % */}
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

                  {/* Priority */}
                  <td className="px-4 py-3">
                    <span className={cn('text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest', priorityClass(opp.priority))}>
                      {opp.priority === 'high' ? t('highPriority') : opp.priority === 'medium' ? t('qualified') : opp.priority}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-on-surface-variant whitespace-nowrap">{formatDate(opp.created_at)}</span>
                  </td>

                  {/* Actions */}
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

      <Pagination page={safePage} total={total} view="table" query={query} t={t} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const OpportunitiesListPage = async ({
  searchParams,
}: {
  searchParams?: { q?: string; view?: string; page?: string };
}) => {
  const t = await getTranslations('Dashboard');
  const tErr = await getTranslations('Errors');

  const query = searchParams?.q?.trim() ?? '';
  const view  = searchParams?.view === 'table' ? 'table' : 'kanban';
  const page  = Math.max(1, parseInt(searchParams?.page ?? '1', 10));

  let opportunities: Opportunity[] = [];
  let user: User | null = null;
  let loadError: string | null = null;

  try {
    [opportunities, user] = await Promise.all([
      query ? opportunityApi.search(query, CURRENT_USER_ID) : opportunityApi.list(CURRENT_USER_ID),
      usersApi.getOne(CURRENT_USER_ID),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : tErr('loadFailed');
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface">
        <TopBar
          userName={user?.email?.split('@')[0].replace('.', ' ') ?? undefined}
          userRole={user?.role ?? undefined}
        />

        <section className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          {loadError && <ErrorBanner message={loadError} />}

          {/* Header */}
          <div className="mb-6 flex justify-between items-end flex-wrap gap-4">
            <div>
              <h2 className="font-headline text-3xl font-black tracking-tight text-primary">
                {query ? t('searchResults', { query }) : t('projectPipeline')}
              </h2>
              <p className="text-on-surface-variant font-medium mt-1">
                {query
                  ? t('searchCount', { count: opportunities.length })
                  : t('allOpportunities')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center bg-surface-container-low rounded-xl p-1 gap-0.5">
                <Link
                  href={buildHref('kanban', page, query)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all',
                    view === 'kanban'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">view_kanban</span>
                  {t('viewKanban')}
                </Link>
                <Link
                  href={buildHref('table', 1, query)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all',
                    view === 'table'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">table_rows</span>
                  {t('viewTable')}
                </Link>
              </div>

              <Link
                href="/opportunities/new"
                className="px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                {t('newOpportunity')}
              </Link>
            </div>
          </div>

          {/* Content */}
          {view === 'table' ? (
            <TableView opportunities={opportunities} page={page} query={query} t={t} />
          ) : (
            <KanbanView opportunities={opportunities} t={t} />
          )}
        </section>
      </main>
    </div>
  );
};

export default OpportunitiesListPage;
