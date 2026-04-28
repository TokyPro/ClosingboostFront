'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { cn } from '../lib/cn';

export const LanguageSwitcher = () => {
  const t = useTranslations('LanguageSwitcher');
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = (params?.locale as string) || routing.defaultLocale;

  const handleChange = (locale: string) => {
    router.replace(pathname, { locale });
  };

  return (
    <div
      style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: 4 }}
      className="flex items-center gap-1"
    >
      {routing.locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleChange(locale)}
          style={currentLocale === locale ? {
            background: 'var(--gradient-primary-cta)',
            color: '#fff',
            borderRadius: 6,
            boxShadow: 'var(--shadow-sm)',
          } : {
            background: 'transparent',
            color: 'var(--fg-2)',
            borderRadius: 6,
          }}
          className={cn(
            'px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all',
            currentLocale !== locale && 'hover:text-on-surface',
          )}
          aria-label={t(locale as 'en' | 'fr')}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
