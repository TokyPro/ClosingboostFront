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
  { icon: 'person_search',   key: 'leads',         href: '/leads' },
  { icon: 'monetization_on', key: 'opportunities', href: '/opportunities' },
  { icon: 'account_tree',    key: 'pipeline',      href: '/pipeline' },
  { icon: 'auto_awesome',    key: 'copilot',       href: '/copilot' },
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
        style={{
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(28px) saturate(140%)',
          WebkitBackdropFilter: 'blur(28px) saturate(140%)',
          borderRight: '1px solid var(--border-glass)',
        }}
        className={cn(
          'fixed md:relative inset-y-0 left-0 z-50',
          'flex flex-col h-screen shrink-0',
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
          style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)' }}
          className={cn(
            'absolute -right-3 top-[72px] z-10 hidden md:flex',
            'h-6 w-6 items-center justify-center rounded-full shadow-md',
            'text-on-surface-variant hover:text-on-surface',
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

        {/* Brand block */}
        <div
          className={cn(
            'flex items-center gap-3 px-3 pt-5 pb-4 mb-1 overflow-hidden',
            !collapsed && 'px-4',
          )}
        >
          {/* Brand mark */}
          <div
            style={{
              background: 'var(--gradient-primary-cta)',
              boxShadow: 'var(--shadow-glow-cobalt)',
            }}
            className={cn(
              'shrink-0 flex items-center justify-center rounded-[12px] transition-all duration-300',
              collapsed ? 'w-11 h-11' : 'w-11 h-11',
            )}
          >
            <Image
              src={logo}
              alt="ETECH"
              width={34}
              height={34}
              className="object-contain w-[30px] h-[30px]"
              priority
            />
          </div>

          {/* Brand text */}
          <div
            className={cn(
              'overflow-hidden whitespace-nowrap',
              'transition-[opacity,max-width] duration-300',
              collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[160px] opacity-100',
            )}
          >
            <p
              style={{ letterSpacing: '-0.012em', lineHeight: 1.1, fontSize: 17 }}
              className="font-headline font-bold text-on-surface"
            >
              SalesBoost
            </p>
            <p
              style={{ fontSize: 11, letterSpacing: '0.14em', marginTop: 2, fontWeight: 700 }}
              className="font-body uppercase text-on-surface-variant"
            >
              by <span style={{ color: 'var(--fg-cobalt)' }}>ETECH</span>
            </p>
          </div>
        </div>

        {/* Nav section label */}
        {!collapsed && (
          <p
            style={{ fontSize: 9, letterSpacing: '0.22em', paddingLeft: 16, paddingBottom: 6, paddingTop: 4 }}
            className="font-body font-semibold uppercase text-on-surface-variant/50"
          >
            Workspace
          </p>
        )}

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
                style={{
                  animationDelay: `${i * 30}ms`,
                  ...(isActive ? {
                    background: 'var(--bg-glass-strong)',
                    boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--border-glass)',
                  } : {}),
                }}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-[10px]',
                  'font-medium overflow-hidden transition-all duration-200',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'text-on-surface font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface',
                )}
                onMouseEnter={!isActive ? (e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-glass-strong)';
                } : undefined}
                onMouseLeave={!isActive ? (e) => {
                  (e.currentTarget as HTMLElement).style.background = '';
                } : undefined}
              >
                {/* Active left indicator — gradient line */}
                <span
                  style={isActive ? {
                    background: 'var(--gradient-primary-cta)',
                    boxShadow: '0 0 12px rgb(59 91 255 / 0.6)',
                  } : {}}
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full',
                    'transition-[height,opacity] duration-300',
                    isActive ? 'h-[22px] opacity-100' : 'h-0 opacity-0',
                  )}
                />

                <span
                  className={cn(
                    'material-symbols-outlined text-[19px] shrink-0 transition-all duration-200',
                    isActive ? 'scale-[1.08]' : 'group-hover:scale-105',
                  )}
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400",
                    color: isActive ? 'var(--fg-cobalt)' : undefined,
                  }}
                >
                  {item.icon}
                </span>

                <span
                  className={cn(
                    'font-label text-[13.5px] tracking-tight whitespace-nowrap',
                    'transition-[opacity,max-width] duration-300',
                    collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100',
                  )}
                >
                  {t(item.key)}
                </span>

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span
                    style={{ background: 'var(--bg-card-high)', border: '1px solid var(--border-glass)' }}
                    className={cn(
                      'pointer-events-none absolute left-full ml-3 z-50',
                      'px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg',
                      'text-on-surface',
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

        {/* Bottom: user + logout */}
        <div className="px-2 py-3 space-y-1" style={{ borderTop: '1px solid var(--border-glass)' }}>
          {user && !collapsed && (
            <div
              style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)' }}
              className="px-3 py-2 rounded-[10px] mb-1"
            >
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
              'group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] overflow-hidden',
              'text-on-surface-variant hover:text-error transition-all duration-200',
              collapsed ? 'justify-center' : '',
            )}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(186, 26, 26, 0.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '';
            }}
          >
            <span className="material-symbols-outlined text-[19px] shrink-0 transition-all duration-200 group-hover:scale-105">
              logout
            </span>
            <span
              className={cn(
                'font-label text-[13.5px] tracking-tight whitespace-nowrap',
                'transition-[opacity,max-width] duration-300',
                collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100',
              )}
            >
              {t('logOut')}
            </span>

            {collapsed && (
              <span
                style={{ background: 'var(--bg-card-high)', border: '1px solid var(--border-glass)' }}
                className="pointer-events-none absolute left-full ml-3 z-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg text-on-surface opacity-0 -translate-x-2 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-[opacity,transform] duration-150"
              >
                {t('logOut')}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
