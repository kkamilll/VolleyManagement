'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, Volleyball } from 'lucide-react';
import Link from 'next/link';

interface PublicClubOption {
  id: string;
  name: string;
  city: string;
  leagueName: string;
  logoUrl?: string;
}

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [clubs, setClubs] = useState<PublicClubOption[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('AUTO');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryClub = searchParams.get('club');
    if (queryClub) {
      setSelectedClubId(queryClub);
      fetch(`/api/clubs?id=${encodeURIComponent(queryClub)}`)
        .then((r) => r.json())
        .then((d) => {
          const list: PublicClubOption[] = d.clubs || [];
          setClubs(list);
        })
        .catch(() => {});
    }
  }, [searchParams]);

  const activeClub = selectedClubId !== 'AUTO' ? clubs.find((c) => c.id === selectedClubId) || null : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const success = await login(email, password);
    setLoading(false);

    if (success) {
      const norm = email.trim().toLowerCase();
      if (norm === 'admin' || norm === 'admin@volleyhub.pl') {
        router.push('/superadmin');
      } else {
        router.push('/');
      }
    } else {
      setError('Nieprawidłowy login lub hasło.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 bg-[#f8fafc] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.10),transparent_55%)]" />

      {/* Crisp Light Login Card */}
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-900/5 relative z-10 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-amber-500 to-emerald-500" />

        <div className="p-7 sm:p-9 space-y-6">
          {/* Minimal Brand Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 flex items-center justify-center overflow-hidden border border-indigo-500/20">
              {activeClub?.logoUrl ? (
                <img
                  src={activeClub.logoUrl}
                  alt={activeClub.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Volleyball className="w-8 h-8" />
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-athletic tracking-tight uppercase text-slate-900">
              {activeClub ? activeClub.name : 'Zaloguj się'}
            </h1>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-bold">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                E-mail lub login
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="twoj@email.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Hasło
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-athletic tracking-wider text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer active:scale-[0.98] uppercase"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

          {/* Minimal Footer Links */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-bold">
            <Link href="/register" className="text-indigo-600 hover:text-indigo-800 transition">
              Dołącz kodem
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/portal" className="text-slate-500 hover:text-slate-800 transition">
              Strona główna
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <LoginFormInner />
    </Suspense>
  );
}
