import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Toaster } from '../../components/Toaster';
import { ThemeProvider } from '../../components/ThemeProvider';
import { SidebarProvider } from '../../components/SidebarContext';
import { AuthProvider } from '../../lib/auth';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'SalesBoost AI | The Digital Closing Executive',
  description: 'AI-Powered Sales Orchestration',
};

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;

  if (!routing.locales.includes(locale as 'en' | 'fr')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        {/* Geist font — Aurora Glass design system */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* Anti-flash: apply stored theme before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark');})();` }} />
      </head>
      <body className="bg-background font-body text-on-surface antialiased overflow-hidden">
        {/* Aurora mesh background — fixed, behind all content */}
        <div aria-hidden="true" className="aurora-bg" />

        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <AuthProvider locale={locale}>
              <SidebarProvider>
                {children}
                <Toaster />
              </SidebarProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
