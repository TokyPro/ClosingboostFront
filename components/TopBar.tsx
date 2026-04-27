'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTheme } from './ThemeProvider';
import { useSidebar } from './SidebarContext';

interface TopBarProps {
  title?: string;
  userName?: string;
  userRole?: string;
}

export const TopBar = ({ title, userName, userRole }: TopBarProps) => {
  const t = useTranslations('TopBar');
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { openMobile } = useSidebar();
  const [query, setQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !query.trim()) return;
    router.push(`/opportunities?q=${encodeURIComponent(query.trim())}`);
    setSearchExpanded(false);
  };

  return (
    <header className="relative w-full sticky top-0 z-30 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between px-4 md:px-6 py-3 gap-3">
      {/* Left: hamburger (mobile) + title + search */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={openMobile}
          aria-label="Open navigation"
          className="md:hidden p-2 -ml-1 shrink-0 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200 active:scale-90"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {title && (
          <h2 className={`font-headline font-black text-lg md:text-xl tracking-tighter text-primary truncate transition-opacity duration-200 ${searchExpanded ? 'opacity-0 sm:opacity-100' : 'opacity-100'}`}>
            {title}
          </h2>
        )}

        {/* Desktop search bar */}
        <div className="relative hidden sm:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
            search
          </span>
          <input
            className="bg-surface-container-low rounded-xl pl-9 pr-4 py-2 text-sm w-48 lg:w-56 focus:ring-2 focus:ring-primary/20 focus:w-64 lg:focus:w-72 transition-all duration-300 outline-none placeholder:text-on-surface-variant/50"
            placeholder={t('searchPlaceholder')}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        {/* Mobile search toggle */}
        <button
          onClick={() => setSearchExpanded((v) => !v)}
          aria-label="Search"
          className="sm:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200 active:scale-90"
        >
          <span className="material-symbols-outlined text-[22px]">{searchExpanded ? 'close' : 'search'}</span>
        </button>
      </div>

      {/* Mobile expanded search — drops below header */}
      {searchExpanded && (
        <div className="absolute top-full inset-x-0 sm:hidden bg-surface-container-lowest border-b border-outline-variant/10 px-4 py-2 animate-fade-in shadow-sm">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">search</span>
            <input
              autoFocus
              className="bg-surface-container-low rounded-xl pl-9 pr-4 py-2 text-sm w-full outline-none"
              placeholder={t('searchPlaceholder')}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>
      )}

      {/* Right actions */}
      <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
        <LanguageSwitcher />

        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200 active:scale-90"
        >
          <span className="material-symbols-outlined text-[22px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        <button className="hidden sm:flex p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200 active:scale-90">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
        </button>

        {/* User pill */}
        <div className="ml-1 flex items-center gap-2 cursor-pointer group">
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-primary font-headline leading-tight">{userName ?? '—'}</p>
            <p className="text-[10px] text-on-surface-variant capitalize">{userRole ?? t('userRole')}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center outline outline-1 outline-primary/20 group-hover:outline-primary/40 group-hover:scale-105 transition-all duration-200">
            <span className="material-symbols-outlined text-[16px] text-primary">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};
