'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../../../lib/auth';
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
    <div className="auth-wrap" style={{ position: 'relative', zIndex: 1 }}>

      {/* ── Left: brand block ─────────────────────────────────────────────── */}
      <div className="auth-brand-block">
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Image src={logo} alt="SalesBoost AI" width={26} height={26} className="object-contain" priority />
          </div>
          <div>
            <p style={{ fontFamily: 'Geist, var(--font-manrope), sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: '-0.012em', color: '#fff' }}>
              SalesBoost AI
            </p>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.7, color: '#fff', marginTop: 3 }}>
              An ETECH product
            </p>
          </div>
        </div>

        {/* Headline */}
        <div>
          <h1 style={{
            fontFamily: 'Geist, var(--font-manrope), sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(36px, 4vw, 56px)',
            lineHeight: 1.05,
            letterSpacing: '-0.028em',
            color: '#fff',
            maxWidth: 480,
          }}>
            Forecast tomorrow&apos;s pipeline. Today.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: 'rgba(255,255,255,0.78)', maxWidth: 460, marginTop: 16 }}>
            Copilot drafts your call briefings, scores every deal, and tells you which conversations move the number this week.
          </p>
        </div>

        {/* Social proof */}
        <div style={{ display: 'flex', gap: 32, color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: 500 }}>
          {[
            { value: '2,400+', label: 'revenue teams' },
            { value: '$1.8B',  label: 'tracked pipeline' },
            { value: '32%',    label: 'avg win-rate lift' },
          ].map((stat) => (
            <div key={stat.label}>
              <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: 28, color: '#fff', display: 'block' }}>
                {stat.value}
              </span>
              {stat.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: auth form ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        position: 'relative',
        background: 'var(--bg-page)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--bg-glass-strong)',
          backdropFilter: 'blur(28px) saturate(140%)',
          WebkitBackdropFilter: 'blur(28px) saturate(140%)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-2xl)',
          padding: 40,
          boxShadow: 'var(--shadow-xl)',
        }}>
          {/* Success state */}
          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 64, height: 64,
                borderRadius: 9999,
                background: 'rgb(var(--accent-cobalt) / 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--fg-cobalt)' }}>pending_actions</span>
              </div>
              <h2 style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 8, color: 'var(--fg-1)' }}>
                Demande envoyée
              </h2>
              <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, marginBottom: 24 }}>
                Votre inscription est en attente de validation par un administrateur. Vous recevrez l&apos;accès une fois approuvé.
              </p>
              <button
                onClick={() => reset('login')}
                style={{ color: 'var(--fg-cobalt)', fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ← Retour à la connexion
              </button>
            </div>
          ) : (
            <>
              <h3 style={{ fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: 24, marginBottom: 6, color: 'var(--fg-1)' }}>
                {mode === 'login' ? 'Bienvenue' : 'Créer un compte'}
              </h3>
              <p style={{ color: 'var(--fg-2)', fontSize: 13.5, marginBottom: 24 }}>
                {mode === 'login' ? 'Connectez-vous à votre espace de travail.' : 'Créez votre compte SalesBoost AI.'}
              </p>

              {/* Mode tabs */}
              <div style={{
                display: 'flex',
                background: 'var(--bg-card-low)',
                borderRadius: 10,
                padding: 4,
                marginBottom: 24,
              }}>
                {(['login', 'register'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => reset(m)}
                    style={{
                      flex: 1,
                      padding: '9px 0',
                      background: mode === m ? 'var(--bg-card)' : 'transparent',
                      color: mode === m ? 'var(--fg-1)' : 'var(--fg-2)',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      borderRadius: 6,
                      boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 180ms',
                    }}
                  >
                    {m === 'login' ? 'Connexion' : 'Inscription'}
                  </button>
                ))}
              </div>

              <form onSubmit={(e) => void handleSubmit(e)}>
                {/* Error */}
                {error && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgb(var(--color-error) / 0.10)',
                    color: 'var(--fg-error)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    fontSize: 13,
                    marginBottom: 14,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>error</span>
                    {error}
                  </div>
                )}

                {/* Email field */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.15em', color: 'var(--fg-2)', display: 'block', marginBottom: 8,
                  }}>
                    Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--fg-2)', fontSize: 18,
                    }}>mail</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      required
                      autoComplete="email"
                      style={{
                        width: '100%',
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 10,
                        padding: '12px 14px 12px 42px',
                        fontSize: 14,
                        color: 'var(--fg-1)',
                        outline: 'none',
                        transition: 'all 180ms',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--fg-cobalt)';
                        e.target.style.boxShadow = '0 0 0 3px rgb(59 91 255 / 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-glass)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.15em', color: 'var(--fg-2)', display: 'block', marginBottom: 8,
                  }}>
                    Mot de passe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--fg-2)', fontSize: 18,
                    }}>lock</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      style={{
                        width: '100%',
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 10,
                        padding: '12px 14px 12px 42px',
                        fontSize: 14,
                        color: 'var(--fg-1)',
                        outline: 'none',
                        transition: 'all 180ms',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--fg-cobalt)';
                        e.target.style.boxShadow = '0 0 0 3px rgb(59 91 255 / 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-glass)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Confirm password */}
                {mode === 'register' && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{
                      fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.15em', color: 'var(--fg-2)', display: 'block', marginBottom: 8,
                    }}>
                      Confirmer le mot de passe
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span className="material-symbols-outlined" style={{
                        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--fg-2)', fontSize: 18,
                      }}>lock_reset</span>
                      <input
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        style={{
                          width: '100%',
                          background: 'var(--bg-glass)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: 10,
                          padding: '12px 14px 12px 42px',
                          fontSize: 14,
                          color: 'var(--fg-1)',
                          outline: 'none',
                          transition: 'all 180ms',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--fg-cobalt)';
                          e.target.style.boxShadow = '0 0 0 3px rgb(59 91 255 / 0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-glass)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '13px 20px',
                    background: 'var(--gradient-primary-cta)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontFamily: 'Geist, var(--font-manrope), sans-serif',
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: 'var(--shadow-cta)',
                    marginTop: 8,
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 180ms',
                  }}
                  onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; }}
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>autorenew</span>
                      {mode === 'login' ? 'Connexion…' : 'Inscription…'}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {mode === 'login' ? 'login' : 'person_add'}
                      </span>
                      {mode === 'login' ? 'Se connecter' : "S'inscrire"}
                      <span className="material-symbols-outlined" style={{ fontSize: 16, marginLeft: 4 }}>arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11,
          color: 'var(--fg-3)',
          whiteSpace: 'nowrap',
        }}>
          © {new Date().getFullYear()} SalesBoost AI — All rights reserved
        </p>
      </div>
    </div>
  );
}
