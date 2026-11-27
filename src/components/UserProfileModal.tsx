'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { PlayerPosition } from '@/lib/types';
import {
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Ruler,
  Hash,
  Shield,
  Volleyball,
  LogOut,
  CreditCard,
  Calendar,
  Users,
  ExternalLink,
  Crown,
  Flame,
  Save,
  KeyRound
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, refreshUser, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [number, setNumber] = useState<string>('');
  const [position, setPosition] = useState<PlayerPosition>('Przyjmujący');
  const [phone, setPhone] = useState('');
  const [height, setHeight] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);

  // Status states
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password change states
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state whenever modal opens or user changes
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setNumber(user.number ? String(user.number) : '');
      setPosition((user.position as PlayerPosition) || 'Przyjmujący');
      setPhone(user.phone || '');
      setHeight(user.height ? String(user.height) : '');
      setAvatarPreview(user.avatar || '');
      setAvatarUrlInput(user.avatar && !user.avatar.startsWith('data:') ? user.avatar : '');
      setErrorMsg(null);
      setSuccessMsg(null);
      setShowUrlField(false);
      setShowPasswordBox(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwError(null);
      setPwSuccess(null);
    }
  }, [user, isOpen]);

  if (!mounted || !isOpen || !user) return null;

  const isSuperAdminUser =
    Boolean((user as { isSuperAdmin?: boolean }).isSuperAdmin) ||
    user.id === 'platform_superadmin';

  const handleChangePassword = async () => {
    setPwError(null);
    setPwSuccess(null);
    if (!currentPassword || !newPassword) {
      setPwError('Wypełnij obecne i nowe hasło.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Nowe hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Nowe hasła nie są identyczne.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || 'Nie udało się zmienić hasła.');
        return;
      }
      setPwSuccess('✓ Hasło zostało zmienione!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPwError('Błąd połączenia z serwerem.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle image file selection with client-side compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Wybrany plik musi być obrazem (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Plik jest zbyt duży (maksymalnie 10 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarPreview(compressed);
          setErrorMsg(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Imię i nazwisko jest wymagane');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const chosenAvatar = avatarUrlInput.trim() && !showUrlField
        ? avatarUrlInput.trim()
        : avatarPreview;

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name: name.trim(),
          number: number ? Number(number) : null,
          position: position,
          phone: phone.trim() || undefined,
          height: height ? Number(height) : null,
          avatar: chosenAvatar || ''
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Błąd zapisu profilu');
      }

      await refreshUser();
      setSuccessMsg('✓ Profil został zaktualizowany pomyślnie!');

      setTimeout(() => {
        onClose();
      }, 1100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Wystąpił błąd podczas zapisywania');
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-800 space-y-5 my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition"
          aria-label="Zamknij"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0 shadow-2xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight font-athletic uppercase">
              Mój Profil Zawodnika
            </h3>
            <p className="text-xs text-slate-500">
              Edycja danych, pozycji na boisku i zdjęcia profilowego
            </p>
          </div>
        </div>

        {/* Hero Card: Avatar & Quick Badges */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-50 to-sky-50/40 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
          {/* Avatar with Camera upload trigger */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl ring-2 ring-sky-200 bg-slate-100 flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-3xl flex items-center justify-center">
                  {name.charAt(0) || user.name.charAt(0)}
                </div>
              )}
            </div>

            <input
              type="file"
              id="user-profile-avatar-upload"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="user-profile-avatar-upload"
              className="absolute -bottom-1.5 -right-1.5 p-2 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white shadow-lg cursor-pointer transition transform hover:scale-105"
              title="Zmień zdjęcie z telefonu lub komputera"
            >
              <Camera className="w-4 h-4" />
            </label>
          </div>

          {/* User Quick Info */}
          <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {name || user.name}
              </span>
              {number && (
                <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono font-black text-xs text-slate-800 shadow-2xs">
                  #{number}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
              {user.isCaptain && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                  <Crown className="w-3 h-3 text-amber-700" />
                  Kapitan
                </span>
              )}
              {user.role === 'KIEROWNIK' && !user.isCaptain && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                  <Crown className="w-3 h-3 text-amber-700" />
                  Kierownik
                </span>
              )}
              {user.role === 'TRENER' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1 shadow-2xs">
                  <Flame className="w-3 h-3 text-sky-600" />
                  Trener
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                {position}
              </span>
            </div>

            {/* Photo Action Buttons */}
            <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <label
                htmlFor="user-profile-avatar-upload"
                className="px-3 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-sky-700 text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5 text-sky-600" />
                <span>Zmień zdjęcie</span>
              </label>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview('');
                    setAvatarUrlInput('');
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-600 text-xs font-bold transition shadow-2xs"
                >
                  Usuń
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowUrlField(!showUrlField)}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
              >
                {showUrlField ? 'Ukryj link URL' : 'Lub link URL'}
              </button>
            </div>
          </div>
        </div>

        {/* Optional URL input field */}
        {showUrlField && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 animate-fadeIn">
            <label className="block text-[11px] font-bold text-slate-600">
              Bezpośredni link URL do zdjęcia:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={avatarUrlInput}
                onChange={e => {
                  setAvatarUrlInput(e.target.value);
                  setAvatarPreview(e.target.value);
                }}
                placeholder="https://... /zdjecie.jpg"
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Imię i nazwisko *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-sky-500 transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Jersey Number */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Numer na koszulce (#)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  placeholder="np. 17"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-sky-500 transition"
                />
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Court Position */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Pozycja na boisku
              </label>
              <div className="relative">
                <select
                  value={position}
                  onChange={e => setPosition(e.target.value as PlayerPosition)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-sky-500 transition appearance-none cursor-pointer"
                >
                  <option value="Przyjmujący">Przyjmujący</option>
                  <option value="Atakujący">Atakujący</option>
                  <option value="Rozgrywający">Rozgrywający</option>
                  <option value="Środkowy">Środkowy</option>
                  <option value="Libero">Libero</option>
                  <option value="Sztab trenerski">Sztab trenerski</option>
                  <option value="Zarząd">Zarząd</option>
                </select>
                <Volleyball className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Numer telefonu
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+48 600 000 000"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Height */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Wzrost (cm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="140"
                  max="230"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  placeholder="np. 192 (opcjonalnie)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 transition"
                />
                <Ruler className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Adres e-mail (Login)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Password Change Section */}
          {!isSuperAdminUser && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordBox((v) => !v);
                  setPwError(null);
                  setPwSuccess(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between transition cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Zmień hasło do konta</span>
                </span>
                <span className="text-[11px] text-slate-400">{showPasswordBox ? 'Zwiń' : 'Rozwiń'}</span>
              </button>

              {showPasswordBox && (
                <div className="mt-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  {pwError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                      {pwError}
                    </div>
                  )}
                  {pwSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                      {pwSuccess}
                    </div>
                  )}
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Obecne hasło"
                    className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nowe hasło (min. 6 znaków)"
                      className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Powtórz nowe hasło"
                      className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={changingPassword}
                    onClick={handleChangePassword}
                    className="w-full h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black uppercase tracking-wider text-[11px] transition cursor-pointer disabled:opacity-50"
                  >
                    {changingPassword ? 'Zmienianie hasła...' : 'Zapisz nowe hasło'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
              title="Wyloguj się ze swojego konta"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Wyloguj</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 font-bold transition"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black uppercase tracking-wider text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Zapisywanie...' : 'Zapisz Zmiany'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

