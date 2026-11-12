'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import {
  Camera,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Volleyball,
  Trophy,
  Swords,
  Search,
  Download,
  Share2,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { LeaguePhoto } from '@/lib/types';

function GaleriaContent() {
  const { user } = useAuth();
  const { isArchiveMode, activeSeason } = useSeasonArchive();

  const [photos, setPhotos] = useState<LeaguePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'MECZ' | 'SPARING' | 'TURNIEJ' | 'INNE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox modal state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Add Photo modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoMatch, setNewPhotoMatch] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState<'MECZ' | 'SPARING' | 'TURNIEJ' | 'INNE'>('MECZ');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const canManage = Boolean(
    user && (user.role === 'KIEROWNIK' || user.role === 'TRENER' || user.isCaptain || user.permissions?.isAdmin)
  );

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/league');
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.leaguePhotos || []);
      }
    } catch (err) {
      console.error('Błąd pobierania zdjęć:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesMatch = p.matchName?.toLowerCase().includes(q);
        const matchesCaption = p.caption?.toLowerCase().includes(q);
        return matchesTitle || matchesMatch || matchesCaption;
      }
      return true;
    });
  }, [photos, categoryFilter, searchQuery]);

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim() || !newPhotoTitle.trim()) {
      setStatusMsg({ text: 'Podaj link do zdjęcia i tytuł!', isError: true });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_PHOTO',
          url: newPhotoUrl.trim(),
          title: newPhotoTitle.trim(),
          matchName: newPhotoMatch.trim() || undefined,
          caption: newPhotoCaption.trim() || undefined,
          category: newPhotoCategory
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się dodać zdjęcia');

      setStatusMsg({ text: 'Zdjęcie dodane pomyślnie!' });
      setNewPhotoUrl('');
      setNewPhotoTitle('');
      setNewPhotoMatch('');
      setNewPhotoCaption('');
      setShowAddModal(false);
      fetchPhotos();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Błąd dodawania zdjęcia', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Czy na pewno chcesz usunąć to zdjęcie z galerii?')) return;

    try {
      const res = await fetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_PHOTO',
          photoId
        })
      });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        if (selectedPhotoIndex !== null) setSelectedPhotoIndex(null);
      }
    } catch (err) {
      console.error('Błąd usuwania zdjęcia:', err);
    }
  };

  const currentPhoto = selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;

  const showPrev = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const showNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < filteredPhotos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'Escape') setSelectedPhotoIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, filteredPhotos]);

  return (
    <div className="min-h-screen text-slate-100 pb-28 pt-4 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Camera className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase font-athletic text-white">
              Galeria Zdjęć Drużyny
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Zdjęcia z meczów ligowych, sparingów i wydarzeń Angels ZTP.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md shadow-sky-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj zdjęcie</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'Wszystkie', count: photos.length },
            { id: 'MECZ', label: 'Liga', count: photos.filter((p) => p.category === 'MECZ').length },
            { id: 'SPARING', label: 'Sparingi', count: photos.filter((p) => p.category === 'SPARING').length },
            { id: 'TURNIEJ', label: 'Turnieje', count: photos.filter((p) => p.category === 'TURNIEJ').length },
            { id: 'INNE', label: 'Klub / Inne', count: photos.filter((p) => p.category === 'INNE').length }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                categoryFilter === cat.id
                  ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  categoryFilter === cat.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj po meczu, tytule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Wczytywanie galerii...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        /* Empty State */
        <div className="cyber-card rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/30">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-white">Brak zdjęć w tej kategorii</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? 'Nie znaleziono zdjęć pasujących do wyszukiwania.'
              : 'Sztab trenerski może dodawać zdjęcia z meczów, sparingów i turniejów.'}
          </p>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              Dodaj pierwsze zdjęcie
            </button>
          )}
        </div>
      ) : (
        /* Photos Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhotoIndex(idx)}
              className="cyber-card rounded-2xl overflow-hidden group cursor-pointer border border-slate-700/60 hover:border-sky-500/50 transition flex flex-col justify-between"
            >
              <div className="relative aspect-video sm:aspect-square bg-slate-950 overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.jpg';
                  }}
                />

                {/* Badge Category */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-sky-300 border border-sky-500/30">
                    {photo.category === 'MECZ'
                      ? 'Liga'
                      : photo.category === 'SPARING'
                      ? 'Sparing'
                      : photo.category === 'TURNIEJ'
                      ? 'Turniej'
                      : 'Klub'}
                  </span>
                </div>

                {/* Delete button (for managers) */}
                {canManage && (
                  <button
                    onClick={(e) => handleDeletePhoto(photo.id, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-500 text-slate-300 hover:text-white transition opacity-0 group-hover:opacity-100"
                    title="Usuń zdjęcie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Photo Caption / Details */}
              <div className="p-3 space-y-1">
                <h4 className="text-xs sm:text-sm font-black text-white truncate">{photo.title}</h4>
                {photo.matchName && (
                  <p className="text-[11px] text-sky-400 font-bold truncate flex items-center gap-1">
                    <Volleyball className="w-3 h-3 shrink-0" />
                    <span>{photo.matchName}</span>
                  </p>
                )}
                {photo.caption && (
                  <p className="text-[11px] text-slate-400 line-clamp-2">{photo.caption}</p>
                )}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{photo.date}</span>
                  {photo.uploadedBy && <span className="truncate max-w-[120px]">{photo.uploadedBy}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {currentPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-fadeIn"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">
                {selectedPhotoIndex! + 1} / {filteredPhotos.length}
              </span>
              <h3 className="text-sm sm:text-base font-black truncate max-w-xs sm:max-w-md">
                {currentPhoto.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={currentPhoto.url}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-sky-500 transition"
                title="Pobierz w pełnym rozmiarze"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => setSelectedPhotoIndex(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-rose-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Photo View with Prev / Next */}
          <div className="relative flex-1 flex items-center justify-center my-3" onClick={(e) => e.stopPropagation()}>
            {selectedPhotoIndex! > 0 && (
              <button
                onClick={showPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-slate-700 transition"
                aria-label="Poprzednie"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <img
              src={currentPhoto.url}
              alt={currentPhoto.title}
              className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />

            {selectedPhotoIndex! < filteredPhotos.length - 1 && (
              <button
                onClick={showNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-slate-700 transition"
                aria-label="Następne"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Bottom Bar: Caption & Meta */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 text-xs space-y-1 max-w-3xl mx-auto w-full" onClick={(e) => e.stopPropagation()}>
            {currentPhoto.caption && <p className="text-slate-200">{currentPhoto.caption}</p>}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
              <span>{currentPhoto.matchName ? `Mecz: ${currentPhoto.matchName}` : 'Wydarzenie klubowe'}</span>
              <span>Data: {currentPhoto.date} {currentPhoto.uploadedBy ? `• Dodał: ${currentPhoto.uploadedBy}` : ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="cyber-card rounded-3xl p-5 sm:p-6 w-full max-w-lg border border-slate-700 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-black text-white uppercase">Dodaj zdjęcie do galerii</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {statusMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusMsg.isError
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                }`}
              >
                {statusMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleAddPhoto} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Link URL do zdjęcia *
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  required
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Wklej bezpośredni link do zdjęcia (np. Imgur, Postimages, Dysk Google lub adres z www).
                </p>
              </div>

              {/* Preview if url entered */}
              {newPhotoUrl.trim() && (
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <p className="text-[10px] text-slate-400 mb-1">Podgląd zdjęcia:</p>
                  <img
                    src={newPhotoUrl}
                    alt="Podgląd"
                    className="max-h-36 mx-auto rounded-lg object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.jpg';
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tytuł zdjęcia *
                  </label>
                  <input
                    type="text"
                    placeholder="np. Skuteczny blok w 3. secie"
                    required
                    value={newPhotoTitle}
                    onChange={(e) => setNewPhotoTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kategoria
                  </label>
                  <select
                    value={newPhotoCategory}
                    onChange={(e) => setNewPhotoCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="MECZ">Mecz ligowy</option>
                    <option value="SPARING">Mecz sparingowy</option>
                    <option value="TURNIEJ">Turniej</option>
                    <option value="INNE">Klub / Trening</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mecz / Rywal (opcjonalnie)
                </label>
                <input
                  type="text"
                  placeholder="np. Gladiatorzy BUD-WENT"
                  value={newPhotoMatch}
                  onChange={(e) => setNewPhotoMatch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Krótki opis / Podpis (opcjonalnie)
                </label>
                <textarea
                  rows={2}
                  placeholder="np. Świetna asekuracja w końcówce..."
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Zapisywanie...' : 'Zapisz zdjęcie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GaleriaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          Ładowanie galerii...
        </div>
      }
    >
      <GaleriaContent />
    </Suspense>
  );
}
