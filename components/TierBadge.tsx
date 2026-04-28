'use client';
import type { CSSProperties } from 'react';
import { cn } from '../lib/cn';

type Tier = 'cold' | 'warm' | 'hot';

interface TierBadgeProps {
  tier: Tier;
  score?: number;
  size?: 'sm' | 'md';
}

const TIER_CONFIG: Record<Tier, { label: string; icon: string; style: CSSProperties }> = {
  cold: {
    label: 'Froid',
    icon: 'ac_unit',
    style: { background: 'rgb(var(--accent-cyan) / 0.14)', color: 'var(--fg-cyan)' },
  },
  warm: {
    label: 'Tiède',
    icon: 'wb_sunny',
    style: { background: 'rgb(var(--accent-amber) / 0.14)', color: 'var(--fg-amber)' },
  },
  hot: {
    label: 'Chaud',
    icon: 'local_fire_department',
    style: { background: 'rgb(var(--color-error) / 0.12)', color: 'var(--fg-error)' },
  },
};

export function TierBadge({ tier, score, size = 'sm' }: TierBadgeProps) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.cold;
  return (
    <span
      style={{ ...config.style, borderRadius: 9999, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em' }}
      className={cn(
        'inline-flex items-center gap-1',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
      )}
    >
      <span
        className={cn('material-symbols-outlined', size === 'sm' ? 'text-[11px]' : 'text-[14px]')}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {config.icon}
      </span>
      {config.label}
      {score !== undefined && <span style={{ opacity: 0.7, marginLeft: 2 }}>{Math.round(score)}</span>}
    </span>
  );
}
