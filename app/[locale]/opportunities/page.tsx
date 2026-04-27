'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '../../../components/Sidebar';
import { TopBar } from '../../../components/TopBar';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { cn } from '../../../lib/cn';
import { opportunityApi, usersApi } from '../../../lib/api';
import { Opportunity, User } from '../../../lib/types';
import { Link } from '@/i18n/navigation';
import { useAuth } from '../../../lib/auth';
import { KanbanView } from '../../../components/opportunities/KanbanView';
import { TableView } from '../../../components/opportunities/TableView';

function buildHref(view: string, page: number, query: string) {
  const p = new URLSearchParams();
  if (query) p.set('q', query);
  p.set('view', view);
  if (view === 'table') p.set('page', String(page));
  return `/opportunities?${p.toString()}`;
}

function OpportunitiesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-5 bg-surface-container-high rounded-full w-24 animate-pulse" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-28 bg-surface-container-low rounded-2xl animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function OpportunitiesListPageInner() {
  const t = useTranslations('Dashboard');
  const tErr = useTranslations('Errors');
  const { user: authUser } = useAuth();
  const searchParams = useSearchParams();

  const query = searchParams.get('q')?.trim() ?? '';
  const view  = searchParams.get('view') === 'table' ? 'table' : 'kanban';
  const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser?.id) return;
    Promise.all([
      query ? opportunityApi.search(query, authUser.id) : opportunityApi.list(authUser.id),
      usersApi.getOne(authUser.id),
    ]).then(([opps, u]) => {
      setOpportunities(opps as Opportunity[]);
      setUser(u as User);
      setLoadError(null);
      setLoading(false);
    }).catch((err: unknown) => {
      setLoadError(err instanceof Error ? err.message : tErr('loadFailed'));
      setLoading(false);
    });
  }, [authUser?.id, query, tErr]);

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

          {loading ? (
            <OpportunitiesSkeleton />
          ) : view === 'table' ? (
            <TableView opportunities={opportunities} page={page} query={query} />
          ) : (
            <KanbanView opportunities={opportunities} />
          )}
        </section>
      </main>
    </div>
  );
}

export default function OpportunitiesListPage() {
  return (
    <Suspense>
      <OpportunitiesListPageInner />
    </Suspense>
  );
}
