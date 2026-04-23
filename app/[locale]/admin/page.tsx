'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Sidebar } from '../../../components/Sidebar';
import { TopBar } from '../../../components/TopBar';
import { adminApi, usersApi, documentsApi, scoringApi } from '../../../lib/api';
import { toast } from '../../../lib/toast';
import { cn } from '../../../lib/cn';

// ── Types ─────────────────────────────────────────────────────────────────────

interface User { id: string; email: string; role: string; created_at: string }
interface Doc { id: string; original_name: string; category: string; status: string; file_size: number | null; updated_at: string }
interface ScoringConfig {
  warm_threshold: number; hot_threshold: number;
  fit_weight: number; intent_weight: number;
  click_score_boost: number; linkedin_boost: number;
  reply_score_boost: number; webinar_score_boost: number;
  meeting_score_boost: number; max_hot_attempts: number;
  cooldown_score_penalty: number;
}

type AdminTab = 'users' | 'knowledge' | 'integrations' | 'email' | 'feedback';

const TABS: { id: AdminTab; icon: string; label: string }[] = [
  { id: 'users',        icon: 'group',         label: 'Utilisateurs' },
  { id: 'knowledge',    icon: 'database',      label: 'Base de connaissance' },
  { id: 'integrations', icon: 'extension',     label: 'Intégrations' },
  { id: 'email',        icon: 'mail',          label: 'Email' },
  { id: 'feedback',     icon: 'loop',          label: 'Boucle Feedback' },
];

// ── Shared UI ─────────────────────────────────────────────────────────────────

const inputCls = 'w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 outline-none transition-all';

function SectionCard({ title, icon, children, action }: {
  title: string; icon: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
          <h3 className="font-headline font-bold text-on-surface">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-on-surface-variant/60">{hint}</p>}
    </div>
  );
}

function SaveBtn({ loading, onClick }: { loading?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:scale-100">
      {loading
        ? <><span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>Enregistrement…</>
        : <><span className="material-symbols-outlined text-[16px]">save</span>Enregistrer</>}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/30 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline font-extrabold text-xl text-primary">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-on-surface-variant hover:text-primary rounded-xl hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UserFormModal({ mode, user, onClose, onSuccess }: {
  mode: 'create' | 'edit'; user?: User; onClose: () => void; onSuccess: (u: User) => void;
}) {
  const t = useTranslations('Admin');
  const [form, setForm] = useState({ email: user?.email ?? '', password: '', role: user?.role ?? 'executive' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSubmitting(true);
    try {
      let result: User;
      if (mode === 'create') {
        result = await usersApi.create({ email: form.email, password: form.password, role: form.role }) as User;
        toast.success(t('userCreated'));
      } else {
        const patch: { email?: string; role?: string; password?: string } = {};
        if (form.email !== user?.email) patch.email = form.email;
        if (form.role !== user?.role) patch.role = form.role;
        if (form.password) patch.password = form.password;
        result = await usersApi.update(user!.id, patch) as User;
        toast.success(t('userUpdated'));
      }
      onSuccess(result);
    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); setSubmitting(false); }
  };

  return (
    <Modal title={mode === 'create' ? t('createUser') : t('editUser')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('emailLabel')}>
          <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
        </Field>
        <Field label={t('passwordLabel')} hint={mode === 'edit' ? t('passwordHint') : undefined}>
          <input type="password" required={mode === 'create'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputCls} />
        </Field>
        <Field label={t('roleLabel')}>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
            <option value="executive">{t('roleExecutive')}</option>
            <option value="manager">{t('roleManager')}</option>
            <option value="admin">{t('roleAdmin')}</option>
          </select>
        </Field>
        {error && <p className="text-sm text-error bg-error/10 px-4 py-3 rounded-xl">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-surface-container-low text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors">{t('cancel')}</button>
          <button type="submit" disabled={submitting} className="flex-1 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl disabled:opacity-60 hover:scale-[1.02] active:scale-95 transition-all">
            {submitting ? '…' : t('save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmModal({ message, onConfirm, onCancel, submitting }: { message: string; onConfirm: () => void; onCancel: () => void; submitting: boolean }) {
  const t = useTranslations('Admin');
  return (
    <Modal title={t('confirmTitle')} onClose={onCancel}>
      <p className="text-on-surface-variant mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={submitting} className="flex-1 py-3 bg-surface-container-low text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors disabled:opacity-60">{t('cancel')}</button>
        <button onClick={onConfirm} disabled={submitting} className="flex-1 py-3 bg-error text-on-error font-bold rounded-xl disabled:opacity-60 hover:opacity-90 transition-opacity">
          {submitting ? '…' : t('delete')}
        </button>
      </div>
    </Modal>
  );
}

function UsersTab({ users, loading, onAdd, onEdit, onDelete }: {
  users: User[]; loading: boolean;
  onAdd: () => void; onEdit: (u: User) => void; onDelete: (u: User) => void;
}) {
  const t = useTranslations('Admin');
  return (
    <SectionCard title={`${users.length} utilisateur${users.length > 1 ? 's' : ''}`} icon="group"
      action={
        <button onClick={onAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          {t('addUser')}
        </button>
      }>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-surface-container-low rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                <th className="text-left px-5 py-3">{t('colEmail')}</th>
                <th className="text-left px-5 py-3">{t('colRole')}</th>
                <th className="text-left px-5 py-3">{t('colCreatedAt')}</th>
                <th className="px-5 py-3 text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-container transition-colors">
                  <td className="px-5 py-4 font-bold text-primary">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-[11px] font-bold capitalize">{u.role}</span>
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant text-xs">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(u)} className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button onClick={() => onDelete(u)} className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-error/10 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ── Knowledge Base Tab ────────────────────────────────────────────────────────

function KnowledgeTab({ documents, loading, onUpload, onReindex, onReindexAll, onDelete, fileInputRef, uploadCategory, onCategoryChange }: {
  documents: Doc[]; loading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReindex: (doc: Doc) => void; onReindexAll: () => void; onDelete: (doc: Doc) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploadCategory: string; onCategoryChange: (v: string) => void;
}) {
  const t = useTranslations('Admin');
  return (
    <SectionCard title={t('knowledgeBase')} icon="database"
      action={
        <div className="flex items-center gap-2">
          <button onClick={onReindexAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-low text-on-surface-variant hover:text-primary font-bold rounded-xl text-xs transition-colors">
            <span className="material-symbols-outlined text-[15px]">refresh</span>
            {t('reindexAll')}
          </button>
          <select value={uploadCategory} onChange={e => onCategoryChange(e.target.value)}
            className="bg-surface-container-low text-on-surface text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20">
            <option value="general">{t('categoryGeneral')}</option>
            <option value="core_methodology">{t('coreMethodology')}</option>
            <option value="market_intelligence">{t('marketIntelligence')}</option>
            <option value="sales_enablement">{t('salesEnablement')}</option>
          </select>
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            {t('uploadNewSource')}
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.pptx,.txt,.csv" className="hidden" onChange={onUpload} />
        </div>
      }>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-surface-container-low rounded-xl animate-pulse" />)}</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-[48px] text-outline/40 block mb-3">folder_open</span>
          <p className="text-on-surface-variant font-medium text-sm">{t('noDocuments')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                <th className="text-left px-5 py-3">{t('colDocName')}</th>
                <th className="text-left px-5 py-3">{t('colCategory')}</th>
                <th className="text-left px-5 py-3">{t('colVectorStatus')}</th>
                <th className="text-left px-5 py-3">{t('colLastUpdated')}</th>
                <th className="px-5 py-3 text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-surface-container transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">description</span>
                      <span className="font-bold text-on-surface text-xs">{doc.original_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant text-xs capitalize">{doc.category.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-4">
                    <span className={cn('flex items-center gap-1.5 text-[11px] font-bold w-fit',
                      doc.status === 'indexing' ? 'text-on-surface-variant' : 'text-on-tertiary-container')}>
                      <span className={cn('w-2 h-2 rounded-full shrink-0',
                        doc.status === 'indexing' ? 'bg-on-surface-variant/40 animate-pulse' : 'bg-on-tertiary-container')} />
                      {doc.status === 'synced' ? t('synced') : doc.status === 'indexing' ? t('indexing') : doc.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant text-xs">{new Date(doc.updated_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onReindex(doc)} title={t('reindexAll')} className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                      </button>
                      <button onClick={() => onDelete(doc)} className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-error/10 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ── Integrations Tab ──────────────────────────────────────────────────────────

const LS_AIRTABLE = 'avv_airtable_cfg';
const LS_NOTION   = 'avv_notion_cfg';

function IntegrationsTab() {
  const [airtable, setAirtable] = useState({ api_key: '', base_id: '', table_name: 'Leads' });
  const [notion, setNotion]     = useState({ token: '', database_id: '' });

  useEffect(() => {
    try {
      const a = localStorage.getItem(LS_AIRTABLE);
      const n = localStorage.getItem(LS_NOTION);
      if (a) setAirtable(JSON.parse(a));
      if (n) setNotion(JSON.parse(n));
    } catch {}
  }, []);

  const saveAirtable = () => {
    localStorage.setItem(LS_AIRTABLE, JSON.stringify(airtable));
    toast.success('Configuration Airtable enregistrée');
  };
  const saveNotion = () => {
    localStorage.setItem(LS_NOTION, JSON.stringify(notion));
    toast.success('Configuration Notion enregistrée');
  };

  return (
    <div className="space-y-6">
      {/* Airtable */}
      <SectionCard title="Airtable" icon="grid_on"
        action={<span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">Stocké localement</span>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <Field label="API Key" hint="Commence par pat… — Airtable > Account > API">
            <input type="password" value={airtable.api_key} onChange={e => setAirtable(v => ({ ...v, api_key: e.target.value }))}
              placeholder="patXXXXXXXXXXXXXX.XXXXXXX" className={cn(inputCls, 'font-mono text-xs')} />
          </Field>
          <Field label="Base ID" hint="URL de la base : airtable.com/appXXXXXXXX">
            <input value={airtable.base_id} onChange={e => setAirtable(v => ({ ...v, base_id: e.target.value }))}
              placeholder="appXXXXXXXXXXXXXX" className={cn(inputCls, 'font-mono text-xs')} />
          </Field>
          <Field label="Nom de la table par défaut">
            <input value={airtable.table_name} onChange={e => setAirtable(v => ({ ...v, table_name: e.target.value }))}
              placeholder="Leads" className={inputCls} />
          </Field>
        </div>
        <div className="flex justify-end"><SaveBtn onClick={saveAirtable} /></div>
      </SectionCard>

      {/* Notion */}
      <SectionCard title="Notion" icon="article"
        action={<span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">Stocké localement</span>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <Field label="Integration Token" hint="Notion > Paramètres > Mes intégrations > Créer">
            <input type="password" value={notion.token} onChange={e => setNotion(v => ({ ...v, token: e.target.value }))}
              placeholder="secret_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" className={cn(inputCls, 'font-mono text-xs')} />
          </Field>
          <Field label="Database ID" hint="ID dans l'URL de la base de données">
            <input value={notion.database_id} onChange={e => setNotion(v => ({ ...v, database_id: e.target.value }))}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className={cn(inputCls, 'font-mono text-xs')} />
          </Field>
        </div>
        <div className="flex justify-end"><SaveBtn onClick={saveNotion} /></div>
      </SectionCard>
    </div>
  );
}

// ── Email Tab ─────────────────────────────────────────────────────────────────

const LS_EMAIL = 'avv_email_cfg';

function EmailTab() {
  const [cfg, setCfg] = useState({
    provider: 'smtp',
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '',
    from_name: '', from_email: '',
    sendgrid_key: '', mailgun_key: '', mailgun_domain: '',
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_EMAIL);
      if (raw) setCfg(JSON.parse(raw));
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem(LS_EMAIL, JSON.stringify(cfg));
    toast.success('Configuration email enregistrée');
  };

  const set = (k: string, v: string) => setCfg(prev => ({ ...prev, [k]: v }));

  return (
    <SectionCard title="Configuration email" icon="mail"
      action={<span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">Stocké localement</span>}>
      <div className="space-y-6">
        {/* Provider selector */}
        <Field label="Fournisseur">
          <div className="flex gap-2">
            {[
              { id: 'smtp', icon: 'dns', label: 'SMTP' },
              { id: 'sendgrid', icon: 'send', label: 'SendGrid' },
              { id: 'mailgun', icon: 'rocket_launch', label: 'Mailgun' },
            ].map(p => (
              <button key={p.id} type="button" onClick={() => set('provider', p.id)}
                className={cn('flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all',
                  cfg.provider === p.id ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high')}>
                <span className="material-symbols-outlined text-[15px]">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Expéditeur (toujours visible) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom d'expéditeur">
            <input value={cfg.from_name} onChange={e => set('from_name', e.target.value)}
              placeholder="SalesBoost AI" className={inputCls} />
          </Field>
          <Field label="Adresse d'expéditeur">
            <input type="email" value={cfg.from_email} onChange={e => set('from_email', e.target.value)}
              placeholder="noreply@votre-domaine.com" className={inputCls} />
          </Field>
        </div>

        {/* SMTP fields */}
        {cfg.provider === 'smtp' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Hôte SMTP">
              <input value={cfg.smtp_host} onChange={e => set('smtp_host', e.target.value)}
                placeholder="smtp.gmail.com" className={inputCls} />
            </Field>
            <Field label="Port">
              <input value={cfg.smtp_port} onChange={e => set('smtp_port', e.target.value)}
                placeholder="587" className={inputCls} />
            </Field>
            <Field label="Utilisateur">
              <input value={cfg.smtp_user} onChange={e => set('smtp_user', e.target.value)}
                placeholder="user@domaine.com" className={inputCls} />
            </Field>
            <Field label="Mot de passe" hint="Mot de passe ou token d'application">
              <input type="password" value={cfg.smtp_pass} onChange={e => set('smtp_pass', e.target.value)}
                placeholder="••••••••••••" className={inputCls} />
            </Field>
          </div>
        )}

        {/* SendGrid fields */}
        {cfg.provider === 'sendgrid' && (
          <Field label="API Key SendGrid">
            <input type="password" value={cfg.sendgrid_key} onChange={e => set('sendgrid_key', e.target.value)}
              placeholder="SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" className={cn(inputCls, 'font-mono text-xs')} />
          </Field>
        )}

        {/* Mailgun fields */}
        {cfg.provider === 'mailgun' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="API Key Mailgun">
              <input type="password" value={cfg.mailgun_key} onChange={e => set('mailgun_key', e.target.value)}
                placeholder="key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" className={cn(inputCls, 'font-mono text-xs')} />
            </Field>
            <Field label="Domaine Mailgun">
              <input value={cfg.mailgun_domain} onChange={e => set('mailgun_domain', e.target.value)}
                placeholder="mg.votre-domaine.com" className={inputCls} />
            </Field>
          </div>
        )}

        <div className="flex justify-end pt-2"><SaveBtn onClick={save} /></div>
      </div>
    </SectionCard>
  );
}

// ── Feedback Loop Tab ─────────────────────────────────────────────────────────

const CHANNELS = [
  { key: 'click_score_boost',    icon: 'language',         label: 'Clic sur lien (site web)',             color: 'text-primary',              desc: 'Visite de la page LinkedIn, site web, ou landing page' },
  { key: 'linkedin_boost',       icon: 'thumb_up',         label: 'Réaction / Commentaire LinkedIn',       color: 'text-[#0A66C2]',            desc: "Like, commentaire ou partage d'une publication" },
  { key: 'reply_score_boost',    icon: 'mail',             label: 'Réponse email',                         color: 'text-tertiary',             desc: 'Le prospect a répondu à un email de prospection' },
  { key: 'webinar_score_boost',  icon: 'play_circle',      label: 'Inscription / Réponse webinaire',       color: 'text-on-tertiary-container', desc: 'Inscription ou réponse positive à une invitation webinaire' },
  { key: 'meeting_score_boost',  icon: 'calendar_month',   label: 'Rendez-vous réservé',                   color: 'text-on-primary-container', desc: 'Booking confirmé via Calendly ou outil de prise de RDV' },
] as const;

type BoostKey = typeof CHANNELS[number]['key'];

function BoostSlider({ label, icon, color, desc, value, onChange }: {
  label: string; icon: string; color: string; desc: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className={cn('material-symbols-outlined text-[22px]', color)}>{icon}</span>
          <div>
            <p className="font-bold text-sm text-on-surface">{label}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input type="number" min={0} max={100} step={5}
            value={value}
            onChange={e => onChange(Math.min(100, Math.max(0, Number(e.target.value))))}
            className="w-16 text-center bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-2 py-1.5 text-sm font-black text-primary outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-xs font-bold text-on-surface-variant">pts</span>
        </div>
      </div>
      <input type="range" min={0} max={100} step={5} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-primary" />
      <div className="flex justify-between text-[10px] text-on-surface-variant/50 mt-1">
        <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
      </div>
    </div>
  );
}

function FeedbackTab() {
  const [config, setConfig] = useState<Partial<ScoringConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    scoringApi.getConfig().then((c) => {
      setConfig(c as ScoringConfig);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const setVal = (key: string, v: number) => setConfig(prev => ({ ...prev, [key]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await scoringApi.updateConfig(config as Parameters<typeof scoringApi.updateConfig>[0]);
      toast.success('Boucle de feedback mise à jour');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 bg-surface-container-low rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Boost par canal */}
      <SectionCard title="Boost de score par signal d'engagement" icon="loop">
        <div className="space-y-4">
          {CHANNELS.map(ch => (
            <BoostSlider key={ch.key} label={ch.label} icon={ch.icon} color={ch.color} desc={ch.desc}
              value={(config[ch.key as BoostKey] ?? 0) as number}
              onChange={v => setVal(ch.key, v)}
            />
          ))}
        </div>
      </SectionCard>

      {/* Seuils et poids */}
      <SectionCard title="Seuils de segmentation & poids du score" icon="tune">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Seuils de palier</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-24 text-xs font-bold text-primary">❄️ Froid &lt;</span>
                <input type="number" min={1} max={99} value={config.warm_threshold ?? 30}
                  onChange={e => setVal('warm_threshold', Number(e.target.value))}
                  className="w-20 text-center bg-surface-container-low rounded-xl px-2 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/20" />
                <span className="text-xs text-on-surface-variant">pts</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-24 text-xs font-bold text-yellow-600">🌤️ Warm &lt;</span>
                <input type="number" min={1} max={99} value={config.hot_threshold ?? 70}
                  onChange={e => setVal('hot_threshold', Number(e.target.value))}
                  className="w-20 text-center bg-surface-container-low rounded-xl px-2 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/20" />
                <span className="text-xs text-on-surface-variant">pts</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-24 text-xs font-bold text-red-500">🔥 Hot ≥</span>
                <span className="text-sm font-black text-primary">{config.hot_threshold ?? 70} pts</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Poids du score composé</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-28 text-xs font-bold text-on-surface">Fit (profil)</span>
                <input type="number" min={0} max={1} step={0.05} value={config.fit_weight ?? 0.4}
                  onChange={e => setVal('fit_weight', Number(e.target.value))}
                  className="w-20 text-center bg-surface-container-low rounded-xl px-2 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/20" />
                <span className="text-xs text-on-surface-variant">× 100</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-28 text-xs font-bold text-on-surface">Intent (signal)</span>
                <input type="number" min={0} max={1} step={0.05} value={config.intent_weight ?? 0.6}
                  onChange={e => setVal('intent_weight', Number(e.target.value))}
                  className="w-20 text-center bg-surface-container-low rounded-xl px-2 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/20" />
                <span className="text-xs text-on-surface-variant">× 100</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Cooldown Hot</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-28 text-xs font-bold text-on-surface">Tentatives max</span>
                <input type="number" min={1} max={20} value={config.max_hot_attempts ?? 3}
                  onChange={e => setVal('max_hot_attempts', Number(e.target.value))}
                  className="w-20 text-center bg-surface-container-low rounded-xl px-2 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/20" />
                <span className="text-xs text-on-surface-variant">essais</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-28 text-xs font-bold text-on-surface">Pénalité score</span>
                <input type="number" min={0} max={100} step={5} value={config.cooldown_score_penalty ?? 30}
                  onChange={e => setVal('cooldown_score_penalty', Number(e.target.value))}
                  className="w-20 text-center bg-surface-container-low rounded-xl px-2 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/20" />
                <span className="text-xs text-on-surface-variant">pts</span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <SaveBtn loading={saving} onClick={save} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const t = useTranslations('Admin');
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  const [userModal, setUserModal] = useState<{ mode: 'create' | 'edit'; user?: User } | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<Doc | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState('general');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [u, d] = await Promise.all([usersApi.list(), documentsApi.list()]) as [User[], Doc[]];
      setUsers(u); setDocuments(d);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erreur de chargement'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUserSuccess = (u: User) => {
    const isNew = !users.find(x => x.id === u.id);
    setUsers(prev => isNew ? [u, ...prev] : prev.map(x => (x.id === u.id ? u : x)));
    setUserModal(null);
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setActionSubmitting(true);
    try {
      await usersApi.delete(deleteUser.id);
      setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
      toast.success(t('userDeleted')); setDeleteUser(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erreur'); }
    finally { setActionSubmitting(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newDoc = await documentsApi.upload(file, uploadCategory) as Doc;
      setDocuments(prev => [newDoc, ...prev]);
      toast.success(t('uploadSuccess'));
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erreur upload'); }
    finally { if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleReindex = async (doc: Doc) => {
    try {
      const updated = await documentsApi.reindex(doc.id) as Doc;
      setDocuments(prev => prev.map(d => (d.id === updated.id ? updated : d)));
      toast.success(t('reindexSuccess'));
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erreur'); }
  };

  const handleReindexAll = async () => {
    try { await documentsApi.reindexAll(); await loadData(); toast.success(t('reindexAllSuccess')); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Erreur'); }
  };

  const handleDeleteDoc = async () => {
    if (!deleteDoc) return;
    setActionSubmitting(true);
    try {
      await documentsApi.delete(deleteDoc.id);
      setDocuments(prev => prev.filter(d => d.id !== deleteDoc.id));
      toast.success(t('deleteSuccess')); setDeleteDoc(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erreur'); }
    finally { setActionSubmitting(false); }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface">
        <TopBar />
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="px-8 pt-8 pb-0">
            <div className="flex items-center gap-3 text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-4">
              <span className="w-6 h-1 bg-primary rounded-full" />
              Administration
            </div>
            <h1 className="font-headline text-4xl font-black text-primary tracking-tight mb-6">{t('title')}</h1>

            {/* Tab bar */}
            <div className="flex gap-1 bg-surface-container-low rounded-2xl p-1 w-fit overflow-x-auto">
              {TABS.map(({ id, icon, label }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap',
                    tab === id ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface',
                  )}>
                  <span className="material-symbols-outlined text-[17px]"
                    style={{ fontVariationSettings: tab === id ? "'FILL' 1" : "'FILL' 0" }}>
                    {icon}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="px-8 py-6">
            {tab === 'users' && (
              <UsersTab users={users} loading={loading}
                onAdd={() => setUserModal({ mode: 'create' })}
                onEdit={u => setUserModal({ mode: 'edit', user: u })}
                onDelete={u => setDeleteUser(u)}
              />
            )}
            {tab === 'knowledge' && (
              <KnowledgeTab documents={documents} loading={loading}
                onUpload={handleFileUpload} onReindex={handleReindex}
                onReindexAll={handleReindexAll} onDelete={d => setDeleteDoc(d)}
                fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                uploadCategory={uploadCategory} onCategoryChange={setUploadCategory}
              />
            )}
            {tab === 'integrations' && <IntegrationsTab />}
            {tab === 'email' && <EmailTab />}
            {tab === 'feedback' && <FeedbackTab />}
          </div>
        </div>
      </div>

      {userModal && (
        <UserFormModal mode={userModal.mode} user={userModal.user}
          onClose={() => setUserModal(null)} onSuccess={handleUserSuccess} />
      )}
      {deleteUser && (
        <ConfirmModal message={t('confirmDeleteUser', { email: deleteUser.email })}
          onConfirm={handleDeleteUser} onCancel={() => setDeleteUser(null)} submitting={actionSubmitting} />
      )}
      {deleteDoc && (
        <ConfirmModal message={t('confirmDeleteDoc', { name: deleteDoc.original_name })}
          onConfirm={handleDeleteDoc} onCancel={() => setDeleteDoc(null)} submitting={actionSubmitting} />
      )}
    </div>
  );
}
