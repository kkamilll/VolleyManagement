'use client';

import React, { useState } from 'react';
import { 
  Shield, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  X, 
  Check, 
  Sparkles,
  AlertCircle,
  Plus
} from 'lucide-react';
import { TeamCrestBadge } from '@/lib/team-crests';

interface TeamCrestModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamCrests: Record<string, string>;
  knownTeams?: string[];
  onCrestUpdated: (teamName: string, logoUrl?: string) => void;
}

export default function TeamCrestModal({
  isOpen,
  onClose,
  teamCrests,
  knownTeams = [],
  onCrestUpdated
}: TeamCrestModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [customTeamName, setCustomTeamName] = useState<string>('');
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Unified list of team names (known teams + teams already in teamCrests, excluding Angels ZTP)
  const allTeamNames = Array.from(
    new Set([
      ...knownTeams,
      ...Object.keys(teamCrests)
    ])
  ).filter(t => !t.toLowerCase().includes('angels') && t.trim().length > 0)
   .sort((a, b) => a.localeCompare(b, 'pl'));

  const effectiveTeamName = selectedTeam === '__custom__' ? customTeamName.trim() : (selectedTeam || customTeamName).trim();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Wybierz plik graficzny (PNG, JPG, WEBP, SVG)');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
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
          const compressed = canvas.toDataURL('image/png');
          setLogoPreview(compressed);
        } else {
          setLogoPreview(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveTeamName) {
      setErrorMsg('Wybierz lub wpisz nazwę drużyny');
      return;
    }

    const effectiveLogo = logoMode === 'upload' ? logoPreview : logoUrl.trim();
    if (!effectiveLogo) {
      setErrorMsg('Wybierz plik graficzny lub wklej adres URL herbu');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_TEAM_CREST',
          teamName: effectiveTeamName,
          logoUrl: effectiveLogo
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Błąd zapisu herbu');
      }

      setSuccessMsg(`Zapisano herb dla "${effectiveTeamName}"!`);
      onCrestUpdated(effectiveTeamName, effectiveLogo);
      setLogoPreview('');
      setLogoUrl('');
      setCustomTeamName('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Wystąpił błąd podczas zapisywania');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCrest = async (teamName: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć herb drużyny "${teamName}"?`)) return;

    try {
      const res = await fetch('/api/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_TEAM_CREST',
          teamName
        })
      });

      if (res.ok) {
        onCrestUpdated(teamName, undefined);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200 shadow-2xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 font-athletic uppercase">
                Herby Drużyn i Rywali
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Dodawaj i edytuj oficjalne herby przeciwników w terminarzu, lidze i tabelach
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Formularz dodawania / aktualizacji herbu */}
          <form onSubmit={handleSave} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 font-athletic flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-sky-600" />
                Dodaj lub Zmień Herb
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                Format: PNG, JPG, SVG
              </span>
            </div>

            {/* Wybór drużyny */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Wybierz drużynę lub wpisz nową:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={selectedTeam}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTeam(val);
                    if (val && val !== '__custom__' && teamCrests[val]) {
                      setLogoPreview(teamCrests[val]);
                    } else if (val === '__custom__') {
                      setLogoPreview('');
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500 shadow-2xs"
                >
                  <option value="">-- Wybierz drużynę z listy --</option>
                  {allTeamNames.map(team => (
                    <option key={team} value={team}>
                      {team} {teamCrests[team] ? '✓ (ma herb)' : ''}
                    </option>
                  ))}
                  <option value="__custom__">+ Inna drużyna (wpisz ręcznie)...</option>
                </select>

                {(selectedTeam === '__custom__' || allTeamNames.length === 0) && (
                  <input
                    type="text"
                    value={customTeamName}
                    onChange={(e) => setCustomTeamName(e.target.value)}
                    placeholder="Wpisz nazwę drużyny / rywala..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                )}
              </div>
            </div>

            {/* Przełącznik: Plik z urządzenia / Link URL */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLogoMode('upload')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    logoMode === 'upload'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Prześlij plik z telefonu / komputera
                </button>
                <button
                  type="button"
                  onClick={() => setLogoMode('url')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    logoMode === 'url'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Wklej link URL
                </button>
              </div>

              {logoMode === 'upload' ? (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 file:cursor-pointer"
                  />
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      setLogoPreview(e.target.value);
                    }}
                    placeholder="https://domena.pl/herb-druzyny.png"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>
              )}
            </div>

            {/* Podgląd herbu */}
            {effectiveTeamName && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-500">Podgląd herbu:</span>
                <div className="flex items-center gap-2.5">
                  <TeamCrestBadge
                    teamName={effectiveTeamName}
                    logoUrl={logoMode === 'upload' ? logoPreview : logoUrl}
                    size="lg"
                  />
                  <div>
                    <span className="text-xs font-black text-slate-900 block font-athletic">
                      {effectiveTeamName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {(logoMode === 'upload' && logoPreview) || (logoMode === 'url' && logoUrl)
                        ? 'Własny herb aktywny'
                        : 'Domyślna tarcza z inicjałami'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Przycisk zapisu */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving || !effectiveTeamName}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider font-athletic shadow-md transition flex items-center gap-2"
              >
                {saving ? (
                  <span>Zapisywanie...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Zapisz Herb Drużyny</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Galeria zapisanych herbów */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 font-athletic">
              Zapisane Herby w Bazie ({Object.keys(teamCrests).length})
            </h4>

            {Object.keys(teamCrests).length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Shield className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-500">Nie dodano jeszcze żadnych herbów rywali.</p>
                <p className="text-[11px] text-slate-400">Użyj formularza powyżej, aby wgrać herb dla dowolnego zespołu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(teamCrests).map(([name, url]) => (
                  <div
                    key={name}
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-sky-300 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <TeamCrestBadge teamName={name} logoUrl={url} size="md" />
                      <div className="min-w-0">
                        <h5 className="text-xs font-black text-slate-900 truncate font-athletic">
                          {name}
                        </h5>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Herb przypisany
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTeam(name);
                          setLogoPreview(url);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 transition"
                      >
                        Zmień
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCrest(name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Usuń herb"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
          >
            Zamknij
          </button>
        </div>

      </div>
    </div>
  );
}
