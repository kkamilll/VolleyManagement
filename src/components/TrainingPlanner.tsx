'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  Flame,
  Plus,
  Trash2,
  Edit3,
  Save,
  Pencil,
  Undo2,
  Image as ImageIcon,
  Video,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Users,
  Compass,
  Trophy,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Volleyball,
  ChevronDown,
  X,
  Play,
  Share2,
  Printer
} from 'lucide-react';
import {
  TrainingPlan,
  TrainingExercise,
  TrainingConclusion,
  TrainingComment,
  EventItem
} from '@/lib/types';

export function TrainingPlannerContent({ defaultTab, hideHeader }: { defaultTab?: 'EXERCISES' | 'CONCLUSIONS' | 'COMMENTS'; hideHeader?: boolean } = {}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryPlanId = searchParams.get('id');
  const queryEventId = searchParams.get('eventId');

  const canManage = Boolean(
    user?.role === 'KIEROWNIK' ||
    user?.role === 'TRENER' ||
    user?.isCaptain ||
    user?.permissions?.canManageTactics
  );

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [players, setPlayers] = useState<{ id: string; name: string; number?: number; position: string }[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Active sub-tab inside the selected plan
  const [activeTab, setActiveTab] = useState<'EXERCISES' | 'CONCLUSIONS' | 'COMMENTS'>(defaultTab || 'EXERCISES');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDate, setNewPlanDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPlanTime, setNewPlanTime] = useState('19:30 - 21:00');
  const [newPlanLocation, setNewPlanLocation] = useState('Hala POSiR, ul. Chwiałkowskiego 34, Poznań');
  const [newPlanDuration, setNewPlanDuration] = useState(90);
  const [newPlanMainGoal, setNewPlanMainGoal] = useState('');
  const [newPlanIntensity, setNewPlanIntensity] = useState<'NISKA' | 'SREDNIA' | 'WYSOKA' | 'MECZOWA'>('WYSOKA');
  const [newPlanEquipment, setNewPlanEquipment] = useState('16 piłek Mikasa V200W, 4 pachołki, tablica taktyczna, taśmy');
  const [newPlanEventId, setNewPlanEventId] = useState('');
  const [creating, setCreating] = useState(false);

  // Exercise Editor Modal state
  const [editingExercise, setEditingExercise] = useState<TrainingExercise | null>(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exTitle, setExTitle] = useState('');
  const [exCategory, setExCategory] = useState<TrainingExercise['category']>('TECHNIKA');
  const [exDuration, setExDuration] = useState(15);
  const [exDescription, setExDescription] = useState('');
  const [exKeyPointsInput, setExKeyPointsInput] = useState('');
  const [exVideoUrl, setExVideoUrl] = useState('');
  const [exImageUrl, setExImageUrl] = useState('');
  const [exDrawingData, setExDrawingData] = useState<string | undefined>(undefined);
  const [savingExercise, setSavingExercise] = useState(false);

  // Drawing Canvas inside Exercise Editor
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#00e5ff'); // Electric cyan
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Conclusion Form state
  const [conclType, setConclType] = useState<TrainingConclusion['type']>('PLUS');
  const [conclTargetPlayerId, setConclTargetPlayerId] = useState('');
  const [conclContent, setConclContent] = useState('');
  const [savingConcl, setSavingConcl] = useState(false);

  // Comment Form state
  const [commentContent, setCommentContent] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Fetch training plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/trainings');
      if (res.ok) {
        const d = await res.json();
        const pList = d.plans || [];
        setPlans(pList);
        setEvents(d.events || []);
        setPlayers(d.players || []);

        if (queryPlanId) {
          const match = pList.find((p: TrainingPlan) => p.id === queryPlanId);
          if (match) setSelectedPlan(match);
          else if (pList.length > 0) setSelectedPlan(pList[0]);
        } else if (queryEventId) {
          const match = pList.find((p: TrainingPlan) => p.eventId === queryEventId);
          if (match) setSelectedPlan(match);
          else if (pList.length > 0) setSelectedPlan(pList[0]);
        } else if (pList.length > 0 && !selectedPlan) {
          setSelectedPlan(pList[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Sync canvas background whenever entering drawing mode or changing exercise
  useEffect(() => {
    if (isDrawingMode && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw volleyball half/full court background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Volleyball lines
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Attack line (3m)
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(20, (canvas.height - 40) * 0.35 + 20);
      ctx.lineTo(canvas.width - 20, (canvas.height - 40) * 0.35 + 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Net line
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(15, 20);
      ctx.lineTo(canvas.width - 15, 20);
      ctx.stroke();

      // If existing drawingData exists, render it on top
      if (exDrawingData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = exDrawingData;
      }
    }
  }, [isDrawingMode, exDrawingData]);

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save history for undo
    setHistory(prev => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setExDrawingData(canvas.toDataURL('image/png'));
    }
  };

  const handleUndoDrawing = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const last = history[history.length - 1];
    ctx.putImageData(last, 0, 0);
    setHistory(prev => prev.slice(0, -1));
    setExDrawingData(canvas.toDataURL('image/png'));
  };

  const handleClearDrawing = () => {
    setExDrawingData(undefined);
    setHistory([]);
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // redraw court
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      }
    }
  };

  // Open exercise modal
  const handleOpenExerciseModal = (exercise?: TrainingExercise) => {
    if (exercise) {
      setEditingExercise(exercise);
      setExTitle(exercise.title);
      setExCategory(exercise.category);
      setExDuration(exercise.durationMinutes);
      setExDescription(exercise.description);
      setExKeyPointsInput((exercise.keyPoints || []).join('\n'));
      setExVideoUrl(exercise.videoUrl || '');
      setExImageUrl(exercise.imageUrl || '');
      setExDrawingData(exercise.courtDrawing);
    } else {
      setEditingExercise(null);
      setExTitle('');
      setExCategory('TECHNIKA');
      setExDuration(15);
      setExDescription('');
      setExKeyPointsInput('');
      setExVideoUrl('');
      setExImageUrl('');
      setExDrawingData(undefined);
    }
    setIsDrawingMode(false);
    setShowExerciseModal(true);
  };

  // Save exercise
  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !exTitle.trim()) return;
    setSavingExercise(true);
    try {
      const keyPoints = exKeyPointsInput
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SAVE_EXERCISE',
          planId: selectedPlan.id,
          exercise: {
            id: editingExercise?.id,
            title: exTitle.trim(),
            category: exCategory,
            durationMinutes: Number(exDuration) || 15,
            description: exDescription.trim(),
            keyPoints,
            videoUrl: exVideoUrl.trim() || undefined,
            imageUrl: exImageUrl.trim() || undefined,
            courtDrawing: exDrawingData || undefined
          }
        })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.plan) {
          setSelectedPlan(d.plan);
          setPlans(prev => prev.map(p => (p.id === d.plan.id ? d.plan : p)));
        }
        setShowExerciseModal(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu ćwiczenia');
      }
    } catch (e) {
      console.error(e);
      alert('Błąd połączenia podczas zapisu ćwiczenia');
    } finally {
      setSavingExercise(false);
    }
  };

  // Delete exercise
  const handleDeleteExercise = async (exerciseId: string) => {
    if (!selectedPlan) return;
    if (!confirm('Czy na pewno chcesz usunąć to ćwiczenie z planu?')) return;
    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DELETE_EXERCISE',
          planId: selectedPlan.id,
          exerciseId
        })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.plan) {
          setSelectedPlan(d.plan);
          setPlans(prev => prev.map(p => (p.id === d.plan.id ? d.plan : p)));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create new plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim() || !newPlanMainGoal.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CREATE_PLAN',
          plan: {
            title: newPlanTitle.trim(),
            date: newPlanDate,
            time: newPlanTime,
            location: newPlanLocation,
            durationMinutes: Number(newPlanDuration) || 90,
            mainGoal: newPlanMainGoal.trim(),
            intensity: newPlanIntensity,
            equipmentNeeded: newPlanEquipment,
            eventId: newPlanEventId || undefined
          }
        })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.plan) {
          setPlans(prev => [d.plan, ...prev]);
          setSelectedPlan(d.plan);
        }
        setShowCreateModal(false);
        setNewPlanTitle('');
        setNewPlanMainGoal('');
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd tworzenia planu treningowego');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  // Add conclusion
  const handleAddConclusion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !conclContent.trim()) return;
    setSavingConcl(true);
    try {
      const targetPlayer = players.find(p => p.id === conclTargetPlayerId);

      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADD_CONCLUSION',
          planId: selectedPlan.id,
          conclusionType: conclType,
          content: conclContent.trim(),
          targetPlayerId: targetPlayer?.id,
          targetPlayerName: targetPlayer ? `${targetPlayer.name} #${targetPlayer.number || ''}` : undefined
        })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.plan) {
          setSelectedPlan(d.plan);
          setPlans(prev => prev.map(p => (p.id === d.plan.id ? d.plan : p)));
        }
        setConclContent('');
        setConclTargetPlayerId('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingConcl(false);
    }
  };

  // Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !commentContent.trim()) return;
    setSavingComment(true);
    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADD_COMMENT',
          planId: selectedPlan.id,
          content: commentContent.trim()
        })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.comment) {
          const updated = {
            ...selectedPlan,
            comments: [...(selectedPlan.comments || []), d.comment]
          };
          setSelectedPlan(updated);
          setPlans(prev => prev.map(p => (p.id === updated.id ? updated : p)));
        }
        setCommentContent('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingComment(false);
    }
  };

  return (
    <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-6 lg:px-10 xl:px-12 pt-4 sm:pt-6 pb-24 md:pb-12 space-y-4">
      {/* Top Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0 shadow-lg shadow-sky-500/20">
              <Volleyball className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-athletic leading-tight">
                Warsztat Trenera • <span className="text-gradient-cyan">Rozpiski Treningowe</span>
              </h1>
              <span className="hidden sm:inline-block text-[11px] text-slate-500 font-medium">
                Planowanie jednostek • Rysowanie ćwiczeń na boisku • Grafiki & Wideo • Wnioski i ocena po treningu
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/taktyka"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Tablica Taktyczna</span>
            </Link>

            {canManage && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-sky-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Rozpisz Nowy Trening</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Training Plans Selector List */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Jednostki ({plans.length})
              </span>
              {canManage && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nowa</span>
                </button>
              )}
            </div>

            {plans.length === 0 ? (
              <div className="text-center py-8 px-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Volleyball className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500">Brak rozpisanych treningów.</p>
                {canManage && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-sky-500 text-slate-950 text-xs font-black"
                  >
                    Stwórz pierwszy plan
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 scrollbar-thin">
                {plans.map(p => {
                  const isSelected = selectedPlan?.id === p.id;
                  const exCount = p.exercises?.length || 0;
                  const conclCount = p.conclusions?.length || 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p)}
                      className={`p-3 rounded-2xl border transition cursor-pointer text-left space-y-1.5 ${
                        isSelected
                          ? 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/30 text-slate-900 shadow-lg'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-sky-300 font-bold">
                          {new Date(p.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} • {p.time || '19:30'}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded uppercase font-black text-[9px] ${
                          p.intensity === 'WYSOKA' ? 'bg-rose-500/20 text-rose-300' :
                          p.intensity === 'MECZOWA' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {p.intensity}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs line-clamp-1 text-slate-900">
                        {p.title}
                      </h4>

                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {p.mainGoal}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                        <span>📋 {exCount} ćwiczeń</span>
                        {conclCount > 0 && <span className="text-emerald-400 font-bold">✓ {conclCount} wniosków</span>}
                        <span>⏱ {p.durationMinutes} min</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Training Plan Workspace */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {!selectedPlan ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3">
              <Volleyball className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Wybierz jednostkę treningową z listy po lewej</h3>
              <p className="text-xs">Możesz przeglądać ćwiczenia, rysować schematy boiska oraz zapisywać wnioski trenerskie.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Training Plan Header Card */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-white via-white to-slate-50 border border-sky-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500 text-slate-950">
                        Plan Treningowy
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-sky-300 border border-sky-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(selectedPlan.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {selectedPlan.time || '19:30 - 21:00'} ({selectedPlan.durationMinutes} min)
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                      {selectedPlan.title}
                    </h2>

                    <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        {selectedPlan.location || 'Hala POSiR'}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-amber-300 font-bold">
                        Intensywność: {selectedPlan.intensity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {canManage && (
                      <button
                        onClick={() => handleOpenExerciseModal()}
                        className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Dodaj Ćwiczenie</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Goals & Equipment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                      🎯 Główny cel treningu:
                    </span>
                    <p className="text-slate-900 font-bold leading-snug">
                      {selectedPlan.mainGoal}
                    </p>
                    {selectedPlan.secondaryGoals && selectedPlan.secondaryGoals.length > 0 && (
                      <ul className="text-[11px] text-slate-500 list-disc list-inside pt-1 space-y-0.5">
                        {selectedPlan.secondaryGoals.map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      📦 Sprzęt & Założenia organizacyjne:
                    </span>
                    <p className="text-slate-700 text-xs">
                      {selectedPlan.equipmentNeeded || '15 piłek, tablica taktyczna, pachołki'}
                    </p>
                    {selectedPlan.coachNotes && (
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                        "{selectedPlan.coachNotes}"
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-tabs: Ćwiczenia / Wnioski / Dyskusja */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setActiveTab('EXERCISES')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                    activeTab === 'EXERCISES'
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span>📋 Ćwiczenia & Rozpiska ({selectedPlan.exercises?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('CONCLUSIONS')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                    activeTab === 'CONCLUSIONS'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span>📝 Wnioski & Ocena Trenera ({selectedPlan.conclusions?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('COMMENTS')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                    activeTab === 'COMMENTS'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span>💬 Dyskusja Drużyny ({selectedPlan.comments?.length || 0})</span>
                </button>
              </div>

              {/* TAB 1: EXERCISES TIMELINE */}
              {activeTab === 'EXERCISES' && (
                <div className="space-y-4">
                  {(!selectedPlan.exercises || selectedPlan.exercises.length === 0) ? (
                    <div className="text-center py-10 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
                      <Volleyball className="w-8 h-8 text-sky-400/60 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">
                        Brak rozpisanych ćwiczeń w tym treningu.
                      </p>
                      {canManage && (
                        <button
                          onClick={() => handleOpenExerciseModal()}
                          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition"
                        >
                          + Dodaj pierwsze ćwiczenie
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedPlan.exercises.map((ex, idx) => (
                        <div
                          key={ex.id}
                          className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-mono font-black text-xs flex items-center justify-center border border-sky-200">
                                {idx + 1}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                ex.category === 'ROZGRZEWKA' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                ex.category === 'TAKTYKA' ? 'bg-sky-500/20 text-sky-300 border border-sky-200' :
                                ex.category === 'GRA' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {ex.category}
                              </span>
                              <h3 className="text-base font-black text-slate-900">
                                {ex.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-xs font-bold">
                                ⏱ {ex.durationMinutes} min
                              </span>

                              {canManage && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenExerciseModal(ex)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-700 text-slate-600 transition"
                                    title="Edytuj ćwiczenie"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExercise(ex.id)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                                    title="Usuń ćwiczenie"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Exercise Description & Key Points */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-7 space-y-2">
                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {ex.description}
                              </p>

                              {ex.keyPoints && ex.keyPoints.length > 0 && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                                    💡 Punkty kluczowe dla trenera / wykonania:
                                  </span>
                                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                                    {ex.keyPoints.map((kp, kIdx) => (
                                      <li key={kIdx}>{kp}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {ex.videoUrl && (
                                <div className="pt-2">
                                  <a
                                    href={ex.videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-rose-400" />
                                    <span>Zobacz wideo instruktażowe ({ex.videoUrl})</span>
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Media Visual: Court Drawing or Graphics */}
                            <div className="md:col-span-5 flex flex-col gap-2">
                              {ex.courtDrawing ? (
                                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 p-1 group relative">
                                  <img
                                    src={ex.courtDrawing}
                                    alt="Rozrysowanie ćwiczenia"
                                    className="w-full h-44 object-contain rounded-xl"
                                  />
                                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] text-sky-400 font-bold border border-sky-400/30">
                                    🎨 Rysunek na boisku
                                  </div>
                                </div>
                              ) : ex.imageUrl ? (
                                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 p-1 relative">
                                  <img
                                    src={ex.imageUrl}
                                    alt="Grafika ćwiczenia"
                                    className="w-full h-44 object-contain rounded-xl"
                                  />
                                </div>
                              ) : (
                                <div className="h-28 rounded-2xl bg-slate-100/30 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-500 text-xs p-3 text-center">
                                  <span>Brak rysunku boiska lub grafiki</span>
                                  {canManage && (
                                    <button
                                      onClick={() => {
                                        handleOpenExerciseModal(ex);
                                        setIsDrawingMode(true);
                                      }}
                                      className="mt-1 text-[11px] text-sky-400 hover:underline font-bold"
                                    >
                                      + Rozrysuj na tablicy
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CONCLUSIONS & DEBRIEF */}
              {activeTab === 'CONCLUSIONS' && (
                <div className="space-y-4">
                  {/* Add Conclusion Form (for Staff) */}
                  {canManage && (
                    <form
                      onSubmit={handleAddConclusion}
                      className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3"
                    >
                      <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Wpisz Wniosek Po Treningu (Ocena & Założenia do poprawy)</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Typ wniosku:
                          </label>
                          <select
                            value={conclType}
                            onChange={e => setConclType(e.target.value as any)}
                            className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400"
                          >
                            <option value="PLUS">🟢 Co wyszło bardzo dobrze (Plus)</option>
                            <option value="MINUS">🔴 Element do poprawy (Minus)</option>
                            <option value="UWAGA">💡 Ogólna uwaga taktyczna</option>
                            <option value="INDYWIDUALNA">👤 Uwaga indywidualna dla gracza</option>
                          </select>
                        </div>

                        {conclType === 'INDYWIDUALNA' && (
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Wybierz zawodnika:
                            </label>
                            <select
                              value={conclTargetPlayerId}
                              onChange={e => setConclTargetPlayerId(e.target.value)}
                              className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400"
                            >
                              <option value="">Wybierz zawodnika z kadry...</option>
                              {players.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} #{p.number || ''} ({p.position})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div>
                        <textarea
                          rows={2}
                          required
                          value={conclContent}
                          onChange={e => setConclContent(e.target.value)}
                          placeholder="Wpisz treść wniosku lub spostrzeżenia trenerskiego..."
                          className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={savingConcl}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20"
                        >
                          {savingConcl ? 'Zapisywanie...' : 'Dodaj Wniosek'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List of conclusions */}
                  {(!selectedPlan.conclusions || selectedPlan.conclusions.length === 0) ? (
                    <div className="text-center py-8 px-4 bg-slate-100/30 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                      Brak wpisanych wniosków po tym treningu.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedPlan.conclusions.map(concl => (
                        <div
                          key={concl.id}
                          className={`p-4 rounded-2xl border space-y-2 ${
                            concl.type === 'PLUS' ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' :
                            concl.type === 'MINUS' ? 'bg-rose-950/20 border-rose-500/30 text-rose-200' :
                            concl.type === 'INDYWIDUALNA' ? 'bg-sky-950/30 border-sky-500/40 text-sky-200' :
                            'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="font-bold uppercase tracking-wider">
                              {concl.type === 'PLUS' ? '🟢 Plus treningu' :
                               concl.type === 'MINUS' ? '🔴 Do poprawy' :
                               concl.type === 'INDYWIDUALNA' ? `👤 Uwaga dla: ${concl.targetPlayerName || 'Gracza'}` :
                               '💡 Uwaga trenerska'}
                            </span>
                            <span className="text-slate-500">
                              {new Date(concl.createdAt).toLocaleDateString('pl-PL')}
                            </span>
                          </div>

                          <p className="text-xs leading-relaxed text-slate-900">
                            {concl.content}
                          </p>

                          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            Wpis: {concl.authorName} ({concl.authorRole})
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TEAM COMMENTS & DISCUSSION */}
              {activeTab === 'COMMENTS' && (
                <div className="space-y-4">
                  {/* Comment Form */}
                  <form
                    onSubmit={handleAddComment}
                    className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2"
                  >
                    <label className="block text-xs font-black uppercase text-slate-600">
                      Zadaj pytanie lub skomentuj trening:
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={commentContent}
                      onChange={e => setCommentContent(e.target.value)}
                      placeholder="Napisz komentarz dla trenera lub drużyny..."
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingComment}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
                      >
                        {savingComment ? 'Wysyłanie...' : 'Wyślij Komentarz'}
                      </button>
                    </div>
                  </form>

                  {/* Comments list */}
                  {(!selectedPlan.comments || selectedPlan.comments.length === 0) ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      Brak komentarzy do tego treningu. Bądź pierwszy!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedPlan.comments.map(c => (
                        <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-bold text-slate-900">
                              {c.authorName} ({c.authorRole})
                            </span>
                            <span>{new Date(c.createdAt).toLocaleString('pl-PL')}</span>
                          </div>
                          <p className="text-xs text-slate-700">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE TRAINING PLAN */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-xl shadow-sm relative space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black uppercase text-slate-900 flex items-center gap-2">
                <Volleyball className="w-5 h-5 text-sky-400" />
                <span>Rozpisz Nową Jednostkę Treningową</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Tytuł treningu *
                </label>
                <input
                  type="text"
                  required
                  value={newPlanTitle}
                  onChange={e => setNewPlanTitle(e.target.value)}
                  placeholder="np. Trening: Przyjęcie zagrywki float i kontra ze skrzydeł"
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={newPlanDate}
                    onChange={e => setNewPlanDate(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Godziny (czas)
                  </label>
                  <input
                    type="text"
                    value={newPlanTime}
                    onChange={e => setNewPlanTime(e.target.value)}
                    placeholder="19:30 - 21:00"
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Miejsce (hala)
                  </label>
                  <input
                    type="text"
                    value={newPlanLocation}
                    onChange={e => setNewPlanLocation(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Intensywność
                  </label>
                  <select
                    value={newPlanIntensity}
                    onChange={e => setNewPlanIntensity(e.target.value as any)}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-sky-400"
                  >
                    <option value="NISKA">🟢 Niska (regeneracja)</option>
                    <option value="SREDNIA">🟡 Średnia (technika)</option>
                    <option value="WYSOKA">🔴 Wysoka (tempo/skoczność)</option>
                    <option value="MECZOWA">⚡ Meczowa (sparing/szóstki)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Główny cel treningu *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newPlanMainGoal}
                  onChange={e => setNewPlanMainGoal(e.target.value)}
                  placeholder="np. Zmniejszenie błędów własnych na przyjęciu i wypracowanie automatyzmu przejścia do kontrataku..."
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Powiąż z wydarzeniem w terminarzu (opcjonalnie)
                </label>
                <select
                  value={newPlanEventId}
                  onChange={e => setNewPlanEventId(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-400"
                >
                  <option value="">Niezależny plan treningowy</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {new Date(ev.date).toLocaleDateString('pl-PL')} — {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black shadow-md shadow-sky-500/20"
                >
                  {creating ? 'Tworzenie...' : 'Stwórz Rozpiskę'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXERCISE EDITOR (WITH DRAWING CANVAS, GRAPHICS, VIDEO) */}
      {showExerciseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-3xl shadow-sm space-y-4 my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black uppercase text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-400" />
                <span>{editingExercise ? 'Edytuj Ćwiczenie' : 'Nowe Ćwiczenie w Treningu'}</span>
              </h3>
              <button
                onClick={() => setShowExerciseModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Nazwa ćwiczenia *
                  </label>
                  <input
                    type="text"
                    required
                    value={exTitle}
                    onChange={e => setExTitle(e.target.value)}
                    placeholder="np. Trójki po prostej z asekuracją kiwki"
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Kategoria
                  </label>
                  <select
                    value={exCategory}
                    onChange={e => setExCategory(e.target.value as any)}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-sky-400"
                  >
                    <option value="ROZGRZEWKA">Rozgrzewka</option>
                    <option value="TECHNIKA">Technika / Ćw. izolowane</option>
                    <option value="TAKTYKA">Taktyka / Szóstki</option>
                    <option value="MOTORYKA">Motoryka & Skoczność</option>
                    <option value="GRA">Gra zadaniowa / Meczowa</option>
                    <option value="INNE">Inne</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Opis przebiegu ćwiczenia *
                </label>
                <textarea
                  rows={3}
                  required
                  value={exDescription}
                  onChange={e => setExDescription(e.target.value)}
                  placeholder="Opisz ustawienie zawodników, obieg piłki, liczbę powtórzeń i rotację..."
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Wskazówki dla trenera (każda linia to osobny punkt)
                  </label>
                  <textarea
                    rows={2}
                    value={exKeyPointsInput}
                    onChange={e => setExKeyPointsInput(e.target.value)}
                    placeholder="np. Kąt ramion przy odbiciu&#10;Głośna komunikacja"
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                      Link do wideo (YouTube / MP4)
                    </label>
                    <input
                      type="url"
                      value={exVideoUrl}
                      onChange={e => setExVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                      Link do grafiki / schematu (URL)
                    </label>
                    <input
                      type="text"
                      value={exImageUrl}
                      onChange={e => setExImageUrl(e.target.value)}
                      placeholder="https://... lub /schemat.png"
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>
              </div>

              {/* INTERACTIVE DRAWING CANVAS ACCORDION */}
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-slate-900 text-xs">
                      Tablica Siatkarska dla tego Ćwiczenia (Rysowanie pisakiem)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                    className="px-3 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-bold text-xs transition"
                  >
                    {isDrawingMode ? 'Ukryj tablicę' : exDrawingData ? '🎨 Zmień rysunek boiska' : '🎨 Rozrysuj na boisku'}
                  </button>
                </div>

                {isDrawingMode && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    {/* Drawing Toolbar */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500">Kolor:</span>
                        {['#00e5ff', '#facc15', '#f8fafc', '#ef4444', '#10b981'].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setDrawColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-6 h-6 rounded-full border-2 transition ${
                              drawColor === c ? 'border-white scale-110 shadow-md' : 'border-transparent'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleUndoDrawing}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 text-xs flex items-center gap-1 font-bold"
                          title="Cofnij ostatnią linię"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>Cofnij</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleClearDrawing}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-rose-400 hover:bg-rose-500/20 text-xs font-bold"
                        >
                          Wyczyść tablicę
                        </button>
                      </div>
                    </div>

                    {/* Canvas */}
                    <div className="relative mx-auto rounded-xl overflow-hidden border border-slate-300 bg-slate-100 flex justify-center">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={340}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="cursor-crosshair max-w-full touch-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 text-center">
                      Rysuj trajektorię piłki, obieg graczy i strefy. Rysunek zostanie automatycznie zapisany do tego ćwiczenia.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowExerciseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={savingExercise}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black shadow-md shadow-sky-500/20"
                >
                  {savingExercise ? 'Zapisywanie...' : 'Zapisz Ćwiczenie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

