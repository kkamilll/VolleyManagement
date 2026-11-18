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
  ChevronLeft,
  ChevronRight,
  Volleyball,
  ChevronDown,
  X,
  Play,
  Share2,
  Printer,
  FileText,
  Download,
  Upload,
  Swords,
  Target,
  Filter,
  Search
} from 'lucide-react';
import {
  TrainingPlan,
  TrainingExercise,
  TrainingConclusion,
  TrainingComment,
  EventItem,
  TacticalMaterial
} from '@/lib/types';

export function TrainingPlannerContent({ 
  defaultTab, 
  hideHeader,
  mode = 'ALL',
  fixedEventType,
  hideTypeFilter = false
}: { 
  defaultTab?: 'EXERCISES' | 'CONCLUSIONS' | 'COMMENTS' | 'MATERIALS'; 
  hideHeader?: boolean;
  mode?: 'ALL' | 'MATCHES' | 'TRAININGS';
  fixedEventType?: 'ALL' | 'TRENING' | 'SPARING' | 'MECZ' | 'TURNIEJ';
  hideTypeFilter?: boolean;
} = {}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryPlanId = searchParams.get('id');
  const queryEventId = searchParams.get('eventId');
  const queryType = searchParams.get('type');

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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(queryEventId || null);
  const [loading, setLoading] = useState(true);

  // Active sub-tab inside the selected plan
  const [activeTab, setActiveTab] = useState<'EXERCISES' | 'MATERIALS' | 'CONCLUSIONS' | 'COMMENTS'>(defaultTab || 'EXERCISES');

  // Materials & Event Type Filter: Mecz, Sparing, Turniej, Trening, Wszystkie
  const [materials, setMaterials] = useState<TacticalMaterial[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState<'ALL' | 'TRENING' | 'SPARING' | 'MECZ' | 'TURNIEJ'>(() => {
    if (fixedEventType) return fixedEventType;
    if (queryType) {
      const up = queryType.toUpperCase();
      if (up === 'SPARING') return 'SPARING';
      if (up === 'TURNIEJ' || up === 'TOURNAMENT') return 'TURNIEJ';
      if (up === 'MECZ' || up === 'MECZ_LIGOWY') return 'MECZ';
      if (up === 'TRENING') return 'TRENING';
    }
    return 'ALL';
  });

  // Filtry statusu rozpisania i czasu dla treningów klubowych
  const [trainingStatusFilter, setTrainingStatusFilter] = useState<'ALL' | 'PLANNED' | 'UNPLANNED'>('ALL');
  const [trainingTimeFilter, setTrainingTimeFilter] = useState<'UPCOMING' | 'ALL' | 'PAST'>('UPCOMING');

  useEffect(() => {
    if (fixedEventType) {
      setEventTypeFilter(fixedEventType);
    }
  }, [fixedEventType]);

  useEffect(() => {
    if (queryType) {
      const up = queryType.toUpperCase();
      if (up === 'SPARING') setEventTypeFilter('SPARING');
      else if (up === 'TURNIEJ' || up === 'TOURNAMENT') setEventTypeFilter('TURNIEJ');
      else if (up === 'MECZ' || up === 'MECZ_LIGOWY') setEventTypeFilter('MECZ');
      else if (up === 'TRENING') setEventTypeFilter('TRENING');
    }
  }, [queryType]);

  useEffect(() => {
    if (queryEventId) {
      setSelectedEventId(queryEventId);
      const timer = setTimeout(() => {
        const el = document.getElementById(`planner-event-${queryEventId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [queryEventId]);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState<'PDF' | 'IMAGE'>('PDF');
  const [matFileUrl, setMatFileUrl] = useState('');
  const [matFileName, setMatFileName] = useState('');
  const [matFileSize, setMatFileSize] = useState('');
  const [matDescription, setMatDescription] = useState('');
  const [savingMaterial, setSavingMaterial] = useState(false);

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

  // Fetch training plans & events & materials
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const [tRes, tacRes, evRes] = await Promise.all([
        fetch('/api/trainings'),
        fetch('/api/tactics'),
        fetch('/api/events')
      ]);

      let allEvents: EventItem[] = [];
      let pList: TrainingPlan[] = [];

      if (evRes.ok) {
        const evData = await evRes.json();
        allEvents = (evData.events || []).sort((a: EventItem, b: EventItem) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      if (tRes.ok) {
        const d = await tRes.json();
        pList = d.plans || [];
        setPlans(pList);
        setPlayers(d.players || []);
        if (allEvents.length === 0 && d.events) {
          allEvents = (d.events || []).sort((a: EventItem, b: EventItem) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      }
      setEvents(allEvents);

      let targetEventId = queryEventId;
      if (!targetEventId && allEvents.length > 0) {
        const candidateEvents = fixedEventType
          ? allEvents.filter(e => {
              if (fixedEventType === 'TRENING') return e.type === 'TRENING';
              if (fixedEventType === 'SPARING') return e.type === 'SPARING';
              if (fixedEventType === 'TURNIEJ') return e.type === 'TURNIEJ';
              if (fixedEventType === 'MECZ') return e.type === 'MECZ' || Boolean(e.opponent && e.title.toLowerCase().includes('lals'));
              return true;
            })
          : mode === 'MATCHES'
          ? allEvents.filter(e => e.type === 'MECZ' || e.type === 'SPARING' || e.type === 'TURNIEJ' || Boolean(e.opponent && e.title.toLowerCase().includes('lals')))
          : mode === 'TRAININGS'
          ? allEvents.filter(e => e.type === 'TRENING')
          : allEvents;

        // Wybierz najbliższe nadchodzące wydarzenie (w kolejności chronologicznej)
        const futureEvents = [...candidateEvents]
          .filter((e: EventItem) => new Date(e.date).getTime() >= Date.now() - 3600000 * 24)
          .sort((a: EventItem, b: EventItem) => new Date(a.date).getTime() - new Date(b.date).getTime());
        targetEventId = (futureEvents[0] || candidateEvents[0] || allEvents[0])?.id;
      }

      if (targetEventId) {
        setSelectedEventId(targetEventId);
        const match = pList.find((p: TrainingPlan) => p.eventId === targetEventId || p.id === targetEventId);
        setSelectedPlan(match || null);

        // Auto-synchronizuj filtr z typem jednostki, jeśli przyszliśmy z Terminarza
        if (queryEventId) {
          const matchedEv = allEvents.find(e => e.id === targetEventId);
          if (matchedEv) {
            if (matchedEv.type === 'SPARING') setEventTypeFilter('SPARING');
            else if (matchedEv.type === 'TURNIEJ') setEventTypeFilter('TURNIEJ');
            else if (matchedEv.type === 'MECZ' || Boolean(matchedEv.opponent)) setEventTypeFilter('MECZ');
            else if (matchedEv.type === 'TRENING') setEventTypeFilter('TRENING');
          }
        }
      } else if (queryPlanId) {
        const match = pList.find((p: TrainingPlan) => p.id === queryPlanId);
        setSelectedPlan(match || null);
      } else {
        setSelectedPlan(null);
      }

      if (tacRes.ok) {
        const td = await tacRes.json();
        setMaterials(td.materials || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMatFileName(file.name);
    setMatFileSize(`${(file.size / 1024 / 1024).toFixed(2)} MB`);

    if (file.type === 'application/pdf') {
      setMatType('PDF');
    } else {
      setMatType('IMAGE');
    }

    if (!matTitle) {
      setMatTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMatFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim() || !matFileUrl.trim()) {
      alert('Podaj tytuł materiału oraz wybierz plik PDF lub link!');
      return;
    }
    setSavingMaterial(true);
    try {
      const scopeType = activeEvent?.type === 'SPARING' ? 'SPARING' :
        activeEvent?.type === 'MECZ' ? 'MECZ_LIGOWY' : 'TRENING';

      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADD_MATERIAL',
          material: {
            title: matTitle.trim(),
            type: matType,
            fileUrl: matFileUrl,
            fileName: matFileName || undefined,
            fileSize: matFileSize || undefined,
            scope: scopeType,
            eventId: activeEvent?.id,
            description: matDescription.trim() || undefined
          }
        })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.material) {
          setMaterials(prev => [d.material, ...prev]);
        }
        setShowAddMaterialModal(false);
        setMatTitle('');
        setMatFileUrl('');
        setMatFileName('');
        setMatFileSize('');
        setMatDescription('');
        alert('Materiał został pomyślnie dodany!');
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu materiału');
      }
    } catch (e) {
      console.error(e);
      alert('Błąd połączenia');
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (matId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten materiał?')) return;
    try {
      const res = await fetch(`/api/tactics?id=${matId}&type=MATERIAL`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMaterials(prev => prev.filter(m => m.id !== matId));
      }
    } catch (e) {
      console.error(e);
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

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
    if (!activePlan || !exTitle.trim()) return;
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
          planId: activePlan.id,
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
    if (!activePlan) return;
    if (!confirm('Czy na pewno chcesz usunąć to ćwiczenie z planu?')) return;
    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DELETE_EXERCISE',
          planId: activePlan.id,
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

    // Quick 1-click plan creation for a selected Terminarz event
  const handleQuickCreatePlanForEvent = async (ev: EventItem) => {
    setCreating(true);
    try {
      const timeStr = ev.date.includes('T') ? ev.date.split('T')[1].slice(0, 5) : '19:30';
      const isSparing = ev.type === 'SPARING';
      const isMatch = ev.type === 'MECZ' || Boolean(ev.opponent && ev.title.toLowerCase().includes('lals'));
      const defaultGoal = isMatch ? `Założenia taktyczne na mecz z ${ev.opponent || 'rywalem ligowym LALS'}`
        : isSparing ? `Sprawdzenie ustawień i założeń w sparingu z ${ev.opponent || 'rywalem'}`
        : 'Doskonalenie techniki i założeń taktycznych';

      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CREATE_PLAN',
          plan: {
            title: ev.title,
            date: ev.date.slice(0, 10),
            time: timeStr ? `${timeStr} - ${parseInt(timeStr.split(':')[0]) + 1}:${timeStr.split(':')[1] || '00'}` : '19:30 - 21:00',
            location: ev.location,
            durationMinutes: 90,
            mainGoal: defaultGoal,
            intensity: isMatch ? 'MECZOWA' : isSparing ? 'WYSOKA' : 'SREDNIA',
            equipmentNeeded: '16 piłek Mikasa V200W, pachołki, tablica taktyczna',
            eventId: ev.id
          }
        })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.plan) {
          setPlans(prev => [d.plan, ...prev]);
          setSelectedPlan(d.plan);
          setSelectedEventId(ev.id);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd tworzenia planu');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
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
    if (!activePlan || !conclContent.trim()) return;
    setSavingConcl(true);
    try {
      const targetPlayer = players.find(p => p.id === conclTargetPlayerId);

      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADD_CONCLUSION',
          planId: activePlan.id,
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
    if (!activePlan || !commentContent.trim()) return;
    setSavingComment(true);
    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADD_COMMENT',
          planId: activePlan.id,
          content: commentContent.trim()
        })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.comment) {
          const updated = {
            ...activePlan,
            comments: [...(activePlan.comments || []), d.comment]
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

  // Bazowa lista wydarzeń (filtrowana według trybu i typu)
  const baseTypeEvents: EventItem[] = useMemo(() => {
    const filter = fixedEventType || eventTypeFilter;
    return events.filter(e => {
      if (fixedEventType) {
        if (fixedEventType === 'TRENING') return e.type === 'TRENING';
        if (fixedEventType === 'SPARING') return e.type === 'SPARING';
        if (fixedEventType === 'TURNIEJ') return e.type === 'TURNIEJ';
        if (fixedEventType === 'MECZ') return e.type === 'MECZ' || Boolean(e.opponent && e.title.toLowerCase().includes('lals'));
        return true;
      }
      if (mode === 'TRAININGS') {
        return e.type === 'TRENING';
      }
      if (mode === 'MATCHES') {
        const isMatch = e.type === 'SPARING' || e.type === 'MECZ' || e.type === 'TURNIEJ' || Boolean(e.opponent && e.title.toLowerCase().includes('lals'));
        if (!isMatch) return false;
        if (filter === 'ALL' || filter === 'TRENING') return true;
        if (filter === 'SPARING') return e.type === 'SPARING';
        if (filter === 'MECZ') return e.type === 'MECZ' || Boolean(e.opponent && e.title.toLowerCase().includes('lals'));
        if (filter === 'TURNIEJ') return e.type === 'TURNIEJ';
        return true;
      }
      if (filter === 'ALL') return true;
      if (filter === 'TRENING') return e.type === 'TRENING';
      if (filter === 'SPARING') return e.type === 'SPARING';
      if (filter === 'MECZ') return e.type === 'MECZ' || Boolean(e.opponent && e.title.toLowerCase().includes('lals'));
      if (filter === 'TURNIEJ') return e.type === 'TURNIEJ';
      return true;
    });
  }, [events, eventTypeFilter, fixedEventType, mode]);

  // Liczniki statusu rozpisania dla treningów klubowych
  const allTrainingsCount = useMemo(() => baseTypeEvents.length, [baseTypeEvents]);
  const plannedTrainingsCount = useMemo(() => {
    return baseTypeEvents.filter(e => {
      const p = plans.find(planItem => planItem.eventId === e.id || planItem.id === e.id);
      return (p?.exercises?.length || 0) > 0;
    }).length;
  }, [baseTypeEvents, plans]);
  const unplannedTrainingsCount = Math.max(0, allTrainingsCount - plannedTrainingsCount);

  // Końcowa przefiltrowana lista wydarzeń (z filtrami statusu rozpisania i czasu)
  const filteredEvents: EventItem[] = useMemo(() => {
    let list = baseTypeEvents;

    if (mode === 'TRAININGS' || fixedEventType === 'TRENING') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Zakres czasowy
      if (trainingTimeFilter === 'UPCOMING') {
        const upcoming = list.filter(e => new Date(e.date).getTime() >= today.getTime());
        if (upcoming.length > 0) {
          list = upcoming;
        }
      } else if (trainingTimeFilter === 'PAST') {
        list = list.filter(e => new Date(e.date).getTime() < today.getTime());
      }

      // Status rozpisania konspektu
      if (trainingStatusFilter === 'PLANNED') {
        list = list.filter(e => {
          const p = plans.find(planItem => planItem.eventId === e.id || planItem.id === e.id);
          return (p?.exercises?.length || 0) > 0;
        });
      } else if (trainingStatusFilter === 'UNPLANNED') {
        list = list.filter(e => {
          const p = plans.find(planItem => planItem.eventId === e.id || planItem.id === e.id);
          return (p?.exercises?.length || 0) === 0;
        });
      }
    }

    return list;
  }, [baseTypeEvents, mode, fixedEventType, trainingTimeFilter, trainingStatusFilter, plans]);

  const trainingsCount = useMemo(() => events.filter(e => e.type === 'TRENING').length, [events]);
  const sparringsCount = useMemo(() => events.filter(e => e.type === 'SPARING').length, [events]);
  const matchesCount = useMemo(() => events.filter(e => e.type === 'MECZ' || Boolean(e.opponent && e.title.toLowerCase().includes('lals'))).length, [events]);
  const tournamentsCount = useMemo(() => events.filter(e => e.type === 'TURNIEJ').length, [events]);

  // Currently active event from Terminarz
  const activeEvent: EventItem | null = filteredEvents.find(e => e.id === selectedEventId) || filteredEvents[0] || null;

  // Automatyczny wybór pierwszego wydarzenia z przefiltrowanej listy, gdy filtr wyklucza poprzednie
  useEffect(() => {
    if (filteredEvents.length > 0) {
      const exists = filteredEvents.some(e => e.id === selectedEventId);
      if (!exists) {
        setSelectedEventId(filteredEvents[0].id);
        const p = plans.find(planItem => planItem.eventId === filteredEvents[0].id || planItem.id === filteredEvents[0].id);
        setSelectedPlan(p || null);
      }
    }
  }, [filteredEvents, selectedEventId, plans]);

  // Active plan associated strictly with this active event
  const activePlan: TrainingPlan | null = activeEvent
    ? (plans.find(p => p.eventId === activeEvent.id || p.id === activeEvent.id) || null)
    : (selectedPlan && events.some(e => e.id === selectedPlan.eventId) ? selectedPlan : null);

  // Materials linked to this active event
  const eventMaterials: TacticalMaterial[] = useMemo(() => {
    if (!activeEvent) return materials;
    return materials.filter(m => m.eventId === activeEvent.id || !m.eventId);
  }, [materials, activeEvent]);

  const currentEventIndex = filteredEvents.findIndex(e => e.id === activeEvent?.id);
  const handlePrevEvent = () => {
    if (currentEventIndex > 0) {
      const prevEv = filteredEvents[currentEventIndex - 1];
      setSelectedEventId(prevEv.id);
      const p = plans.find(planItem => planItem.eventId === prevEv.id || planItem.id === prevEv.id);
      setSelectedPlan(p || null);
    }
  };
  const handleNextEvent = () => {
    if (currentEventIndex < filteredEvents.length - 1) {
      const nextEv = filteredEvents[currentEventIndex + 1];
      setSelectedEventId(nextEv.id);
      const p = plans.find(planItem => planItem.eventId === nextEv.id || planItem.id === nextEv.id);
      setSelectedPlan(p || null);
    }
  };

  return (
    <div className={hideHeader ? "w-full space-y-4" : "w-full max-w-[2000px] mx-auto px-2 sm:px-6 lg:px-10 xl:px-12 pt-4 sm:pt-6 pb-24 md:pb-12 space-y-4"}>
      {/* Top Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0 shadow-lg shadow-sky-500/20">
              <Volleyball className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-athletic leading-tight">
                Założenia & Plany • <span className="text-gradient-cyan">Treningi, Sparingi, Mecze</span>
              </h1>
              <span className="hidden sm:inline-block text-[11px] text-slate-500 font-medium">
                Rozpiski ćwiczeń z rysunkami boiska • Założenia meczowe • Załączniki PDF & Wideo • Wnioski i ocena
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/taktyka?tab=board"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-sky-600" />
              <span>Tablica & Brudnopis</span>
            </Link>

            {canManage && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nowa Rozpiska</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Layout - Jedno pod drugim (Full width stacked layout) */}
      <div className="flex flex-col gap-6 w-full">
        {/* Górna sekcja: Kompaktowy selektor wydarzenia (Pasek wyboru + Szybkie pigułki) */}
        <div className="w-full space-y-3">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5">
            {/* Główny pasek: Tytuł, Dropdown ze strzałkami, Szczegóły aktywnej jednostki & Przycisk Terminarza */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-xs ${
                  mode === 'TRAININGS' || fixedEventType === 'TRENING'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white'
                    : fixedEventType === 'SPARING'
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black'
                    : fixedEventType === 'TURNIEJ'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-700 text-white'
                    : 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white'
                }`}>
                  {mode === 'TRAININGS' || fixedEventType === 'TRENING' ? <Volleyball className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-wider">
                      {mode === 'TRAININGS' || fixedEventType === 'TRENING'
                        ? 'Treningi z Terminarza'
                        : fixedEventType === 'MECZ'
                        ? 'Mecze Ligowe'
                        : fixedEventType === 'SPARING'
                        ? 'Sparingi'
                        : fixedEventType === 'TURNIEJ'
                        ? 'Turnieje'
                        : 'Wydarzenia'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-black border ${
                      mode === 'TRAININGS' || fixedEventType === 'TRENING'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : fixedEventType === 'SPARING'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : fixedEventType === 'TURNIEJ'
                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                        : 'bg-sky-100 text-sky-800 border-sky-300'
                    }`}>
                      {filteredEvents.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {mode === 'TRAININGS' || fixedEventType === 'TRENING'
                      ? 'Wybierz trening klubowy, aby edytować konspekt ćwiczeń'
                      : fixedEventType === 'MECZ'
                      ? 'Wybierz mecz ligowy z terminarza'
                      : fixedEventType === 'SPARING'
                      ? 'Wybierz sparing kontrolny'
                      : fixedEventType === 'TURNIEJ'
                      ? 'Wybierz turniej siatkarski'
                      : 'Wybierz jednostkę z terminarza'}
                  </p>
                </div>
              </div>

              {/* Selektor ze strzałkami Poprzedni / Następny */}
              {filteredEvents.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-1 max-w-xl">
                  <button
                    type="button"
                    onClick={handlePrevEvent}
                    disabled={currentEventIndex <= 0}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-700 flex items-center justify-center transition shrink-0"
                    title="Poprzednia jednostka"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <select
                    value={activeEvent?.id || ''}
                    onChange={e => {
                      const ev = filteredEvents.find(evItem => evItem.id === e.target.value);
                      if (ev) {
                        setSelectedEventId(ev.id);
                        const p = plans.find(planItem => planItem.eventId === ev.id || planItem.id === ev.id);
                        setSelectedPlan(p || null);
                      }
                    }}
                    className="flex-1 bg-slate-50 hover:bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:outline-none focus:border-emerald-500 shadow-2xs min-w-0 truncate"
                  >
                    {filteredEvents.map(ev => {
                      const p = plans.find(planItem => planItem.eventId === ev.id || planItem.id === ev.id);
                      const exCount = p?.exercises?.length || 0;
                      const evDate = new Date(ev.date);
                      const statusLabel = exCount > 0 ? `✓ Rozpisany (${exCount} ćw.)` : '⏳ Do rozpisania';
                      return (
                        <option key={ev.id} value={ev.id}>
                          {evDate.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })} ({evDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}) — {ev.title} • {statusLabel}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    type="button"
                    onClick={handleNextEvent}
                    disabled={currentEventIndex >= filteredEvents.length - 1}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-700 flex items-center justify-center transition shrink-0"
                    title="Następna jednostka"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 max-w-xl text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-dashed border-slate-200">
                  Brak jednostek w wybranym filtrze.
                </div>
              )}

              {/* Przycisk do Terminarza */}
              <Link
                href="/events"
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl border border-slate-300 transition shadow-2xs shrink-0 self-start lg:self-auto"
                title="Przejdź do Terminarza"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Terminarz</span>
              </Link>
            </div>

            {/* Pasek Filtrów i Zakresu: dla Treningów (status rozpisania & czas) lub dla Meczów (typ wydarzenia) */}
            {!hideTypeFilter && (
              mode === 'MATCHES' ? (
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setEventTypeFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      eventTypeFilter === 'ALL' || eventTypeFilter === 'TRENING'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    Wszystkie ({sparringsCount + matchesCount + tournamentsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventTypeFilter('MECZ')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                      eventTypeFilter === 'MECZ'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Volleyball className="w-3.5 h-3.5" />
                    <span>Mecze LALS ({matchesCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventTypeFilter('SPARING')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                      eventTypeFilter === 'SPARING'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Sparingi ({sparringsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventTypeFilter('TURNIEJ')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                      eventTypeFilter === 'TURNIEJ'
                        ? 'bg-purple-600 text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Turnieje ({tournamentsCount})</span>
                  </button>
                </div>
              ) : (mode === 'TRAININGS' || fixedEventType === 'TRENING') ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  {/* Filtry statusu rozpisania konspektu */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto scrollbar-none w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setTrainingStatusFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                        trainingStatusFilter === 'ALL'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <span>Wszystkie treningi</span>
                      <span className="font-mono text-[10px] opacity-80 font-black">({allTrainingsCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrainingStatusFilter('UNPLANNED')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                        trainingStatusFilter === 'UNPLANNED'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <span>⏳ Do rozpisania</span>
                      <span className="font-mono text-[10px] opacity-80 font-black">({unplannedTrainingsCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrainingStatusFilter('PLANNED')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                        trainingStatusFilter === 'PLANNED'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <span>✓ Rozpisane konspekty</span>
                      <span className="font-mono text-[10px] opacity-80 font-black">({plannedTrainingsCount})</span>
                    </button>
                  </div>

                  {/* Filtr horyzontu czasowego (Nadchodzące / Wszystkie / Przeszłe) */}
                  <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto shrink-0">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Zakres:</span>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setTrainingTimeFilter('UPCOMING')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          trainingTimeFilter === 'UPCOMING'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Nadchodzące
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrainingTimeFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          trainingTimeFilter === 'ALL'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Wszystkie
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrainingTimeFilter('PAST')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          trainingTimeFilter === 'PAST'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Przeszłe
                      </button>
                    </div>
                  </div>
                </div>
              ) : null
            )}

            {/* Informacja, gdy lista jest pusta */}
            {filteredEvents.length === 0 && (
              <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2 mt-2">
                <Volleyball className="w-8 h-8 text-emerald-500 mx-auto opacity-75" />
                <p className="text-xs font-bold text-slate-800">Brak jednostek w wybranym filtrze.</p>
                <p className="text-[11px] text-slate-500">Zmień filtry statusu/czasu lub przejdź do Terminarza, aby dodać nowy trening.</p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setTrainingStatusFilter('ALL'); setTrainingTimeFilter('ALL'); }}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition shadow-2xs"
                  >
                    Resetuj filtry
                  </button>
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Terminarz</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dolna sekcja: Wybrany Plan i Konspekt (Full width) */}
        <div className="w-full space-y-4">
          {!activePlan ? (
            activeEvent ? (() => {
              const roundMatch = activeEvent.title.match(/R(\d+)/i) || activeEvent.title.match(/Runda\s*(\d+)/i);
              const roundNum = roundMatch ? roundMatch[1] : null;
              let oppName = activeEvent.opponent || '';
              if (!oppName && activeEvent.title.includes(' vs ')) {
                const parts = activeEvent.title.split(' vs ');
                oppName = parts[0].includes('Angels') ? parts[1].trim() : parts[0].replace(/.*:\s*/, '').trim();
              }
              const attendingCount = activeEvent.attendees?.filter(a => a.status === 'BEDE').length || 0;

              return (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  {/* Górny pasek metadanych */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 font-mono">
                        {activeEvent.type === 'SPARING' ? '⚔️ Sparing' : activeEvent.type === 'MECZ' ? `🏐 LALS ${roundNum ? `• Runda ${roundNum}` : ''}` : '🏋️ Trening'}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {new Date(activeEvent.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{attendingCount} zadeklarowanych</span>
                      </span>
                      <Link
                        href={`/events?eventId=${activeEvent.id}`}
                        className="text-xs text-sky-600 hover:text-sky-800 font-bold px-2 py-1 rounded-lg hover:bg-sky-50 transition"
                      >
                        Terminarz &rarr;
                      </Link>
                    </div>
                  </div>

                  {/* Duel Scoreboard Card for Match/Sparing OR Training Banner */}
                  {activeEvent.type === 'TRENING' ? (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border border-emerald-200 shadow-2xs">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0 border border-emerald-400">
                            🏐
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 block">Jednostka Treningowa</span>
                            <h4 className="text-xl font-black text-slate-900 uppercase font-athletic tracking-tight">{activeEvent.title}</h4>
                          </div>
                        </div>

                        <div className="flex flex-col items-center sm:items-end justify-center px-4 py-1">
                          <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {new Date(activeEvent.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{activeEvent.location || 'Hala POSiR'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200 shadow-2xs">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
                        {/* Gospodarz */}
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0 border border-sky-400">
                            👼
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase text-sky-700 block">Gospodarz</span>
                            <h4 className="text-xl font-black text-slate-900 uppercase font-athletic tracking-tight">Angels ZTP</h4>
                          </div>
                        </div>

                        {/* VS & Szczegóły Miejsca */}
                        <div className="flex flex-col items-center justify-center px-4 py-1">
                          <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-black text-slate-700 font-mono">
                            VS
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1 mt-1.5">
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            {new Date(activeEvent.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{activeEvent.location || 'Hala OSiR, Luboń'}</span>
                          </span>
                        </div>

                        {/* Gość */}
                        <div className="flex items-center sm:flex-row-reverse gap-3.5 text-center sm:text-right">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0 border border-slate-700">
                            🏐
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase text-amber-600 block">Przeciwnik</span>
                            <h4 className="text-xl font-black text-slate-900 uppercase font-athletic tracking-tight">
                              {oppName || 'Rywal Ligowy'}
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2 Kafelki Przygotowania Taktycznego */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-sky-600" />
                          {activeEvent.type === 'TRENING' ? 'Konspekt & Ćwiczenia' : 'Założenia Meczowe'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Do rozpisania
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {activeEvent.type === 'TRENING'
                          ? 'Wprowadź cele jednostki, rozgrzewkę, ćwiczenia techniczne, zadaniowe i grę kontrolną.'
                          : 'Zdefiniuj cele meczowe, taktykę zagrywki, kierunki ataku i asekurację bloku.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-amber-600" />
                          {activeEvent.type === 'TRENING' ? 'Rozrysowanie na Boisku (Pisak)' : 'Ustawienie Wyjściowe (P1–P6)'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                          Tablica
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {activeEvent.type === 'TRENING'
                          ? 'Każde ćwiczenie możesz rozrysować bezpośrednio na boisku (trajektorie piłek, strefy, obieg graczy).'
                          : 'Rozrysuj schemat rotacji, strefy przyjęcia libero i pozycje obrony na tablicy taktycznej.'}
                      </p>
                    </div>
                  </div>

                  {/* Pasek Głównych Akcji */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {canManage && (
                      <button
                        onClick={() => handleQuickCreatePlanForEvent(activeEvent)}
                        disabled={creating}
                        className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                          activeEvent.type === 'TRENING'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-sky-600 hover:bg-sky-500 text-white'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {creating
                            ? 'Tworzenie...'
                            : activeEvent.type === 'TRENING'
                            ? 'Rozpocznij konspekt / Dodaj ćwiczenia'
                            : 'Rozpisz taktykę na ten mecz'}
                        </span>
                      </button>
                    )}

                    <Link
                      href={`/taktyka?tab=board&eventId=${activeEvent.id}`}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <Compass className="w-4 h-4 text-sky-600" />
                      <span>Tablica Taktyczna</span>
                    </Link>
                  </div>
                </div>
              );
            })() : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3 shadow-sm">
                <Volleyball className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Wybierz jednostkę z listy po lewej</h3>
                <p className="text-xs">Wydarzenia pobierane są z Terminarza (treningi, sparingi, mecze LALS). Kliknij jednostkę, aby przygotować taktykę, ćwiczenia i materiały.</p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {/* Event Plan Header Card */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-white via-white to-slate-50 border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        activeEvent?.type === 'SPARING' ? 'bg-amber-500 text-slate-950 font-bold' :
                        activeEvent?.type === 'MECZ' ? 'bg-indigo-600 text-white' :
                        'bg-sky-600 text-white'
                      }`}>
                        {activeEvent?.type === 'SPARING' ? 'Założenia Sparingowe' : activeEvent?.type === 'MECZ' ? 'Plan Meczowy LALS' : 'Plan Treningowy'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-sky-800 border border-slate-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-sky-600" />
                        {new Date(activePlan.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-700 bg-slate-100 border border-slate-200 flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {activePlan.time || '19:30 - 21:00'} ({activePlan.durationMinutes} min)
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                      {activePlan.title}
                    </h2>

                    <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {activePlan.location || 'Hala POSiR'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-amber-800 font-bold">
                        Intensywność: {activePlan.intensity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {activeEvent && (
                      <Link
                        href={`/taktyka?tab=board&eventId=${activeEvent.id}`}
                        className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                        title="Otwórz tablicę taktyczną i rozrysuj ustawienie na to spotkanie"
                      >
                        <Compass className="w-3.5 h-3.5 text-sky-600" />
                        <span className="hidden sm:inline">Rozrysuj na tablicy</span>
                        <span className="sm:hidden">Tablica</span>
                      </Link>
                    )}
                    {canManage && (
                      <button
                        onClick={() => handleOpenExerciseModal()}
                        className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Dodaj Ćwiczenie / Założenie</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Goals & Equipment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">
                      🎯 Główny cel jednostki:
                    </span>
                    <p className="text-slate-900 font-bold leading-snug">
                      {activePlan.mainGoal}
                    </p>
                    {activePlan.secondaryGoals && activePlan.secondaryGoals.length > 0 && (
                      <ul className="text-[11px] text-slate-500 list-disc list-inside pt-1 space-y-0.5">
                        {activePlan.secondaryGoals.map((g, i) => (
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
                      {activePlan.equipmentNeeded || '15 piłek, tablica taktyczna, pachołki'}
                    </p>
                    {activePlan.coachNotes && (
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                        "{activePlan.coachNotes}"
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-tabs: Ćwiczenia / Materiały & Załączniki / Wnioski / Dyskusja */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none flex-nowrap">
                <button
                  onClick={() => setActiveTab('EXERCISES')}
                  className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                    activeTab === 'EXERCISES'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Ćwiczenia & Rozpiska ({activePlan.exercises?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('MATERIALS')}
                  className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                    activeTab === 'MATERIALS'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Materiały & Załączniki ({eventMaterials.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('CONCLUSIONS')}
                  className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                    activeTab === 'CONCLUSIONS'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Wnioski & Ocena Trenera ({activePlan.conclusions?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('COMMENTS')}
                  className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                    activeTab === 'COMMENTS'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Dyskusja Drużyny ({activePlan.comments?.length || 0})</span>
                </button>
              </div>

              {/* TAB 1: EXERCISES TIMELINE */}
              {activeTab === 'EXERCISES' && (
                <div className="space-y-4">
                  {(!activePlan.exercises || activePlan.exercises.length === 0) ? (
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
                      {activePlan.exercises.map((ex, idx) => (
                        <div
                          key={ex.id}
                          className={`p-4 sm:p-5 rounded-3xl bg-white border border-slate-300 shadow-md hover:shadow-lg space-y-3 transition ${
                            ex.category === 'ROZGRZEWKA' ? 'border-t-4 border-t-amber-500' :
                            ex.category === 'TAKTYKA' ? 'border-t-4 border-t-sky-500' :
                            ex.category === 'GRA' ? 'border-t-4 border-t-purple-500' :
                            'border-t-4 border-t-emerald-500'
                          }`}
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
                                    Rysunek na boisku
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

              {/* TAB: MATERIALS & ATTACHMENTS */}
              {activeTab === 'MATERIALS' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-500" />
                        <span>Materiały Taktyczne, PDF & Scouting dla tej jednostki</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Załączone pliki PDF, rozpiski taktyczne, analizy rywali oraz materiały wideo.
                      </p>
                    </div>

                    {canManage && (
                      <button
                        onClick={() => setShowAddMaterialModal(true)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Dodaj Materiał / Załącznik PDF</span>
                      </button>
                    )}
                  </div>

                  {eventMaterials.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
                      <FileText className="w-10 h-10 text-rose-400/40 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">
                        Brak załączonych materiałów do tej jednostki.
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Możesz dodać plik PDF (np. raport taktyczny, scouting rywala) lub grafikę z założeniami.
                      </p>
                      {canManage && (
                        <button
                          onClick={() => setShowAddMaterialModal(true)}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Dodaj pierwszy materiał</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {eventMaterials.map(mat => (
                        <div
                          key={mat.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm flex flex-col justify-between gap-3 group transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                              {mat.type === 'PDF' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                                  {mat.type}
                                </span>
                                {mat.fileSize && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {mat.fileSize}
                                  </span>
                                )}
                              </div>
                              <h5 className="text-sm font-black text-slate-900 mt-1 truncate">
                                {mat.title}
                              </h5>
                              {mat.description && (
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                  {mat.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <span className="text-[10px] text-slate-400">
                              {mat.uploadedAt ? new Date(mat.uploadedAt).toLocaleDateString('pl-PL') : ''}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {mat.fileUrl && (
                                <a
                                  href={mat.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Otwórz / Pobierz</span>
                                </a>
                              )}
                              {canManage && (
                                <button
                                  onClick={() => handleDeleteMaterial(mat.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="Usuń materiał"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
                  {(!activePlan.conclusions || activePlan.conclusions.length === 0) ? (
                    <div className="text-center py-8 px-4 bg-slate-100/30 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                      Brak wpisanych wniosków po tym treningu.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activePlan.conclusions.map(concl => (
                        <div
                          key={concl.id}
                          className={`p-4 rounded-2xl border space-y-2 ${
                            concl.type === 'PLUS' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                            concl.type === 'MINUS' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                            concl.type === 'INDYWIDUALNA' ? 'bg-sky-50 border-sky-200 text-sky-800' :
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
                  {(!activePlan.comments || activePlan.comments.length === 0) ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      Brak komentarzy do tego treningu. Bądź pierwszy!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activePlan.comments.map(c => (
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

      {/* MODAL: ADD MATERIAL */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-xl relative space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black uppercase text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-500" />
                <span>Dodaj Materiał / Załącznik</span>
              </h3>
              <button
                onClick={() => setShowAddMaterialModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Tytuł materiału *
                </label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={e => setMatTitle(e.target.value)}
                  placeholder="np. Scouting rywala - strefy zagrywki i atak ze skrzydła"
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Typ załącznika
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMatType('PDF')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition flex items-center justify-center gap-1.5 ${
                      matType === 'PDF'
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Dokument PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatType('IMAGE')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition flex items-center justify-center gap-1.5 ${
                      matType === 'IMAGE'
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Grafika / Obraz</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Wgraj plik (PDF lub Obraz) *
                </label>
                <input
                  type="file"
                  accept={matType === 'PDF' ? '.pdf,application/pdf' : 'image/*'}
                  onChange={handleMaterialFileUpload}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-rose-600 file:text-white file:font-bold file:text-xs hover:file:bg-rose-500 cursor-pointer"
                />
                {matFileName && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">
                    ✓ Wybrano: {matFileName} ({matFileSize})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Lub podaj bezpośredni link URL (opcjonalnie)
                </label>
                <input
                  type="url"
                  value={matFileUrl.startsWith('data:') ? '' : matFileUrl}
                  onChange={e => setMatFileUrl(e.target.value)}
                  placeholder="https://... (np. link do chmury Google Drive / Dropbox)"
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Krótki opis / instrukcja dla zawodników
                </label>
                <textarea
                  rows={2}
                  value={matDescription}
                  onChange={e => setMatDescription(e.target.value)}
                  placeholder="np. Zwróćcie uwagę na kierunki ataku numeru 7 i rotację P4..."
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={savingMaterial || !matFileUrl}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-sm disabled:opacity-50"
                >
                  {savingMaterial ? 'Zapisywanie...' : 'Zapisz Materiał'}
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
                    {isDrawingMode ? 'Ukryj tablicę' : exDrawingData ? 'Zmień rysunek boiska' : 'Rozrysuj na boisku'}
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

