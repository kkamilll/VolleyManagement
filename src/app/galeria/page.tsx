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
  AlertCircle,
  Upload,
  Layers,
  Sparkles
} from 'lucide-react';
import { LeaguePhoto, MatchResult, EventItem } from '@/lib/types';

function GaleriaContent() {
  const { user } = useAuth();
  const { isArchiveMode, activeSeason } = useSeasonArchive();

  const [photos, setPhotos] = useState<LeaguePhoto[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'MECZ' | 'SPARING' | 'TURNIEJ' | 'INNE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('ALL');

  // Lightbox modal state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Add Photos / Album modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [photoSeriesList, setPhotoSeriesList] = useState<{ url: string; caption?: string }[]>([]);
  const [albumTitle, setAlbumTitle] = useState('');
  const [photoMatch, setPhotoMatch] = useState('');
  const [photoCategory, setPhotoCategory] = useState<'MECZ' | 'SPARING' | 'TURNIEJ' | 'INNE'>('MECZ');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoSingleUrl, setPhotoSingleUrl] = useState('');
  const [linkedEventOrMatchId, setLinkedEventOrMatchId] = useState('');
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const canManage = Boolean(
    user && (user.role === 'KIEROWNIK' || user.role === 'TRENER' || user.isCaptain || user.permissions?.isAdmin)
  );

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const [leagueRes, matchesRes, eventsRes] = await Promise.all([
        fetch('/api/league'),
        fetch('/api/matches').catch(() => null),
        fetch('/api/events').catch(() => null)
      ]);

      if (leagueRes.ok) {
        const data = await leagueRes.json();
        setPhotos(data.leaguePhotos || []);
      }
      if (matchesRes && matchesRes.ok) {
        const m = await matchesRes.json();
        setMatches(m.matches || []);
      }
      if (eventsRes && eventsRes.ok) {
        const ev = await eventsRes.json();
        setEvents(ev.events || []);
      }
    } catch (err) {
      console.error('Błąd pobierania danych galerii:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Unique albums / series
  const uniqueAlbums = useMemo(() => {
    const map = new Map<string, { title: string; count: number; category: string }>();
    photos.forEach(p => {
      const key = p.seriesTitle || p.matchName;
      if (key) {
        const existing = map.get(key) || { title: key, count: 0, category: p.category || 'MECZ' };
        existing.count += 1;
        map.set(key, existing);
      }
    });
    return Array.from(map.values());
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) {
        return false;
      }
      if (selectedAlbum !== 'ALL') {
        const pAlbum = p.seriesTitle || p.matchName;
        if (pAlbum !== selectedAlbum) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesMatch = p.matchName?.toLowerCase().includes(q);
        const matchesCaption = p.caption?.toLowerCase().includes(q);
        const matchesSeries = p.seriesTitle?.toLowerCase().includes(q);
        return matchesTitle || matchesMatch || matchesCaption || matchesSeries;
      }
      return true;
    });
  }, [photos, categoryFilter, selectedAlbum, searchQuery]);

  // Client-side image resize and optimization
  const processPhotoFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setProcessingPhotos(true);
    setProcessingCount(files.length);

    const readFileAsCompressedBase64 = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1920;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.82);
              resolve(compressed);
            } else {
              resolve(e.target?.result as string);
            }
          };
          img.onerror = () => resolve(e.target?.result as string);
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    };

    try {
      const fileArray = Array.from(files);
      const newItems: { url: string; caption?: string }[] = [];
      for (const f of fileArray) {
        if (f.type.startsWith('image/')) {
          const b64 = await readFileAsCompressedBase64(f);
          newItems.push({ url: b64, caption: f.name.replace(/\.[^.]+$/, '') });
        }
      }
      setPhotoSeriesList(prev => [...prev, ...newItems]);
      if (!albumTitle && fileArray.length > 1) {
        setAlbumTitle(photoMatch ? `Album: ${photoMatch}` : 'Nowa fotorelacja');
      }
    } catch (err) {
      console.error('Błąd kompresji zdjęć:', err);
    } finally {
      setProcessingPhotos(false);
      setProcessingCount(0);
    }
  };

  const handleMultiplePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processPhotoFiles(e.target.files);
    }
  };

  const handleAddUrlToSeries = () => {
    if (!photoSingleUrl.trim()) return;
    const urls = photoSingleUrl
      .split(/\r?\n/)
      .map(u => u.trim())
      .filter(Boolean);

    const newItems = urls.map(url => ({ url }));
    setPhotoSeriesList(prev => [...prev, ...newItems]);
    setPhotoSingleUrl('');
  };

  const handleRemoveFromSeries = (idx: number) => {
    setPhotoSeriesList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photoSeriesList.length === 0 && !photoSingleUrl.trim()) {
      setStatusMsg({ text: 'Wybierz lub wklej przynajmniej jedno zdjęcie!', isError: true });
      return;
    }

    const allPhotos = [...photoSeriesList];
    if (photoSingleUrl.trim()) {
      allPhotos.push({ url: photoSingleUrl.trim() });
    }

    const effectiveTitle = albumTitle.trim() || photoMatch.trim() || 'Fotorelacja z meczu';

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_PHOTOS_BATCH',
          photos: allPhotos,
          seriesTitle: effectiveTitle,
          matchName: photoMatch.trim() || undefined,
          caption: photoCaption.trim() || undefined,
          category: photoCategory
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się dodać albumu');

      setStatusMsg({ text: `Pomyślnie dodano album (${allPhotos.length} zdjęć)!` });
      setPhotoSeriesList([]);
      setAlbumTitle('');
      setPhotoMatch('');
      setPhotoCaption('');
      setPhotoSingleUrl('');
      setLinkedEventOrMatchId('');
      setShowAddModal(false);
      await fetchPhotos();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Błąd zapisu albumu', isError: true });
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
    <div className="min-h-screen text-slate-800 pb-28 pt-4 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/20 text-sky-600 border border-sky-500/30">
              <Camera className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase font-athletic text-slate-900">
              Galeria Zdjęć & Fotorelacje
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Albumy i zdjęcia z meczów ligowych LALS, sparingów oraz wydarzeń Angels ZTP.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md shadow-amber-500/20 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Dodaj Album / Zdjęcia</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'Wszystkie', count: photos.length },
            { id: 'MECZ', label: 'Liga LALS', count: photos.filter((p) => p.category === 'MECZ').length },
            { id: 'SPARING', label: 'Sparingi', count: photos.filter((p) => p.category === 'SPARING').length },
            { id: 'TURNIEJ', label: 'Turnieje', count: photos.filter((p) => p.category === 'TURNIEJ').length },
            { id: 'INNE', label: 'Klub / Inne', count: photos.filter((p) => p.category === 'INNE').length }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategoryFilter(cat.id as any);
                setSelectedAlbum('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                categoryFilter === cat.id
                  ? 'bg-sky-600 text-white font-black shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  categoryFilter === cat.id ? 'bg-white/20 text-white font-black' : 'bg-slate-100 text-slate-600'
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
            placeholder="Szukaj po albumie, meczu, tytule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition shadow-2xs"
          />
        </div>
      </div>

      {/* Album Badges Horizontal Scroll if albums exist */}
      {uniqueAlbums.length > 0 && (
        <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Albumy z Meczów ({uniqueAlbums.length}):</span>
            </span>
            {selectedAlbum !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedAlbum('ALL')}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 underline"
              >
                Pokaż wszystkie zdjęcia
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedAlbum('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 border ${
                selectedAlbum === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              Wszystkie albumy
            </button>
            {uniqueAlbums.map(album => (
              <button
                key={album.title}
                onClick={() => setSelectedAlbum(album.title)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 flex items-center gap-1.5 border ${
                  selectedAlbum === album.title
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-2xs font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{album.title}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/70 text-slate-800 font-mono">
                  {album.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 space-y-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Wczytywanie galerii...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center mx-auto border border-sky-500/30">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900">Brak zdjęć w tym albumie lub kategorii</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? 'Nie znaleziono zdjęć pasujących do wpisanej frazy.'
              : 'Sztab trenerski i zawodnicy mogą dodawać całe serie zdjęć z meczów.'}
          </p>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Dodaj pierwszy album / zdjęcia
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
              className="bg-white rounded-2xl overflow-hidden group cursor-pointer border border-slate-200 hover:border-sky-500 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="relative aspect-video sm:aspect-square bg-slate-100 overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.jpg';
                  }}
                />

                {/* Badge Category & Album */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-md text-amber-300 border border-white/20">
                    {photo.category === 'MECZ'
                      ? 'Liga LALS'
                      : photo.category === 'SPARING'
                      ? 'Sparing'
                      : photo.category === 'TURNIEJ'
                      ? 'Turniej'
                      : 'Klub'}
                  </span>
                  {photo.seriesTitle && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-950/80 backdrop-blur-md text-white border border-white/15 max-w-[150px] truncate flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                      <span className="truncate">{photo.seriesTitle}</span>
                    </span>
                  )}
                </div>

                {/* Delete button (for managers) */}
                {canManage && (
                  <button
                    onClick={(e) => handleDeletePhoto(photo.id, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-rose-600 text-white transition opacity-0 group-hover:opacity-100 shadow"
                    title="Usuń zdjęcie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Photo Caption / Details */}
              <div className="p-3 space-y-1">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">{photo.title}</h4>
                {photo.matchName && (
                  <p className="text-[11px] text-sky-700 font-bold truncate flex items-center gap-1">
                    <Volleyball className="w-3 h-3 shrink-0 text-sky-600" />
                    <span>{photo.matchName}</span>
                  </p>
                )}
                {photo.caption && (
                  <p className="text-[11px] text-slate-500 line-clamp-2">{photo.caption}</p>
                )}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{photo.date}</span>
                  {photo.uploadedBy && <span className="truncate max-w-[130px] font-medium">{photo.uploadedBy}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {currentPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-fadeIn"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/40 text-xs font-mono font-bold shadow-xs">
                {selectedPhotoIndex! + 1} / {filteredPhotos.length}
              </span>
              <div className="truncate max-w-xs sm:max-w-md">
                <h3 className="text-sm sm:text-base font-black truncate text-white tracking-wide">
                  {currentPhoto.title}
                </h3>
                {currentPhoto.seriesTitle && (
                  <p className="text-[10px] text-sky-300 truncate">Album: {currentPhoto.seriesTitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={currentPhoto.url}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white hover:text-sky-300 hover:border-sky-400 transition shadow-sm"
                title="Pobierz w pełnym rozmiarze"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => setSelectedPhotoIndex(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white hover:text-rose-400 hover:border-rose-400 transition shadow-sm"
                title="Zamknij"
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
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-slate-900/80 hover:bg-sky-600 text-white border border-white/25 transition shadow-lg z-20"
                aria-label="Poprzednie"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
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
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-slate-900/80 hover:bg-sky-600 text-white border border-white/25 transition shadow-lg z-20"
                aria-label="Następne"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          {/* Bottom Bar: Caption & Meta */}
          <div className="bg-slate-900/90 border border-white/20 rounded-2xl p-3 sm:p-4 text-xs space-y-1 max-w-3xl mx-auto w-full backdrop-blur-md shadow-2xl text-white" onClick={(e) => e.stopPropagation()}>
            {currentPhoto.caption && <p className="text-slate-100 font-medium">{currentPhoto.caption}</p>}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10">
              <span className="text-sky-300 font-bold">{currentPhoto.matchName ? `Mecz: ${currentPhoto.matchName}` : 'Wydarzenie klubowe'}</span>
              <span>Data: {currentPhoto.date} {currentPhoto.uploadedBy ? `• Dodał: ${currentPhoto.uploadedBy}` : ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DODAJ ALBUM / SERIĘ ZDJĘĆ Z MECZU (DRAG & DROP, MULTI-UPLOAD) */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-xl border border-slate-200 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 uppercase">Dodaj Album / Fotorelację z Meczu</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {statusMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusMsg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                {statusMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveAlbum} className="space-y-4">
              {/* Tytuł albumu & Kategoria */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nazwa albumu / fotorelacji *
                  </label>
                  <input
                    type="text"
                    placeholder="np. Mecz ligowy LALS vs Gladiatorzy BUD-WENT"
                    required
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                {/* Typ wydarzenia */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kategoria wydarzenia *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'MECZ', label: 'Mecz LALS', color: 'sky' },
                      { id: 'SPARING', label: 'Sparing', color: 'amber' },
                      { id: 'TURNIEJ', label: 'Turniej', color: 'purple' },
                      { id: 'INNE', label: 'Klub / Trening', color: 'slate' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setPhotoCategory(cat.id as any)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase transition border ${
                          photoCategory === cat.id
                            ? cat.color === 'sky'
                              ? 'bg-sky-100 text-sky-900 border-sky-400 shadow-xs'
                              : cat.color === 'amber'
                              ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs'
                              : cat.color === 'purple'
                              ? 'bg-purple-100 text-purple-900 border-purple-400 shadow-xs'
                              : 'bg-slate-800 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Powiąż z meczem z terminarza */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Powiąż z meczem / rywalem (opcjonalnie)
                  </label>
                  <select
                    value={linkedEventOrMatchId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      setLinkedEventOrMatchId(selId);
                      if (selId) {
                        const matchedMatch = matches.find(m => m.id === selId);
                        const matchedEvt = events.find(ev => ev.id === selId);
                        if (matchedMatch) {
                          const mTitle = `Angels ZTP vs ${matchedMatch.opponent}`;
                          setPhotoMatch(mTitle);
                          if (!albumTitle) setAlbumTitle(`Fotorelacja: ${mTitle}`);
                        } else if (matchedEvt) {
                          setPhotoMatch(matchedEvt.title);
                          if (!albumTitle) setAlbumTitle(`Album: ${matchedEvt.title}`);
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value="">-- Wybierz z kalendarza lub wpisz własną nazwę poniżej --</option>
                    {matches.length > 0 && (
                      <optgroup label="🏐 Mecze z terminarza">
                        {matches.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.date.slice(0, 10)} — {m.matchType || 'Mecz'}: Angels vs {m.opponent}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {events.length > 0 && (
                      <optgroup label="📅 Wydarzenia z kalendarza">
                        {events.map(ev => (
                          <option key={ev.id} value={ev.id}>
                            {ev.date.slice(0, 10)} — [{ev.type}] {ev.title}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* DRAG & DROP MULTI-PHOTO UPLOAD ZONE */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>Wybierz lub przeciągnij zdjęcia do albumu (Drag & Drop) *</span>
                  </label>
                  {photoSeriesList.length > 0 && (
                    <span className="text-[11px] font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Do wgrania: {photoSeriesList.length} {photoSeriesList.length === 1 ? 'zdjęcie' : photoSeriesList.length < 5 ? 'zdjęcia' : 'zdjęć'}
                    </span>
                  )}
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingPhotos(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingPhotos(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingPhotos(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingPhotos(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      processPhotoFiles(e.dataTransfer.files);
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed transition duration-200 text-center mb-2.5 ${
                    isDraggingPhotos
                      ? 'border-amber-500 bg-amber-50/90 text-amber-950 scale-[1.01] shadow-md ring-4 ring-amber-200'
                      : 'border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    id="galeria-multi-upload"
                    className="hidden"
                    onChange={handleMultiplePhotosUpload}
                  />
                  <label htmlFor="galeria-multi-upload" className="cursor-pointer w-full flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition ${
                      isDraggingPhotos ? 'bg-amber-500 text-slate-950 scale-110 shadow-md' : 'bg-white border border-slate-200 text-amber-600 shadow-2xs'
                    }`}>
                      <Upload className="w-6 h-6 stroke-[2.5]" />
                    </div>

                    <span className="text-sm font-black text-slate-900 block">
                      {isDraggingPhotos 
                        ? '👉 Upuść zdjęcia tutaj teraz!' 
                        : 'Przeciągnij tutaj kilkanaście zdjęć naraz (Drag & Drop)'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      lub kliknij, aby zaznaczyć serię zdjęć z telefonu / komputera (JPG, PNG, WebP)
                    </span>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        ⚡ Wgrywanie wielu zdjęć naraz
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
                        🔍 Automatyczna optymalizacja wagi
                      </span>
                    </div>
                  </label>

                  {processingPhotos && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center z-10 space-y-2 p-4 shadow-inner">
                      <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-black text-slate-900 font-mono">
                        Wczytywanie i optymalizacja {processingCount} zdjęć...
                      </span>
                      <span className="text-[10px] text-slate-500">Kompresujemy zdjęcia w locie, aby nie obciążały pamięci telefonu</span>
                    </div>
                  )}
                </div>

                {/* Miniatury wczytanych zdjęć w serii */}
                {photoSeriesList.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        Miniatury w albumie ({photoSeriesList.length} szt.):
                      </span>
                      <button
                        type="button"
                        onClick={() => setPhotoSeriesList([])}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
                      >
                        Wyczyść wszystkie
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                      {photoSeriesList.map((item, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-300 bg-white shadow-2xs">
                          <img src={item.url} alt={`Podgląd ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveFromSeries(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center opacity-85 hover:opacity-100 transition shadow"
                            title="Usuń z albumu"
                          >
                            ✕
                          </button>
                          <span className="absolute bottom-1 left-1 text-[9px] font-mono font-bold text-white bg-slate-950/75 px-1 py-0.2 rounded">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alternatywa: wklejenie linków URL */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>LUB wklej linki do zdjęć (np. z Imgur / Google):</span>
                    {photoSingleUrl.trim() && (
                      <button
                        type="button"
                        onClick={handleAddUrlToSeries}
                        className="text-amber-600 font-bold hover:underline"
                      >
                        + Dodaj linki do listy
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="https://... (lub wklej link ze schowka)"
                    value={photoSingleUrl}
                    onChange={(e) => setPhotoSingleUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Opis albumu / notatka (opcjonalnie)
                </label>
                <textarea
                  rows={2}
                  placeholder="np. Zdjęcia z 5-setowego boju w hali w Luboniu, świetna gra blokiem..."
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white resize-none transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (photoSeriesList.length === 0 && !photoSingleUrl.trim())}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider disabled:opacity-50 transition shadow-md shadow-amber-500/20"
                >
                  {isSubmitting
                    ? 'Zapisywanie...'
                    : photoSeriesList.length > 1
                    ? `Zapisz cały album (${photoSeriesList.length} zdjęć)`
                    : 'Zapisz album / zdjęcie'}
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
        <div className="min-h-screen flex items-center justify-center text-slate-500">
          Ładowanie galerii...
        </div>
      }
    >
      <GaleriaContent />
    </Suspense>
  );
}
