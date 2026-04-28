'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Sidebar } from '../../../components/Sidebar';
import { TopBar } from '../../../components/TopBar';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { opportunityApi, usersApi } from '../../../lib/api';
import { Opportunity, User } from '../../../lib/types';
import { Link } from '@/i18n/navigation';
import { useAuth } from '../../../lib/auth';

const formatCurrency = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
};

/* ── Metric card (Aurora Glass) ─────────────────────────────────────────── */
interface MetricCardProps {
  label: string;
  value: string;
  trend: string;
  icon: string;
  accent: 'cobalt' | 'lime' | 'cyan' | 'amber';
}

const accentColors: Record<string, { fg: string; glow: string }> = {
  cobalt: { fg: 'var(--fg-cobalt)', glow: 'var(--accent-cobalt)' },
  lime:   { fg: 'var(--fg-lime)',   glow: 'var(--accent-lime)' },
  cyan:   { fg: 'var(--fg-cyan)',   glow: 'var(--accent-cyan)' },
  amber:  { fg: 'var(--fg-amber)',  glow: 'var(--accent-amber)' },
};

const MetricCard = ({ label, value, trend, icon, accent }: MetricCardProps) => {
  const { fg } = accentColors[accent];
  return (
    <div
      style={{
        background: 'var(--bg-glass-strong)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-xl)',
        padding: '18px 22px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 280ms var(--ease-out-quart)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; }}
    >
      {/* Eyebrow label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em',
          color: fg,
        }}>
          <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 2 }} />
          {label}
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--fg-3)' }}>{icon}</span>
      </div>

      {/* Value */}
      <div style={{
        fontFamily: 'Geist, var(--font-manrope), sans-serif',
        fontWeight: 700,
        fontSize: 32,
        letterSpacing: '-0.025em',
        lineHeight: 1.05,
        color: 'var(--fg-1)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>

      {/* Trend */}
      <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: 'var(--fg-2)' }}>
        {trend}
      </div>
    </div>
  );
};

/* ── Kanban column ─────────────────────────────────────────────────────── */
interface KanbanColProps {
  title: string;
  count: number;
  dot: string;
  children: React.ReactNode;
}

const dotColors: Record<string, string> = {
  discovery:   'rgb(var(--accent-cobalt))',
  proposal:    'rgb(var(--accent-cyan))',
  negotiation: 'rgb(var(--accent-amber))',
  closed:      'rgb(var(--accent-lime))',
};

const KanbanCol = ({ title, count, dot, children }: KanbanColProps) => (
  <div style={{ flexShrink: 0, width: 272, display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--fg-2)' }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: dotColors[dot] ?? 'var(--fg-2)', boxShadow: `0 0 8px ${dotColors[dot] ?? 'transparent'}` }} />
        {title}
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, color: 'var(--fg-2)',
        background: 'var(--bg-glass-strong)',
        padding: '2px 8px',
        borderRadius: 9999,
        border: '1px solid var(--border-glass)',
      }}>
        {count}
      </span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {children}
    </div>
  </div>
);

/* ── Kanban deal card ──────────────────────────────────────────────────── */
interface KanbanCardProps {
  title: string;
  value: string;
  initials: string;
  progress?: number;
  badge?: string;
  badgeStyle?: React.CSSProperties;
}

const KanbanCard = ({ title, value, initials, progress, badge, badgeStyle }: KanbanCardProps) => (
  <div
    style={{
      background: 'var(--bg-glass-strong)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--border-glass)',
      borderRadius: 'var(--radius-lg)',
      padding: 14,
      display: 'flex', flexDirection: 'column', gap: 10,
      cursor: 'pointer',
      transition: 'all 180ms var(--ease-out-quart)',
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = 'translateY(-3px)';
      el.style.boxShadow = 'var(--shadow-md)';
      el.style.borderColor = 'rgb(var(--accent-cobalt) / 0.4)';
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget as HTMLElement;
      el.style.transform = '';
      el.style.boxShadow = '';
      el.style.borderColor = 'var(--border-glass)';
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)', letterSpacing: '-0.01em', flex: 1, marginRight: 8 }}>
        {title}
      </div>
      {badge && (
        <span style={{
          fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em',
          padding: '3px 8px', borderRadius: 9999, flexShrink: 0,
          ...badgeStyle,
        }}>
          {badge}
        </span>
      )}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontFamily: 'Geist, var(--font-manrope), sans-serif', fontWeight: 700, fontSize: 17, color: 'var(--fg-1)' }}>
        {value}
      </div>
      <div style={{
        width: 24, height: 24, borderRadius: 9999,
        background: 'var(--gradient-primary-cta)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 600, color: '#fff',
      }}>
        {initials}
      </div>
    </div>
    {progress != null && (
      <div style={{ width: '100%', height: 4, background: 'var(--bg-card-mid)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'var(--gradient-primary-cta)',
          borderRadius: 'inherit',
          transition: 'width 1.2s var(--ease-out-quart)',
        }} />
      </div>
    )}
  </div>
);

/* ── Skeleton ──────────────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            height: 120, borderRadius: 20,
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-glass)',
            animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
          }} />
        ))}
      </div>
      <div style={{ height: 140, borderRadius: 20, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
const DashboardPage = () => {
  const t = useTranslations('Dashboard');
  const tErr = useTranslations('Errors');
  const { user: authUser } = useAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser?.id) return;
    Promise.all([
      opportunityApi.list(authUser.id),
      usersApi.getOne(authUser.id),
    ]).then(([opps, u]) => {
      setOpportunities(opps);
      setUser(u);
      setLoadError(null);
      setLoading(false);
    }).catch((err: unknown) => {
      setLoadError(err instanceof Error ? err.message : tErr('loadFailed'));
      setLoading(false);
    });
  }, [authUser?.id, tErr]);

  const totalValue = opportunities.reduce((acc, o) => acc + o.value, 0);
  const closedOpps = opportunities.filter((o) => o.stage === 'signed');
  const conversionRate = opportunities.length > 0
    ? ((closedOpps.length / opportunities.length) * 100).toFixed(1)
    : '0.0';
  const avgWinProb = opportunities.length > 0
    ? ((opportunities.reduce((acc, o) => acc + o.win_probability, 0) / opportunities.length) * 100).toFixed(0)
    : '0';

  const goalProgress = totalValue > 0
    ? Math.round((closedOpps.reduce((acc, o) => acc + o.value, 0) / totalValue) * 100)
    : 0;

  const displayName = user?.email?.split('@')[0].replace('.', ' ') ?? '—';

  const stages = [
    { id: 'discovery',   title: t('discovery'),   dot: 'discovery' },
    { id: 'proposal',    title: t('proposal'),     dot: 'proposal' },
    { id: 'negotiation', title: t('negotiation'),  dot: 'negotiation' },
    { id: 'closed',      title: t('closed'),       dot: 'closed' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar userName={displayName} userRole={user?.role} />

        <section className="p-7 flex-1 overflow-y-auto custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {loadError && <ErrorBanner message={loadError} />}

          {/* Page header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}
            className="animate-page-rise stagger-1">
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em',
                color: 'var(--fg-cobalt)', marginBottom: 6,
              }}>
                <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 2 }} />
                Overview
              </div>
              <h1 style={{
                fontFamily: 'Geist, var(--font-manrope), sans-serif',
                fontWeight: 700, fontSize: 32,
                letterSpacing: '-0.025em', lineHeight: 1.05,
                color: 'var(--fg-1)', margin: 0,
              }}>
                {t('title')}
              </h1>
              <p style={{ color: 'var(--fg-2)', fontSize: 14, marginTop: 4 }}>{t('subtitle')}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg-glass-strong)',
                  color: 'var(--fg-1)', border: '1px solid var(--border-glass)',
                  borderRadius: 10, padding: '9px 16px', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', backdropFilter: 'blur(12px)', transition: 'all 180ms',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                {t('downloadReport')}
              </button>
              <Link
                href="/opportunities/new"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--gradient-primary-cta)',
                  color: '#fff', border: 'none',
                  borderRadius: 10, padding: '9px 18px',
                  fontFamily: 'Geist, var(--font-manrope), sans-serif',
                  fontWeight: 600, fontSize: 13.5,
                  boxShadow: 'var(--shadow-cta)',
                  transition: 'all 180ms var(--ease-spring)',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgb(59 91 255 / 0.45)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-cta)'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                {t('newOpportunity')}
              </Link>
            </div>
          </div>

          {loading ? <DashboardSkeleton /> : (
            <>
              {/* Executive hero card */}
              <div
                className="animate-page-rise stagger-2"
                style={{
                  background: 'linear-gradient(135deg, rgb(var(--accent-cobalt)) 0%, rgb(var(--color-primary)) 60%, rgb(var(--accent-cyan)) 110%)',
                  color: '#fff',
                  padding: 26,
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-cta)',
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr',
                  gap: 32,
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', inset: '-50%', background: 'radial-gradient(500px 500px at 80% 20%, rgba(255,255,255,0.18), transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgb(var(--accent-cyan))' }}>
                    <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 2 }} />
                    {t('executiveOverview')}
                  </div>
                  <h2 style={{ fontFamily: 'Geist, var(--font-manrope), sans-serif', fontWeight: 700, fontSize: 40, letterSpacing: '-0.025em', lineHeight: 1.05, color: '#fff', margin: '8px 0' }}>
                    {formatCurrency(totalValue)} {t('salesVelocity')}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 1.55, maxWidth: 480 }}>
                    {opportunities.length} {t('oppsCount')} — {closedOpps.length} {t('closed')}
                  </p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                    <Link
                      href="/copilot"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)',
                        color: '#fff', border: 'none', borderRadius: 10,
                        padding: '9px 16px', fontWeight: 600, fontSize: 13,
                        cursor: 'pointer', textDecoration: 'none',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
                      Open Copilot
                    </Link>
                    <Link
                      href="/pipeline"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)',
                        color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10,
                        padding: '9px 16px', fontWeight: 600, fontSize: 13,
                        cursor: 'pointer', textDecoration: 'none',
                      }}
                    >
                      {t('projectPipeline')}
                    </Link>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, position: 'relative' }}>
                  {[
                    { label: t('conversionRate'),    value: `${conversionRate}%` },
                    { label: t('avgWinProbability'), value: `${avgWinProb}%` },
                    { label: t('goalProgress'),      value: `${goalProgress}%` },
                    { label: t('closed'),            value: String(closedOpps.length) },
                  ].map((m) => (
                    <div key={m.label} style={{
                      background: 'rgba(255,255,255,0.10)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: 'var(--radius-lg)', padding: '14px 18px',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>{m.label}</div>
                      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: 28, color: '#fff', marginTop: 4 }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metric strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="animate-page-rise stagger-3">
                <MetricCard
                  label={t('totalPipelineValue')}
                  value={formatCurrency(totalValue)}
                  trend={`${opportunities.length} ${t('oppsCount')}`}
                  icon="analytics"
                  accent="cobalt"
                />
                <MetricCard
                  label={t('conversionRate')}
                  value={`${conversionRate}%`}
                  trend={`${closedOpps.length} ${t('closed')}`}
                  icon="trending_up"
                  accent="cyan"
                />
                <MetricCard
                  label={t('avgWinProbability')}
                  value={`${avgWinProb}%`}
                  trend={t('acrossAllDeals')}
                  icon="bolt"
                  accent="lime"
                />
              </div>

              {/* Pipeline kanban */}
              <div className="animate-page-rise stagger-4">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: 'Geist, var(--font-manrope), sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--fg-1)', letterSpacing: '-0.012em' }}>
                    {t('projectPipeline')}
                  </h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[t('allStages'), t('last30Days')].map((label) => (
                      <span key={label} style={{
                        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em',
                        padding: '4px 12px', borderRadius: 9999,
                        background: 'var(--bg-glass-strong)',
                        border: '1px solid var(--border-glass)',
                        color: 'var(--fg-2)',
                      }}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }} className="custom-scrollbar">
                  {stages.map((stage) => {
                    const stageOpps = opportunities.filter((o) => o.stage === stage.id);
                    return (
                      <KanbanCol key={stage.id} title={stage.title} count={stageOpps.length} dot={stage.dot}>
                        {stageOpps.map((opp) => (
                          <Link key={opp.id} href={`/opportunities/${opp.id}/briefing`} style={{ textDecoration: 'none' }}>
                            <KanbanCard
                              title={opp.title}
                              value={formatCurrency(opp.value)}
                              initials={opp.company_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                              progress={stage.id === 'negotiation' ? opp.win_probability * 100 : undefined}
                              badge={
                                opp.priority === 'high' ? t('highPriority') :
                                opp.priority === 'medium' ? t('qualified') :
                                stage.id === 'signed' ? t('completed') : undefined
                              }
                              badgeStyle={
                                opp.priority === 'high'
                                  ? { background: 'rgb(var(--accent-cobalt) / 0.12)', color: 'var(--fg-cobalt)' }
                                  : opp.priority === 'medium'
                                  ? { background: 'rgb(var(--accent-cyan) / 0.12)', color: 'var(--fg-cyan)' }
                                  : { background: 'rgb(var(--accent-lime) / 0.18)', color: 'var(--fg-lime)' }
                              }
                            />
                          </Link>
                        ))}
                      </KanbanCol>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
