'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTheme } from './ThemeProvider';
import { useSidebar } from './SidebarContext';
import { alertsApi } from '../lib/api';
import { cn } from '../lib/cn';

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
  const [alertCount, setAlertCount] = useState(0);
  const [alertLeads, setAlertLeads] = useState<{ id: string; company_name: string | null; score: number }[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await alertsApi.hotFollowUp(3);
        setAlertCount(data.count);
        setAlertLeads(data.leads);
      } catch { /* silent */ }
    };
    void fetch();
    const interval = setInterval(() => void fetch(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setShowAlerts(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !query.trim()) return;
    router.push(`/opportunities?q=${encodeURIComponent(query.trim())}`);
    setSearchExpanded(false);
  };

  /* Shared icon-button style */
  const iconBtnStyle = {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--fg-2)',
    transition: 'all 180ms',
  } as const;

  return (
    <header
      style={{
        height: 60,
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        borderBottom: '1px solid var(--border-glass)',
      }}
      className="relative w-full sticky top-0 z-30 flex items-center justify-between px-4 md:px-7 gap-3"
    >
      {/* Left: hamburger + live pill + search */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={openMobile}
          aria-label="Open navigation"
          style={iconBtnStyle}
          className="md:hidden hover:!bg-[var(--bg-glass-strong)] hover:text-on-surface active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Live sync pill */}
        <span
          style={{ background: 'rgb(var(--accent-cobalt) / 0.10)', color: 'var(--fg-cobalt)' }}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
        >
          <span
            style={{ width: 6, height: 6, borderRadius: 99, background: 'currentColor', boxShadow: '0 0 6px currentColor' }}
            className="inline-block"
          />
          Live · Synced
        </span>

        {title && (
          <h2
            className={cn(
              'font-headline font-bold text-lg md:text-xl tracking-tight text-on-surface truncate transition-opacity duration-200',
              searchExpanded ? 'opacity-0 sm:opacity-100' : 'opacity-100',
            )}
            style={{ letterSpacing: '-0.012em' }}
          >
            {title}
          </h2>
        )}

        {/* Desktop search bar */}
        <div className="relative hidden sm:block" style={{ flex: 1, maxWidth: 340, marginLeft: 4 }}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-on-surface-variant/60">
            search
          </span>
          <input
            style={{
              width: '100%',
              background: 'var(--bg-glass-strong)',
              border: '1px solid var(--border-glass)',
              borderRadius: 10,
              padding: '8px 14px 8px 36px',
              fontSize: 13,
              color: 'var(--fg-1)',
              outline: 'none',
              transition: 'all 180ms',
            }}
            className="focus:border-[var(--fg-cobalt)] focus:shadow-[0_0_0_3px_rgb(59_91_255/0.15)] placeholder:text-on-surface-variant/40"
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
          style={iconBtnStyle}
          className="sm:hidden hover:!bg-[var(--bg-glass-strong)] hover:text-on-surface active:scale-90"
        >
          <span className="material-symbols-outlined text-[22px]">{searchExpanded ? 'close' : 'search'}</span>
        </button>
      </div>

      {/* Mobile expanded search */}
      {searchExpanded && (
        <div
          style={{ background: 'var(--bg-glass-strong)', borderBottom: '1px solid var(--border-glass)' }}
          className="absolute top-full inset-x-0 sm:hidden px-4 py-2 animate-fade-in"
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-on-surface-variant/60">search</span>
            <input
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                borderRadius: 10,
                padding: '8px 14px 8px 36px',
                fontSize: 13,
                color: 'var(--fg-1)',
                outline: 'none',
              }}
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
      <div className="flex items-center gap-1 shrink-0">
        <LanguageSwitcher />

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          style={iconBtnStyle}
          className="hover:!bg-[var(--bg-glass-strong)] hover:!text-on-surface hover:scale-105 active:scale-[0.92]"
        >
          <span className="material-symbols-outlined text-[20px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notifications */}
        <div ref={alertRef} className="relative hidden sm:block">
          <button
            onClick={() => setShowAlerts((v) => !v)}
            style={iconBtnStyle}
            className="hover:!bg-[var(--bg-glass-strong)] hover:!text-on-surface hover:scale-105 active:scale-[0.92] relative"
            title={alertCount > 0 ? `${alertCount} lead(s) chaud(s) sans relance` : 'Notifications'}
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-error text-white text-[9px] font-black px-1 leading-none">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          {showAlerts && (
            <div
              style={{
                background: 'var(--bg-glass-strong)',
                backdropFilter: 'blur(28px) saturate(140%)',
                border: '1px solid var(--border-glass)',
                boxShadow: 'var(--shadow-xl)',
              }}
              className="absolute right-0 top-full mt-2 w-72 rounded-[20px] overflow-hidden z-50"
            >
              <div
                style={{ background: 'var(--bg-card-low)', borderBottom: '1px solid var(--border-glass)' }}
                className="px-4 py-3 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px] text-error">local_fire_department</span>
                <p className="text-xs font-bold text-on-surface">Leads chauds sans relance</p>
                <span className="ml-auto text-[10px] font-bold text-error bg-error/10 px-2 py-0.5 rounded-full">{alertCount}</span>
              </div>
              {alertLeads.length === 0 ? (
                <p className="px-4 py-5 text-xs text-on-surface-variant text-center">Aucune alerte</p>
              ) : (
                <ul className="divide-y divide-outline-variant/5 max-h-64 overflow-y-auto">
                  {alertLeads.slice(0, 8).map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-[var(--bg-card-low)]"
                      onClick={() => { router.push('/leads'); setShowAlerts(false); }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-error/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[14px] text-error">business</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-on-surface truncate">{l.company_name ?? '—'}</p>
                        <p className="text-[10px] text-on-surface-variant">Score {Math.round(l.score)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ borderTop: '1px solid var(--border-glass)', background: 'var(--bg-card-low)' }} className="px-4 py-2.5">
                <button
                  onClick={() => { router.push('/leads'); setShowAlerts(false); }}
                  style={{ color: 'var(--fg-cobalt)' }}
                  className="w-full text-xs font-bold hover:opacity-80 transition-opacity"
                >
                  Voir tous les leads →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="ml-1 flex items-center gap-2 cursor-pointer group">
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-on-surface font-headline leading-tight" style={{ letterSpacing: '-0.012em' }}>
              {userName ?? '—'}
            </p>
            <p className="text-[10px] text-on-surface-variant capitalize">{userRole ?? t('userRole')}</p>
          </div>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9999,
              background: 'var(--gradient-primary-cta)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              boxShadow: '0 0 0 2px var(--bg-glass-strong)',
              transition: 'all 200ms',
            }}
            className="group-hover:scale-105"
          >
            {userName ? userName.charAt(0).toUpperCase() : '?'}
          </div>
        </div>
      </div>
    </header>
  );
};
