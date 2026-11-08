'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Shield, Crown, Volleyball, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login, quickSwitch } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const success = await login(email, password);
    setLoading(false);

    if (success) {
      router.push('/');
    } else {
      setError('Błędne dane logowania (Domyślne hasło testowe: haslo123)');
    }
  };

  const handleQuickLogin = async (userId: string) => {
    setLoading(true);
    await quickSwitch(userId);
    router.push('/');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 relative">
      <div className="max-w-md w-full angel-card rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden z-10 border border-steel-700/60 bg-dark-900/95 backdrop-blur-xl">
        {/* Athletic Badge & Crest */}
        <div className="text-center mb-6">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3">
            <img
              src="/logo.jpg"
              alt="Angels ZTP Volleyball Team"
              className="w-full h-full object-contain drop-shadow-2xl rounded-2xl border border-steel-700/70"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-steel-800/80 border border-steel-600/50 text-steel-200 text-[10px] font-athletic tracking-widest uppercase mb-1">
            System Drużynowy · 2026/2027
          </div>
          <h1 className="text-xl sm:text-2xl font-athletic text-bone-100 tracking-wider uppercase">
            Angels ZTP
          </h1>
          <p className="text-[11px] text-steel-400">Logowanie do panelu zarządzania</p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-steel-300 mb-1">Adres e-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-steel-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="twoj@email.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-950/80 border border-steel-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm text-bone-100 placeholder-steel-600 focus:outline-none focus:border-steel-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-steel-300 mb-1">Hasło</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-steel-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-950/80 border border-steel-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm text-bone-100 placeholder-steel-600 focus:outline-none focus:border-steel-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-athletic tracking-wider text-xs sm:text-sm bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-slate-950 font-black shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Collapsible Demo Accounts (for developers/testing only) */}
        <details className="mt-4 pt-3 border-t border-steel-800/80 group">
          <summary className="text-[11px] font-mono text-steel-500 hover:text-steel-300 cursor-pointer flex items-center justify-between select-none">
            <span>Konta demonstracyjne (testy)</span>
            <span className="text-[10px] text-steel-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2.5 grid grid-cols-1 gap-1.5 animate-fadeIn">
            <button
              type="button"
              onClick={() => handleQuickLogin('usr_kierownik')}
              className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Łukasz Kremer #17 (Kapitan & Kierownik)</span>
              </span>
              <span className="text-[10px] font-mono text-amber-300/80">Pełny dostęp</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('usr_trener')}
              className="py-1.5 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold transition flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2">
                <ClipboardList className="w-3.5 h-3.5 text-sky-400" />
                <span>Hubert Obara #12 (Trener)</span>
              </span>
              <span className="text-[10px] font-mono text-sky-300/80">Taktyka & Skład</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('usr_zawodnik_2')}
              className="py-1.5 px-3 rounded-xl bg-steel-800/40 hover:bg-steel-800/80 border border-steel-700 text-steel-300 text-xs font-bold transition flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2">
                <Volleyball className="w-3.5 h-3.5 text-purple-400" />
                <span>Kamil Pujanek #4 (Zawodnik)</span>
              </span>
              <span className="text-[10px] font-mono text-steel-400">Składki & Mecze</span>
            </button>
          </div>
        </details>

        <div className="mt-5 pt-4 border-t border-steel-800 text-center text-xs text-steel-400">
          Nowy zawodnik w Angels ZTP?{' '}
          <Link href="/register" className="text-bone-100 font-bold hover:text-white underline underline-offset-4 ml-1">
            Zarejestruj konto
          </Link>
        </div>
      </div>
    </div>
  );
}
