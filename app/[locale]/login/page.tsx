'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../../../lib/auth';
import { cn } from '../../../lib/cn';
import logo from '../../../images/logo-sary.png';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(false);
    setEmail('');
    setPassword('');
    setConfirm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'register' && password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
        setSuccess(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-2xl shadow-on-background/10 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                <Image src={logo} alt="SalesBoost AI" width={40} height={40} className="object-contain" priority />
              </div>
            </div>
            <h1 className="font-headline font-black text-2xl text-on-surface tracking-tight">SalesBoost AI</h1>
            <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-[0.15em] mt-1">
              The Digital Closing Executive
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex mx-8 mb-6 bg-surface-container-low rounded-xl p-1">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => reset(m)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-bold transition-all',
                  mode === m
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {/* Success state (after register) */}
          {success ? (
            <div className="px-8 pb-10 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px] text-primary">pending_actions</span>
              </div>
              <h2 className="font-headline font-bold text-on-surface text-lg mb-2">Demande envoyée</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                Votre inscription est en attente de validation par un administrateur. Vous recevrez l'accès une fois approuvé.
              </p>
              <button
                onClick={() => reset('login')}
                className="text-primary font-bold text-sm hover:underline"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="px-8 pb-8 space-y-4">
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-error/10 text-error rounded-xl px-4 py-3 text-sm">
                  <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    required
                    autoComplete="email"
                    className="w-full bg-surface-container-low rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all placeholder:text-on-surface-variant/40"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Mot de passe
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
                    lock
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full bg-surface-container-low rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all placeholder:text-on-surface-variant/40"
                  />
                </div>
              </div>

              {/* Confirm password (register only) */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
                      lock_reset
                    </span>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      className="w-full bg-surface-container-low rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all placeholder:text-on-surface-variant/40"
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-60 disabled:scale-100 text-sm mt-2"
              >
                {loading ? (
                  <><span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>
                  {mode === 'login' ? 'Connexion…' : 'Inscription…'}</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">
                    {mode === 'login' ? 'login' : 'person_add'}
                  </span>
                  {mode === 'login' ? 'Se connecter' : "S'inscrire"}</>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-on-surface-variant/50 mt-6">
          © {new Date().getFullYear()} SalesBoost AI — All rights reserved
        </p>
      </div>
    </div>
  );
}
