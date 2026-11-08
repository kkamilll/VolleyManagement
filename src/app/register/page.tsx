'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Phone, ArrowRight, Shield, Volleyball, Crown, ClipboardList } from 'lucide-react';
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
    });

    setLoading(false);

    if (success) {
      router.push('/');
    } else {
      setError('Błąd rejestracji lub konto z tym adresem e-mail już istnieje.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 relative">
      <div className="max-w-lg w-full angel-card rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden z-10 border border-steel-700/60 bg-dark-900/95 backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2">
            <img
              src="/logo.jpg"
              alt="Angels ZTP"
              className="w-full h-full object-contain drop-shadow-xl rounded-2xl border border-steel-700/70"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-steel-800/80 border border-steel-600/50 text-steel-200 text-[10px] font-athletic tracking-widest uppercase mb-1">
            Nowy Członek Drużyny
          </div>
          <h1 className="text-xl sm:text-2xl font-athletic text-bone-100 tracking-wider uppercase">
            Dołącz do Angels ZTP
          </h1>
          <p className="text-[11px] text-steel-400">Utwórz profil zawodnika lub sztabu</p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-steel-300 mb-1.5">Rola w drużynie *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('ZAWODNIK')}
                className={`py-2 px-2.5 rounded-xl text-xs font-athletic border transition flex items-center justify-center gap-1.5 ${
                  role === 'ZAWODNIK'
                    ? 'bg-steel-700 text-bone-100 border-steel-500 shadow'
                    : 'bg-dark-950/80 border-steel-800 text-steel-400 hover:text-white'
                }`}
              >
                <Volleyball className="w-3.5 h-3.5" /> Zawodnik
              </button>
              <button
                type="button"
                onClick={() => setRole('TRENER')}
                className={`py-2 px-2.5 rounded-xl text-xs font-athletic border transition flex items-center justify-center gap-1.5 ${
                  role === 'TRENER'
                    ? 'bg-sky-900/60 text-sky-200 border-sky-500 shadow'
                    : 'bg-dark-950/80 border-steel-800 text-steel-400 hover:text-white'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" /> Trener
              </button>
              <button
                type="button"
                onClick={() => setRole('KIEROWNIK')}
                className={`py-2 px-2.5 rounded-xl text-xs font-athletic border transition flex items-center justify-center gap-1.5 ${
                  role === 'KIEROWNIK'
                    ? 'bg-amber-900/50 text-amber-200 border-amber-500 shadow'
                    : 'bg-dark-950/80 border-steel-800 text-steel-400 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" /> Kierownik
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-steel-300 mb-1">Imię i Nazwisko *</label>
              <div className="relative">
                <User className="w-4 h-4 text-steel-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="np. Karol Ordon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark-950/80 border border-steel-700/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-bone-100 placeholder-steel-600 focus:outline-none focus:border-steel-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-steel-300 mb-1">Adres e-mail *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-steel-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="twoj@email.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-950/80 border border-steel-700/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-bone-100 placeholder-steel-600 focus:outline-none focus:border-steel-400 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-steel-300 mb-1">Hasło *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-steel-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="Minimum 6 znaków"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-950/80 border border-steel-700/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-bone-100 placeholder-steel-600 focus:outline-none focus:border-steel-400 transition"
              />
            </div>
          </div>

          {role === 'ZAWODNIK' && (
            <div className="p-3.5 rounded-2xl bg-dark-950/80 border border-steel-800 space-y-3">
              <span className="text-[10px] font-athletic text-steel-300 uppercase tracking-wider block">
                Parametry Boiskowe
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-steel-400 mb-1">Numer koszulki</label>
                  <input
                    type="number"
                    placeholder="np. 17"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full bg-dark-900 border border-steel-700/80 rounded-xl px-3 py-1.5 text-xs text-bone-100 focus:outline-none focus:border-steel-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-steel-400 mb-1">Pozycja</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as PlayerPosition)}
                    className="w-full bg-dark-900 border border-steel-700/80 rounded-xl px-2.5 py-1.5 text-xs text-bone-100 focus:outline-none focus:border-steel-400"
                  >
                    <option value="Przyjmujący">Przyjmujący</option>
                    <option value="Atakujący">Atakujący</option>
                    <option value="Środkowy">Środkowy</option>
                    <option value="Rozgrywający">Rozgrywający</option>
                    <option value="Libero">Libero</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-steel-400 mb-1">Wzrost (cm)</label>
                  <input
                    type="number"
                    placeholder="np. 194"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-dark-900 border border-steel-700/80 rounded-xl px-3 py-1.5 text-xs text-bone-100 focus:outline-none focus:border-steel-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-steel-400 mb-1">Telefon</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-steel-500 absolute left-3 top-2" />
                    <input
                      type="tel"
                      placeholder="500 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-dark-900 border border-steel-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-bone-100 focus:outline-none focus:border-steel-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-athletic tracking-wider text-xs sm:text-sm bg-gradient-to-r from-steel-700 via-steel-600 to-steel-500 hover:from-steel-600 hover:to-steel-400 text-white shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
          >
            {loading ? 'Rejestrowanie...' : 'Zarejestruj konto'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-steel-800 text-center text-xs text-steel-400">
          Masz już konto w Angels ZTP?{' '}
          <Link href="/login" className="text-bone-100 font-bold hover:text-white underline underline-offset-4 ml-1">
            Zaloguj się
          </Link>
        </div>
      </div>
    </div>
  );
}
