'use client';

import React, { useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '../../../../components/Sidebar';
import { TopBar } from '../../../../components/TopBar';
import { opportunityApi } from '../../../../lib/api';
import { cn } from '../../../../lib/cn';
import { useAuth } from '../../../../lib/auth';

type Priority = 'low' | 'medium' | 'high';

interface FormState {
  title: string;
  company_name: string;
  value: string;
  priority: Priority;
  win_probability: string;
  contact_name: string;
  meeting_date: string;
}

const PRIORITY_OPTIONS: { value: Priority; labelKey: string }[] = [
  { value: 'low', labelKey: 'priorityLow' },
  { value: 'medium', labelKey: 'priorityMedium' },
  { value: 'high', labelKey: 'priorityHigh' },
];

export default function NewOpportunityPage() {
  const t = useTranslations('NewOpportunity');
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>({
    title: '',
    company_name: '',
    value: '',
    priority: 'medium',
    win_probability: '0',
    contact_name: '',
    meeting_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; title: string; company_name: string } | null>(null);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await opportunityApi.create(
        {
          title: form.title.trim(),
          company_name: form.company_name.trim(),
          value: parseFloat(form.value) || 0,
          priority: form.priority,
          win_probability: parseFloat(form.win_probability) / 100 || 0,
          contact_name: form.contact_name.trim() || undefined,
          meeting_date: form.meeting_date ? new Date(form.meeting_date).toISOString() : undefined,
        },
        user?.id ?? '',
      );
      setCreated({ id: result.id, title: form.title.trim(), company_name: form.company_name.trim() });
      setSubmitting(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errorMessage'));
      setSubmitting(false);
    }
  };

  if (created) {
    const copilotHref = `/copilot?opportunity_id=${created.id}&title=${encodeURIComponent(created.title)}&company=${encodeURIComponent(created.company_name)}`;
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface">
          <TopBar />
          <section className="p-8 flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center">
            <div className="max-w-md w-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-headline font-black text-3xl text-primary tracking-tight mb-2">
                {t('successTitle')}
              </h2>
              <p className="text-on-surface-variant mb-2 font-medium">{created.company_name} — {created.title}</p>
              <p className="text-sm text-on-surface-variant/70 mb-10">{t('successSubtitle')}</p>

              <div className="flex flex-col gap-3">
                <Link
                  href={copilotHref}
                  className="flex items-center justify-center gap-2.5 w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                >
                  <Sparkles className="w-5 h-5" />
                  {t('goToCopilot')}
                </Link>
                <button
                  onClick={() => router.push(`/opportunities/${created.id}/briefing`)}
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-surface-container-low text-on-surface font-bold rounded-2xl hover:bg-surface-container-high transition-colors text-sm"
                >
                  <FileText className="w-4 h-4" />
                  {t('submit')}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface">
        <TopBar />
        <section className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-4">
                <span className="w-6 h-1 bg-primary rounded-full" />
                {t('eyebrow')}
              </div>
              <h1 className="font-headline text-4xl font-black text-primary tracking-tight">
                {t('title')}
              </h1>
              <p className="text-on-surface-variant font-medium mt-1">{t('subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label={t('titleLabel')} required>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder={t('titlePlaceholder')}
                  className={inputClass}
                />
              </Field>

              <Field label={t('companyLabel')} required>
                <input
                  type="text"
                  required
                  value={form.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder={t('companyPlaceholder')}
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label={t('contactNameLabel')}>
                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={(e) => handleChange('contact_name', e.target.value)}
                    placeholder={t('contactNamePlaceholder')}
                    className={inputClass}
                  />
                </Field>

                <Field label={t('meetingDateLabel')}>
                  <input
                    type="datetime-local"
                    value={form.meeting_date}
                    onChange={(e) => handleChange('meeting_date', e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label={t('valueLabel')}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={form.value}
                      onChange={(e) => handleChange('value', e.target.value)}
                      placeholder="0"
                      className={cn(inputClass, 'pl-7')}
                    />
                  </div>
                </Field>

                <Field label={t('winProbLabel')}>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.win_probability}
                      onChange={(e) => handleChange('win_probability', e.target.value)}
                      placeholder="0"
                      className={cn(inputClass, 'pr-7')}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">%</span>
                  </div>
                </Field>
              </div>

              <Field label={t('priorityLabel')}>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleChange('priority', value)}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all',
                        form.priority === value
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high',
                      )}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </Field>

              {error && (
                <p className="text-sm font-medium text-error bg-error/10 px-4 py-3 rounded-xl">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 py-3 bg-surface-container-low text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:scale-100"
                >
                  {submitting ? t('submitting') : t('submit')}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

const inputClass =
  'w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
