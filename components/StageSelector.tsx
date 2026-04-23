'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { opportunityApi } from '../lib/api';
import { cn } from '../lib/cn';

const STAGES = [
  { id: 'discovery', dotClass: 'bg-surface-container-highest' },
  { id: 'proposal', dotClass: 'bg-on-tertiary-container' },
  { id: 'negotiation', dotClass: 'bg-primary' },
  { id: 'closed', dotClass: 'bg-on-primary-container' },
] as const;

interface StageSelectorProps {
  opportunityId: string;
  currentStage: string;
}

export const StageSelector = ({ opportunityId, currentStage }: StageSelectorProps) => {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStageChange = async (stage: string) => {
    if (stage === currentStage || loading) return;
    setLoading(true);
    try {
      await opportunityApi.update(opportunityId, { stage });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STAGES.map((stage) => {
        const isActive = currentStage === stage.id;
        return (
          <button
            key={stage.id}
            onClick={() => handleStageChange(stage.id)}
            disabled={loading}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50',
              isActive
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', stage.dotClass)} />
            {t(stage.id)}
          </button>
        );
      })}
    </div>
  );
};
