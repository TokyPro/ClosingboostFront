'use client';
import { cn } from '../lib/cn';

type Tier = 'cold' | 'warm' | 'hot';

interface TierBadgeProps {
  tier: Tier;
  score?: number;
  size?: 'sm' | 'md';
}

const TIER_CONFIG: Record<Tier, { label: string; labelFr: string; icon: string; classes: string }> = {
  cold: {
    label: 'Cold',
    labelFr: 'Froid',
    icon: 'ac_unit',
    classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  warm: {
    label: 'Warm',
    labelFr: 'Tiède',
    icon: 'wb_sunny',
    classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  hot: {
    label: 'Hot',
    labelFr: 'Chaud',
    icon: 'local_fire_department',
    classes: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
};

export function TierBadge({ tier, score, size = 'sm' }: TierBadgeProps) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.cold;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
      config.classes,
    )}>
      <span
        className={cn('material-symbols-outlined', size === 'sm' ? 'text-[11px]' : 'text-[14px]')}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {config.icon}
      </span>
      {config.labelFr}
      {score !== undefined && <span className="ml-1 opacity-70">{Math.round(score)}</span>}
    </span>
  );
}
