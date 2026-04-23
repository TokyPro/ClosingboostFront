'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTheme } from './ThemeProvider';

interface TopBarProps {
  title?: string;
  userName?: string;
  userRole?: string;
}

export const TopBar = ({ title, userName, userRole }: TopBarProps) => {
  const t = useTranslations('TopBar');
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !query.trim()) return;
    router.push(`/opportunities?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="w-full sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl shadow-sm flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-6">
        {title && (
          <h2 className="font-headline font-black text-xl tracking-tighter text-primary">
            {title}
          </h2>
        )}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
            search
          </span>
          <input
            className="bg-surface-container-low rounded-xl pl-9 pr-4 py-2 text-sm w-56 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            placeholder={t('searchPlaceholder')}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />

        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[22px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors active:scale-95">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors active:scale-95">
          <span className="material-symbols-outlined text-[22px]">help_outline</span>
        </button>

        <div className="pl-2 flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <p className="text-xs font-bold text-primary font-headline leading-tight">
              {userName ?? '—'}
            </p>
            <p className="text-[10px] text-on-surface-variant capitalize">
              {userRole ?? t('userRole')}
            </p>
          </div>
          <div className="h-8 w-8 rounded-full bg-surface-container-high flex items-center justify-center outline outline-1 outline-outline-variant/20">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};
