'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '../lib/cn';
import logo from '../images/logo.png';

export const Sidebar = () => {
  const t = useTranslations('Sidebar');
  const pathname = usePathname();

  const navItems = [
    { icon: 'dashboard', label: t('dashboard'), href: '/dashboard' },
    { icon: 'monetization_on', label: t('opportunities'), href: '/opportunities' },
    { icon: 'person_search', label: t('leads'), href: '/leads' },
    { icon: 'account_tree', label: t('pipeline'), href: '/pipeline' },
    { icon: 'smart_toy', label: t('copilot'), href: '/copilot' },
    { icon: 'settings', label: t('admin'), href: '/admin' },
    { icon: 'contact_support', label: t('support'), href: '/support' },
  ];

  return (
    <aside className="h-screen w-64 flex-none bg-surface-container-low flex flex-col p-4 space-y-1 z-50 shrink-0">
      <div className="px-2 py-4 mb-4">
        <Image
          src={logo}
          alt="SalesBoost AI"
          width={200}
          height={56}
          className="object-contain object-left w-full max-h-14"
          priority
        />
        <div className="mt-2 pl-0.5">
          <h1 className="font-headline font-black text-sm text-primary leading-tight tracking-tight">
            SalesBoost AI
          </h1>
          <p className="font-body text-[9px] uppercase tracking-[0.12em] text-on-surface-variant font-semibold leading-tight mt-0.5">
            {t('brandTagline')}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && item.href !== '#';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium',
                isActive
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
              )}
            >
              <span
                className={cn(
                  'material-symbols-outlined text-[20px]',
                  isActive ? 'text-primary' : 'text-on-surface-variant'
                )}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="font-label text-sm tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-2 space-y-0.5">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-xl transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-label text-sm tracking-tight">{t('logOut')}</span>
        </a>
      </div>
    </aside>
  );
};
