'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../../../components/Sidebar';
import { TopBar } from '../../../components/TopBar';
import { scoringApi, agentsApi, leadsApi } from '../../../lib/api';
import { TierBadge } from '../../../components/TierBadge';
import { toast } from '../../../lib/toast';
import { cn } from '../../../lib/cn';
import type { PipelineStats, LeadRecord, AgentRunResult, ScoringConfig } from '../../../lib/types';

// ─── Tier meta ─────────────────────────────────────────────────────────────────

type Tier = 'cold' | 'warm' | 'hot';

const TIER_META: Record<Tier, { title: string; subtitle: string; icon: string; bg: string; accent: string }> = {
  cold: {
    title: 'Froid',
    subtitle: 'Agent Éclaireur — Notoriété',
    icon: 'ac_unit',
    bg: 'bg-blue-500/5',
    accent: 'text-blue-600',
  },
  warm: {
    title: 'Tiède',
    subtitle: 'Agent Conseiller — Considération',
    icon: 'wb_sunny',
    bg: 'bg-amber-500/5',
    accent: 'text-amber-600',
  },
  hot: {
    title: 'Chaud',
    subtitle: 'Agent Closer — Conversion',
    icon: 'local_fire_department',
    bg: 'bg-red-500/5',
    accent: 'text-red-600',
  },
};

// ─── Lead mini card ───────────────────────────────────────────────────────────

interface LeadMiniCardProps {
  lead: LeadRecord;
  onRunAgent: (lead: LeadRecord) => void;
  runningAgentId: string | null;
}

function LeadMiniCard({ lead, onRunAgent, runningAgentId }: LeadMiniCardProps) {
  const isRunning = runningAgentId === lead.id;
  const displayName = lead.contact_name ?? lead.company_name ?? '—';
  const initials = displayName
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-surface-container-lowest rounded-xl p-3 flex flex-col gap-2 hover:shadow-md transition-all">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
          {initials || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs text-on-surface truncate">{displayName}</p>
          {lead.contact_title && (
            <p className="text-[10px] text-on-surface-variant truncate">{lead.contact_title}</p>
          )}
        </div>
        <TierBadge tier={lead.tier as Tier} score={lead.score} size="sm" />
      </div>
      {lead.company_name && lead.contact_name && (
        <p className="text-[10px] text-on-surface-variant truncate">{lead.company_name}</p>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1.5 bg-surface-container-high rounded-full w-16">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                lead.tier === 'hot'
                  ? 'bg-red-500'
                  : lead.tier === 'warm'
                    ? 'bg-amber-500'
                    : 'bg-blue-400',
              )}
              style={{ width: `${Math.round(lead.score)}%` }}
            />
          </div>
          <span className="text-[9px] font-black text-on-surface-variant">{Math.round(lead.score)}</span>
        </div>
        {lead.outreach_attempts > 0 && (
          <span className="text-[9px] text-on-surface-variant">{lead.outreach_attempts}× envoi</span>
        )}
      </div>
      <button
        onClick={() => onRunAgent(lead)}
        disabled={isRunning}
        className={cn(
          'w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all',
          isRunning
            ? 'bg-primary/5 text-primary opacity-60 cursor-wait'
            : 'bg-primary/10 hover:bg-primary/20 text-primary active:scale-95',
        )}
      >
        {isRunning ? (
          <>
            <span className="material-symbols-outlined text-[11px] animate-spin">autorenew</span>
            Agent en cours...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[11px]">smart_toy</span>
            Lancer l&apos;Agent
          </>
        )}
      </button>
    </div>
  );
}

// ─── Tier column ──────────────────────────────────────────────────────────────

interface TierColumnProps {
  tier: Tier;
  leads: LeadRecord[];
  onRunAgent: (lead: LeadRecord) => void;
  runningAgentId: string | null;
}

function TierColumn({ tier, leads, onRunAgent, runningAgentId }: TierColumnProps) {
  const meta = TIER_META[tier];
  return (
    <div className={cn('rounded-2xl p-4 flex flex-col gap-3', meta.bg)}>
      <div className="flex items-center gap-2">
        <span
          className={cn('material-symbols-outlined text-[24px]', meta.accent)}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {meta.icon}
        </span>
        <div>
          <p className={cn('font-black text-sm', meta.accent)}>{meta.title}</p>
          <p className="text-[10px] text-on-surface-variant">{meta.subtitle}</p>
        </div>
        <span
          className={cn(
            'ml-auto text-[11px] font-black px-2 py-0.5 rounded-full',
            meta.accent,
            meta.bg.replace('/5', '/20'),
          )}
        >
          {leads.length}
        </span>
      </div>
      <div className="space-y-2 flex-1 min-h-[200px]">
        {leads.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs text-on-surface-variant/50">
            Aucun lead
          </div>
        ) : (
          leads.map((lead) => (
            <LeadMiniCard
              key={lead.id}
              lead={lead}
              onRunAgent={onRunAgent}
              runningAgentId={runningAgentId}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Agent result modal ───────────────────────────────────────────────────────

interface AgentResultModalProps {
  result: AgentRunResult;
  onClose: () => void;
  onMarkSent: (messageId: string) => void;
}

function AgentResultModal({ result, onClose, onMarkSent }: AgentResultModalProps) {
  const tierConfig = TIER_META[result.tier as Tier] ?? TIER_META.cold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', tierConfig.bg)}>
                <span
                  className={cn('material-symbols-outlined text-[22px]', tierConfig.accent)}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {tierConfig.icon}
                </span>
              </div>
              <div>
                <p className="font-black text-sm text-on-surface">Agent {result.agent_name}</p>
                <p className="text-[11px] text-on-surface-variant">{result.action}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
            </button>
          </div>

          {/* Channel */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Canal :
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container rounded-full text-xs font-bold text-on-surface">
              <span className="material-symbols-outlined text-[12px]">
                {result.channel === 'email'
                  ? 'email'
                  : result.channel === 'linkedin'
                    ? 'person'
                    : 'chat'}
              </span>
              {result.channel}
            </span>
          </div>

          {/* Subject */}
          {result.subject && (
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                Objet
              </p>
              <p className="text-sm font-semibold text-on-surface bg-surface-container-low rounded-xl px-4 py-2.5">
                {result.subject}
              </p>
            </div>
          )}

          {/* Message */}
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
              Message généré
            </p>
            <div className="bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface leading-relaxed whitespace-pre-line">
              {result.message_content}
            </div>
          </div>

          {/* Rationale */}
          {result.rationale && (
            <div className="mb-5 bg-tertiary/5 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2">
                <span
                  className="material-symbols-outlined text-[16px] text-tertiary mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">{result.rationale}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onMarkSent(result.message_id);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              Marquer comme envoyé
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 bg-surface-container text-on-surface-variant rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Config panel ─────────────────────────────────────────────────────────────

interface ConfigPanelProps {
  config: ScoringConfig;
  onUpdate: (data: Partial<ScoringConfig>) => Promise<void>;
}

function ConfigPanel({ config, onUpdate }: ConfigPanelProps) {
  const [warmThreshold, setWarmThreshold] = useState(config.warm_threshold);
  const [hotThreshold, setHotThreshold] = useState(config.hot_threshold);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ warm_threshold: warmThreshold, hot_threshold: hotThreshold });
      toast.success('Configuration mise à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5">
      <p className="font-black text-sm text-on-surface mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
        Seuils de segmentation dynamiques
      </p>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Seuil Tiède
            </label>
            <span className="text-xs font-black text-amber-600">{warmThreshold}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={60}
            value={warmThreshold}
            onChange={(e) => setWarmThreshold(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <p className="text-[10px] text-on-surface-variant mt-1">
            Score ≥ {warmThreshold}% → Tiède (Agent Conseiller)
          </p>
        </div>
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Seuil Chaud
            </label>
            <span className="text-xs font-black text-red-600">{hotThreshold}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={90}
            value={hotThreshold}
            onChange={(e) => setHotThreshold(Number(e.target.value))}
            className="w-full accent-red-500"
          />
          <p className="text-[10px] text-on-surface-variant mt-1">
            Score ≥ {hotThreshold}% → Chaud (Agent Closer)
          </p>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 transition-all"
      >
        {saving ? 'Enregistrement...' : 'Appliquer'}
      </button>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const [coldLeads, setColdLeads] = useState<LeadRecord[]>([]);
  const [warmLeads, setWarmLeads] = useState<LeadRecord[]>([]);
  const [hotLeads, setHotLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const [agentResult, setAgentResult] = useState<AgentRunResult | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, configData, allLeadsData] = await Promise.all([
        scoringApi.getPipelineStats() as Promise<PipelineStats>,
        scoringApi.getConfig() as Promise<ScoringConfig>,
        leadsApi.listSaved({ limit: 200 }) as Promise<{
          leads: LeadRecord[];
          total: number;
          page: number;
          limit: number;
        }>,
      ]);
      setStats(statsData);
      setConfig(configData);
      const all = allLeadsData.leads ?? [];
      setColdLeads(all.filter((l: LeadRecord) => l.tier === 'cold'));
      setWarmLeads(all.filter((l: LeadRecord) => l.tier === 'warm'));
      setHotLeads(all.filter((l: LeadRecord) => l.tier === 'hot'));
    } catch {
      toast.error('Erreur lors du chargement du pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRunAgent = async (lead: LeadRecord) => {
    setRunningAgentId(lead.id);
    try {
      const result = (await agentsApi.runAgent(lead.id)) as AgentRunResult;
      setAgentResult(result);
      toast.success(`Agent ${result.agent_name} — message généré`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur agent');
    } finally {
      setRunningAgentId(null);
    }
  };

  const handleMarkSent = async (messageId: string) => {
    try {
      await agentsApi.updateMessageStatus(messageId, 'sent');
      toast.success('Message marqué comme envoyé');
    } catch {
      // silent — status update is best-effort
    }
  };

  const handleConfigUpdate = async (data: Partial<ScoringConfig>) => {
    await scoringApi.updateConfig(data);
    await loadData();
  };

  const handleCooldown = async () => {
    try {
      await scoringApi.runCooldown();
      toast.success('Leads refroidis');
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur cooldown');
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <section className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="px-8 pt-8 pb-5">
            <div className="flex items-center gap-3 text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-4">
              <span className="w-6 h-1 bg-primary rounded-full" />
              Workflow Commercial
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-headline text-4xl font-black text-primary tracking-tight">
                  Pipeline IA
                </h1>
                <p className="text-on-surface-variant font-medium mt-1">
                  Scoring dynamique · 3 agents IA · Boucle de feedback automatique
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void loadData()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-sm font-bold text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Actualiser
                </button>
                <button
                  onClick={() => void handleCooldown()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-sm font-bold text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">timer</span>
                  Cooldown
                </button>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          {stats && (
            <div className="px-8 mb-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total leads', value: stats.total, icon: 'group', color: 'text-on-surface' },
                  {
                    label: 'Froid (P1)',
                    value: `${stats.cold_count} (${stats.cold_pct}%)`,
                    icon: 'ac_unit',
                    color: 'text-blue-600',
                  },
                  {
                    label: 'Tiède (P2)',
                    value: `${stats.warm_count} (${stats.warm_pct}%)`,
                    icon: 'wb_sunny',
                    color: 'text-amber-600',
                  },
                  {
                    label: 'Chaud (P3)',
                    value: `${stats.hot_count} (${stats.hot_pct}%)`,
                    icon: 'local_fire_department',
                    color: 'text-red-600',
                  },
                ].map((s) => (
                  <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={cn('material-symbols-outlined text-[18px]', s.color)}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {s.icon}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                        {s.label}
                      </span>
                    </div>
                    <p className={cn('font-black text-2xl', s.color)}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flow diagram */}
          <div className="px-8 mb-6">
            <div className="bg-surface-container-lowest rounded-2xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                Flux Logique
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: 'Acquisition', icon: 'download', desc: 'Scraping + Enrichissement' },
                  { label: '→', icon: null, desc: null },
                  { label: 'Scoring', icon: 'analytics', desc: 'Fit + Intent (0-100)' },
                  { label: '→', icon: null, desc: null },
                  { label: 'Aiguillage', icon: 'fork_right', desc: 'P1 / P2 / P3' },
                  { label: '→', icon: null, desc: null },
                  { label: 'Agent IA', icon: 'smart_toy', desc: 'Message personnalisé' },
                  { label: '→', icon: null, desc: null },
                  { label: 'RDV', icon: 'event', desc: 'Calendly + Notif Slack' },
                ].map((step, i) =>
                  step.icon === null ? (
                    <span key={i} className="text-outline text-lg">
                      →
                    </span>
                  ) : (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-2 bg-surface-container rounded-xl"
                    >
                      <span
                        className="material-symbols-outlined text-[16px] text-primary"
                        style={{ fontVariationSettings: "'FILL' 0" }}
                      >
                        {step.icon}
                      </span>
                      <div>
                        <p className="text-xs font-black text-on-surface leading-none">{step.label}</p>
                        {step.desc && (
                          <p className="text-[9px] text-on-surface-variant leading-none mt-0.5">
                            {step.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="px-8 pb-8 flex gap-6">
            {/* Kanban columns */}
            <div className="flex-1 grid grid-cols-3 gap-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-surface-container-low animate-pulse h-64" />
                ))
              ) : (
                <>
                  <TierColumn
                    tier="cold"
                    leads={coldLeads}
                    onRunAgent={handleRunAgent}
                    runningAgentId={runningAgentId}
                  />
                  <TierColumn
                    tier="warm"
                    leads={warmLeads}
                    onRunAgent={handleRunAgent}
                    runningAgentId={runningAgentId}
                  />
                  <TierColumn
                    tier="hot"
                    leads={hotLeads}
                    onRunAgent={handleRunAgent}
                    runningAgentId={runningAgentId}
                  />
                </>
              )}
            </div>

            {/* Config panel */}
            {config && (
              <div className="w-72 shrink-0">
                <ConfigPanel config={config} onUpdate={handleConfigUpdate} />
                {/* Feedback loop info */}
                <div className="mt-4 bg-surface-container-lowest rounded-2xl p-4">
                  <p className="font-black text-sm text-on-surface mb-3 flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-[18px] text-tertiary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      loop
                    </span>
                    Boucle de Feedback
                  </p>
                  <div className="space-y-2.5">
                    {[
                      {
                        event: 'Lien cliqué',
                        boost: `+${config.click_score_boost}pts`,
                        color: 'text-blue-600',
                      },
                      {
                        event: 'Email répondu',
                        boost: `+${config.reply_score_boost}pts`,
                        color: 'text-amber-600',
                      },
                      {
                        event: 'Webinar inscrit',
                        boost: `+${config.webinar_score_boost}pts`,
                        color: 'text-amber-600',
                      },
                      {
                        event: 'RDV booké',
                        boost: `+${config.meeting_score_boost}pts`,
                        color: 'text-red-600',
                      },
                      {
                        event: `Timeout (${config.max_hot_attempts}× chaud)`,
                        boost: `-${config.cooldown_score_penalty}pts`,
                        color: 'text-on-surface-variant',
                      },
                    ].map((item) => (
                      <div key={item.event} className="flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant">{item.event}</span>
                        <span className={cn('text-xs font-black', item.color)}>{item.boost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Agent result modal */}
      {agentResult && (
        <AgentResultModal
          result={agentResult}
          onClose={() => setAgentResult(null)}
          onMarkSent={handleMarkSent}
        />
      )}
    </div>
  );
}
