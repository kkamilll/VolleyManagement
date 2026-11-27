'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Phone, ArrowRight, Volleyball, Crown, ClipboardList, KeyRound } from 'lucide-react';
import { Role, PlayerPosition } from '@/lib/types';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('ZAWODNIK');
  const [number, setNumber] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('Przyjmujący');
  const [height, setHeight] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const success = await register({
      name,
      email,
      password,
      role,
      number: number ? Number(number) : undefined,
      position,
      height: height ? Number(height) : undefined,
      phone,
      inviteCode: inviteCode.trim() || undefined,
    });

    setLoading(false);

    if (success) {
      router.push('/');
    } else {
      setError('Nieprawidłowy kod zaproszenia lub konto z tym adresem e-mail już istnieje.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 bg-[#f8fafc] relative overflow-hidden select-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.10),transparent_55%)]" />

      <div className="max-w-lg w-full bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-900/5 relative z-10 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-amber-500 to-emerald-500" />

        <div className="p-6 sm:p-9 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2.5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 flex items-center justify-center border border-indigo-500/20">
              <Volleyball className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-athletic font-bold tracking-widest uppercase">
              <Volleyball className="w-3 h-3 text-indigo-600" />
              <span>Rejestracja Zawodnika</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-athletic tracking-tight uppercase text-slate-900">
              Dołącz do drużyny
            </h1>
            <p className="text-xs text-slate-500">
              Wpisz kod zaproszenia od trenera lub kierownika i utwórz swój profil
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Kod zaproszenia klubu */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Kod zaproszenia klubu *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Wpisz kod otrzymany od trenera lub kierownika"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full h-11 bg-indigo-50/50 border border-indigo-200 rounded-xl pl-10 pr-4 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Kod zaproszenia jest wymagany, aby dołączyć do właściwej drużyny.
              </p>
            </div>

            {/* Rola w drużynie */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Rola w zespole *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('ZAWODNIK')}
                  className={`h-10 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'ZAWODNIK'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Volleyball className="w-3.5 h-3.5" /> Zawodnik
                </button>
                <button
                  type="button"
                  onClick={() => setRole('TRENER')}
                  className={`h-10 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'TRENER'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" /> Trener
                </button>
                <button
                  type="button"
                  onClick={() => setRole('KIEROWNIK')}
                  className={`h-10 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'KIEROWNIK'
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" /> Kierownik
                </button>
              </div>
            </div>

            {/* Imię i Nazwisko oraz Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Imię i Nazwisko *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Jan Kowalski"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Adres e-mail *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="twoj@email.pl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition"
                  />
                </div>
              </div>
            </div>

            {/* Hasło */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Hasło *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 znaków"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition"
                />
              </div>
            </div>

            {/* Parametry boiskowe dla zawodnika */}
            {role === 'ZAWODNIK' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="text-[10px] font-black font-athletic text-indigo-600 uppercase tracking-widest block">
                  Parametry Boiskowe
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Numer koszulki</label>
                    <input
                      type="number"
                      placeholder="np. 17"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Pozycja</label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value as PlayerPosition)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition"
                    >
                      <option value="Przyjmujący">Przyjmujący</option>
                      <option value="Atakujący">Atakujący</option>
                      <option value="Środkowy">Środkowy</option>
                      <option value="Rozgrywający">Rozgrywający</option>
                      <option value="Libero">Libero</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Wzrost (cm)</label>
                    <input
                      type="number"
                      placeholder="np. 194"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Telefon</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="500 123 456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-athletic tracking-wider text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer active:scale-[0.98]"
            >
              {loading ? 'Rejestrowanie profilu...' : 'Utwórz konto i dołącz'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-bold">
            <Link href="/login" className="text-indigo-600 hover:text-indigo-800 transition">
              Masz już konto? Zaloguj się
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
