'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Opportunity } from '@/lib/types';
import { cn } from '@/lib/cn';
import { Link } from '@/i18n/navigation';

const STAGES = [
  { id: 'creation',          dotClass: 'bg-surface-container-highest' },
  { id: 'qualification',     dotClass: 'bg-surface-container-high' },
  { id: 'first_meeting',     dotClass: 'bg-tertiary-container' },
  { id: 'quote_needed',      dotClass: 'bg-on-tertiary-container' },
  { id: 'offer_sent',        dotClass: 'bg-primary-container' },
  { id: 'waiting_signature', dotClass: 'bg-primary' },
  { id: 'signed',            dotClass: 'bg-on-primary-container' },
] as const;

const formatCurrency = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `$${(v / 1_000).toFixed(0)}k`
  : `$${v}`;

const priorityClass = (p: string) => {
  if (p === 'high')   return 'bg-tertiary-container text-on-tertiary-container';
  if (p === 'medium') return 'bg-surface-container-high text-on-surface-variant';
  return 'bg-surface-container-low text-on-surface-variant/70';
};

interface KanbanViewProps {
  opportunities: Opportunity[];
}

export function KanbanView({ opportunities }: KanbanViewProps) {
  const t = useTranslations('Dashboard');
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
