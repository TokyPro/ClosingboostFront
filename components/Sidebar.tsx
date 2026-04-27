'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '../lib/cn';
import { useSidebar } from './SidebarContext';
import { useAuth } from '../lib/auth';
import logo from '../images/logo.png';

const NAV_ITEMS = [
  { icon: 'dashboard',       key: 'dashboard',    href: '/dashboard' },
  { icon: 'monetization_on', key: 'opportunities', href: '/opportunities' },
  { icon: 'person_search',   key: 'leads',         href: '/leads' },
  { icon: 'account_tree',    key: 'pipeline',      href: '/pipeline' },
  { icon: 'smart_toy',       key: 'copilot',       href: '/copilot' },
  { icon: 'settings',        key: 'admin',         href: '/admin' },
  { icon: 'contact_support', key: 'support',       href: '/support' },
] as const;

export const Sidebar = () => {
  const t = useTranslations('Sidebar');
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, mounted, toggleCollapsed, closeMobile } = useSidebar();
  const { user, logout } = useAuth();

  const collapsed = mounted && isCollapsed;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={closeMobile}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      <aside
        className={cn(
          'fixed md:relative inset-y-0 left-0 z-50',
          'flex flex-col h-screen shrink-0 bg-surface-container-low',
          'will-change-[width,transform]',
          mounted ? 'transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]' : '',
          collapsed ? 'md:w-[68px]' : 'md:w-64',
          'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'absolute -right-3 top-[72px] z-10 hidden md:flex',
            'h-6 w-6 items-center justify-center rounded-full',
            'bg-surface-container-highest shadow-md border border-outline-variant/20',
            'text-on-surface-variant hover:bg-primary hover:text-on-primary',
            'transition-all duration-200 hover:scale-110',
          )}
        >
          <span
            className={cn(
              'material-symbols-outlined text-[14px] transition-transform duration-300',
              collapsed ? '' : 'rotate-180',
            )}
          >
            chevron_right
          </span>
        </button>

        {/* Logo */}
        <div
          className={cn(
            'flex flex-col items-center gap-2 px-3 pt-6 pb-4 mb-1 overflow-hidden',
            !collapsed && 'px-5',
          )}
        >
          <div className={cn(
            'shrink-0 transition-all duration-300 hover:scale-105',
            collapsed ? 'w-11 h-11' : 'w-[72px] h-[72px]',
          )}>
            <Image src={logo} alt="SalesBoost AI" width={72} height={72} className="object-contain w-full h-full" priority />
          </div>
          <div
            className={cn(
              'overflow-hidden whitespace-nowrap text-center',
              'transition-[opacity,max-height] duration-300',
              collapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-20 opacity-100',
            )}
          >
            <p className="font-headline font-black text-base text-primary leading-tight tracking-tight">
              SalesBoost AI
            </p>
            <p className="font-body text-[9px] uppercase tracking-[0.12em] text-on-surface-variant font-semibold leading-tight mt-0.5">
              {t('brandTagline')}
            </p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {NAV_ITEMS.map((item, i) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                title={collapsed ? t(item.key) : undefined}
                style={{ animationDelay: `${i * 30}ms` }}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'font-medium overflow-hidden transition-all duration-200',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container',
                )}
              >
                {/* Active left indicator bar */}
                <span
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary',
                    'transition-[height,opacity] duration-300',
                    isActive ? 'h-5 opacity-100' : 'h-0 opacity-0',
                  )}
                />

                <span
                  className={cn(
                    'material-symbols-outlined text-[20px] shrink-0 transition-all duration-200',
                    isActive
                      ? 'text-primary scale-110'
                      : 'text-on-surface-variant group-hover:scale-105',
                  )}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>

                <span
                  className={cn(
                    'font-label text-sm tracking-tight whitespace-nowrap',
                    'transition-[opacity,max-width] duration-300',
                    collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100',
                    isActive ? 'font-bold' : '',
                  )}
                >
                  {t(item.key)}
                </span>

                {/* Tooltip shown only when collapsed */}
                {collapsed && (
                  <span
                    className={cn(
                      'pointer-events-none absolute left-full ml-3 z-50',
                      'px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap',
                      'bg-inverse-surface text-inverse-on-surface shadow-lg',
                      'opacity-0 -translate-x-2 scale-95',
                      'group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100',
                      'transition-[opacity,transform] duration-150',
                    )}
                  >
                    {t(item.key)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-2 py-3 border-t border-outline-variant/10 space-y-1">
          {/* User info */}
          {user && !collapsed && (
            <div className="px-3 py-2 rounded-xl bg-surface-container/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant truncate">
                {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
              </p>
              <p className="text-xs text-on-surface font-medium truncate mt-0.5">{user.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            title={collapsed ? t('logOut') : undefined}
            className={cn(
              'group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl overflow-hidden',
              'text-on-surface-variant hover:text-error hover:bg-error/10',
              'transition-all duration-200',
              collapsed ? 'justify-center' : '',
            )}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0 transition-all duration-200 group-hover:scale-105">
              logout
            </span>
            <span
              className={cn(
                'font-label text-sm tracking-tight whitespace-nowrap',
                'transition-[opacity,max-width] duration-300',
                collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100',
              )}
            >
              {t('logOut')}
            </span>
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 z-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-inverse-surface text-inverse-on-surface shadow-lg opacity-0 -translate-x-2 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-[opacity,transform] duration-150">
                {t('logOut')}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
