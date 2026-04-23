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

const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
};

const getPriorityClass = (priority: string, t: any) => {
  switch (priority) {
    case 'high':
      return 'bg-tertiary-container text-on-tertiary-container';
    case 'medium':
      return 'bg-surface-container-high text-on-surface-variant';
    default:
      return 'bg-surface-container-low text-on-surface-variant/70';
  }
};

interface MetricCardProps {
  title: string;
  value: string;
  trend: string;
  trendHighlight?: boolean;
  icon: string;
  accentClass: string;
}

interface PipelineColumnProps {
  title: string;
  count: number;
  dotClass: string;
  children: React.ReactNode;
}

interface PipelineCardProps {
  title: string;
  value: string;
  priority?: string;
  priorityClass?: string;
  initials: string;
  initials2?: string;
  progress?: number;
  winProb?: string;
  daysLeft?: string;
}

interface TeamMemberProps {
  name: string;
  role: string;
  deals: number;
  dealsLabel: string;
}

const MetricCard = ({ title, value, trend, trendHighlight, icon, accentClass }: MetricCardProps) => (
  <div
    className={cn(
      'bg-surface-container-lowest p-6 rounded-2xl shadow-sm border-l-4 hover:scale-[1.02] transition-transform',
      accentClass
    )}
  >
    <div className="flex justify-between items-start mb-4">
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{title}</p>
      <span className="material-symbols-outlined text-[20px] text-on-surface-variant/40">{icon}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="font-headline text-3xl font-black text-on-surface">{value}</span>
      <span
        className={cn(
          'text-[10px] font-bold px-2 py-0.5 rounded-full',
          trendHighlight
            ? 'text-on-tertiary-container bg-tertiary-container/15'
            : 'text-on-primary-container bg-on-primary-container/15'
        )}
      >
        {trend}
      </span>
    </div>
  </div>
);

const PipelineColumn = ({ title, count, dotClass, children }: PipelineColumnProps) => (
  <div className="flex-none w-72 space-y-4">
    <div className="flex items-center justify-between px-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
        {title} ({count})
      </span>
      <span className={cn('h-2 w-2 rounded-full', dotClass)} />
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const PipelineCard = ({
  title,
  value,
  priority,
  priorityClass,
  initials,
  initials2,
  progress,
  winProb,
  daysLeft,
}: PipelineCardProps) => (
  <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
    <div className="flex justify-between items-start mb-3">
      <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
        {title}
      </h4>
      <span className="material-symbols-outlined text-[16px] text-outline/50">more_horiz</span>
    </div>

    <div className="flex items-center gap-2 mb-4">
      {priority && (
        <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest', priorityClass)}>
          {priority}
        </span>
      )}
      <span className="text-[10px] font-bold text-on-surface-variant">{value}</span>
    </div>

    {progress != null && (
      <div className="w-full bg-surface-container-high h-1 rounded-full mb-3 overflow-hidden">
        <div className="bg-primary h-1 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
    )}

    <div className="flex justify-between items-center">
      <div className="flex -space-x-2">
        {initials && (
          <div className="h-6 w-6 rounded-full bg-surface-container-high flex items-center justify-center text-[9px] font-bold text-on-surface outline outline-2 outline-surface-container-lowest">
            {initials}
          </div>
        )}
        {initials2 && (
          <div className="h-6 w-6 rounded-full bg-surface-container-highest flex items-center justify-center text-[9px] font-bold text-on-surface outline outline-2 outline-surface-container-lowest">
            {initials2}
          </div>
        )}
      </div>
      {winProb ? (
        <span className="text-[10px] text-on-tertiary-container font-bold uppercase tracking-wider">
          {winProb}
        </span>
      ) : (
        <span className="text-[9px] text-on-surface-variant flex items-center gap-1 font-bold">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          {daysLeft}
        </span>
      )}
    </div>
  </div>
);

const TeamMember = ({ name, role, deals, dealsLabel }: TeamMemberProps) => (
  <div className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center outline outline-1 outline-outline-variant/20">
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">person</span>
      </div>
      <div>
        <p className="text-sm font-bold text-on-surface">{name}</p>
        <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">{role}</p>
      </div>
    </div>
    <span className="text-[10px] font-black text-on-tertiary-container px-2 py-1 bg-tertiary-container/15 rounded-xl">
      {deals} {dealsLabel}
    </span>
  </div>
);

const DashboardPage = async () => {
  const t = await getTranslations('Dashboard');
  const tErr = await getTranslations('Errors');

  let opportunities: Opportunity[] = [];
  let user: User | null = null;
  let loadError: string | null = null;

  try {
    [opportunities, user] = await Promise.all([
      opportunityApi.list(CURRENT_USER_ID),
      usersApi.getOne(CURRENT_USER_ID),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : tErr('loadFailed');
  }

  // Compute real metrics from loaded opportunities
  const totalValue = opportunities.reduce((acc, o) => acc + o.value, 0);
  const closedOpps = opportunities.filter((o) => o.stage === 'signed');
  const conversionRate = opportunities.length > 0
    ? ((closedOpps.length / opportunities.length) * 100).toFixed(1)
    : '0.0';
  const avgWinProb = opportunities.length > 0
    ? ((opportunities.reduce((acc, o) => acc + o.win_probability, 0) / opportunities.length) * 100).toFixed(0)
    : '0';

  const stages = [
    { id: 'discovery', title: t('discovery'), dotClass: 'bg-surface-container-highest' },
    { id: 'proposal', title: t('proposal'), dotClass: 'bg-on-tertiary-container' },
    { id: 'negotiation', title: t('negotiation'), dotClass: 'bg-primary' },
    { id: 'closed', title: t('closed'), dotClass: 'bg-on-primary-container' },
  ];

  // goalProgress = % of total pipeline value that is closed
  const goalProgress = totalValue > 0
    ? Math.round((closedOpps.reduce((acc, o) => acc + o.value, 0) / totalValue) * 100)
    : 0;

  const displayName = user?.email?.split('@')[0].replace('.', ' ') ?? '—';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface">
        <TopBar userName={displayName} userRole={user?.role} />

        <section className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          {loadError && <ErrorBanner message={loadError} />}
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="font-headline text-3xl font-black tracking-tight text-primary">
                {t('title')}
              </h2>
              <p className="text-on-surface-variant font-medium mt-1">
                {t('subtitle')}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-surface-container-lowest text-on-surface text-sm font-semibold rounded-xl hover:bg-surface-container-low transition-colors shadow-sm outline outline-1 outline-outline-variant/15">
                {t('downloadReport')}
              </button>
              <Link href="/opportunities/new" className="px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                {t('newOpportunity')}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <MetricCard
              title={t('totalPipelineValue')}
              value={totalValue >= 1_000_000
                ? `$${(totalValue / 1_000_000).toFixed(1)}M`
                : `$${(totalValue / 1000).toFixed(0)}k`}
              trend={`${opportunities.length} ${t('oppsCount')}`}
              icon="analytics"
              accentClass="border-primary"
            />
            <MetricCard
              title={t('conversionRate')}
              value={`${conversionRate}%`}
              trend={`${closedOpps.length} ${t('closed')}`}
              icon="trending_up"
              accentClass="border-on-tertiary-container"
            />
            <MetricCard
              title={t('avgWinProbability')}
              value={`${avgWinProb}%`}
              trend={t('acrossAllDeals')}
              trendHighlight
              icon="bolt"
              accentClass="border-on-primary-container"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-xl font-bold text-primary">{t('projectPipeline')}</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-surface-container-high text-[10px] font-bold text-on-surface-variant rounded-full uppercase tracking-widest">
                    {t('allStages')}
                  </span>
                  <span className="px-3 py-1 bg-surface-container-high text-[10px] font-bold text-on-surface-variant rounded-full uppercase tracking-widest">
                    {t('last30Days')}
                  </span>
                </div>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                {stages.map((stage) => {
                  const stageOpps = opportunities.filter((opp) => opp.stage === stage.id);
                  return (
                    <PipelineColumn key={stage.id} title={stage.title} count={stageOpps.length} dotClass={stage.dotClass}>
                      {stageOpps.map((opp) => (
                        <Link key={opp.id} href={`/opportunities/${opp.id}/briefing`}>
                          {stage.id === 'closed' ? (
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
                            <PipelineCard
                              title={opp.title}
                              value={formatCurrency(opp.value)}
                              priority={opp.priority === 'high' ? t('highPriority') : opp.priority === 'medium' ? t('qualified') : undefined}
                              priorityClass={getPriorityClass(opp.priority, t)}
                              initials={opp.company_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              progress={stage.id === 'negotiation' ? opp.win_probability * 100 : undefined}
                              winProb={stage.id === 'negotiation' ? `${(opp.win_probability * 100).toFixed(0)}% ${t('winProb')}` : undefined}
                              daysLeft={t('daysLeft')}
                            />
                          )}
                        </Link>
                      ))}
                    </PipelineColumn>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-primary to-primary-container text-on-primary p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="relative z-10">
                  <h4 className="font-headline font-bold mb-2">{t('executiveOverview')}</h4>
                  <p className="text-on-primary/80 text-sm mb-5">
                    {t('salesVelocity')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span>{t('goalProgress')}</span>
                      <span>{goalProgress}%</span>
                    </div>
                    <div className="w-full bg-on-primary/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-on-primary h-full transition-all duration-1000"
                        style={{ width: `${goalProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <span className="material-symbols-outlined !text-[120px]">insights</span>
                </div>
              </div>

              {user && (
                <div>
                  <h3 className="font-headline text-lg font-bold text-primary mb-4">
                    {t('accountOwner')}
                  </h3>
                  <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
                    <TeamMember
                      name={displayName}
                      role={user.role}
                      deals={opportunities.length}
                      dealsLabel={t('deals')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
