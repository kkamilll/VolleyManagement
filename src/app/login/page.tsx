'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, Volleyball } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

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
      setError('Nieprawidłowy adres e-mail lub hasło.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 relative overflow-hidden select-none">
      {/* Dynamic ambient glow elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-2xl border border-sky-500/30 rounded-3xl p-7 sm:p-9 shadow-2xl relative z-10 text-white space-y-6">
        
        {/* Athletic Crest & Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2 p-1 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-amber-400 shadow-xl shadow-sky-500/20">
            <img
              src="/logo.jpg"
              alt="Angels ZTP Volleyball Team"
              className="w-full h-full object-contain rounded-xl bg-slate-950"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-[10px] font-athletic tracking-widest uppercase">
            <Volleyball className="w-3 h-3 text-sky-400" />
            <span>LALS 2026/2027 • Panel Drużyny</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-athletic tracking-wider uppercase text-white drop-shadow-sm">
            Angels ZTP
          </h1>
          <p className="text-xs text-slate-400 font-medium">Logowanie do oficjalnego systemu klubowego</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-bold animate-fadeIn">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
              Adres e-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-sky-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="twoj.email@angelsztp.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
              Hasło
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-sky-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-athletic tracking-wider text-xs sm:text-sm bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-slate-950 font-black shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Logowanie...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Zaloguj się</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Footer & Registration Link */}
        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Nowy zawodnik w kadrze?{' '}
          <Link href="/register" className="text-sky-300 hover:text-white font-bold underline underline-offset-4 ml-1 transition">
            Zarejestruj konto
          </Link>
        </div>

      </div>
    </div>
  );
}
