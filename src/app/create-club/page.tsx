'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Volleyball,
  Building2,
  MapPin,
  Trophy,
  Palette,
  User,
  Mail,
  Lock,
  Upload,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { CLUB_THEMES, ClubTheme } from '@/lib/club-types';
import { useAuth } from '@/context/AuthContext';
import { useClub } from '@/context/ClubContext';

export default function CreateClubPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { refreshClub, isSuperAdmin, loadingClub } = useClub();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [themeId, setThemeId] = useState<ClubTheme['id']>('navy-gold');

  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedTheme = CLUB_THEMES.find((t) => t.id === themeId) || CLUB_THEMES[0];

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          city,
          leagueName,
          logoUrl,
          themeId,
          ownerName,
          ownerEmail,
          ownerPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Nie udało się utworzyć klubu');
        return;
      }

      await refreshClub();
      router.push('/superadmin');
      router.refresh();
    } catch {
      setError('Błąd połączenia z serwerem');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loadingClub && !isSuperAdmin) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
        <Building2 className="w-12 h-12 text-amber-600" />
        <h1 className="text-xl font-black uppercase text-slate-900">Tylko dla Administratora Portalu</h1>
        <p className="text-sm text-slate-600 max-w-md">
          Nowe kluby i drużyny w portalu może zakładać wyłącznie Administrator. Jeśli chcesz dołączyć do swojej drużyny, użyj kodu zaproszenia od trenera.
        </p>
        <div className="flex items-center gap-2">
          <Link href="/register" className="h-10 px-4 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs uppercase inline-flex items-center">
            Dołącz kodem
          </Link>
          <Link href="/portal" className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs inline-flex items-center">
            Wróć do portalu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/portal"
          className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Wróć do portalu</span>
        </Link>
        <Link
          href="/login"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 underline underline-offset-2"
        >
          Masz już konto? Zaloguj się
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6"
        >
          <div className="space-y-1.5 border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nowa Drużyna w Portalu</span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight font-athletic text-slate-900">
              Załóż własny panel klubu
            </h1>
            <p className="text-xs text-slate-500">
              Otrzymasz w pełni niezależną bazę danych, własny kod zaproszenia dla zawodników i pełny dostęp do wszystkich modułów.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          {/* 1. Club Details */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>1. Dane Drużyny / Klubu</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nazwa drużyny *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. KS Metro Warszawa, Volley Poznań..."
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Miasto *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="np. Warszawa"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rozgrywki / Liga</label>
                <div className="relative">
                  <Trophy className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    placeholder="np. I Liga Amatorska"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Theme Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-600" />
                <span>Barwy klubowe</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CLUB_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeId(t.id)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                      themeId === t.id
                        ? 'border-slate-900 ring-2 ring-amber-400/50 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: t.primaryHex }} />
                      <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: t.accentHex }} />
                    </div>
                    <div className="text-[10px] font-bold text-slate-700 truncate">{t.label.split(' ')[0]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Logo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Herb / Logo drużyny (opcjonalnie)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Wgraj plik</span>
                  <input type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />
                </label>
                <input
                  type="text"
                  value={logoUrl.startsWith('data:') ? '' : logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="lub wklej link URL do herbu..."
                  className="flex-1 h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* 2. Manager / Admin Account */}
          <div className="space-y-3.5 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-600" />
              <span>2. Konto Administratora / Kierownika Drużyny</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Imię i nazwisko *</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="np. Jan Kowalski"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adres e-mail (login) *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="trener@twojklub.pl"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hasło (min. 6 znaków) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Tworzenie klubu...' : 'Utwórz Klub i Wejdź do Panelu'}</span>
          </button>
        </form>

        {/* Live Preview Card */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className={`h-2 w-full bg-gradient-to-r ${selectedTheme.ribbonClass}`} />
            <div className="p-6 space-y-4">
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Podgląd Twojego Klubu
              </div>

              <div className="flex items-center gap-3.5">
                <div className={`w-14 h-14 rounded-2xl ${selectedTheme.badgeBgClass} ${selectedTheme.badgeTextClass} flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 shadow-sm`}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Volleyball className="w-7 h-7" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-black uppercase tracking-tight font-athletic text-slate-900 truncate">
                    {name.trim() || 'Nazwa Twojej Drużyny'}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 truncate">
                    {city.trim() || 'Miasto'} • {leagueName.trim() || 'Liga Amatorska'}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
                <div className="font-black text-slate-800 uppercase text-[11px]">Co otrzymujesz od razu:</div>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>W pełni odseparowana baza danych drużyny</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Unikalny kod zaproszenia dla zawodników</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Terminarz, Taktyka, Treningi, Rozgrywki, Składki</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
