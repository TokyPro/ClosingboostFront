import React from 'react';
import {
  ShieldAlert,
  Lightbulb,
  Target,
  TrendingUp,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Sidebar } from '../../../../../components/Sidebar';
import { StageSelector } from '../../../../../components/StageSelector';
import { BriefingActions } from '../../../../../components/BriefingActions';
import { opportunityApi } from '../../../../../lib/api';
import { Opportunity, Briefing } from '../../../../../lib/types';

interface InsightItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  desc: string;
}

const InsightItem = ({ icon: Icon, label, value, desc }: InsightItemProps) => (
  <div className="flex gap-4">
    <div className="w-10 h-10 rounded-2xl bg-tertiary-container/50 flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 text-on-tertiary-container" />
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold text-on-tertiary-container">{label}</p>
      <p className="text-xl font-headline font-bold text-inverse-on-surface mb-0.5">{value}</p>
      <p className="text-[11px] text-inverse-on-surface/60 leading-tight">{desc}</p>
    </div>
  </div>
);

type Props = {
  params: { id: string };
};

const BriefingPage = async ({ params }: Props) => {
  const { id } = params;
  const t = await getTranslations('Briefing');

  let opportunity: Opportunity | null = null;
  let briefing: Briefing | null = null;

  try {
    [opportunity, briefing] = await Promise.all([
      opportunityApi.getOne(id),
      opportunityApi.getBriefing(id),
    ]);
  } catch (error) {
    console.error("Failed to fetch briefing data:", error);
  }

  if (!opportunity || !briefing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant font-medium">Loading briefing or not found...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface">
        <header className="w-full sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl shadow-sm flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Link href="/dashboard" className="text-[11px] font-bold hover:text-primary transition-colors">
              {t('dashboardCrumb')}
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[11px] font-bold text-primary">{t('briefingCrumb')}</span>
          </div>
          <div className="flex gap-3">
            <BriefingActions
              opportunityId={opportunity.id.toString()}
              editLabel={t('edit')}
              deleteLabel={t('delete')}
              deletingLabel={t('deleting')}
              confirmDeleteTitle={t('confirmDeleteTitle')}
              confirmDeleteMessage={t('confirmDeleteMessage')}
              confirmDeleteBtn={t('confirmDeleteBtn')}
              cancelLabel={t('cancelDelete')}
            />
          </div>
        </header>

        <section className="p-8 max-w-5xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar">
          <div className="mb-12 pb-8 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-4">
                <span className="w-6 h-1 bg-primary rounded-full" />
                {t('strategicAnalysis')}
              </div>
              <h1 className="font-headline text-5xl font-black text-primary mb-2 leading-tight">
                {opportunity.title}
              </h1>
              <p className="text-on-surface-variant font-medium text-lg">
                {t('analysisFor')}{' '}
                <span className="text-primary font-bold">{opportunity.company_name}</span>
              </p>
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  {t('stageLabel')}
                </p>
                <StageSelector opportunityId={opportunity.id.toString()} currentStage={opportunity.stage} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8 space-y-12">
              <section>
                <h3 className="flex items-center gap-3 font-headline text-xl font-black text-primary mb-6 uppercase tracking-tight">
                  <Target className="w-6 h-6 text-primary" />
                  {t('aiDrivenStrategy')}
                </h3>
                <div className="bg-surface-container-lowest p-10 rounded-2xl shadow-sm leading-relaxed">
                  <p
                    className="text-on-surface text-lg mb-6"
                  >
                    {briefing.ai_strategy}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-3 font-headline text-xl font-black text-primary mb-6 uppercase tracking-tight">
                  <ShieldAlert className="w-6 h-6 text-error" />
                  {t('riskAssessment')}
                </h3>
                <div className="bg-surface-container-lowest border-l-4 border-error p-8 rounded-2xl shadow-sm">
                  <p className="text-on-surface font-medium leading-relaxed italic">
                    &ldquo;{briefing.ai_risk_assessment}&rdquo;
                  </p>
                </div>
              </section>
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-8">
              <div className="bg-inverse-surface text-inverse-on-surface p-8 rounded-2xl shadow-xl">
                <h4 className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-widest mb-6">
                  {t('marketIntelligence')}
                </h4>
                <div className="space-y-8">
                  <InsightItem
                    icon={TrendingUp}
                    label={t('demandIndex')}
                    value={briefing.market_insights.demand_index || "N/A"}
                    desc={briefing.market_insights.sector_trend || ""}
                  />
                  <InsightItem
                    icon={Globe}
                    label={t('competitorAnalysis')}
                    value={briefing.market_insights.competitor_count || "—"}
                    desc={briefing.market_insights.competitor_analysis || ""}
                  />
                </div>
              </div>

              <div className="bg-tertiary-container p-6 rounded-2xl shadow-lg relative overflow-hidden group cursor-pointer">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-on-tertiary-container" />
                    <span className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-wider">
                      {t('playbookSuggestion')}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-on-tertiary-container">
                    &ldquo;{t('playbookText')}&rdquo;
                  </p>
                </div>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-on-tertiary-container/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BriefingPage;
