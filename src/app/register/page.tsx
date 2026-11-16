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
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 relative overflow-hidden select-none">
      {/* Ambient glowing atmosphere */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-900/90 backdrop-blur-2xl border border-sky-500/30 rounded-3xl p-6 sm:p-9 shadow-2xl relative z-10 text-white space-y-6">
        
        {/* Athletic Crest & Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 p-1 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-amber-400 shadow-xl shadow-sky-500/20">
            <img
              src="/logo.jpg"
              alt="Angels ZTP"
              className="w-full h-full object-contain rounded-xl bg-slate-950"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-[10px] font-athletic tracking-widest uppercase">
            <Volleyball className="w-3 h-3 text-sky-400" />
            <span>Nowy Członek Drużyny</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black font-athletic tracking-wider uppercase text-white">
            Dołącz do Angels ZTP
          </h1>
          <p className="text-xs text-slate-400">Utwórz profil zawodnika lub sztabu trenerskiego</p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-bold animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Rola w drużynie */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-2 font-mono">
              Rola w zespole *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('ZAWODNIK')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'ZAWODNIK'
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-athletic'
                    : 'bg-slate-950/60 border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Volleyball className="w-3.5 h-3.5" /> Zawodnik
              </button>
              <button
                type="button"
                onClick={() => setRole('TRENER')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'TRENER'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-athletic'
                    : 'bg-slate-950/60 border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" /> Trener
              </button>
              <button
                type="button"
                onClick={() => setRole('KIEROWNIK')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'KIEROWNIK'
                    ? 'bg-purple-400 text-slate-950 border-purple-300 shadow-md font-athletic'
                    : 'bg-slate-950/60 border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Crown className="w-3.5 h-3.5" /> Kierownik
              </button>
            </div>
          </div>

          {/* Imię i Nazwisko oraz Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                Imię i Nazwisko *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="np. Karol Ordon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                Adres e-mail *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="twoj@angelsztp.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition"
                />
              </div>
            </div>
          </div>

          {/* Hasło */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
              Hasło *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="Minimum 6 znaków"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition"
              />
            </div>
          </div>

          {/* Parametry boiskowe dla zawodnika */}
          {role === 'ZAWODNIK' && (
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
              <span className="text-[10px] font-black font-athletic text-sky-300 uppercase tracking-widest block">
                Parametry Boiskowe
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Numer koszulki</label>
                  <input
                    type="number"
                    placeholder="np. 17"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Pozycja</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as PlayerPosition)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
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
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Wzrost (cm)</label>
                  <input
                    type="number"
                    placeholder="np. 194"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Telefon</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      placeholder="500 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-athletic tracking-wider text-xs sm:text-sm bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-slate-950 font-black shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer active:scale-[0.98]"
          >
            {loading ? 'Rejestrowanie profilu...' : 'Zarejestruj profil w Angels ZTP'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Masz już konto w zespole?{' '}
          <Link href="/login" className="text-sky-300 hover:text-white font-bold underline underline-offset-4 ml-1 transition">
            Zaloguj się
          </Link>
        </div>

      </div>
    </div>
  );
}
