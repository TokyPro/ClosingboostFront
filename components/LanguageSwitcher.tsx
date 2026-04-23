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
    <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
      {routing.locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleChange(locale)}
          className={cn(
            'px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all',
            currentLocale === locale
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-primary'
          )}
          aria-label={t(locale as 'en' | 'fr')}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
