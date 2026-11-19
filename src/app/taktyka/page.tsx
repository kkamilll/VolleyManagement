'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import { TrainingPlannerContent } from '@/components/TrainingPlanner';
import { drawVolleyballCourt, CourtViewMode } from '@/lib/court';
import {
  Target,
  Pencil,
  Undo2,
  Trash2,
  Save,
  RotateCw,
  RotateCcw,
  Move,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Compass,
  ArrowRight,
  Shield,
  Flame,
  Volleyball,
  Calendar,
  Trophy,
  Camera,
  MessageSquare,
  Check,
  X,
  Edit3,
  CornerDownRight,
  Send,
  HelpCircle,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Swords,
  UserCheck,
  Plus,
  CheckCircle,
  MapPin,
  FileText,
  File,
  Download,
  ExternalLink,
  Upload,
  FolderArchive,
  Lock,
  Unlock,
  FlaskConical,
  Smartphone,
  Maximize2,
  Play,
  Image as ImageIcon,
  Video
} from 'lucide-react';
import {
  TacticalPlay,
  TacticalPost,
  RotationCode,
  TacticalPhase,
  CourtPlayerPosition,
  PlayerRoleCode,
  TacticScope,
  EventItem,
  MatchResult,
  TacticalMaterial,
  AttendanceRecord
} from '@/lib/types';

// Default initial positions for 5-1 rotations on Full Court (Siatka w połowie: y=50%, Angels ZTP: y=52-95%)
// Domyślne pozycje wyjściowe systemu 5-1:
// - Środkowi (Ś1, Ś2 / Libero: L)
// - Przyjmujący (P1, P2)
// - Rozgrywający (R) i Atakujący (A)
const ROTATION_DEFAULTS: Record<RotationCode, Record<TacticalPhase, CourtPlayerPosition[]>> = {
  P1: {
    PRZYJECIE: [
      { id: 'p1_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 1, x: 82, y: 84, task: 'Chowa się za P1 (II linia) i po serwisie sprintuje pod siatkę do strefy 2/3' },
      { id: 'p1_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 2, x: 76, y: 68, task: 'Schodzi ze strefy 2 do linii przyjęcia po prawej stronie' },
      { id: 'p1_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 3, x: 50, y: 56, task: 'Stoi przy siatce, atak z 1. tempa (krótka na wprost rozgrywającego)' },
      { id: 'p1_a', name: 'Atakujący (A)', roleCode: 'A', zone: 4, x: 18, y: 56, task: 'Skrzydłowy lewy, atak ze strefy 4 z I linii' },
      { id: 'p1_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 5, x: 24, y: 78, task: 'Przyjęcie lewego sektora boiska w II linii' },
      { id: 'p1_l', name: 'Libero (L)', roleCode: 'L', zone: 6, x: 50, y: 82, task: 'Dowodzenie przyjęciem w środku (zmienia Ś2 w II linii)' }
    ],
    OBRONA: [
      { id: 'p1_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 1, x: 80, y: 84, task: 'Obrona ataku po prostej' },
      { id: 'p1_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 2, x: 78, y: 56, task: 'Blok prawy (zamyka prostą)' },
      { id: 'p1_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 3, x: 50, y: 56, task: 'Dostawienie bloku do skrzydła' },
      { id: 'p1_a', name: 'Atakujący (A)', roleCode: 'A', zone: 4, x: 18, y: 56, task: 'Blok lewy skrzydłowy' },
      { id: 'p1_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 5, x: 22, y: 82, task: 'Obrona ciasnego skosu' },
      { id: 'p1_l', name: 'Libero (L)', roleCode: 'L', zone: 6, x: 50, y: 86, task: 'Obrona ataku po głębokim skosie' }
    ],
    ATAK: [
      { id: 'p1_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 1, x: 65, y: 57, task: 'Wystawa z wyskoku ze strefy 2/3' },
      { id: 'p1_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 2, x: 80, y: 57, task: 'Atak z prawego skrzydła' },
      { id: 'p1_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 3, x: 50, y: 56, task: 'Szybkie tempo na środku' },
      { id: 'p1_a', name: 'Atakujący (A)', roleCode: 'A', zone: 4, x: 16, y: 57, task: 'Atak po skosie ze strefy 4' },
      { id: 'p1_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 5, x: 45, y: 74, task: 'Najście na pajpa z 6. metra' },
      { id: 'p1_l', name: 'Libero (L)', roleCode: 'L', zone: 6, x: 50, y: 82, task: 'Asekuracja atakującego' }
    ],
    ZAGRYWKA: [
      { id: 'p1_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 1, x: 80, y: 94, task: 'Zagrywka taktyczna w strefę 1 lub 5' },
      { id: 'p1_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 2, x: 78, y: 56, task: 'Blok prawy' },
      { id: 'p1_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 3, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p1_a', name: 'Atakujący (A)', roleCode: 'A', zone: 4, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p1_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 5, x: 24, y: 82, task: 'Obrona skosu' },
      { id: 'p1_l', name: 'Libero (L)', roleCode: 'L', zone: 6, x: 50, y: 82, task: 'Obrona środka' }
    ]
  },
  P2: {
    PRZYJECIE: [
      { id: 'p2_l', name: 'Libero (L)', roleCode: 'L', zone: 1, x: 76, y: 80, task: 'Przyjmuje prawy sektor (zmienia Ś1 w II linii; naprzeciwko Ś2 w strefie 4)' },
      { id: 'p2_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 2, x: 74, y: 56, task: 'Rozgrywający w I linii w strefie 2, wystawia bezpośrednio z siatki' },
      { id: 'p2_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 3, x: 32, y: 68, task: 'Schodzi ze strefy 3 do przyjęcia po lewej i przygotowuje atak' },
      { id: 'p2_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 4, x: 20, y: 56, task: 'Środkowy 2 w I linii przy siatce (naprzeciwko Libero w strefie 1)' },
      { id: 'p2_a', name: 'Atakujący (A)', roleCode: 'A', zone: 5, x: 22, y: 82, task: 'Atakujący w II linii, gotowy do ataku z lewej strony lub pipe' },
      { id: 'p2_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 6, x: 50, y: 80, task: 'Przyjęcie środka boiska w II linii' }
    ],
    OBRONA: [
      { id: 'p2_l', name: 'Libero (L)', roleCode: 'L', zone: 1, x: 80, y: 84, task: 'Obrona prostej' },
      { id: 'p2_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 2, x: 78, y: 56, task: 'Blok prawy (zamyka prostą)' },
      { id: 'p2_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 3, x: 18, y: 56, task: 'Przejście na lewe skrzydło do bloku' },
      { id: 'p2_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 4, x: 50, y: 56, task: 'Przejście na środek do bloku' },
      { id: 'p2_a', name: 'Atakujący (A)', roleCode: 'A', zone: 5, x: 22, y: 82, task: 'Obrona ciasnego skosu' },
      { id: 'p2_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 6, x: 50, y: 86, task: 'Obrona środka' }
    ],
    ATAK: [
      { id: 'p2_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 2, x: 68, y: 57, task: 'Wystawa i opcja kiwki w 2. kontakcie' },
      { id: 'p2_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 4, x: 50, y: 56, task: 'Krótka z 1. tempa na środku' },
      { id: 'p2_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 3, x: 16, y: 57, task: 'Atak z lewego skrzydła (strefa 4)' },
      { id: 'p2_a', name: 'Atakujący (A)', roleCode: 'A', zone: 5, x: 22, y: 78, task: 'Atak z lewej strony z II linii' },
      { id: 'p2_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 6, x: 50, y: 74, task: 'Wejście na pipe' },
      { id: 'p2_l', name: 'Libero (L)', roleCode: 'L', zone: 1, x: 75, y: 82, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p2_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 1, x: 80, y: 94, task: 'Środkowy 1 na zagrywce (po akcji zmiana na Libero)' },
      { id: 'p2_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 2, x: 78, y: 56, task: 'Blok prawy' },
      { id: 'p2_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 4, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p2_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 3, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p2_a', name: 'Atakujący (A)', roleCode: 'A', zone: 5, x: 24, y: 82, task: 'Obrona skosu' },
      { id: 'p2_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 6, x: 50, y: 82, task: 'Obrona środka' }
    ]
  },
  P3: {
    PRZYJECIE: [
      { id: 'p3_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 1, x: 76, y: 80, task: 'Przyjęcie prawego sektora boiska w II linii' },
      { id: 'p3_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 2, x: 80, y: 56, task: 'Środkowy 2 w strefie 2 (I linia), gotowy na obejście za plecy R' },
      { id: 'p3_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 3, x: 62, y: 56, task: 'Rozgrywający w I linii w strefie 3' },
      { id: 'p3_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 4, x: 22, y: 68, task: 'Schodzi ze strefy 4 do przyjęcia po lewej i przygotowuje atak' },
      { id: 'p3_l', name: 'Libero (L)', roleCode: 'L', zone: 5, x: 38, y: 80, task: 'Zmienia Ś1 w II linii (naprzeciwko Ś2 w strefie 2), przyjmuje środek' },
      { id: 'p3_a', name: 'Atakujący (A)', roleCode: 'A', zone: 6, x: 58, y: 84, task: 'Chowa się za R w środku, gotowy do ataku z prawej II linii' }
    ],
    OBRONA: [
      { id: 'p3_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 1, x: 80, y: 84, task: 'Obrona po prostej' },
      { id: 'p3_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 2, x: 50, y: 56, task: 'Przejście na środek do bloku' },
      { id: 'p3_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 3, x: 78, y: 56, task: 'Przejście na prawe skrzydło do bloku' },
      { id: 'p3_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 4, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p3_l', name: 'Libero (L)', roleCode: 'L', zone: 5, x: 22, y: 84, task: 'Obrona skosu' },
      { id: 'p3_a', name: 'Atakujący (A)', roleCode: 'A', zone: 6, x: 50, y: 86, task: 'Obrona środka' }
    ],
    ATAK: [
      { id: 'p3_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 3, x: 65, y: 57, task: 'Wystawa piłki ze strefy 2/3' },
      { id: 'p3_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 4, x: 16, y: 57, task: 'Atak ze skrzydła lewego' },
      { id: 'p3_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 2, x: 50, y: 56, task: 'Krótka na środku lub obejście za głowę' },
      { id: 'p3_a', name: 'Atakujący (A)', roleCode: 'A', zone: 6, x: 82, y: 78, task: 'Atak z prawej strony II linii' },
      { id: 'p3_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 1, x: 45, y: 74, task: 'Wejście na pipe' },
      { id: 'p3_l', name: 'Libero (L)', roleCode: 'L', zone: 5, x: 50, y: 82, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p3_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 1, x: 80, y: 94, task: 'Mocna zagrywka kierunkowa' },
      { id: 'p3_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 2, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p3_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 3, x: 78, y: 56, task: 'Blok prawy' },
      { id: 'p3_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 4, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p3_l', name: 'Libero (L)', roleCode: 'L', zone: 5, x: 24, y: 82, task: 'Obrona skosu' },
      { id: 'p3_a', name: 'Atakujący (A)', roleCode: 'A', zone: 6, x: 50, y: 82, task: 'Obrona środka' }
    ]
  },
  P4: {
    PRZYJECIE: [
      { id: 'p4_a', name: 'Atakujący (A)', roleCode: 'A', zone: 1, x: 80, y: 84, task: 'Atakujący w II linii, gotowy do ataku z prawej strony' },
      { id: 'p4_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 2, x: 76, y: 68, task: 'Schodzi ze strefy 2 do przyjęcia po prawej stronie' },
      { id: 'p4_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 3, x: 50, y: 56, task: 'Środkowy 2 w strefie 3 (naprzeciwko Libero w strefie 6)' },
      { id: 'p4_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 4, x: 24, y: 56, task: 'Rozgrywający w I linii w strefie 4, przesuwa się na pozycję rozegrania' },
      { id: 'p4_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 5, x: 26, y: 80, task: 'Przyjęcie lewego sektora boiska' },
      { id: 'p4_l', name: 'Libero (L)', roleCode: 'L', zone: 6, x: 50, y: 82, task: 'Zmienia Ś1 w II linii (naprzeciwko Ś2 w strefie 3), przyjmuje środek' }
    ],
    OBRONA: [
      { id: 'p4_a', name: 'Atakujący (A)', roleCode: 'A', zone: 1, x: 80, y: 84, task: 'Obrona prostej' },
      { id: 'p4_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 2, x: 18, y: 56, task: 'Przejście na lewe skrzydło do bloku' },
      { id: 'p4_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 3, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p4_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 4, x: 78, y: 56, task: 'Przejście na prawe skrzydło do bloku' },
      { id: 'p4_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 5, x: 22, y: 82, task: 'Obrona skosu' },
      { id: 'p4_l', name: 'Libero (L)', roleCode: 'L', zone: 6, x: 50, y: 86, task: 'Obrona środka' }
    ],
    ATAK: [
      { id: 'p4_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 4, x: 65, y: 57, task: 'Rozegranie pod siatką (opcja kiwki w 2. kontakcie)' },
      { id: 'p4_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 3, x: 50, y: 56, task: 'Krótka ze środka' },
      { id: 'p4_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 2, x: 16, y: 57, task: 'Atak ze strefy 4 (lewe skrzydło)' },
      { id: 'p4_a', name: 'Atakujący (A)', roleCode: 'A', zone: 1, x: 82, y: 78, task: 'Atak z prawej II linii' },
      { id: 'p4_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 5, x: 45, y: 74, task: 'Pipe ze środka' },
      { id: 'p4_l', name: 'Libero (L)', roleCode: 'L', zone: 6, x: 48, y: 82, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p4_a', name: 'Atakujący (A)', roleCode: 'A', zone: 1, x: 80, y: 94, task: 'Mocna zagrywka po prostej' },
      { id: 'p4_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 4, x: 78, y: 56, task: 'Blok prawy' },
      { id: 'p4_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 3, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p4_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 2, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p4_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 5, x: 24, y: 82, task: 'Obrona skosu' },
      { id: 'p4_l', name: 'Libero (L)', roleCode: 'L', zone: 6, x: 50, y: 82, task: 'Obrona środka' }
    ]
  },
  P5: {
    PRZYJECIE: [
      { id: 'p5_l', name: 'Libero (L)', roleCode: 'L', zone: 1, x: 78, y: 80, task: 'Zmienia Ś2 w II linii (naprzeciwko Ś1 w strefie 4), przyjmuje prawy sektor' },
      { id: 'p5_a', name: 'Atakujący (A)', roleCode: 'A', zone: 2, x: 80, y: 56, task: 'Atakujący w I linii w strefie 2, gotowy do ataku ze skrzydła' },
      { id: 'p5_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 3, x: 42, y: 70, task: 'Schodzi ze strefy 3 do linii przyjęcia' },
      { id: 'p5_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 4, x: 20, y: 56, task: 'Środkowy 1 przy siatce po lewej (naprzeciwko Libero w strefie 1)' },
      { id: 'p5_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 5, x: 18, y: 80, task: 'Chowa się za Ś1 w lewym rogu i sprintuje pod siatkę' },
      { id: 'p5_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 6, x: 52, y: 80, task: 'Przyjęcie lewego/środkowego sektora boiska' }
    ],
    OBRONA: [
      { id: 'p5_l', name: 'Libero (L)', roleCode: 'L', zone: 1, x: 80, y: 84, task: 'Obrona po prostej' },
      { id: 'p5_a', name: 'Atakujący (A)', roleCode: 'A', zone: 2, x: 78, y: 56, task: 'Blok prawy skrzydłowy' },
      { id: 'p5_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 3, x: 18, y: 56, task: 'Przejście na lewe skrzydło do bloku' },
      { id: 'p5_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 4, x: 50, y: 56, task: 'Przejście na środek do bloku' },
      { id: 'p5_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 5, x: 22, y: 82, task: 'Obrona ciasnego skosu' },
      { id: 'p5_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 6, x: 50, y: 86, task: 'Obrona środka' }
    ],
    ATAK: [
      { id: 'p5_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 5, x: 65, y: 57, task: 'Wystawa zbiegowa ze strefy 2/3' },
      { id: 'p5_a', name: 'Atakujący (A)', roleCode: 'A', zone: 2, x: 80, y: 57, task: 'Atak z prawego skrzydła ze strefy 2' },
      { id: 'p5_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 4, x: 50, y: 56, task: 'Krótka na środku' },
      { id: 'p5_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 3, x: 16, y: 57, task: 'Atak ze strefy 4 po przejściu' },
      { id: 'p5_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 6, x: 45, y: 74, task: 'Pipe ze strefy 6' },
      { id: 'p5_l', name: 'Libero (L)', roleCode: 'L', zone: 1, x: 50, y: 82, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p5_s2', name: 'Środkowy 2 (Ś2)', roleCode: 'Ś2', zone: 1, x: 80, y: 94, task: 'Środkowy 2 na zagrywce' },
      { id: 'p5_a', name: 'Atakujący (A)', roleCode: 'A', zone: 2, x: 78, y: 56, task: 'Blok prawy' },
      { id: 'p5_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 3, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p5_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 4, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p5_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 5, x: 24, y: 82, task: 'Obrona skosu' },
      { id: 'p5_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 6, x: 50, y: 82, task: 'Obrona środka' }
    ]
  },
  P6: {
    PRZYJECIE: [
      { id: 'p6_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 1, x: 78, y: 80, task: 'Przyjęcie prawego sektora boiska w II linii' },
      { id: 'p6_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 2, x: 80, y: 56, task: 'Środkowy 1 w strefie 2 (naprzeciwko Libero w strefie 5)' },
      { id: 'p6_a', name: 'Atakujący (A)', roleCode: 'A', zone: 3, x: 52, y: 56, task: 'Atakujący w strefie 3, gotowy do nabiegu na prawe skrzydło' },
      { id: 'p6_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 4, x: 24, y: 68, task: 'Schodzi ze strefy 4 do linii przyjęcia' },
      { id: 'p6_l', name: 'Libero (L)', roleCode: 'L', zone: 5, x: 36, y: 80, task: 'Zmienia Ś2 w II linii (naprzeciwko Ś1 w strefie 2), przyjmuje lewy/środek' },
      { id: 'p6_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 6, x: 50, y: 74, task: 'Chowa się za A w środku i po zagrywce biegnie pod siatkę' }
    ],
    OBRONA: [
      { id: 'p6_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 1, x: 80, y: 84, task: 'Obrona po prostej' },
      { id: 'p6_a', name: 'Atakujący (A)', roleCode: 'A', zone: 3, x: 78, y: 56, task: 'Przejście na prawe skrzydło do bloku' },
      { id: 'p6_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 2, x: 50, y: 56, task: 'Przejście na środek do bloku' },
      { id: 'p6_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 4, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p6_l', name: 'Libero (L)', roleCode: 'L', zone: 5, x: 22, y: 82, task: 'Obrona ciasnego skosu' },
      { id: 'p6_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 6, x: 50, y: 85, task: 'Obrona środka' }
    ],
    ATAK: [
      { id: 'p6_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 6, x: 65, y: 57, task: 'Wystawa ze strefy 2/3 po zbiegu ze środka' },
      { id: 'p6_a', name: 'Atakujący (A)', roleCode: 'A', zone: 3, x: 80, y: 57, task: 'Atak z prawego skrzydła ze strefy 2' },
      { id: 'p6_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 2, x: 50, y: 56, task: 'Krótka na środku' },
      { id: 'p6_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 4, x: 18, y: 57, task: 'Atak ze strefy 4' },
      { id: 'p6_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 1, x: 75, y: 78, task: 'Wejście z II linii / asekuracja' },
      { id: 'p6_l', name: 'Libero (L)', roleCode: 'L', zone: 5, x: 25, y: 82, task: 'Asekuracja skrzydeł' }
    ],
    ZAGRYWKA: [
      { id: 'p6_p1', name: 'Przyjmujący 1 (P1)', roleCode: 'P1', zone: 1, x: 80, y: 94, task: 'Mocna zagrywka z wyskoku' },
      { id: 'p6_a', name: 'Atakujący (A)', roleCode: 'A', zone: 3, x: 78, y: 56, task: 'Blok prawy' },
      { id: 'p6_s1', name: 'Środkowy 1 (Ś1)', roleCode: 'Ś1', zone: 2, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p6_p2', name: 'Przyjmujący 2 (P2)', roleCode: 'P2', zone: 4, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p6_l', name: 'Libero (L)', roleCode: 'L', zone: 5, x: 24, y: 82, task: 'Obrona skosu' },
      { id: 'p6_r', name: 'Rozgrywający (R)', roleCode: 'R', zone: 6, x: 50, y: 82, task: 'Obrona środka' }
    ]
  }
};

function TacticsContent() {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get('eventId');
  const queryMatchId = searchParams.get('matchId');
  const queryTacticId = searchParams.get('tacticId');
  const queryType = searchParams.get('type');

  const { user } = useAuth();
  const { isArchiveMode } = useSeasonArchive();
  const canEdit = !isArchiveMode && Boolean(
    user && (
      user.role === 'TRENER' ||
      user.role === 'KIEROWNIK' ||
      user.isCaptain ||
      user.id === 'usr_pujanek' ||
      user.id === 'usr_kierownik' ||
      (user.email && (user.email.toLowerCase().includes('pujanek') || user.email.toLowerCase().includes('kremer'))) ||
      user.permissions?.canManageTactics ||
      user.permissions?.isAdmin
    )
  );

  // Section switcher: 1. Tablica, 2. Rozpiski Meczowe, 3. Sparingi, 4. Turnieje, 5. Treningi
  const [tacticsSection, setTacticsSection] = useState<'board' | 'matches' | 'sparingi' | 'turnieje' | 'trainings'>('board');
  const [showLoadTacticModal, setShowLoadTacticModal] = useState(false);
  const [loadTacticSearch, setLoadTacticSearch] = useState('');

  useEffect(() => {
    const tab = searchParams.get('tab')?.toLowerCase();
    const type = searchParams.get('type')?.toUpperCase();
    if (tab === 'sparingi' || tab === 'sparing' || tab === 'sparrings' || type === 'SPARING') {
      setTacticsSection('sparingi');
    } else if (tab === 'turnieje' || tab === 'turniej' || tab === 'tournaments' || type === 'TURNIEJ') {
      setTacticsSection('turnieje');
    } else if (tab === 'matches' || tab === 'mecze' || tab === 'mecz' || tab === 'playbook' || tab === 'debrief' || tab === 'odprawa' || type === 'MECZ' || type === 'MECZ_LIGOWY') {
      setTacticsSection('matches');
    } else if (tab === 'training' || tab === 'trening' || tab === 'treningi' || tab === 'trainings' || type === 'TRENING') {
      setTacticsSection('trainings');
    } else if (tab === 'board' || tab === 'taktyka' || tab === 'tablica') {
      setTacticsSection('board');
    }
  }, [searchParams]);

  // Tactical board state
  const courtContainerRef = useRef<HTMLDivElement | null>(null);
  const [rotation, setRotation] = useState<RotationCode>('P1');
  const [phase, setPhase] = useState<TacticalPhase>('PRZYJECIE');
  const [positions, setPositions] = useState<CourtPlayerPosition[]>(ROTATION_DEFAULTS.P1.PRZYJECIE);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const selectedPlayer = positions.find(p => p.id === selectedPlayerId);
  const hasLibero = useMemo(() => positions.some(p => p.roleCode === 'L'), [positions]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Volleyball Ball marker on court
  const [showBall, setShowBall] = useState(true);
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 50, y: 68 });

  // Opponent team markers on full court (domyślnie wyłączone, aby nie zaciemniać tablicy)
  const [showOpponents, setShowOpponents] = useState(false);
  const [opponentPositions, setOpponentPositions] = useState<CourtPlayerPosition[]>([
    { id: 'opp_b1', name: 'Blok L', number: 4, roleCode: 'B1', zone: 4, x: 20, y: 44, task: 'Blok lewy skrzydłowy' },
    { id: 'opp_b2', name: 'Blok Ś', number: 3, roleCode: 'B2', zone: 3, x: 50, y: 44, task: 'Blok środkowy' },
    { id: 'opp_b3', name: 'Blok P', number: 2, roleCode: 'B3', zone: 2, x: 80, y: 44, task: 'Blok prawy skrzydłowy' },
    { id: 'opp_d5', name: 'Obrona V', number: 5, roleCode: 'O5', zone: 5, x: 22, y: 18, task: 'Obrona ciasnego skosu' },
    { id: 'opp_d6', name: 'Obrona VI', number: 6, roleCode: 'O6', zone: 6, x: 50, y: 14, task: 'Obrona środka boiska' },
    { id: 'opp_d1', name: 'Obrona I', number: 1, roleCode: 'O1', zone: 1, x: 78, y: 18, task: 'Obrona po prostej' }
  ]);

  // Tool selection: 'move' (default drag & drop) or drawing tools
  const [activeTool, setActiveTool] = useState<'move' | 'pen' | 'marker' | 'arrow' | 'eraser'>('move');
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState<string>('#facc15'); // Yellow default
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  // Playbook & Saved Tactics
  const [tactics, setTactics] = useState<TacticalPlay[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedTactic, setSelectedTactic] = useState<TacticalPlay | null>(null);
  const [showScopeFilters, setShowScopeFilters] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'WSZYSTKIE' | TacticScope>('WSZYSTKIE');
  const [playbookCategory, setPlaybookCategory] = useState<'WSZYSTKIE' | 'MECZE_LALS' | 'SPARINGI' | 'OGOLNA' | 'TRENING'>('WSZYSTKIE');
  const [playbookMatchFilter, setPlaybookMatchFilter] = useState<string>('WSZYSCY');
  const [playbookSearch, setPlaybookSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Unit context selector state: 'GENERAL' | 'EVENT_<id>' | 'MATCH_<id>'
  const [selectedContextKey, setSelectedContextKey] = useState<string>('GENERAL');
  const [unitDirectives, setUnitDirectives] = useState<string[]>([]);
  const [showDirectiveEditor, setShowDirectiveEditor] = useState(false);
  const [newDirectiveInput, setNewDirectiveInput] = useState('');

  // Tactical Materials (PDF & Graphics)
  const [materials, setMaterials] = useState<TacticalMaterial[]>([]);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState<'PDF' | 'IMAGE' | 'VIDEO'>('PDF');
  const [materialFileUrl, setMaterialFileUrl] = useState('');
  const [materialFileName, setMaterialFileName] = useState('');
  const [materialFileSize, setMaterialFileSize] = useState('');
  const [materialScope, setMaterialScope] = useState<'MECZ_LIGOWY' | 'SPARING' | 'TURNIEJ' | 'TRENING' | 'OGOLNE'>('OGOLNE');
  const [materialEventId, setMaterialEventId] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [materialFilter, setMaterialFilter] = useState<'ALL' | 'PDF' | 'IMAGE' | 'VIDEO'>('ALL');
  const [showQuickDrawModal, setShowQuickDrawModal] = useState(false);
  const [quickDrawTitle, setQuickDrawTitle] = useState('');
  const [quickDrawPhase, setQuickDrawPhase] = useState<TacticalPhase>('PRZYJECIE');
  const [quickDrawRotation, setQuickDrawRotation] = useState<RotationCode>('P1');
  const [quickDrawColor, setQuickDrawColor] = useState('#00e5ff');
  const [quickDrawHistory, setQuickDrawHistory] = useState<ImageData[]>([]);
  const [isQuickDrawing, setIsQuickDrawing] = useState(false);
  const quickDrawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [quickDrawCourtView, setQuickDrawCourtView] = useState<CourtViewMode>('FULL');
  const [previewMedia, setPreviewMedia] = useState<TacticalMaterial | null>(null);
  const [selectedPdfViewer, setSelectedPdfViewer] = useState<TacticalMaterial | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<TacticalMaterial | null>(null);

  // Save Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lastAddedTactic, setLastAddedTactic] = useState<{
    id: string;
    title: string;
    matchTitle: string;
    rotation?: string;
    phase?: string;
  } | null>(null);
  const [savedPostNotification, setSavedPostNotification] = useState<{ id: string; title: string; matchTitle: string } | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [notePostTitle, setNotePostTitle] = useState('');
  const [notePostContent, setNotePostContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [tacticTitle, setTacticTitle] = useState('');
  const [tacticScope, setTacticScope] = useState<TacticScope>('OGOLNA');
  const [linkedEventId, setLinkedEventId] = useState<string>('');
  const [linkedMatchId, setLinkedMatchId] = useState<string>('');
  const [tacticComment, setTacticComment] = useState('');
  const [saving, setSaving] = useState(false);
  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showCourtPositions, setShowCourtPositions] = useState(false);

  const insertTagIntoNote = (tag: string) => {
    const textarea = noteTextareaRef.current;
    if (!textarea) {
      setTacticComment(prev => prev ? `${prev} ${tag} ` : `${tag} `);
      return;
    }
    const start = textarea.selectionStart ?? tacticComment.length;
    const end = textarea.selectionEnd ?? tacticComment.length;
    const before = tacticComment.substring(0, start);
    const after = tacticComment.substring(end);
    const spaceBefore = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '';
    const spaceAfter = ' ';
    const newText = `${before}${spaceBefore}${tag}${spaceAfter}${after}`;
    setTacticComment(newText);
    setTimeout(() => {
      textarea.focus();
      const newPos = start + spaceBefore.length + tag.length + spaceAfter.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  // Player Suggestions / Discussion Feed State
  const [newPostContent, setNewPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [editingPostModal, setEditingPostModal] = useState<TacticalPost | null>(null);
  const [editCoachFeedback, setEditCoachFeedback] = useState('');
  const [postFilter, setPostFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED'>('ALL');

  // Player Read-Only & Sandbox State
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Board Orientation: 'vertical' (pionowo) vs 'horizontal' (poziomo)
  const [boardOrientation, setBoardOrientation] = useState<'vertical' | 'horizontal'>('vertical');

  // Full squad list for @ mentions & tactical notes
  const allSquadMembers = useMemo(() => {
    const list = (players && players.length > 0 ? players : [
      { id: 'usr_kremer', name: 'Łukasz Kremer', number: 17, role: 'KIEROWNIK', isCaptain: true },
      { id: 'usr_rutkowski', name: 'Hubert Rutkowski', number: null, role: 'TRENER', isCoach: true },
      { id: 'usr_obara', name: 'Hubert Obara', number: 12, role: 'ZAWODNIK' },
      { id: 'usr_pujanek', name: 'Kamil Pujanek', number: 4, role: 'KIEROWNIK', isCaptain: false },
      { id: 'usr_smigiel', name: 'Michał Śmigiel', number: 8, role: 'ZAWODNIK' },
      { id: 'usr_augustynek', name: 'Bartosz Augustynek', number: 97, role: 'ZAWODNIK' },
      { id: 'usr_graczyk', name: 'Piotr Graczyk', number: 7, role: 'ZAWODNIK' },
      { id: 'usr_kruk', name: 'Dominik Kruk', number: 10, role: 'ZAWODNIK' },
      { id: 'usr_krupa', name: 'Tomasz Krupa', number: 1, role: 'ZAWODNIK' },
      { id: 'usr_noak', name: 'Maciej Noak', number: 47, role: 'ZAWODNIK' },
      { id: 'usr_krol', name: 'Wit Król', number: 91, role: 'ZAWODNIK' },
      { id: 'usr_ordon', name: 'Karol Ordon', number: 28, role: 'ZAWODNIK' },
      { id: 'usr_suwalski', name: 'Stanisław Suwalski', number: 55, role: 'ZAWODNIK' },
      { id: 'usr_zadlo', name: 'Tomasz Żądło', number: 5, role: 'ZAWODNIK' },
      { id: 'usr_kulupa', name: 'Paweł Kulupa', number: 3, role: 'ZAWODNIK' },
      { id: 'usr_shetty', name: 'Vikhyath Shetty', number: 19, role: 'ZAWODNIK' }
    ]);

    return [...list].sort((a: any, b: any) => {
      if (a.isCoach || a.role === 'TRENER') return -1;
      if (b.isCoach || b.role === 'TRENER') return 1;
      if (a.isCaptain && !b.isCaptain) return -1;
      if (!a.isCaptain && b.isCaptain) return 1;
      return (a.number || 999) - (b.number || 999);
    });
  }, [players]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('volley_board_orientation');
      if (saved === 'vertical' || saved === 'horizontal') {
        setBoardOrientation(saved);
      }
    }
  }, []);

  const handleToggleOrientation = (orient: 'vertical' | 'horizontal') => {
    setBoardOrientation(orient);
    if (typeof window !== 'undefined') {
      localStorage.setItem('volley_board_orientation', orient);
    }
  };

  // Can the user effectively drag/draw right now?
  const isEffectiveEditor = !isArchiveMode && Boolean(canEdit || isSandboxMode);

  // Dedykowana lista opcji wyboru meczu / wydarzenia w zależności od wybranej sekcji (zabezpieczona przed duplikatami)
  const sectionTargetOptions = useMemo(() => {
    if (tacticsSection === 'matches') {
      const list: Array<{
        key: string;
        id: string;
        type: string;
        title: string;
        opponent: string;
        date: string;
        location: string;
      }> = [];
      const seenOpponents = new Set<string>();

      events
        .filter(e => e.type === 'MECZ' || (e.title && (e.title.toLowerCase().includes('lals') || e.title.toLowerCase().includes('mecz'))))
        .forEach(e => {
          const oppKey = (e.opponent || e.title).toLowerCase().trim();
          seenOpponents.add(oppKey);
          list.push({
            key: `EVENT_${e.id}`,
            id: e.id,
            type: 'MECZ',
            title: e.opponent ? `${e.title.includes('(R') ? e.title.split(':')[0] + ': ' : ''}vs ${e.opponent}` : e.title,
            opponent: e.opponent || e.title,
            date: e.date,
            location: e.location || 'Hala OSiR, Luboń'
          });
        });

      matches.forEach(m => {
        const oppKey = m.opponent.toLowerCase().trim();
        if (!seenOpponents.has(oppKey)) {
          seenOpponents.add(oppKey);
          list.push({
            key: `MATCH_${m.id}`,
            id: m.id,
            type: 'MECZ',
            title: `vs ${m.opponent}`,
            opponent: m.opponent,
            date: m.date,
            location: m.location || 'Hala POSiR'
          });
        }
      });

      return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (tacticsSection === 'sparingi') {
      return events
        .filter(e => e.type === 'SPARING')
        .map(e => ({
          key: `EVENT_${e.id}`,
          id: e.id,
          type: 'SPARING',
          title: e.opponent ? `vs ${e.opponent}` : e.title,
          opponent: e.opponent || e.title,
          date: e.date,
          location: e.location || 'Hala POSiR'
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (tacticsSection === 'turnieje') {
      return events
        .filter(e => e.type === 'TURNIEJ')
        .map(e => ({
          key: `EVENT_${e.id}`,
          id: e.id,
          type: 'TURNIEJ',
          title: e.title,
          opponent: e.opponent || '',
          date: e.date,
          location: e.location || 'Hala POSiR'
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (tacticsSection === 'trainings') {
      return events
        .filter(e => e.type === 'TRENING')
        .map(e => ({
          key: `EVENT_${e.id}`,
          id: e.id,
          type: 'TRENING',
          title: e.title,
          opponent: '',
          date: e.date,
          location: e.location || 'Hala POSiR'
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return [];
  }, [tacticsSection, matches, events]);

  // Active target event or match based on unit selector (with bi-directional auto-sync & section scoping)
  const activeTargetEvent = useMemo(() => {
    if (tacticsSection !== 'board') {
      const exists = sectionTargetOptions.some(opt => opt.key === selectedContextKey);
      if (!exists) return null;
    }
    if (selectedContextKey.startsWith('EVENT_')) {
      const id = selectedContextKey.replace('EVENT_', '');
      return events.find(e => e.id === id) || null;
    }
    if (selectedContextKey.startsWith('MATCH_')) {
      const matchId = selectedContextKey.replace('MATCH_', '');
      const m = matches.find(match => match.id === matchId);
      const ev = events.find(e => e.id === matchId.replace('mat_', 'evt_') || (m?.opponent && e.opponent && e.opponent.toLowerCase() === m.opponent.toLowerCase()));
      return ev || null;
    }
    return null;
  }, [selectedContextKey, events, matches, tacticsSection, sectionTargetOptions]);

  const activeTargetMatch = useMemo(() => {
    if (tacticsSection !== 'board') {
      const exists = sectionTargetOptions.some(opt => opt.key === selectedContextKey);
      if (!exists) return null;
    }
    if (selectedContextKey.startsWith('MATCH_')) {
      const id = selectedContextKey.replace('MATCH_', '');
      return matches.find(m => m.id === id) || null;
    }
    if (selectedContextKey.startsWith('EVENT_')) {
      const eventId = selectedContextKey.replace('EVENT_', '');
      const ev = events.find(e => e.id === eventId);
      const m = matches.find(match => match.id === eventId.replace('mat_', 'evt_') || (ev?.opponent && match.opponent && match.opponent.toLowerCase() === ev.opponent.toLowerCase()));
      return m || null;
    }
    return null;
  }, [selectedContextKey, matches, events, tacticsSection, sectionTargetOptions]);

  // Backward compatibility alias for single targetEvent
  const targetEvent = activeTargetEvent;

  // Materiały taktyczne (pliki, wideo, zdjęcia) dla aktualnego meczu/wydarzenia
  const currentUnitMaterials = useMemo(() => {
    return materials.filter(m => {
      if (activeTargetEvent && m.eventId === activeTargetEvent.id) return true;
      if (activeTargetMatch && m.matchId === activeTargetMatch.id) return true;
      if (activeTargetEvent && m.matchId && m.matchId === activeTargetEvent.id.replace('evt_', 'mat_')) return true;
      if (activeTargetMatch && m.eventId && m.eventId === activeTargetMatch.id.replace('mat_', 'evt_')) return true;
      const opp = (activeTargetEvent?.opponent || activeTargetMatch?.opponent || '').toLowerCase().trim();
      if (opp && opp.length >= 3) {
        if (m.opponentName && m.opponentName.toLowerCase().includes(opp)) return true;
        if (m.title && m.title.toLowerCase().includes(opp)) return true;
        if (m.description && m.description.toLowerCase().includes(opp)) return true;
      }
      return false;
    });
  }, [materials, activeTargetEvent, activeTargetMatch]);

  // Zapisane schematy i tablice taktyczne dla aktualnego meczu/wydarzenia (Feed postów ze schematami)
  const currentUnitTactics = useMemo(() => {
    return tactics.filter(t => {
      if (activeTargetEvent && t.eventId === activeTargetEvent.id) return true;
      if (activeTargetMatch && t.matchId === activeTargetMatch.id) return true;
      if (activeTargetEvent && t.matchId && t.matchId === activeTargetEvent.id.replace('evt_', 'mat_')) return true;
      if (activeTargetMatch && t.eventId && t.eventId === activeTargetMatch.id.replace('mat_', 'evt_')) return true;
      const opp = (activeTargetEvent?.opponent || activeTargetMatch?.opponent || '').toLowerCase().trim();
      if (opp && opp.length >= 3) {
        if (t.targetOpponent && t.targetOpponent.toLowerCase().includes(opp)) return true;
        if (t.title && t.title.toLowerCase().includes(opp)) return true;
        if (t.description && t.description.toLowerCase().includes(opp)) return true;
        if (t.tacticalNotes && t.tacticalNotes.toLowerCase().includes(opp)) return true;
      }
      return false;
    });
  }, [tactics, activeTargetEvent, activeTargetMatch]);



  // Załaduj zapisany schemat z listy meczu bezpośrednio na główną tablicę taktyczną
  const handleLoadTacticToBoard = (tac: TacticalPlay) => {
    setSelectedTactic(tac);
    setLastAddedTactic(null);
    setTacticTitle(tac.title);
    if (tac.rotation) setRotation(tac.rotation);
    if (tac.phase) setPhase(tac.phase);
    if (tac.courtPositions && tac.courtPositions.length > 0) setPositions(tac.courtPositions);
    if (tac.description || tac.tacticalNotes) setTacticComment(tac.description || tac.tacticalNotes || '');
    if (tac.eventId) {
      setLinkedEventId(tac.eventId);
      setSelectedContextKey(`EVENT_${tac.eventId}`);
    } else if (tac.matchId) {
      setLinkedMatchId(tac.matchId);
      setSelectedContextKey(`MATCH_${tac.matchId}`);
    }
    setTacticsSection('board');
  };

  // Otwórz czystą tablicę taktyczną z ustawionym kontekstem tego meczu
  const handleOpenBoardForCurrentTarget = () => {
    if (activeTargetEvent) {
      setLinkedEventId(activeTargetEvent.id);
      setLinkedMatchId('');
      setSelectedContextKey(`EVENT_${activeTargetEvent.id}`);
      setTacticTitle(`Mecz vs ${activeTargetEvent.opponent || 'Rywal'}: Ustawienie ${rotation} (${phase})`);
    } else if (activeTargetMatch) {
      setLinkedMatchId(activeTargetMatch.id);
      setLinkedEventId('');
      setSelectedContextKey(`MATCH_${activeTargetMatch.id}`);
      setTacticTitle(`Mecz vs ${activeTargetMatch.opponent}: Ustawienie ${rotation} (${phase})`);
    }
    setTacticsSection('board');
  };

  // Otwórz modal dodawania załącznika / wideo / zdjęcia dla tego meczu
  const handleOpenAddMaterialForCurrentTarget = (initialType: 'IMAGE' | 'PDF' | 'VIDEO' = 'IMAGE') => {
    const defaultScope: TacticScope = tacticsSection === 'matches' ? 'MECZ_LIGOWY' : tacticsSection === 'sparingi' ? 'SPARING' : 'TURNIEJ';
    setMaterialScope(defaultScope);
    setMaterialType(initialType);
    setMaterialEventId(activeTargetEvent?.id || '');
    setMaterialTitle(
      initialType === 'VIDEO'
        ? `Wideo z meczu vs ${activeTargetEvent?.opponent || activeTargetMatch?.opponent || 'Rywal'}`
        : `Materiały vs ${activeTargetEvent?.opponent || activeTargetMatch?.opponent || 'Rywal'}`
    );
    setMaterialFileUrl('');
    setMaterialFileName('');
    setMaterialFileSize('');
    setMaterialDescription('');
    setShowAddMaterialModal(true);
  };

  // Szybkie rysowanie schematu boiska w dedykowanym modalu dla tego meczu
  const handleOpenQuickDrawModal = () => {
    const opp = activeTargetEvent?.opponent || activeTargetMatch?.opponent || 'Rywal';
    setQuickDrawTitle(`Mecz vs ${opp}: Schemat ${rotation} (${phase})`);
    setQuickDrawPhase(phase);
    setQuickDrawRotation(rotation);
    setQuickDrawHistory([]);
    setShowQuickDrawModal(true);
  };

  // Funkcja pomocnicza: Wyciąganie ID i miniatury YouTube
  const getYoutubeId = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return m ? m[1] : null;
  };

  // Quick Draw Mouse & Touch handlers
  const startQuickDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = quickDrawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setQuickDrawHistory(prev => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.strokeStyle = quickDrawColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsQuickDrawing(true);
  };

  const drawQuickDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isQuickDrawing) return;
    const canvas = quickDrawCanvasRef.current;
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

  const stopQuickDraw = () => {
    setIsQuickDrawing(false);
  };

  const handleUndoQuickDraw = () => {
    if (quickDrawHistory.length === 0) return;
    const canvas = quickDrawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const last = quickDrawHistory[quickDrawHistory.length - 1];
    ctx.putImageData(last, 0, 0);
    setQuickDrawHistory(prev => prev.slice(0, -1));
  };

  const handleToggleQuickDrawCourtView = (mode: CourtViewMode) => {
    setQuickDrawCourtView(mode);
    setQuickDrawHistory([]);
    const canvas = quickDrawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawVolleyballCourt(ctx, canvas.width, canvas.height, mode);
  };

  const handleClearQuickDraw = () => {
    setQuickDrawHistory([]);
    const canvas = quickDrawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawVolleyballCourt(ctx, canvas.width, canvas.height, quickDrawCourtView);
  };

  // Quick draw canvas background initializer
  useEffect(() => {
    if (showQuickDrawModal && quickDrawCanvasRef.current) {
      const canvas = quickDrawCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawVolleyballCourt(ctx, canvas.width, canvas.height, quickDrawCourtView);
    }
  }, [showQuickDrawModal, quickDrawCourtView]);

  const handleSaveQuickDrawTactic = async () => {
    if (!quickDrawCanvasRef.current || !quickDrawTitle.trim()) return;
    setSaving(true);
    try {
      const canvas = quickDrawCanvasRef.current;
      const drawingData = canvas.toDataURL('image/png');
      const scope: TacticScope = tacticsSection === 'matches' ? 'MECZ_LIGOWY' : tacticsSection === 'sparingi' ? 'SPARING' : 'TURNIEJ';

      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TACTIC',
          tactic: {
            title: quickDrawTitle.trim(),
            phase: quickDrawPhase,
            rotation: quickDrawRotation,
            scope,
            eventId: activeTargetEvent?.id || undefined,
            matchId: activeTargetMatch?.id || undefined,
            description: `Schemat taktyczny rozrysowany pisakiem na mecz vs ${activeTargetEvent?.opponent || activeTargetMatch?.opponent || 'Rywal'}.`,
            courtPositions: positions,
            directives: [
              `Faza: ${quickDrawPhase}`,
              `Rotacja wyjściowa: ${quickDrawRotation}`,
              `Data rozrysowania: ${new Date().toLocaleDateString('pl-PL')}`
            ],
            drawingData,
            tacticalNotes: `Wariant taktyczny z tablicy: ${quickDrawTitle.trim()}`
          }
        })
      });

      if (res.ok) {
        setShowQuickDrawModal(false);
        await fetchData();
      } else {
        alert('Błąd zapisu schematu taktycznego');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas zapisywania');
    } finally {
      setSaving(false);
    }
  };

    // Pełna zunifikowana lista wszystkich meczów i wydarzeń do wyboru w nagłówku tablicy
  const allTargetOptions = useMemo(() => {
    const list: Array<{
      key: string;
      id: string;
      type: string;
      title: string;
      opponent: string;
      date: string;
      icon: string;
    }> = [];
    const seen = new Set<string>();

    events.forEach(e => {
      const oppKey = `${e.type}_${(e.opponent || e.title).toLowerCase().trim()}`;
      if (!seen.has(oppKey)) {
        seen.add(oppKey);
        const icon = e.type === 'TRENING' ? '🏐' : e.type === 'SPARING' ? '⚔️' : e.type === 'TURNIEJ' ? '🏆' : '🏐';
        list.push({
          key: `EVENT_${e.id}`,
          id: e.id,
          type: e.type,
          title: e.opponent ? `${e.title.includes('(R') ? e.title.split(':')[0] + ' ' : ''}vs ${e.opponent}` : e.title,
          opponent: e.opponent || e.title,
          date: e.date,
          icon
        });
      }
    });

    matches.forEach(m => {
      const oppKey = `MECZ_${m.opponent.toLowerCase().trim()}`;
      if (!seen.has(oppKey)) {
        seen.add(oppKey);
        list.push({
          key: `MATCH_${m.id}`,
          id: m.id,
          type: 'MECZ',
          title: `vs ${m.opponent}`,
          opponent: m.opponent,
          date: m.date,
          icon: '🏆'
        });
      }
    });

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, matches]);

  // Automatyczny wybór pierwszego meczu/wydarzenia przy wejściu w sekcję rozpisek
  useEffect(() => {
    if (tacticsSection !== 'board') {
      const matchExists = sectionTargetOptions.some(opt => opt.key === selectedContextKey);
      if (!matchExists) {
        if (sectionTargetOptions.length > 0) {
          setSelectedContextKey(sectionTargetOptions[0].key);
        } else {
          setSelectedContextKey('');
          setTacticComment('');
          setSelectedTactic(null);
          setLastAddedTactic(null);
        }
      }
    }
  }, [tacticsSection, sectionTargetOptions, selectedContextKey]);

  // Indeks aktualnie wybranego meczu w liście danej sekcji
  const currentSectionTargetIndex = useMemo(() => {
    return sectionTargetOptions.findIndex(opt => opt.key === selectedContextKey);
  }, [sectionTargetOptions, selectedContextKey]);

  const handlePrevTarget = () => {
    if (currentSectionTargetIndex > 0) {
      setSelectedContextKey(sectionTargetOptions[currentSectionTargetIndex - 1].key);
    }
  };

  const handleNextTarget = () => {
    if (currentSectionTargetIndex >= 0 && currentSectionTargetIndex < sectionTargetOptions.length - 1) {
      setSelectedContextKey(sectionTargetOptions[currentSectionTargetIndex + 1].key);
    }
  };

  // Dodawanie i usuwanie dyrektyw punktowych
  const handleAddUnitDirective = () => {
    if (!newDirectiveInput.trim()) return;
    setUnitDirectives(prev => [...prev, newDirectiveInput.trim()]);
    setNewDirectiveInput('');
  };

  const handleRemoveUnitDirective = (index: number) => {
    setUnitDirectives(prev => prev.filter((_, i) => i !== index));
  };

  // Przypisanie zawodnika ze składu do pozycji nominalnej (R, Ś1, P1, A, Ś2, P2, L)
  const handleAssignPlayerToCourtRole = (roleCode: string, memberId: string) => {
    const member = allSquadMembers.find(m => m.id === memberId);
    if (!member) return;
    setPositions(prev =>
      prev.map(p =>
        p.roleCode === roleCode
          ? { ...p, name: `${member.name} (${roleCode})`, number: member.number || p.number }
          : p
      )
    );
  };

  // Przełączanie pozycji na tablicy: Libero (L) ⇄ Środkowy (Ś)
  const handleToggleLiberoMiddle = () => {
    setPositions(prev => {
      const hasL = prev.some(p => p.roleCode === 'L');
      if (hasL) {
        // Zamień Libero (L) na Środkowego (Ś)
        return prev.map(p => {
          if (p.roleCode === 'L') {
            const hasS1 = prev.some(item => item.roleCode === 'Ś1' || item.roleCode === 'Ś');
            const newRole = hasS1 ? 'Ś2' : 'Ś';
            return {
              ...p,
              roleCode: newRole,
              name: `Środkowy (${newRole})`,
              task: p.task ? p.task.replace(/Libero/gi, 'Środkowy') : 'Środkowy w II linii'
            };
          }
          return p;
        });
      } else {
        // Zamień Środkowego w II linii (strefy 1, 6, 5 lub Ś2 / Ś) na Libero (L)
        const target = prev.find(p => p.roleCode === 'Ś2' || p.roleCode === 'Ś' || ((p.roleCode === 'Ś1' || p.roleCode.startsWith('Ś')) && [1, 6, 5].includes(p.zone)));
        const targetId = target?.id || prev.find(p => p.roleCode.startsWith('Ś'))?.id;
        if (!targetId) return prev;
        return prev.map(p => {
          if (p.id === targetId) {
            return {
              ...p,
              roleCode: 'L',
              name: 'Libero (L)',
              task: p.task ? p.task.replace(/Środkowy/gi, 'Libero') : 'Libero w II linii'
            };
          }
          return p;
        });
      }
    });
  };

  // Zmiana roli konkretnego gracza na boisku (np. bezpośrednio po kliknięciu znacznika gracza)
  const handleSetPlayerRole = (playerId: string, newRole: string) => {
    setPositions(prev =>
      prev.map(p => {
        if (p.id !== playerId) return p;
        const isNowLibero = newRole === 'L';
        const newName = isNowLibero
          ? 'Libero (L)'
          : newRole === 'Ś' || newRole === 'Ś2' || newRole === 'Ś1'
          ? `Środkowy (${newRole})`
          : `${newRole}`;
        const newTask = isNowLibero
          ? (p.task?.replace(/Środkowy/gi, 'Libero') || 'Libero w II linii')
          : (p.task?.replace(/Libero/gi, 'Środkowy') || 'Środkowy w II linii');
        return {
          ...p,
          roleCode: newRole,
          name: newName,
          task: newTask
        };
      })
    );
  };

  // Sync context key when URL searchParams provide an ID
  useEffect(() => {
    if (queryEventId) {
      setSelectedContextKey(`EVENT_${queryEventId}`);
      setLinkedEventId(queryEventId);
    } else if (queryMatchId) {
      setSelectedContextKey(`MATCH_${queryMatchId}`);
      setLinkedMatchId(queryMatchId);
    }
  }, [queryEventId, queryMatchId]);

  // Synchronize tactical directives and scope when active target changes
  useEffect(() => {
    if (!activeTargetEvent && !activeTargetMatch) {
      setTacticComment('');
      setUnitDirectives([]);
      setLinkedEventId('');
      setLinkedMatchId('');
      return;
    }

    // 1. Sprawdź, czy istnieje już zapisana taktyka dla tego meczu / wydarzenia w bazie
    let foundTactic: TacticalPlay | null = null;
    if (activeTargetEvent) {
      foundTactic = tactics.find(t => t.eventId === activeTargetEvent.id) || null;
    } else if (activeTargetMatch) {
      foundTactic = tactics.find(t => t.matchId === activeTargetMatch.id) || null;
    }

    if (foundTactic) {
      setLinkedEventId(foundTactic.eventId || '');
      setLinkedMatchId(foundTactic.matchId || '');
      setTacticScope(foundTactic.scope || 'MECZ_LIGOWY');
      if (foundTactic.tacticalNotes || foundTactic.description) {
        setTacticComment(foundTactic.tacticalNotes || foundTactic.description || '');
      }
      if (foundTactic.directives && foundTactic.directives.length > 0) {
        setUnitDirectives(foundTactic.directives);
      }
      return;
    }

    // 2. Jeśli nie ma jeszcze zapisanej taktyki, przygotuj szablon wyjściowy
    if (activeTargetEvent) {
      setLinkedEventId(activeTargetEvent.id);
      setLinkedMatchId('');
      if (activeTargetEvent.type === 'TRENING') {
        setTacticScope('TRENING');
        setUnitDirectives([
          '🎯 Przyjęcie w 3-osobowym pasie (L + P1 + P2) z dograniem na 2. metr',
          '⚡ Szybkie 1. tempo do środkowego (Ś1/Ś2) przy dobrym przyjęciu',
          '🛡️ Asekuracja atakującego: gracz II linii na 6. metrze',
          '🏐 Zagrywka taktyczna w strefę 1 lub 5 rywali'
        ]);
        setTacticComment('Główne akcenty treningowe: zgranie rozegrania ze środkowymi, przyjęcie zagrywki z rotacji P1 i P6 oraz organizacja kontrataku po obronie.');
      } else if (activeTargetEvent.type === 'SPARING') {
        setTacticScope('SPARING');
        setUnitDirectives([
          `⚔️ Test szóstki wyjściowej z rywalem: ${activeTargetEvent.opponent || 'Rywal'}`,
          '💥 Atak z II linii (pipe) przy obronie kontrataku',
          '🛑 Podwójny blok zamykający prostą na skrzydłach',
          '🔄 Test wariantów gry zmienników w 2. i 3. secie'
        ]);
        setTacticComment(`Odprawa sparingowa vs ${activeTargetEvent.opponent || 'Rywal'}: Skupiamy się na płynności przejść z przyjęcia do ataku oraz zgraniu bloku z obroną w polu.`);
      } else if (activeTargetEvent.type === 'TURNIEJ') {
        setTacticScope('TURNIEJ');
        setUnitDirectives([
          '🏆 Optymalizacja sił i rotacja składem w turnieju',
          '🎯 Stabilne przyjęcie i eliminacja serii punktowych rywala',
          '⚡ Szybkie tempo na skrzydłach i zero przestojów'
        ]);
        setTacticComment('Strategia turniejowa: ekonomiczne gospodarowanie siłami, agresywna zagrywka od pierwszej piłki i maksymalna koncentracja w końcówkach setów.');
      } else {
        setTacticScope('MECZ_LIGOWY');
        setUnitDirectives([
          `🔵 Odprawa ligowa LALS vs ${activeTargetEvent.opponent || 'Rywal'}`,
          '🎯 Maksymalna agresja zagrywką w strefy 1 i 5',
          '🛡️ Strefowy podwójny blok na skrzydłowego rywali',
          '🏐 Libero czyści pole za blokiem na 6. metrze'
        ]);
        setTacticComment(`Plan taktyczny na mecz LALS vs ${activeTargetEvent.opponent || 'Rywal'}: Odrzucenie rywala od siatki trudnym serwisem po skosie, odcięcie lewego skrzydła podwójnym blokiem.`);
      }
    } else if (activeTargetMatch) {
      setLinkedMatchId(activeTargetMatch.id);
      setLinkedEventId('');
      setTacticScope('MECZ_LIGOWY');
      setUnitDirectives([
        `🔵 Odprawa meczowa LALS vs ${activeTargetMatch.opponent}`,
        '🎯 Celowanie zagrywką w strefę 1 (odcięcie rozgrywającego rywali)',
        '🛡️ Podwójny blok zamykający prostą na skrzydle',
        '🏐 Asekuracja i czyszczenie kiwek na 6. metrze'
      ]);
      setTacticComment(`Założenia ligowe vs ${activeTargetMatch.opponent}: Skupienie na własnej zagrywce, asekuracja za blokiem i szybkie tempo na skrzydłach (P1, A).`);
    } else {
      setLinkedEventId('');
      setLinkedMatchId('');
      setTacticScope('OGOLNA');
      setUnitDirectives([
        'Podstawowe pozycje wyjściowe zespołu',
        'Asekuracja i organizacja rozegrania',
        'Zgranie i komunikacja na boisku'
      ]);
      setTacticComment('');
    }
  }, [activeTargetEvent, activeTargetMatch, tactics]);

  // Fetch tactics and events
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tacRes, evtRes, matRes] = await Promise.all([
        fetch('/api/tactics'),
        fetch('/api/events'),
        fetch('/api/matches')
      ]);

      if (tacRes.ok) {
        const d = await tacRes.json();
        const tacs = d.tactics || [];
        setTactics(tacs);
        if (d.materials) setMaterials(d.materials);
        if (d.players) setPlayers(d.players);
        if (queryTacticId) {
          const target = tacs.find((t: TacticalPlay) => t.id === queryTacticId);
          if (target) {
            loadSavedTactic(target);
          }
        } else if (queryEventId) {
          const eventTacs = tacs.filter((t: TacticalPlay) => t.eventId === queryEventId);
          if (eventTacs.length > 0) {
            loadSavedTactic(eventTacs[0]);
          }
        } else if (queryMatchId) {
          const matchTacs = tacs.filter((t: TacticalPlay) => t.matchId === queryMatchId);
          if (matchTacs.length > 0) {
            loadSavedTactic(matchTacs[0]);
          }
        }
      }
      if (evtRes.ok) {
        const d = await evtRes.json();
        setEvents(d.events || []);
      }
      if (matRes.ok) {
        const d = await matRes.json();
        setMatches(d.matches || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync positions when rotation or phase changes
  const applyPreset = (rot: RotationCode, ph: TacticalPhase) => {
    setRotation(rot);
    setPhase(ph);
    if (ROTATION_DEFAULTS[rot] && ROTATION_DEFAULTS[rot][ph]) {
      setPositions([...ROTATION_DEFAULTS[rot][ph]]);
    }
    // Set smart ball position for the phase
    if (ph === 'ZAGRYWKA') {
      setBallPos({ x: 80, y: 94 });
    } else if (ph === 'ATAK') {
      setBallPos({ x: 65, y: 57 });
    } else {
      setBallPos({ x: 50, y: 70 });
    }
  };

  const handleResetPositions = () => {
    applyPreset(rotation, phase);
  };

  const handleUpdatePlayerTask = (playerId: string, newTask: string) => {
    setPositions(prev =>
      prev.map(p => (p.id === playerId ? { ...p, task: newTask } : p))
    );
  };

  // Smooth real-time Drag & Drop listener for players, opponents, and ball
  useEffect(() => {
    if (!draggingId) return;

    const updatePosition = (clientX: number, clientY: number) => {
      const container = courtContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mousePercentX = ((clientX - rect.left) / rect.width) * 100;
      const mousePercentY = ((clientY - rect.top) / rect.height) * 100;

      let rawX: number;
      let rawY: number;

      if (boardOrientation === 'horizontal') {
        // Horizontal mapping: screenX is y (opponents on left, Angels on right), screenY is 100 - x
        rawY = mousePercentX;
        rawX = 100 - mousePercentY;
      } else {
        rawX = mousePercentX;
        rawY = mousePercentY;
      }

      const clampedX = Math.round(Math.max(4, Math.min(96, rawX)));
      const clampedY = Math.round(Math.max(4, Math.min(96, rawY)));

      if (draggingId === 'ball') {
        setBallPos({ x: clampedX, y: clampedY });
      } else if (draggingId.startsWith('opp_')) {
        setOpponentPositions(prev =>
          prev.map(p => (p.id === draggingId ? { ...p, x: clampedX, y: clampedY } : p))
        );
      } else {
        setPositions(prev =>
          prev.map(p => (p.id === draggingId ? { ...p, x: clampedX, y: clampedY } : p))
        );
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updatePosition(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onPointerUp = () => {
      setDraggingId(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('touchcancel', onPointerUp);
    };
  }, [draggingId, boardOrientation]);

  // Canvas setup & resize observer
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (parent) {
        // preserve existing content if any
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx && canvas.width > 0 && canvas.height > 0) {
          tempCtx.drawImage(canvas, 0, 0);
        }

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        const ctx = canvas.getContext('2d');
        if (ctx && tempCanvas.width > 0 && tempCanvas.height > 0) {
          ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
        }
      }
    };

    resizeCanvas();
    const timer = setTimeout(resizeCanvas, 150);
    window.addEventListener('resize', resizeCanvas);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [boardOrientation]);

  // Save canvas state to history for undo
  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prev => [...prev.slice(-12), state]);
    } catch (e) {
      // ignore
    }
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const newHistory = [...history];
    const prevState = newHistory.pop();
    setHistory(newHistory);
    if (prevState) {
      ctx.putImageData(prevState, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleClearDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    saveCanvasState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Drawing event handlers (Mouse + Touch)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (lastAddedTactic) setLastAddedTactic(null);
    if (activeTool === 'move') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveCanvasState();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setIsDrawing(true);
    startPos.current = { x, y };

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);

    const actualWidth = activeTool === 'marker' ? 7 : activeTool === 'eraser' ? 26 : lineWidth;
    ctx.strokeStyle = activeTool === 'eraser' ? '#000000' : drawColor;
    ctx.lineWidth = actualWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === 'move') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen' || activeTool === 'marker' || activeTool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === 'move') return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !startPos.current) return;

    if (activeTool === 'arrow') {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      drawArrow(ctx, startPos.current.x, startPos.current.y, x, y, drawColor, lineWidth);
    }
    startPos.current = null;
  };

  // Touch drawing handlers for smartphones and tablets
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (lastAddedTactic) setLastAddedTactic(null);
    if (activeTool === 'move' || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveCanvasState();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    setIsDrawing(true);
    startPos.current = { x, y };

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);

    const actualWidth = activeTool === 'marker' ? 7 : activeTool === 'eraser' ? 26 : lineWidth;
    ctx.strokeStyle = activeTool === 'eraser' ? '#000000' : drawColor;
    ctx.lineWidth = actualWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === 'move' || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen' || activeTool === 'marker' || activeTool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === 'move') return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !startPos.current) return;

    if (activeTool === 'arrow' && e.changedTouches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.changedTouches[0];
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;
      drawArrow(ctx, startPos.current.x, startPos.current.y, x, y, drawColor, lineWidth);
    }
    startPos.current = null;
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    width: number
  ) => {
    const headLength = 16;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';

    // Shaft
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Optional click to move selected player (when in 'move' mode and can edit)
  const handleCourtClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEffectiveEditor) return;
    if (activeTool !== 'move') return;
    if (!selectedPlayerId || draggingId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const clickY = Math.max(4, Math.min(96, ((e.clientY - rect.top) / rect.height) * 100));

    if (selectedPlayerId === 'ball') {
      setBallPos({ x: Math.round(clickX), y: Math.round(clickY) });
    } else if (selectedPlayerId.startsWith('opp_')) {
      setOpponentPositions(prev =>
        prev.map(p => (p.id === selectedPlayerId ? { ...p, x: Math.round(clickX), y: Math.round(clickY) } : p))
      );
    } else {
      setPositions(prev =>
        prev.map(p => (p.id === selectedPlayerId ? { ...p, x: Math.round(clickX), y: Math.round(clickY) } : p))
      );
    }
  };

  const handleOpenSaveModal = () => {
    if (!tacticTitle.trim()) {
      const unitName = activeTargetEvent ? activeTargetEvent.title : (activeTargetMatch ? `LALS vs ${activeTargetMatch.opponent}` : '');
      setTacticTitle(unitName ? `${unitName} • R${rotation} (${phase})` : `Plan: Rotacja ${rotation} (${phase})`);
    }
    if (activeTargetEvent) {
      setLinkedEventId(activeTargetEvent.id);
      if (activeTargetEvent.type === 'TRENING') setTacticScope('TRENING');
      else if (activeTargetEvent.type === 'SPARING') setTacticScope('SPARING');
      else if (activeTargetEvent.type === 'TURNIEJ') setTacticScope('TURNIEJ');
      else setTacticScope('MECZ_LIGOWY');
    } else if (activeTargetMatch) {
      setLinkedMatchId(activeTargetMatch.id);
      setTacticScope('MECZ_LIGOWY');
    } else if (!linkedMatchId && matches.length > 0) {
      setLinkedMatchId(matches[0].id);
      setTacticScope('MECZ_LIGOWY');
    }
    setShowSaveModal(true);
  };

  // Load a saved tactic onto the board (with legacy auto-adaptation)
  const loadSavedTactic = (tactic: TacticalPlay) => {
    setSelectedTactic(tactic);
    setTacticTitle(tactic.title || '');
    setTacticComment(tactic.tacticalNotes || tactic.description || '');
    setRotation(tactic.rotation);
    setPhase(tactic.phase);
    if (tactic.courtPositions && tactic.courtPositions.length > 0) {
      const needsShift = tactic.courtPositions.every(p => p.y <= 45);
      const adapted = needsShift
        ? tactic.courtPositions.map(p => ({ ...p, y: Math.round(52 + p.y * 0.44) }))
        : tactic.courtPositions;
      setPositions([...adapted]);
    } else {
      if (ROTATION_DEFAULTS[tactic.rotation] && ROTATION_DEFAULTS[tactic.rotation][tactic.phase]) {
        setPositions([...ROTATION_DEFAULTS[tactic.rotation][tactic.phase]]);
      }
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (tactic.drawingData) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = tactic.drawingData;
        }
      }
    }
    setTacticsSection('board');
  };

  // Start fresh clean draft on the board
  const handleStartNewDraft = () => {
    setSelectedTactic(null);
    setLastAddedTactic(null);
    setTacticTitle('');
    setTacticComment('');
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHistory([]);
    applyPreset(rotation, phase);
  };

  // 1-Click Update of current loaded tactic (overwrites canvas & player positions)
  const handleQuickUpdateCurrentTactic = async () => {
    if (!selectedTactic) return;
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const drawingData = canvas ? canvas.toDataURL('image/png') : undefined;

      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'UPDATE_TACTIC',
          tactic: {
            id: selectedTactic.id,
            title: tacticTitle || selectedTactic.title,
            phase,
            rotation,
            courtPositions: positions,
            directives: selectedTactic.directives?.filter(d => !/^[A-Za-zżźćńółęąśŻŹĆĄŚĘŁÓŃ\s]+\s*\([A-Z0-9ŚśŁł]+\)\s*:/i.test(d)) || [],
            drawingData,
            tacticalNotes: tacticComment || selectedTactic.tacticalNotes || '',
            description: tacticComment || selectedTactic.description || ''
          }
        })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.tactic) {
          setSelectedTactic(d.tactic);
          setTactics(prev => prev.map(t => (t.id === d.tactic.id ? d.tactic : t)));
        }
        alert('Taktyka została pomyślnie zaktualizowana!');
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd aktualizacji taktyki');
      }
    } catch (e) {
      console.error(e);
      alert('Błąd podczas zapisywania zmian');
    } finally {
      setSaving(false);
    }
  };

  // Save current tactic & drawing to DB
  const handleSaveTactic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tacticTitle.trim()) return;
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const drawingData = canvas ? canvas.toDataURL('image/png') : undefined;

      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TACTIC',
          tactic: {
            title: tacticTitle,
            phase,
            rotation,
            scope: tacticScope,
            eventId: linkedEventId || undefined,
            matchId: linkedMatchId || undefined,
            description: tacticComment,
            courtPositions: positions,
            directives: [],
            drawingData,
            tacticalNotes: tacticComment
          }
        })
      });

      if (res.ok) {
        const d = await res.json();
        setShowSaveModal(false);
        setTacticTitle('');
        setTacticComment('');
        await fetchData();
        if (d.tactic) {
          setLastAddedTactic({
            id: d.tactic.id,
            title: d.tactic.title || tacticTitle,
            matchTitle: activeTargetEvent ? activeTargetEvent.title : (activeTargetMatch ? `vs ${activeTargetMatch.opponent}` : 'Ogólna'),
            rotation,
            phase
          });
          setSelectedTactic(null);
        }
        alert('Zrzut taktyczny został pomyślnie zapisany i przypisany do meczu!');
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu taktyki');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Populate court positions using confirmed attendees from the active event
  const handlePopulateConfirmedPlayers = () => {
    if (!activeTargetEvent) {
      alert('Wybierz konkretne wydarzenie (trening, sparing lub mecz) z listy powyżej.');
      return;
    }
    const confirmed = (activeTargetEvent.attendees || []).filter(a => a.status === 'BEDE');
    if (confirmed.length === 0) {
      alert(`Brak potwierdzonych obecności (status "Będę") w ankiecie dla: ${activeTargetEvent.title}.`);
      return;
    }

    // Attach player details (number, position) if known
    const attendeesWithInfo = confirmed.map(c => {
      const p = players.find(pl => pl.id === c.userId || pl.name.toLowerCase() === c.userName.toLowerCase());
      return {
        userId: c.userId,
        name: c.userName,
        number: p?.number || 99,
        position: p?.position || ''
      };
    });

    // Helper queues by position
    const setters = attendeesWithInfo.filter(p => p.position.toLowerCase().includes('rozgr') || p.position.toLowerCase().includes('setter'));
    const outsides = attendeesWithInfo.filter(p => p.position.toLowerCase().includes('przyjm') || p.position.toLowerCase().includes('outside'));
    const middles = attendeesWithInfo.filter(p => p.position.toLowerCase().includes('środ') || p.position.toLowerCase().includes('middle'));
    const opposites = attendeesWithInfo.filter(p => p.position.toLowerCase().includes('atak') || p.position.toLowerCase().includes('opposite'));
    const liberos = attendeesWithInfo.filter(p => p.position.toLowerCase().includes('libero'));

    const unassigned = [...attendeesWithInfo];

    const pickPlayer = (group: typeof attendeesWithInfo) => {
      if (group.length > 0) {
        const p = group.shift()!;
        const idx = unassigned.findIndex(u => u.userId === p.userId);
        if (idx !== -1) unassigned.splice(idx, 1);
        return p;
      }
      if (unassigned.length > 0) {
        return unassigned.shift()!;
      }
      return null;
    };

    const assignedR = pickPlayer(setters);
    const assignedP1 = pickPlayer(outsides);
    const assignedS1 = pickPlayer(middles);
    const assignedA = pickPlayer(opposites);
    const assignedP2 = pickPlayer(outsides);
    const assignedL = pickPlayer(liberos);

    const updated = positions.map(pos => {
      let assigned = null;
      if (pos.roleCode === 'R' && assignedR) assigned = assignedR;
      else if (pos.roleCode === 'P1' && assignedP1) assigned = assignedP1;
      else if (pos.roleCode === 'Ś1' && assignedS1) assigned = assignedS1;
      else if (pos.roleCode === 'A' && assignedA) assigned = assignedA;
      else if (pos.roleCode === 'P2' && assignedP2) assigned = assignedP2;
      else if ((pos.roleCode === 'L' || pos.roleCode === 'Ś2') && assignedL) assigned = assignedL;

      if (assigned) {
        return {
          ...pos,
          name: `${assigned.name} (${pos.roleCode})`,
          number: assigned.number
        };
      }
      return pos;
    });

    setPositions(updated);
    alert(`Ustawiono ${Math.min(confirmed.length, 6)} potwierdzonych graczy z ankiety (${confirmed.map(c => c.userName).join(', ')}) na nominalnych pozycjach boiskowych!`);
  };

  // 1-Click Save board tactic directly as a post to the active match
  const handleSaveAsMatchPost = async () => {
    if (!activeTargetEvent && !activeTargetMatch && selectedContextKey === 'GENERAL') {
      handleOpenSaveModal();
      return;
    }
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const drawingData = canvas ? canvas.toDataURL('image/png') : undefined;

      const opp = activeTargetEvent?.opponent || activeTargetMatch?.opponent || 'Rywal';
      const unitType = activeTargetEvent?.type || 'MECZ';
      const typeLabel = unitType === 'TRENING' ? 'Trening' : unitType === 'SPARING' ? 'Sparing' : unitType === 'TURNIEJ' ? 'Turniej' : 'Mecz';
      
      const title = `Schemat taktyczny: Ustawienie ${rotation} (${phase})`;
      const desc = tacticComment.trim() || `Wariant taktyczny z tablicy: rotacja ${rotation}, faza ${phase}`;

      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TACTIC',
          tactic: {
            title,
            phase,
            rotation,
            scope: unitType === 'TRENING' ? 'TRENING' : unitType === 'SPARING' ? 'SPARING' : unitType === 'TURNIEJ' ? 'TURNIEJ' : 'MECZ_LIGOWY',
            eventId: activeTargetEvent?.id,
            matchId: activeTargetMatch?.id,
            targetOpponent: opp,
            description: desc,
            courtPositions: positions,
            directives: [],
            drawingData,
            tacticalNotes: desc
          }
        })
      });

      if (res.ok) {
        const d = await res.json();
        await fetchData();
        if (d.tactic) {
          setLastAddedTactic({
            id: d.tactic.id,
            title: d.tactic.title || title,
            matchTitle: `${typeLabel} vs ${opp}`,
            rotation: d.tactic.rotation || rotation,
            phase: d.tactic.phase || phase
          });
          setSelectedTactic(null);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu schematu');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas zapisywania');
    } finally {
      setSaving(false);
    }
  };

  // Save text note directly as a post to the active match
  const handleSaveNotePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notePostContent.trim()) return;
    setSavingNote(true);
    try {
      const opp = activeTargetEvent?.opponent || activeTargetMatch?.opponent || 'Rywal';
      const unitType = activeTargetEvent?.type || 'MECZ';
      const title = notePostTitle.trim() || `Założenia taktyczne: vs ${opp}`;

      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TACTIC',
          tactic: {
            title,
            phase: 'PRZYJECIE',
            rotation: 'P1',
            scope: unitType === 'TRENING' ? 'TRENING' : unitType === 'SPARING' ? 'SPARING' : unitType === 'TURNIEJ' ? 'TURNIEJ' : 'MECZ_LIGOWY',
            eventId: activeTargetEvent?.id,
            matchId: activeTargetMatch?.id,
            targetOpponent: opp,
            description: notePostContent.trim(),
            courtPositions: positions,
            directives: unitDirectives.length > 0 ? unitDirectives : [],
            drawingData: undefined,
            tacticalNotes: notePostContent.trim()
          }
        })
      });

      if (res.ok) {
        setShowAddNoteModal(false);
        setNotePostTitle('');
        setNotePostContent('');
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu notatki');
      }
    } catch (err) {
      console.error(err);
      alert('Błąd serwera');
    } finally {
      setSavingNote(false);
    }
  };

  // 1-Click Save linked directly to active target unit
  const handleQuickSaveForUnit = async () => {
    if (!activeTargetEvent && !activeTargetMatch) {
      handleOpenSaveModal();
      return;
    }
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const drawingData = canvas ? canvas.toDataURL('image/png') : undefined;

      let defaultTitle = '';
      let scope: TacticScope = 'OGOLNA';
      let eventId: string | undefined = undefined;
      let matchId: string | undefined = undefined;
      let desc = tacticComment.trim() ? tacticComment : '';

      if (activeTargetEvent) {
        eventId = activeTargetEvent.id;
        const dateStr = new Date(activeTargetEvent.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
        if (activeTargetEvent.type === 'TRENING') {
          scope = 'TRENING';
          defaultTitle = `Trening [${dateStr}]: ${activeTargetEvent.title} • Rotacja ${rotation} (${phase})`;
          if (!desc) desc = `Założenia treningowe: ${unitDirectives.join('; ')}`;
        } else if (activeTargetEvent.type === 'SPARING') {
          scope = 'SPARING';
          defaultTitle = `Sparing [${dateStr}] vs ${activeTargetEvent.opponent || 'Rywal'}: Rotacja ${rotation} (${phase})`;
          if (!desc) desc = `Plan sparingowy: ${unitDirectives.join('; ')}`;
        } else if (activeTargetEvent.type === 'TURNIEJ') {
          scope = 'TURNIEJ';
          defaultTitle = `Turniej [${dateStr}] ${activeTargetEvent.title}: Rotacja ${rotation} (${phase})`;
          if (!desc) desc = `Taktyka turniejowa: ${unitDirectives.join('; ')}`;
        } else {
          scope = 'MECZ_LIGOWY';
          defaultTitle = `Mecz LALS [${dateStr}] vs ${activeTargetEvent.opponent || 'Rywal'}: Rotacja ${rotation} (${phase})`;
          if (!desc) desc = `Odprawa meczowa LALS: ${unitDirectives.join('; ')}`;
        }
      } else if (activeTargetMatch) {
        matchId = activeTargetMatch.id;
        scope = 'MECZ_LIGOWY';
        const dateStr = new Date(activeTargetMatch.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
        defaultTitle = `Mecz LALS [${dateStr}] vs ${activeTargetMatch.opponent}: Rotacja ${rotation} (${phase})`;
        if (!desc) desc = `Odprawa na mecz ligowy: ${unitDirectives.join('; ')}`;
      }

      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TACTIC',
          tactic: {
            title: defaultTitle,
            phase,
            rotation,
            scope,
            eventId,
            matchId,
            description: desc,
            courtPositions: positions,
            directives: unitDirectives.filter(d => !/^[A-Za-zżźćńółęąśŻŹĆĄŚĘŁÓŃ\s]+\s*\([A-Z0-9ŚśŁł]+\)\s*:/i.test(d)),
            drawingData,
            tacticalNotes: desc
          }
        })
      });

      if (res.ok) {
        const d = await res.json();
        await fetchData();
        if (d.tactic) {
          setLastAddedTactic({
            id: d.tactic.id,
            title: d.tactic.title || tacticTitle,
            matchTitle: activeTargetEvent ? activeTargetEvent.title : (activeTargetMatch ? `vs ${activeTargetMatch.opponent}` : 'Ogólna'),
            rotation,
            phase
          });
          setSelectedTactic(null);
        }
        alert(`Pomyślnie zapisano taktykę dla tej jednostki! Pojawi się ona bezpośrednio w terminarzu i profilu meczu.`);
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu taktyki');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Add a player suggestion / discussion post
  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTactic || !newPostContent.trim()) return;
    setSubmittingPost(true);
    try {
      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADD_POST',
          tacticId: selectedTactic.id,
          content: newPostContent
        })
      });
      const d = await res.json();
      if (res.ok) {
        setNewPostContent('');
        await fetchData();
        // Update selected tactic posts
        if (selectedTactic) {
          const updatedPosts = [d.post, ...(selectedTactic.posts || [])];
          setSelectedTactic({ ...selectedTactic, posts: updatedPosts });
        }
        alert(d.message || 'Twoja sugestia została dodana!');
      } else {
        alert(d.error || 'Błąd dodawania wpisu');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingPost(false);
    }
  };



  // Update post status (Accept / Reject / Comment)
  const handleUpdatePostStatus = async (
    postId: string,
    status: 'ZAAKCEPTOWANY' | 'ODRZUCONY',
    coachComment?: string
  ) => {
    if (!selectedTactic) return;
    try {
      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'UPDATE_POST_STATUS',
          tacticId: selectedTactic.id,
          postId,
          status,
          coachComment
        })
      });
      if (res.ok) {
        setEditingPostModal(null);
        setEditCoachFeedback('');
        await fetchData();
        // Update local state
        if (selectedTactic && selectedTactic.posts) {
          const updated = selectedTactic.posts.map(p =>
            p.id === postId ? { ...p, status, coachComment: coachComment || p.coachComment } : p
          );
          setSelectedTactic({ ...selectedTactic, posts: updated });
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd aktualizacji statusu');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Grant editing permission to a player upon request
  const handleGrantTacticEdit = async (targetUserId: string, postId: string) => {
    if (!selectedTactic) return;
    const confirmGrant = window.confirm('Czy na pewno chcesz odblokować temu zawodnikowi pełne uprawnienia do edycji tablicy taktycznej?');
    if (!confirmGrant) return;

    try {
      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'GRANT_PLAYER_TACTIC_EDIT',
          targetUserId,
          postId,
          tacticId: selectedTactic.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Uprawnienia zostały pomyślnie nadane!');
        await fetchData();
        if (selectedTactic.posts) {
          const updated = selectedTactic.posts.map(p =>
            p.id === postId
              ? { ...p, status: 'ZAAKCEPTOWANY' as const, coachComment: `🔑 Trener ${user?.name || 'Hubert'} zaakceptował prośbę i odblokował uprawnienia do edycji taktyki!` }
              : p
          );
          setSelectedTactic({ ...selectedTactic, posts: updated });
        }
      } else {
        alert(data.error || 'Błąd przyznawania uprawnień');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas nadawania uprawnień');
    }
  };

  // Material handlers (PDF & Graphics)
  const handleMaterialFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setMaterialType(isPdf ? 'PDF' : 'IMAGE');
    setMaterialFileName(file.name);
    setMaterialFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    if (!materialTitle) {
      setMaterialTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    const reader = new FileReader();
    reader.onload = ev => {
      setMaterialFileUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle.trim() || !materialFileUrl) {
      alert('Podaj tytuł materiału oraz wybierz plik PDF lub grafikę!');
      return;
    }

    setUploadingMaterial(true);
    try {
      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADD_MATERIAL',
          material: {
            title: materialTitle.trim(),
            type: materialType,
            fileUrl: materialFileUrl,
            fileName: materialFileName,
            fileSize: materialFileSize,
            scope: materialScope,
            eventId: materialEventId || undefined,
            description: materialDescription.trim() || undefined
          }
        })
      });

      if (res.ok) {
        setShowAddMaterialModal(false);
        setMaterialTitle('');
        setMaterialFileUrl('');
        setMaterialFileName('');
        setMaterialFileSize('');
        setMaterialDescription('');
        await fetchData();
        alert('Materiał taktyczny został pomyślnie dodany!');
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd zapisu materiału');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas dodawania materiału');
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten materiał taktyczny?')) return;
    try {
      const res = await fetch(`/api/tactics?id=${materialId}&type=MATERIAL`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTactic = async (tacticId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten zrzut taktyczny?')) return;
    try {
      const res = await fetch(`/api/tactics?id=${tacticId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedTactic?.id === tacticId) {
          setSelectedTactic(null);
        }
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Błąd usuwania taktyki');
      }
    } catch (e) {
      console.error(e);
      alert('Wystąpił błąd podczas usuwania taktyki');
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      if (materialFilter === 'PDF' && m.type !== 'PDF') return false;
      if (materialFilter === 'IMAGE' && m.type !== 'IMAGE') return false;
      return true;
    });
  }, [materials, materialFilter]);

  const isLockedToUnit = Boolean(queryEventId || queryMatchId);

  const unitTactics = useMemo(() => {
    if (!isLockedToUnit) return [];
    return tactics.filter(t => {
      if (queryEventId && (t.eventId === queryEventId || (activeTargetEvent && t.eventId === activeTargetEvent.id))) {
        return true;
      }
      if (queryMatchId && (t.matchId === queryMatchId || (activeTargetMatch && t.matchId === activeTargetMatch.id))) {
        return true;
      }
      if (queryTacticId && t.id === queryTacticId) {
        return true;
      }
      return false;
    });
  }, [tactics, isLockedToUnit, queryEventId, queryMatchId, queryTacticId, activeTargetEvent, activeTargetMatch]);

  // Comprehensive helper to get context & metadata for any tactic
  const getTacticTargetInfo = (tac: TacticalPlay) => {
    if (tac.matchId) {
      const m = matches.find(match => match.id === tac.matchId);
      if (m) {
        return {
          type: 'MECZ_LIGOWY' as const,
          category: 'MECZE_LALS' as const,
          label: `Mecz LALS vs ${m.opponent}`,
          opponent: m.opponent,
          date: m.date,
          badgeColor: 'sky',
          icon: '🏆',
          isMatch: true
        };
      }
    }
    if (tac.eventId) {
      const e = events.find(evt => evt.id === tac.eventId);
      if (e) {
        const isLalsMatch = e.type === 'MECZ' || tac.scope === 'MECZ_LIGOWY';
        return {
          type: (isLalsMatch ? 'MECZ_LIGOWY' : e.type) as any,
          category: isLalsMatch ? ('MECZE_LALS' as const) : e.type === 'TRENING' ? ('TRENING' as const) : ('SPARINGI' as const),
          label: e.title || (e.opponent ? `vs ${e.opponent}` : 'Wydarzenie'),
          opponent: e.opponent || tac.targetOpponent,
          date: e.date,
          badgeColor: isLalsMatch ? 'sky' : e.type === 'SPARING' ? 'amber' : e.type === 'TRENING' ? 'emerald' : 'purple',
          icon: isLalsMatch ? '🏆' : e.type === 'SPARING' ? '⚔️' : e.type === 'TRENING' ? '🏐' : '🥇',
          isMatch: isLalsMatch
        };
      }
    }
    if (tac.targetOpponent) {
      const isLals = tac.scope === 'MECZ_LIGOWY';
      return {
        type: (tac.scope || 'MECZ_LIGOWY') as any,
        category: isLals ? ('MECZE_LALS' as const) : ('SPARINGI' as const),
        label: `${isLals ? 'Mecz LALS' : 'Sparing'} vs ${tac.targetOpponent}`,
        opponent: tac.targetOpponent,
        date: null,
        badgeColor: isLals ? 'sky' : 'amber',
        icon: isLals ? '🏆' : '⚔️',
        isMatch: isLals
      };
    }
    if (tac.scope === 'MECZ_LIGOWY') {
      return {
        type: 'MECZ_LIGOWY' as const,
        category: 'MECZE_LALS' as const,
        label: 'Mecz Ligowy LALS',
        opponent: null,
        date: null,
        badgeColor: 'sky',
        icon: '🏆',
        isMatch: true
      };
    }
    if (tac.scope === 'SPARING') {
      return {
        type: 'SPARING' as const,
        category: 'SPARINGI' as const,
        label: 'Sparing Zespołu',
        opponent: null,
        date: null,
        badgeColor: 'amber',
        icon: '⚔️',
        isMatch: false
      };
    }
    if (tac.scope === 'TURNIEJ') {
      return {
        type: 'TURNIEJ' as const,
        category: 'SPARINGI' as const,
        label: 'Turniej Zespołu',
        opponent: null,
        date: null,
        badgeColor: 'purple',
        icon: '🥇',
        isMatch: false
      };
    }
    if (tac.scope === 'TRENING') {
      return {
        type: 'TRENING' as const,
        category: 'TRENING' as const,
        label: 'Trening Zespołu',
        opponent: null,
        date: null,
        badgeColor: 'emerald',
        icon: '🏐',
        isMatch: false
      };
    }
    return {
      type: 'OGOLNA' as const,
      category: 'OGOLNA' as const,
      label: 'Baza Ogólna Zespołu',
      opponent: null,
      date: null,
      badgeColor: 'slate',
      icon: '📘',
      isMatch: false
    };
  };

  // Unique match/event list for dropdown filter
  const availableMatchOptions = useMemo(() => {
    const list: { key: string; label: string; date?: string; type: 'MECZ' | 'SPARING' | 'OGOLNA' }[] = [
      { key: 'WSZYSCY', label: 'Wszystkie mecze i rywale', type: 'OGOLNA' },
      { key: 'OGOLNA', label: '📘 Tylko Baza Ogólna Zespołu', type: 'OGOLNA' }
    ];

    matches.forEach(m => {
      const dateStr = m.date ? new Date(m.date).toLocaleDateString('pl-PL') : '';
      list.push({
        key: `MATCH_${m.id}`,
        label: `🏆 Mecz LALS: vs ${m.opponent}${dateStr ? ` (${dateStr})` : ''}`,
        date: m.date,
        type: 'MECZ'
      });
    });

    events
      .filter(e => e.type === 'SPARING' || e.type === 'MECZ' || e.type === 'TURNIEJ')
      .forEach(e => {
        const dateStr = e.date ? new Date(e.date).toLocaleDateString('pl-PL') : '';
        list.push({
          key: `EVENT_${e.id}`,
          label: `${e.type === 'MECZ' ? '🏆' : '⚔️'} ${e.title}${e.opponent ? ` vs ${e.opponent}` : ''}${dateStr ? ` (${dateStr})` : ''}`,
          date: e.date,
          type: e.type === 'MECZ' ? 'MECZ' : 'SPARING'
        });
      });

    return list;
  }, [matches, events]);

  // Accurate counts for playbook category tabs
  const categoryCounts = useMemo(() => {
    let lals = 0;
    let sparing = 0;
    let ogolna = 0;
    let trening = 0;

    tactics.forEach(tac => {
      const target = getTacticTargetInfo(tac);
      if (target.isMatch || tac.scope === 'MECZ_LIGOWY') lals++;
      else if (target.category === 'SPARINGI') sparing++;
      else if (target.category === 'TRENING') trening++;
      else ogolna++;
    });

    return {
      all: tactics.length,
      lals,
      sparing,
      ogolna,
      trening
    };
  }, [tactics, matches, events]);

  const matchesCount = useMemo(() => events.filter(e => e.type === 'MECZ' || Boolean(e.opponent && e.title.toLowerCase().includes('lals'))).length, [events]);
  const sparringsCount = useMemo(() => events.filter(e => e.type === 'SPARING').length, [events]);
  const tournamentsCount = useMemo(() => events.filter(e => e.type === 'TURNIEJ').length, [events]);
  const trainingsCount = useMemo(() => events.filter(e => e.type === 'TRENING').length, [events]);

  const filteredTactics = useMemo(() => {
    if (isLockedToUnit) {
      return unitTactics;
    }

    return tactics.filter(tac => {
      const target = getTacticTargetInfo(tac);

      // 1. Category Filter
      if (playbookCategory !== 'WSZYSTKIE') {
        if (playbookCategory === 'MECZE_LALS') {
          if (!target.isMatch && tac.scope !== 'MECZ_LIGOWY') return false;
        } else if (playbookCategory === 'SPARINGI') {
          if (target.category !== 'SPARINGI') return false;
        } else if (playbookCategory === 'OGOLNA') {
          if (target.category !== 'OGOLNA' && (tac.matchId || tac.eventId)) return false;
        } else if (playbookCategory === 'TRENING') {
          if (target.category !== 'TRENING') return false;
        }
      }

      // 2. Specific Match/Event Dropdown Filter
      if (playbookMatchFilter !== 'WSZYSCY') {
        if (playbookMatchFilter === 'OGOLNA') {
          if (tac.matchId || tac.eventId || tac.targetOpponent) return false;
        } else if (playbookMatchFilter.startsWith('MATCH_')) {
          const mId = playbookMatchFilter.replace('MATCH_', '');
          if (tac.matchId !== mId) return false;
        } else if (playbookMatchFilter.startsWith('EVENT_')) {
          const eId = playbookMatchFilter.replace('EVENT_', '');
          if (tac.eventId !== eId) return false;
        }
      }

      // 3. Search Query Filter
      if (playbookSearch.trim()) {
        const q = playbookSearch.toLowerCase();
        const inTitle = (tac.title || '').toLowerCase().includes(q);
        const inDesc = (tac.description || '').toLowerCase().includes(q);
        const inTarget = (target.label || '').toLowerCase().includes(q);
        const inOpponent = (target.opponent || '').toLowerCase().includes(q);
        const inRot = (tac.rotation || '').toLowerCase().includes(q);
        const inPhase = (tac.phase || '').toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inTarget && !inOpponent && !inRot && !inPhase) return false;
      }

      return true;
    });
  }, [isLockedToUnit, unitTactics, tactics, playbookCategory, playbookMatchFilter, playbookSearch, matches, events]);

  return (
    <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-6 lg:px-10 xl:px-12 pt-4 sm:pt-6 pb-28 md:pb-16 space-y-3 sm:space-y-4">
      {/* Top Header - Unified Taktyka & Trening Hub */}
      {/* GŁÓWNY NAGŁÓWEK MODUŁU */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-sm">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-athletic leading-tight">
              Taktyka
            </h1>
          </div>
        </div>

        {isArchiveMode && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold shadow-sm">
              <span>🔒 Archiwum</span>
            </div>
          </div>
        )}
      </div>

      {/* GŁÓWNY PODZIAŁ MODUŁU TAKTYKI: TABLICA + ROZPISKI (MECZE, SPARINGI, TURNIEJE, TRENINGI) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/90 shadow-2xs">
        {/* 5 Głównych Zakładek Taktyki - spójny, elegancki pasek segmentowy z dużymi przyciskami pod kciuk */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full lg:w-auto py-0.5">
          <button
            type="button"
            onClick={() => { setTacticsSection('board'); setSelectedTactic(null); setLastAddedTactic(null); }}
            className={`shrink-0 flex items-center justify-center gap-2 h-11 sm:h-10 px-4 rounded-xl text-xs sm:text-sm font-bold transition border whitespace-nowrap cursor-pointer active:scale-95 ${
              tacticsSection === 'board'
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs font-black'
                : 'bg-white/90 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:bg-white'
            }`}
          >
            <Compass className={`w-4 h-4 ${tacticsSection === 'board' ? 'text-sky-200' : 'text-sky-600'}`} />
            <span>Tablica</span>
          </button>

          <button
            type="button"
            onClick={() => { setTacticsSection('matches'); setSelectedTactic(null); setLastAddedTactic(null); }}
            className={`shrink-0 flex items-center justify-center gap-2 h-11 sm:h-10 px-4 rounded-xl text-xs sm:text-sm font-bold transition border whitespace-nowrap cursor-pointer active:scale-95 ${
              tacticsSection === 'matches'
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs font-black'
                : 'bg-white/90 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:bg-white'
            }`}
          >
            <Trophy className={`w-4 h-4 ${tacticsSection === 'matches' ? 'text-sky-200' : 'text-sky-600'}`} />
            <span>Mecze</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${tacticsSection === 'matches' ? 'bg-sky-700/60 text-sky-100 font-black' : 'bg-slate-100 text-slate-600'}`}>
              {matchesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setTacticsSection('sparingi'); setSelectedTactic(null); setLastAddedTactic(null); }}
            className={`shrink-0 flex items-center justify-center gap-2 h-11 sm:h-10 px-4 rounded-xl text-xs sm:text-sm font-bold transition border whitespace-nowrap cursor-pointer active:scale-95 ${
              tacticsSection === 'sparingi'
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs font-black'
                : 'bg-white/90 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:bg-white'
            }`}
          >
            <Swords className={`w-4 h-4 ${tacticsSection === 'sparingi' ? 'text-sky-200' : 'text-slate-600'}`} />
            <span>Sparingi</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${tacticsSection === 'sparingi' ? 'bg-sky-700/60 text-sky-100 font-black' : 'bg-slate-100 text-slate-600'}`}>
              {sparringsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setTacticsSection('turnieje'); setSelectedTactic(null); setLastAddedTactic(null); }}
            className={`shrink-0 flex items-center justify-center gap-2 h-11 sm:h-10 px-4 rounded-xl text-xs sm:text-sm font-bold transition border whitespace-nowrap cursor-pointer active:scale-95 ${
              tacticsSection === 'turnieje'
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs font-black'
                : 'bg-white/90 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:bg-white'
            }`}
          >
            <Crown className={`w-4 h-4 ${tacticsSection === 'turnieje' ? 'text-sky-200' : 'text-slate-600'}`} />
            <span>Turnieje</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${tacticsSection === 'turnieje' ? 'bg-sky-700/60 text-sky-100 font-black' : 'bg-slate-100 text-slate-600'}`}>
              {tournamentsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTacticsSection('trainings')}
            className={`shrink-0 flex items-center justify-center gap-2 h-11 sm:h-10 px-4 rounded-xl text-xs sm:text-sm font-bold transition border whitespace-nowrap cursor-pointer active:scale-95 ${
              tacticsSection === 'trainings'
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs font-black'
                : 'bg-white/90 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:bg-white'
            }`}
          >
            <Volleyball className={`w-4 h-4 ${tacticsSection === 'trainings' ? 'text-sky-200' : 'text-slate-600'}`} />
            <span>Treningi</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${tacticsSection === 'trainings' ? 'bg-sky-700/60 text-sky-100 font-black' : 'bg-slate-100 text-slate-600'}`}>
              {trainingsCount}
            </span>
          </button>
        </div>

        {/* Prawa strona w trybie Tablicy: Kontekst i wygodne przyciski zapisu */}
        {tacticsSection === 'board' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto pt-1.5 lg:pt-0 border-t lg:border-t-0 border-slate-200">
            {/* Wybór kontekstu tablicy */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <select
                value={selectedContextKey}
                onChange={e => setSelectedContextKey(e.target.value)}
                className="flex-1 sm:flex-initial h-10 sm:h-9 bg-white border border-slate-200/90 text-slate-800 rounded-xl px-3 text-xs sm:text-sm font-bold focus:outline-none focus:border-sky-500 shadow-2xs truncate"
                title="Wybierz wydarzenie, którego dotyczy ta taktyka"
              >
                <option value="GENERAL">🌐 Ogólna Tablica Drużyny</option>

                {events.some(e => e.type === 'TRENING') && (
                  <optgroup label="🏐 Najbliższe Treningi">
                    {events.filter(e => e.type === 'TRENING').map(e => (
                      <option key={e.id} value={`EVENT_${e.id}`}>
                        Trening: {new Date(e.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} — {e.title}
                      </option>
                    ))}
                  </optgroup>
                )}

                {events.some(e => e.type === 'SPARING') && (
                  <optgroup label="⚔️ Sparingi">
                    {events.filter(e => e.type === 'SPARING').map(e => (
                      <option key={e.id} value={`EVENT_${e.id}`}>
                        Sparing: {new Date(e.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} vs {e.opponent || 'Rywal'}
                      </option>
                    ))}
                  </optgroup>
                )}

                {(events.some(e => e.type === 'MECZ' || e.title.toLowerCase().includes('lals') || e.title.toLowerCase().includes('mecz')) || matches.length > 0) && (
                  <optgroup label="🏆 Mecze Ligowe LALS">
                    {events.filter(e => e.type === 'MECZ' || e.title.toLowerCase().includes('lals') || e.title.toLowerCase().includes('mecz')).map(e => (
                      <option key={e.id} value={`EVENT_${e.id}`}>
                        Mecz LALS: {new Date(e.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} vs {e.opponent || 'Rywal'}
                      </option>
                    ))}
                    {matches.map(m => (
                      <option key={m.id} value={`MATCH_${m.id}`}>
                        LALS: {new Date(m.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} vs {m.opponent}
                      </option>
                    ))}
                  </optgroup>
                )}

                {events.some(e => e.type === 'TURNIEJ') && (
                  <optgroup label="🥇 Turnieje">
                    {events.filter(e => e.type === 'TURNIEJ').map(e => (
                      <option key={e.id} value={`EVENT_${e.id}`}>
                        Turniej: {new Date(e.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} — {e.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {selectedContextKey !== 'GENERAL' && (
                <button
                  onClick={() => setSelectedContextKey('GENERAL')}
                  className="h-10 sm:h-9 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold transition shadow-2xs whitespace-nowrap cursor-pointer"
                  title="Powrót do ogólnej tablicy"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Narzędzia tablicy */}
            {canEdit && (
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                {tactics.length > 0 && (
                  <button
                    onClick={() => setShowLoadTacticModal(true)}
                    className="flex-1 sm:flex-initial h-10 sm:h-9 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    title="Wczytaj zapisany schemat z bazy"
                  >
                    <FolderArchive className="w-4 h-4 text-sky-600" />
                    <span>Wczytaj</span>
                  </button>
                )}

                <button
                  onClick={handleResetPositions}
                  className="flex-1 sm:flex-initial h-10 sm:h-9 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  title="Przywróć domyślne pozycje"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={handleSaveAsMatchPost}
                  disabled={saving}
                  className="flex-2 sm:flex-initial h-10 sm:h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Zapisz ten schemat bezpośrednio jako post do wybranego meczu"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>
                    {saving ? 'Zapisuję...' : 'Zapisz'}
                  </span>
                </button>

                <button
                  onClick={handleOpenSaveModal}
                  className="flex-1 sm:flex-initial h-10 sm:h-9 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  title="Więcej opcji zapisu (baza ogólna, własny tytuł)"
                >
                  <Save className="w-4 h-4 text-sky-600" />
                  <span>Więcej</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {tacticsSection === 'board' && (
        <>
          {/* PASEK OSTATNIO DODANEGO SCHEMATU (Znika po kliknięciu Nowy szkic / dodaniu nowego / zamknięciu) */}
          {lastAddedTactic && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-sky-50 border border-sky-300 border-l-4 border-l-sky-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top duration-200 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center text-sm shrink-0 font-bold shadow-xs">
                  <Compass className="w-4 h-4 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-200 text-sky-900">
                      Ostatnio dodano:
                    </span>
                    <span className="text-xs font-black text-slate-900 truncate">
                      {lastAddedTactic.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-sky-800 border border-sky-200">
                      {lastAddedTactic.matchTitle}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setTacticsSection(activeTargetEvent?.type === 'SPARING' ? 'sparingi' : activeTargetEvent?.type === 'TURNIEJ' ? 'turnieje' : 'matches');
                    setLastAddedTactic(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white text-sky-900 border border-sky-200 font-bold text-xs hover:bg-sky-50 transition shadow-2xs flex items-center gap-1"
                >
                  <span>Wpisy meczu &rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLastAddedTactic(null);
                    handleStartNewDraft();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs"
                  title="Wyczyść i rozrysuj nowy schemat"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nowy szkic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLastAddedTactic(null)}
                  className="w-7 h-7 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold transition"
                  title="Zamknij"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* TRYB EDYCJI ISTNIEJĄCEGO SCHEMATU (Tylko gdy kliknięto 'Otwórz na tablicy' w feedzie meczu) */}
          {selectedTactic && (() => {
            const target = getTacticTargetInfo(selectedTactic);
            return (
              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50 border border-amber-300 border-l-4 border-l-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-sm shrink-0 font-bold shadow-xs">
                    <Pencil className="w-4 h-4 text-slate-950" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950">
                        Edytujesz schemat:
                      </span>
                      <span className="text-xs font-black text-slate-900 truncate">
                        {selectedTactic.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-800 border border-amber-200">
                        {target.icon} {target.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {canEdit && (
                    <button
                      onClick={handleQuickUpdateCurrentTactic}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-xs"
                      title="Zapisz zmiany w tym schemacie"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Zapisywanie...' : 'Zapisz zmiany'}</span>
                    </button>
                  )}
                  <button
                    onClick={handleStartNewDraft}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    title="Opuść edycję i zacznij czysty szkic"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500" />
                    <span>Nowy szkic</span>
                  </button>
                  <button
                    onClick={() => setSelectedTactic(null)}
                    className="w-7 h-7 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold transition"
                    title="Zamknij tryb edycji"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })()}

      {/* SEKCJA 1: TABLICA TAKTYCZNA (BOISKO I KONSOLA ROZGRYWANIA) */}
      <div className="bg-white border border-slate-300 rounded-3xl p-3 sm:p-5 shadow-md space-y-4 border-t-4 border-t-sky-600">
          
          {/* KONSOLA TAKTYCZNA (ROTACJE P1-P6, NARZĘDZIA I BOISKO) */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3.5 shadow-2xs space-y-2.5">
            {/* Rząd 1: Pasek Rotacji (P1 - P6) i Fazy Gry - duże, dotykowe przyciski */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full">
                <span className="text-[11px] font-black uppercase text-slate-400 shrink-0 mr-0.5">Rotacja:</span>
                {(['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as RotationCode[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => applyPreset(r, phase)}
                    className={`h-9 sm:h-8 px-3 rounded-xl text-xs font-black transition cursor-pointer shrink-0 min-w-[36px] flex items-center justify-center active:scale-95 ${
                      rotation === r
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                    }`}
                    title={`Ustawienie ${r}`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full">
                <span className="text-[11px] font-black uppercase text-slate-400 shrink-0 mr-0.5">Faza:</span>
                {(['PRZYJECIE', 'OBRONA', 'ATAK', 'ZAGRYWKA'] as TacticalPhase[]).map(p => {
                  const label = p === 'PRZYJECIE' ? 'Przyjęcie' : p === 'OBRONA' ? 'Obrona' : p === 'ATAK' ? 'Atak' : 'Zagrywka';
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyPreset(rotation, p)}
                      className={`h-9 sm:h-8 px-3 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center justify-center active:scale-95 ${
                        phase === p
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rząd 2: Główne Przyciski Boiska - wygodne i równe na telefonie */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTool('move')}
                  className={`h-9.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer active:scale-95 ${
                    activeTool === 'move'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm font-black'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-100'
                  }`}
                  title="Przesuwaj: chwyć i przeciągaj zawodników i piłkę"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>Przesuń</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleLiberoMiddle}
                  className={`h-9.5 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                    hasLibero
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      : 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100'
                  }`}
                  title="Przełącz gracza w II linii: Libero (L) ⇄ Środkowy (Ś)"
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center font-black text-[10px] ${
                    hasLibero ? 'bg-amber-500 text-slate-950' : 'bg-sky-600 text-white'
                  }`}>
                    {hasLibero ? 'L' : 'Ś'}
                  </span>
                  <span>{hasLibero ? 'Libero' : 'Środkowy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowOpponents(!showOpponents)}
                  className={`h-9.5 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    showOpponents
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-100'
                  }`}
                  title="Pokaż/ukryj blok i obronę przeciwnika"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Rywale</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBall(!showBall)}
                  className={`h-9.5 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    showBall
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-100'
                  }`}
                  title="Pokaż/ukryj piłkę"
                >
                  <Volleyball className="w-3.5 h-3.5" />
                  <span>Piłka</span>
                </button>

                {/* Przycisk rozwijania narzędzi rysowania */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !showDrawingTools;
                    setShowDrawingTools(next);
                    if (next && activeTool === 'move') {
                      setActiveTool('pen');
                    } else if (!next) {
                      setActiveTool('move');
                    }
                  }}
                  className={`h-9.5 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    showDrawingTools || activeTool !== 'move'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-100'
                  }`}
                  title="Pokaż/ukryj narzędzia pisaka i kolorów"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Rysuj</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetPositions}
                  className="h-9.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                  title="Przywróć domyślne pozycje na boisku"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Przełącznik orientacji boiska: pionowo (telefon) vs poziomo */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="inline-flex items-center p-0.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleToggleOrientation('vertical')}
                    className={`h-8 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                      boardOrientation === 'vertical'
                        ? 'bg-slate-900 text-white font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Widok pionowy (telefon)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Pion</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleOrientation('horizontal')}
                    className={`h-8 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                      boardOrientation === 'horizontal'
                        ? 'bg-slate-900 text-white font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Widok poziomy (desktop / obrócony telefon)"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Poziom</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Rząd 3: Rozwijany panel narzędzi rysowania (widoczny tylko gdy włączono 'Rysuj') */}
            {(showDrawingTools || activeTool !== 'move') && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 flex-wrap animate-in fade-in duration-150">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setActiveTool('pen'); setLineWidth(3); }}
                    className={`h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 transition border cursor-pointer ${
                      activeTool === 'pen'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                    title="Pisak"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Pisak</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTool('arrow')}
                    className={`h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 transition border cursor-pointer ${
                      activeTool === 'arrow'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                    title="Strzałka"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Strzałka</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTool('eraser')}
                    className={`h-7 px-2 rounded-lg text-xs font-bold flex items-center gap-1 transition border cursor-pointer ${
                      activeTool === 'eraser'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                    title="Gumka"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Kolory pisaka */}
                <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-300">
                  {[
                    { hex: '#facc15', label: 'Żółty' },
                    { hex: '#0284c7', label: 'Błękitny' },
                    { hex: '#e11d48', label: 'Czerwony' },
                    { hex: '#0f172a', label: 'Ciemny' }
                  ].map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        setDrawColor(c.hex);
                        if (activeTool === 'move') setActiveTool('pen');
                      }}
                      className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                        drawColor === c.hex ? 'border-sky-500 scale-110 ring-2 ring-sky-300' : 'border-slate-300 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>

                {/* Akcje Cofnij / Wyczyść */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="h-7 px-2 rounded-lg bg-white text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 shadow-2xs transition cursor-pointer flex items-center gap-1"
                    title="Cofnij ostatnią linię"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">Cofnij</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearDrawing}
                    className="h-7 px-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-2xs transition cursor-pointer flex items-center gap-1"
                    title="Wyczyść rysunki"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">Wyczyść</span>
                  </button>
                </div>
              </div>
            )}

            {/* Rząd 4: Tytuł taktyki */}
            <div className="pt-1.5 border-t border-slate-200/80 flex items-center gap-2">
              <input
                type="text"
                value={tacticTitle}
                onChange={(e) => setTacticTitle(e.target.value)}
                placeholder="Wpisz nazwę schematu (np. Przyjęcie P1 ze środkowym)..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-sky-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Full Volleyball Court Canvas Area */}
          <div
            id="tactical-court-container"
            ref={courtContainerRef}
            className={`relative bg-[#0a0f1d] rounded-3xl border-2 border-slate-300/80 shadow-xl overflow-hidden mx-auto select-none transition-all duration-300 ${
              boardOrientation === 'horizontal'
                ? 'aspect-[16/10] sm:aspect-[18/11] max-w-5xl'
                : 'aspect-[9/13] sm:aspect-[9/12] max-w-3xl'
            } ${
              activeTool === 'move' ? 'cursor-default' : 'cursor-crosshair'
            }`}
            onClick={handleCourtClick}
          >
            {/* Outer Playing Boundary Line (White 2.5px with crisp glow) */}
            <div className="absolute inset-3 sm:inset-5 border-[2.5px] border-white rounded-xs pointer-events-none z-1 shadow-[0_0_8px_rgba(255,255,255,0.2)]" />

            {boardOrientation === 'vertical' ? (
              <>
                {/* Top Half: Połowa Rywali (0% - 50%) - Authentic Taraflex Court */}
                <div className="absolute top-3 sm:top-5 left-3 sm:left-5 right-3 sm:right-5 bottom-1/2 bg-gradient-to-b from-[#1a3375] via-[#1d3d8f] to-[#1e40af] pointer-events-none" />

                {/* Opponent 3m Attack Line (at 33.3%) */}
                <div className="absolute top-[33.3%] left-3 sm:left-5 right-3 sm:right-5 border-b-2 border-dashed border-rose-300/80 pointer-events-none z-5" />
                {/* Opponent 3m Extension Dashes outside court */}
                <div className="absolute top-[33.3%] left-0.5 sm:left-1 w-2 sm:w-3 border-b-2 border-dashed border-rose-300/60 pointer-events-none z-5" />
                <div className="absolute top-[33.3%] right-0.5 sm:right-1 w-2 sm:w-3 border-b-2 border-dashed border-rose-300/60 pointer-events-none z-5" />

                {/* Subtle Opponent Zone Watermarks */}
                <div className="absolute top-7 left-6 text-xs font-black text-white/25 select-none pointer-events-none font-mono">V</div>
                <div className="absolute top-7 left-1/2 -translate-x-1/2 text-xs font-black text-white/25 select-none pointer-events-none font-mono">VI</div>
                <div className="absolute top-7 right-6 text-xs font-black text-white/25 select-none pointer-events-none font-mono">I</div>
                <div className="absolute top-[42%] left-6 text-xs font-black text-white/25 select-none pointer-events-none font-mono">IV</div>
                <div className="absolute top-[42%] left-1/2 -translate-x-1/2 text-xs font-black text-white/25 select-none pointer-events-none font-mono">III</div>
                <div className="absolute top-[42%] right-6 text-xs font-black text-white/25 select-none pointer-events-none font-mono">II</div>

                {/* Center Net System: Realistyczna siatka siatkarska (taśma górna, splot oczek, taśma dolna) */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-20 pointer-events-none flex items-center justify-between">
                  {/* Left Post */}
                  <div className="w-3.5 sm:w-4 h-9 sm:h-10 bg-gradient-to-r from-slate-500 to-slate-400 rounded-r border border-slate-600 shadow-md -translate-x-0.5 shrink-0" />

                  {/* Realistic Volleyball Net Band & Woven Mesh */}
                  <div className="flex-1 flex flex-col h-4.5 sm:h-5 shadow-sm relative overflow-hidden">
                    {/* Top White Tape (5cm band) */}
                    <div className="h-1 sm:h-1.5 bg-white border-b border-slate-300 shadow-2xs w-full" />
                    {/* Woven Dark Mesh */}
                    <div className="flex-1 volleyball-net-mesh-h w-full opacity-90" />
                    {/* Bottom White Tape */}
                    <div className="h-0.5 sm:h-1 bg-white/95 border-t border-slate-300/80 w-full" />
                  </div>

                  {/* Right Post */}
                  <div className="w-3.5 sm:w-4 h-9 sm:h-10 bg-gradient-to-l from-slate-500 to-slate-400 rounded-l border border-slate-600 shadow-md translate-x-0.5 shrink-0" />
                </div>

                {/* Center Line Under Net (Official 5cm White Line) */}
                <div className="absolute top-1/2 left-3 sm:left-5 right-3 sm:right-5 h-[2px] bg-white pointer-events-none z-10 -translate-y-1/2" />

                {/* Antennas (Czerwono-białe antenki na liniach bocznych - FIVB official) */}
                <div
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 -translate-x-1/2 h-14 w-2 bg-[repeating-linear-gradient(to_bottom,#ef4444,#ef4444_7px,#ffffff_7px,#ffffff_14px)] rounded-full shadow-lg z-25 pointer-events-none border border-slate-900"
                  title="Antenka siatkarska lewa"
                />
                <div
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 translate-x-1/2 h-14 w-2 bg-[repeating-linear-gradient(to_bottom,#ef4444,#ef4444_7px,#ffffff_7px,#ffffff_14px)] rounded-full shadow-lg z-25 pointer-events-none border border-slate-900"
                  title="Antenka siatkarska prawa"
                />

                {/* Bottom Half: Połowa Angels ZTP (50% - 100%) - Authentic Taraflex Royal Blue */}
                <div className="absolute top-1/2 left-3 sm:left-5 right-3 sm:right-5 bottom-3 sm:bottom-5 bg-gradient-to-b from-[#1e40af] via-[#214dc7] to-[#2563eb] pointer-events-none" />

                {/* Angels ZTP 3m Attack Line (at 66.7%) */}
                <div className="absolute top-[66.7%] left-3 sm:left-5 right-3 sm:right-5 border-b-2 border-dashed border-sky-200/90 pointer-events-none z-5" />
                {/* Angels 3m Extension Dashes outside court */}
                <div className="absolute top-[66.7%] left-0.5 sm:left-1 w-2 sm:w-3 border-b-2 border-dashed border-sky-300/60 pointer-events-none z-5" />
                <div className="absolute top-[66.7%] right-0.5 sm:right-1 w-2 sm:w-3 border-b-2 border-dashed border-sky-300/60 pointer-events-none z-5" />

                {/* Subtle Angels ZTP Zone Watermarks */}
                <div className="absolute top-[55%] left-6 text-xs font-black text-white/25 select-none pointer-events-none font-mono">IV</div>
                <div className="absolute top-[55%] left-1/2 -translate-x-1/2 text-xs font-black text-white/25 select-none pointer-events-none font-mono">III</div>
                <div className="absolute top-[55%] right-6 text-xs font-black text-white/25 select-none pointer-events-none font-mono">II</div>
                <div className="absolute bottom-6 left-6 text-xs font-black text-white/25 select-none pointer-events-none font-mono">V</div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-black text-white/25 select-none pointer-events-none font-mono">VI</div>
                <div className="absolute bottom-6 right-6 text-xs font-black text-white/25 select-none pointer-events-none font-mono">I</div>
              </>
            ) : (
              <>
                {/* Left Half: Połowa Rywali (0% - 50%) */}
                <div className="absolute top-3 sm:top-5 left-3 sm:left-5 right-1/2 bottom-3 sm:bottom-5 bg-gradient-to-r from-[#1a3375] via-[#1d3d8f] to-[#1e40af] pointer-events-none" />

                {/* Opponent 3m Attack Line (at 33.3%) */}
                <div className="absolute left-[33.3%] top-3 sm:top-5 bottom-3 sm:bottom-5 border-r-2 border-dashed border-rose-300/80 pointer-events-none z-5" />
                {/* Opponent 3m Extension Dashes outside court */}
                <div className="absolute left-[33.3%] top-0.5 sm:top-1 h-2 sm:h-3 border-r-2 border-dashed border-rose-300/60 pointer-events-none z-5" />
                <div className="absolute left-[33.3%] bottom-0.5 sm:bottom-1 h-2 sm:h-3 border-r-2 border-dashed border-rose-300/60 pointer-events-none z-5" />

                {/* Opponent Zone Watermarks (Horizontal) */}
                <div className="absolute top-6 left-7 text-xs font-black text-white/25 select-none pointer-events-none font-mono">V</div>
                <div className="absolute top-1/2 -translate-y-1/2 left-7 text-xs font-black text-white/25 select-none pointer-events-none font-mono">VI</div>
                <div className="absolute bottom-6 left-7 text-xs font-black text-white/25 select-none pointer-events-none font-mono">I</div>
                <div className="absolute top-6 left-[41%] text-xs font-black text-white/25 select-none pointer-events-none font-mono">IV</div>
                <div className="absolute top-1/2 -translate-y-1/2 left-[41%] text-xs font-black text-white/25 select-none pointer-events-none font-mono">III</div>
                <div className="absolute bottom-6 left-[41%] text-xs font-black text-white/25 select-none pointer-events-none font-mono">II</div>

                {/* Center Net System: Czysta, profesjonalna siatka w pionie */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center justify-between">
                  {/* Top Post */}
                  <div className="h-3.5 sm:h-4 w-9 sm:w-10 bg-gradient-to-b from-slate-500 to-slate-400 rounded-b border border-slate-600 shadow-md -translate-y-0.5 shrink-0" />

                  {/* Realistic Volleyball Net Band & Woven Mesh (Vertical) */}
                  <div className="flex-1 flex flex-row w-4.5 sm:w-5 shadow-sm relative overflow-hidden">
                    {/* Left White Tape (5cm band) */}
                    <div className="w-1 sm:w-1.5 bg-white border-r border-slate-300 shadow-2xs h-full" />
                    {/* Woven Dark Mesh */}
                    <div className="flex-1 volleyball-net-mesh-v h-full opacity-90" />
                    {/* Right White Tape */}
                    <div className="w-0.5 sm:w-1 bg-white/95 border-l border-slate-300/80 h-full" />
                  </div>

                  {/* Bottom Post */}
                  <div className="h-3.5 sm:h-4 w-9 sm:w-10 bg-gradient-to-t from-slate-500 to-slate-400 rounded-t border border-slate-600 shadow-md translate-y-0.5 shrink-0" />
                </div>

                {/* Center Line Under Net */}
                <div className="absolute left-1/2 top-3 sm:top-5 bottom-3 sm:bottom-5 w-[2px] bg-white pointer-events-none z-10 -translate-x-1/2" />

                {/* Antennas (Czerwono-białe antenki na liniach bocznych - góra i dół) */}
                <div
                  className="absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-2 bg-[repeating-linear-gradient(to_right,#ef4444,#ef4444_7px,#ffffff_7px,#ffffff_14px)] rounded-full shadow-lg z-25 pointer-events-none border border-slate-900"
                  title="Antenka siatkarska górna"
                />
                <div
                  className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 translate-y-1/2 w-14 h-2 bg-[repeating-linear-gradient(to_right,#ef4444,#ef4444_7px,#ffffff_7px,#ffffff_14px)] rounded-full shadow-lg z-25 pointer-events-none border border-slate-900"
                  title="Antenka siatkarska dolna"
                />

                {/* Right Half: Połowa Angels ZTP (50% - 100%) */}
                <div className="absolute top-3 sm:top-5 left-1/2 right-3 sm:right-5 bottom-3 sm:bottom-5 bg-gradient-to-r from-[#1e40af] via-[#214dc7] to-[#2563eb] pointer-events-none" />

                {/* Angels ZTP 3m Attack Line (at 66.7%) */}
                <div className="absolute left-[66.7%] top-3 sm:top-5 bottom-3 sm:bottom-5 border-r-2 border-dashed border-sky-200/90 pointer-events-none z-5" />
                {/* Angels 3m Extension Dashes outside court */}
                <div className="absolute left-[66.7%] top-0.5 sm:top-1 h-2 sm:h-3 border-r-2 border-dashed border-sky-300/60 pointer-events-none z-5" />
                <div className="absolute left-[66.7%] bottom-0.5 sm:bottom-1 h-2 sm:h-3 border-r-2 border-dashed border-sky-300/60 pointer-events-none z-5" />

                {/* Angels ZTP Zone Watermarks (Horizontal) */}
                <div className="absolute top-6 left-[56%] text-xs font-black text-white/25 select-none pointer-events-none font-mono">II</div>
                <div className="absolute top-1/2 -translate-y-1/2 left-[56%] text-xs font-black text-white/25 select-none pointer-events-none font-mono">III</div>
                <div className="absolute bottom-6 left-[56%] text-xs font-black text-white/25 select-none pointer-events-none font-mono">IV</div>
                <div className="absolute top-6 right-7 text-xs font-black text-white/25 select-none pointer-events-none font-mono">I</div>
                <div className="absolute top-1/2 -translate-y-1/2 right-7 text-xs font-black text-white/25 select-none pointer-events-none font-mono">VI</div>
                <div className="absolute bottom-6 right-7 text-xs font-black text-white/25 select-none pointer-events-none font-mono">V</div>
              </>
            )}

            {/* Draggable Volleyball Ball 🏐 */}
            {showBall && (
              <div
                onMouseDown={e => {
                  if (activeTool === 'move' && isEffectiveEditor) {
                    e.stopPropagation();
                    setDraggingId('ball');
                    setSelectedPlayerId('ball');
                  }
                }}
                onTouchStart={e => {
                  if (activeTool === 'move' && isEffectiveEditor) {
                    e.stopPropagation();
                    setDraggingId('ball');
                    setSelectedPlayerId('ball');
                  }
                }}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedPlayerId('ball');
                }}
                style={{
                  left: boardOrientation === 'horizontal' ? `${ballPos.y}%` : `${ballPos.x}%`,
                  top: boardOrientation === 'horizontal' ? `${100 - ballPos.x}%` : `${ballPos.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className={`absolute z-25 flex flex-col items-center select-none transition-transform touch-none p-2 -m-2 ${
                  activeTool === 'move' && isEffectiveEditor ? 'cursor-grab active:cursor-grabbing hover:scale-125' : 'pointer-events-none'
                } ${draggingId === 'ball' ? 'scale-125 z-30' : ''}`}
                title="Piłka siatkarska"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-sky-500 border border-white shadow-xl flex items-center justify-center text-xs ring-2 ring-amber-400/50">
                  🏐
                </div>
              </div>
            )}

            {/* Opponent Draggable Player Markers (when enabled) */}
            {showOpponents && opponentPositions.map(opp => {
              const isSelected = selectedPlayerId === opp.id;
              const isDragging = draggingId === opp.id;
              return (
                <div
                  key={opp.id}
                  title={`${opp.name} (${opp.roleCode})`}
                  onMouseDown={e => {
                    if (activeTool === 'move' && isEffectiveEditor) {
                      e.stopPropagation();
                      setDraggingId(opp.id);
                      setSelectedPlayerId(opp.id);
                    }
                  }}
                  onTouchStart={e => {
                    if (activeTool === 'move' && isEffectiveEditor) {
                      e.stopPropagation();
                      setDraggingId(opp.id);
                      setSelectedPlayerId(opp.id);
                    }
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedPlayerId(isSelected ? null : opp.id);
                  }}
                  style={{
                    left: boardOrientation === 'horizontal' ? `${opp.y}%` : `${opp.x}%`,
                    top: boardOrientation === 'horizontal' ? `${100 - opp.x}%` : `${opp.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-20 flex flex-col items-center select-none transition-transform touch-none p-2 -m-2 ${
                    activeTool === 'move' && isEffectiveEditor ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  } ${isDragging ? 'scale-120 z-30 opacity-90' : isSelected ? 'scale-110 z-25' : 'hover:scale-105'}`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[10px] shadow-lg border-2 transition ${
                      isSelected
                        ? 'bg-rose-500 text-white border-white animate-pulse ring-2 ring-rose-400'
                        : 'bg-rose-600 text-white border-white shadow-md'
                    }`}
                  >
                    {opp.roleCode}
                  </div>
                </div>
              );
            })}

            {/* Angels ZTP Draggable Player Markers */}
            {positions.map(player => {
              const isSelected = selectedPlayerId === player.id;
              const isDragging = draggingId === player.id;
              const isLibero = player.roleCode === 'L';
              return (
                <div
                  key={player.id}
                  title={`${player.name} • Strefa ${player.zone}${player.task ? `: ${player.task}` : ''}`}
                  onMouseDown={e => {
                    if (activeTool === 'move' && isEffectiveEditor) {
                      e.stopPropagation();
                      setDraggingId(player.id);
                      setSelectedPlayerId(player.id);
                    }
                  }}
                  onTouchStart={e => {
                    if (activeTool === 'move' && isEffectiveEditor) {
                      e.stopPropagation();
                      setDraggingId(player.id);
                      setSelectedPlayerId(player.id);
                    }
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedPlayerId(isSelected ? null : player.id);
                  }}
                  style={{
                    left: boardOrientation === 'horizontal' ? `${player.y}%` : `${player.x}%`,
                    top: boardOrientation === 'horizontal' ? `${100 - player.x}%` : `${player.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-20 flex flex-col items-center select-none transition-transform touch-none p-2 -m-2 ${
                    activeTool === 'move' && isEffectiveEditor ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  } ${isDragging ? 'scale-120 z-30 opacity-90' : isSelected ? 'scale-110 z-25' : 'hover:scale-105'}`}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs shadow-lg border-2 transition ${
                      isLibero
                        ? 'bg-amber-500 text-slate-950 border-white'
                        : isSelected
                        ? 'bg-sky-400 text-slate-950 border-white animate-pulse ring-2 ring-sky-300'
                        : 'bg-sky-600 text-white border-white shadow-md'
                    }`}
                  >
                    {player.number ? `#${player.number}` : player.roleCode}
                  </div>

                  {/* Szybkie menu akcji dla wybranego zawodnika: zmiana L ⇄ Ś */}
                  {isSelected && (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-sm text-white px-2 py-1 rounded-xl shadow-xl flex items-center gap-1.5 whitespace-nowrap border border-slate-700 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <span className="text-[10px] font-black text-slate-300 font-mono">
                        {player.roleCode}
                      </span>
                      {isLibero ? (
                        <button
                          type="button"
                          onClick={() => handleSetPlayerRole(player.id, 'Ś')}
                          className="px-2 py-0.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[10px] transition shadow-xs flex items-center gap-1 cursor-pointer"
                          title="Wstaw Środkowego (Ś) zamiast Libero (L)"
                        >
                          <span>Wstaw Ś</span>
                        </button>
                      ) : player.roleCode.startsWith('Ś') ? (
                        <button
                          type="button"
                          onClick={() => handleSetPlayerRole(player.id, 'L')}
                          className="px-2 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] transition shadow-xs flex items-center gap-1 cursor-pointer"
                          title="Wstaw Libero (L) zamiast Środkowego (Ś)"
                        >
                          <span>Wstaw L</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleSetPlayerRole(player.id, 'Ś')}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-sky-600 text-white text-[10px] font-black transition cursor-pointer"
                            title="Zmień na Środkowego (Ś)"
                          >
                            Ś
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetPlayerRole(player.id, 'L')}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white text-[10px] font-black transition cursor-pointer"
                            title="Zmień na Libero (L)"
                          >
                            L
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Drawing Canvas Layer Across the Entire Full Court */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`absolute inset-0 z-15 ${
                !isEffectiveEditor || activeTool === 'move' ? 'pointer-events-none' : 'pointer-events-auto touch-none'
              }`}
            />
          </div>

      </div>



      </>
      )}

      {/* SEKCJA 2: TRENINGI (KONSPEKTY & ĆWICZENIA Z ROZRYSOWANIEM NA BOISKU) */}
      {tacticsSection === 'trainings' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <TrainingPlannerContent mode="TRAININGS" defaultTab="EXERCISES" hideHeader={true} />
        </div>
      )}

      {/* SEKCJA 3: ROZPISKI MECZOWE / SPARINGI / TURNIEJE (POSTY & TIMELINE TAKTYCZNY MECZU) */}
      {tacticsSection !== 'board' && tacticsSection !== 'trainings' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* 1. KARTA MECZU & SZYBKIE NARZĘDZIA */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-3.5">
            {/* Wybór meczu i informacje */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
              {sectionTargetOptions.length > 0 ? (
                <div className="flex items-center gap-1.5 w-full sm:max-w-xl">
                  <button
                    type="button"
                    onClick={handlePrevTarget}
                    disabled={currentSectionTargetIndex <= 0}
                    className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 disabled:opacity-30 disabled:pointer-events-none text-slate-700 flex items-center justify-center transition shrink-0 cursor-pointer active:scale-95"
                    title="Poprzedni mecz"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <select
                    value={selectedContextKey}
                    onChange={e => setSelectedContextKey(e.target.value)}
                    className="flex-1 h-9 bg-slate-50 hover:bg-white border border-slate-200/90 text-slate-900 rounded-xl px-3 text-xs sm:text-sm font-bold focus:outline-none focus:border-sky-500 shadow-2xs min-w-0 truncate cursor-pointer"
                  >
                    {sectionTargetOptions.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {new Date(opt.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} — {opt.title}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleNextTarget}
                    disabled={currentSectionTargetIndex >= sectionTargetOptions.length - 1}
                    className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 disabled:opacity-30 disabled:pointer-events-none text-slate-700 flex items-center justify-center transition shrink-0 cursor-pointer active:scale-95"
                    title="Następny mecz"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Brak zaplanowanych spotkań w tej kategorii.</p>
              )}

              {/* Informacja o lokalizacji i frekwencji */}
              {(activeTargetEvent || activeTargetMatch) && (
                <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap sm:justify-end">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate max-w-[200px]">{activeTargetEvent?.location || activeTargetMatch?.location || 'Hala OSiR, Luboń'}</span>
                  </span>
                  {activeTargetEvent && (activeTargetEvent.attendees || []).filter(a => a.status === 'BEDE').length > 0 && (
                    <Link
                      href={`/events?eventId=${activeTargetEvent.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition shrink-0"
                      title="Zobacz frekwencję w Terminarzu"
                    >
                      <Users className="w-3 h-3 text-emerald-600" />
                      <span>{(activeTargetEvent.attendees || []).filter(a => a.status === 'BEDE').length} obecnych</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Narzędzia i formaty rozpiski: Równy, duży pasek o stałej wysokości 44px pod kciuk */}
            {canEdit && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setTacticsSection('board')}
                  className="col-span-2 sm:col-span-1 h-11 sm:h-10 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 min-h-[44px]"
                  title="Otwórz pełną tablicę taktyczną dla tego meczu"
                >
                  <Compass className="w-4 h-4 text-sky-200 shrink-0" />
                  <span>Tablica taktyczna</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenQuickDrawModal}
                  className="h-11 sm:h-10 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 min-h-[44px]"
                  title="Szybki szkic pisakiem na boisku"
                >
                  <Pencil className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Szybki szkic</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(true)}
                  className="h-11 sm:h-10 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 min-h-[44px]"
                  title="Dodaj notatkę lub wytyczne dla drużyny"
                >
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Notatka</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddMaterialForCurrentTarget('VIDEO')}
                  className="h-11 sm:h-10 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 min-h-[44px]"
                  title="Dodaj wideo rywala z YouTube"
                >
                  <Play className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Wideo rywala</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddMaterialForCurrentTarget('IMAGE')}
                  className="h-11 sm:h-10 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 min-h-[44px]"
                  title="Dodaj zdjęcie lub dokument PDF"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zdjęcie / PDF</span>
                </button>
              </div>
            )}

          </div>

          {/* 4. FEED POSTÓW & ROZPISKA TAKTYCZNA DLA TEGO MECZU */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>📋 Rozpiska & Posty Meczowe</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono text-xs font-black">
                  {currentUnitTactics.length + currentUnitMaterials.length + (tacticComment.trim() ? 1 : 0)}
                </span>
              </h3>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Wszystkie schematy z tablicy, wideo rywala, zdjęcia i wytyczne przypisane do tego meczu.
              </span>
            </div>

            {/* STAN PUSTY: GDY BRAK JESZCZE POSTÓW DLA TEGO MECZU */}
            {currentUnitTactics.length === 0 && currentUnitMaterials.length === 0 && !tacticComment.trim() && (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-200 shadow-xs">
                  <Compass className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900">
                    Brak rozpisanych materiałów dla meczu vs {activeTargetEvent?.opponent || activeTargetMatch?.opponent || 'Rywal'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Rozrysuj pierwszy schemat ustawienia na tablicy, dodaj wideo analizy rywala lub zapisz wytyczne taktyczne dla zespołu.
                  </p>
                </div>
                {canEdit && (
                  <p className="text-xs text-slate-500 font-medium pt-1">
                    Wybierz narzędzie z paska powyżej, aby rozrysować taktykę, dodać wideo lub notatkę do tego meczu.
                  </p>
                )}
              </div>
            )}

            {/* GŁÓWNA NOTATKA / WYTYCZNE TRENERA (JEŚLI ISTNIEJĄ) */}
            {tacticComment.trim() && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-sm font-bold border border-amber-200/80 shadow-2xs shrink-0">
                      <FileText className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Założenia taktyczne i odprawa na mecz
                      </h4>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Wpis sztabu szkoleniowego Angels ZTP
                      </span>
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setShowAddNoteModal(true)}
                      className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edytuj</span>
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-100 font-medium text-justified-clean">
                  {tacticComment}
                </div>
              </div>
            )}

            {/* LISTA POSTÓW: SCHEMATY Z TABLICY TAKTYCZNEJ */}
            {currentUnitTactics.map(tac => {
              return (
                <div
                  key={tac.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition space-y-3.5 animate-in fade-in duration-200"
                >
                  {/* Nagłówek posta ze schematem */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                        <Compass className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-sm text-slate-900">
                            {tac.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-sky-100 text-sky-800 font-mono">
                            Rotacja: {tac.rotation || 'P1'}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 font-mono">
                            {tac.phase || 'PRZYJĘCIE'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Dodano przez: <strong className="text-slate-700">{tac.createdByName || 'Trener Hubert Rutkowski'}</strong> • {new Date(tac.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLoadTacticToBoard(tac)}
                        className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                        title="Załaduj ten schemat na główną tablicę taktyczną"
                      >
                        <Compass className="w-3.5 h-3.5 text-sky-600" />
                        <span>Otwórz na tablicy &rarr;</span>
                      </button>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTactic(tac.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          title="Usuń ten wpis taktyczny"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* UKŁAD Z RYSUNKIEM Z BOKU (DOKŁADNIE JAK W TRENINGACH / NA WZORZE) */}
                  {(() => {
                    const coachDirectives = (tac.directives || []).filter(
                      dir => !/^[A-Za-zżźćńółęąśŻŹĆĄŚĘŁÓŃ\s]+\s*\([A-Z0-9ŚśŁł]+\)\s*:/i.test(dir)
                    );
                    const hasNotes = Boolean(tac.tacticalNotes && tac.tacticalNotes.trim());
                    const hasLeftContent = Boolean(tac.description || coachDirectives.length > 0 || hasNotes);

                    return (
                      <div className={`grid grid-cols-1 ${hasLeftContent ? 'md:grid-cols-12' : 'max-w-xl mx-auto'} gap-5 items-start pt-1`}>
                        {/* LEWA STRONA: Opis, wytyczne i punkty kluczowe */}
                        {hasLeftContent && (
                          <div className="md:col-span-7 space-y-3">
                            {tac.description && (
                              <p className="text-xs text-slate-800 leading-relaxed bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/90 font-medium text-justified-clean">
                                {tac.description}
                              </p>
                            )}

                            {(coachDirectives.length > 0 || hasNotes) && (
                              <div className="p-4 bg-amber-50/90 rounded-2xl border-l-4 border-l-amber-500 border border-amber-300/80 text-xs text-slate-900 leading-relaxed space-y-2.5 shadow-2xs">
                                <div className="flex items-center gap-1.5 text-amber-950 font-black text-[11px] uppercase tracking-wider">
                                  <span>💡 Punkty kluczowe dla trenera / wykonania:</span>
                                </div>
                                {coachDirectives.length > 0 && (
                                  <ul className="list-disc list-inside space-y-1.5 text-slate-900 text-xs pl-1 font-medium text-justified-clean">
                                    {coachDirectives.map((dir, dIdx) => (
                                      <li key={dIdx} className="leading-snug">{dir}</li>
                                    ))}
                                  </ul>
                                )}
                                {hasNotes && (
                                  <p className={`text-slate-900 text-xs font-medium text-justified-clean ${coachDirectives.length > 0 ? 'pt-2 border-t border-amber-200/80' : ''}`}>
                                    {tac.tacticalNotes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* PRAWA STRONA: Boisko siatkarskie z pozycjami i nałożonym rysunkiem */}
                        <div className={`${hasLeftContent ? 'md:col-span-5' : 'w-full'} flex flex-col gap-2`}>
                      <div className="relative bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden group/draw shadow-md h-52 sm:h-56 w-full flex items-center justify-center p-2">
                        {/* Właściwe boisko siatkarskie (Wymiary zgodne z tablicą pionową) */}
                        <div className="relative h-full aspect-[9/13] bg-[#1e40af] border-2 border-white rounded-sm overflow-hidden shadow-md">
                          {/* Połowa Rywali (Góra: 0 - 50%) */}
                          <div className="absolute top-0 left-0 right-0 bottom-1/2 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af]" />

                          {/* Linia 3m rywali */}
                          <div className="absolute top-[33.3%] left-0 right-0 border-b border-dashed border-rose-300/60 pointer-events-none" />

                          {/* Siatka na środku (50%) */}
                          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-white border-y border-slate-300 shadow-sm z-10 flex items-center justify-between pointer-events-none">
                            <div className="w-1.5 h-3 bg-slate-400 rounded-r border border-slate-600 -translate-x-0.5" />
                            <div className="w-1.5 h-3 bg-slate-400 rounded-l border border-slate-600 translate-x-0.5" />
                          </div>

                          {/* Linia 3m Angels ZTP (66.7%) */}
                          <div className="absolute top-[66.7%] left-0 right-0 border-b border-dashed border-sky-200/80 pointer-events-none z-5" />

                          {/* Subtelne oznaczenia stref */}
                          <div className="absolute top-[52%] left-1.5 text-[8px] font-black text-white/20 select-none pointer-events-none">IV</div>
                          <div className="absolute top-[52%] left-1/2 -translate-x-1/2 text-[8px] font-black text-white/20 select-none pointer-events-none">III</div>
                          <div className="absolute top-[52%] right-1.5 text-[8px] font-black text-white/20 select-none pointer-events-none">II</div>
                          <div className="absolute bottom-2 left-1.5 text-[8px] font-black text-white/20 select-none pointer-events-none">V</div>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/20 select-none pointer-events-none">VI</div>
                          <div className="absolute bottom-2 right-1.5 text-[8px] font-black text-white/20 select-none pointer-events-none">I</div>

                          {/* Pozycje zawodników na boisku (Kółka ze skrótami ról) */}
                          {(tac.courtPositions && tac.courtPositions.length > 0 ? tac.courtPositions : (ROTATION_DEFAULTS[tac.rotation || 'P1']?.[tac.phase || 'PRZYJECIE'] || [])).map(p => (
                            <div
                              key={p.id || p.roleCode}
                              style={{ left: `${p.x}%`, top: `${p.y}%` }}
                              className="absolute -translate-x-1/2 -translate-y-1/2 z-15 pointer-events-none"
                              title={`${p.name || p.roleCode}${p.number ? ` #${p.number}` : ''}${p.task ? `: ${p.task}` : ''}`}
                            >
                              <div className={`w-5 h-5 rounded-full border border-white flex items-center justify-center text-[9px] font-black shadow-md ${
                                p.roleCode === 'L'
                                  ? 'bg-amber-400 text-slate-950 font-black'
                                  : p.roleCode === 'R'
                                  ? 'bg-sky-400 text-slate-950 font-black'
                                  : 'bg-white text-slate-950 font-black'
                              }`}>
                                {p.roleCode}
                              </div>
                            </div>
                          ))}

                          {/* Warstwa odręcznego rysunku / szkicu (jeśli istnieje) */}
                          {tac.drawingData && (
                            <img
                              src={tac.drawingData}
                              alt={tac.title}
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
                            />
                          )}
                        </div>

                        {/* Oznaczenie: Schemat & Rysunek */}
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[10px] text-sky-400 font-bold border border-sky-400/30 flex items-center gap-1 z-30">
                          <Compass className="w-3 h-3 text-sky-400" />
                          <span>Boisko & Rysunek</span>
                        </div>

                        {/* Przycisk otwarcia na pełnej tablicy taktycznej */}
                        <button
                          type="button"
                          onClick={() => handleLoadTacticToBoard(tac)}
                          className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-sky-600 text-white text-[10px] font-bold border border-slate-700 hover:border-sky-400 shadow-sm transition z-30 flex items-center gap-1"
                          title="Otwórz i edytuj na tablicy"
                        >
                          <span>Edytuj na tablicy &rarr;</span>
                        </button>
                      </div>
                    </div>

                  </div>
                    );
                  })()}
                </div>
              );
            })}

            {/* LISTA POSTÓW: MATERIAŁY, WIDEO, ZDJĘCIA & DOKUMENTY PDF */}
            {currentUnitMaterials.map(mat => {
              const isVideo = mat.type === 'VIDEO' || mat.fileUrl.includes('youtube') || mat.fileUrl.includes('youtu.be') || mat.fileUrl.endsWith('.mp4');
              const ytId = getYoutubeId(mat.fileUrl);

              return (
                <div
                  key={mat.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition space-y-3.5 animate-in fade-in duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm shrink-0 ${
                        isVideo ? 'bg-rose-50 text-rose-600 border border-rose-200' : mat.type === 'IMAGE' ? 'bg-sky-50 text-sky-600 border border-sky-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {isVideo ? (
                          <Play className="w-5 h-5 text-rose-600 fill-rose-600" />
                        ) : mat.type === 'IMAGE' ? (
                          <ImageIcon className="w-5 h-5 text-sky-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-sm text-slate-900">
                            {mat.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase font-mono ${
                            isVideo ? 'bg-rose-100 text-rose-800' : mat.type === 'IMAGE' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isVideo ? 'Wideo' : mat.type === 'IMAGE' ? 'Zdjęcie' : 'Plik PDF'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Dodano przez: <strong className="text-slate-700">{mat.uploadedByName || 'Sztab'}</strong> • {new Date(mat.uploadedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {isVideo ? (
                        <button
                          type="button"
                          onClick={() => setPreviewMedia(mat)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-rose-600" />
                          <span>Odtwórz wideo</span>
                        </button>
                      ) : mat.type === 'IMAGE' ? (
                        <button
                          type="button"
                          onClick={() => setPreviewMedia(mat)}
                          className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-600" />
                          <span>Powiększ</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (mat.fileUrl.startsWith('data:application/pdf') || mat.fileUrl.endsWith('.pdf')) {
                              setSelectedPdfViewer(mat);
                            } else {
                              window.open(mat.fileUrl, '_blank');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Otwórz PDF</span>
                        </button>
                      )}

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMaterial(mat.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          title="Usuń materiał"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Podgląd wideo lub zdjęcia */}
                  {isVideo ? (
                    ytId ? (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={mat.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => setPreviewMedia(mat)}
                        className="h-48 bg-slate-900 rounded-2xl relative cursor-pointer group flex items-center justify-center overflow-hidden"
                      >
                        <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <Play className="w-6 h-6 fill-white ml-0.5" />
                        </div>
                      </div>
                    )
                  ) : mat.type === 'IMAGE' ? (
                    <div
                      onClick={() => setPreviewMedia(mat)}
                      className="rounded-2xl overflow-hidden border border-slate-200 max-h-72 bg-slate-100 flex items-center justify-center cursor-pointer group"
                    >
                      <img
                        src={mat.fileUrl}
                        alt={mat.title}
                        className="max-h-72 w-full object-contain group-hover:scale-102 transition duration-300"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/70 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-xs text-slate-900">{mat.fileName || mat.title}</p>
                          {mat.fileSize && <p className="text-[10px] text-slate-500 font-mono">{mat.fileSize}</p>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (mat.fileUrl.startsWith('data:application/pdf') || mat.fileUrl.endsWith('.pdf')) {
                            setSelectedPdfViewer(mat);
                          } else {
                            window.open(mat.fileUrl, '_blank');
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        Pobierz / Wyświetl
                      </button>
                    </div>
                  )}

                  {/* Opis materiału */}
                  {mat.description && (
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 leading-relaxed text-justified-clean">
                      {mat.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Modal: Wczytaj zapisany schemat na tablicę */}
      {showLoadTacticModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-xl shadow-xl space-y-4 max-h-[88vh] overflow-y-auto text-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-black uppercase text-slate-900">
                  Wczytaj zapisany schemat
                </h3>
              </div>
              <button
                onClick={() => setShowLoadTacticModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={loadTacticSearch}
              onChange={e => setLoadTacticSearch(e.target.value)}
              placeholder="Szukaj po nazwie lub opisie schematu..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
            />

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {tactics
                .filter(t => !loadTacticSearch || t.title.toLowerCase().includes(loadTacticSearch.toLowerCase()) || (t.description && t.description.toLowerCase().includes(loadTacticSearch.toLowerCase())))
                .map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      loadSavedTactic(t);
                      setShowLoadTacticModal(false);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 cursor-pointer transition flex items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{t.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {t.rotation} • {t.phase}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.description}</p>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-sky-600 text-white text-xs font-bold shrink-0">
                      Wczytaj ➔
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dodaj Materiał Taktyczny (PDF / Grafika) */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[92vh] overflow-y-auto text-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-black uppercase text-slate-900">
                  Dodaj Materiał Taktyczny
                </h3>
              </div>
              <button
                onClick={() => setShowAddMaterialModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4">
              {/* Typ materiału: Zdjęcie / Wideo / PDF */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Typ załącznika</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setMaterialType('IMAGE');
                      setMaterialFileUrl('');
                      setMaterialFileName('');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      materialType === 'IMAGE'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Zdjęcie</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMaterialType('VIDEO');
                      setMaterialFileUrl('');
                      setMaterialFileName('');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      materialType === 'VIDEO'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Wideo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMaterialType('PDF');
                      setMaterialFileUrl('');
                      setMaterialFileName('');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      materialType === 'PDF'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* Input for Video Link or File Upload */}
              {materialType === 'VIDEO' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link do wideo (YouTube / Vimeo / bezpośredni MP4) *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=... lub link MP4"
                    value={materialFileUrl}
                    onChange={e => setMaterialFileUrl(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl p-2.5 text-xs focus:outline-none focus:border-rose-400 shadow-2xs font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Wideo z meczu ligowego, odprawy lub analizy zagrywki rywali.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {materialType === 'IMAGE' ? 'Wybierz zdjęcie / grafikę z dysku *' : 'Wybierz dokument PDF z dysku *'}
                  </label>
                  <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-sky-400 bg-slate-50 cursor-pointer transition group mb-2 text-center">
                    <Upload className="w-7 h-7 text-slate-400 group-hover:text-sky-500 transition mb-1" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">
                      {materialFileName
                        ? `✓ ${materialFileName}`
                        : materialType === 'IMAGE'
                        ? 'Kliknij, aby wybrać zdjęcie (PNG, JPG, WEBP)'
                        : 'Kliknij, aby wybrać plik PDF'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {materialType === 'IMAGE' ? 'Zrzuty tablicy z szatni, infografiki taktyczne' : 'Playbooki taktyczne, oficjalne protokoły i raporty'}
                    </span>
                    <input
                      type="file"
                      accept={materialType === 'IMAGE' ? 'image/*' : '.pdf'}
                      className="hidden"
                      onChange={handleMaterialFileUpload}
                    />
                  </label>

                  <input
                    type="text"
                    placeholder="LUB wklej bezpośredni link URL..."
                    value={materialFileUrl.startsWith('data:') ? `[Wczytano plik z dysku: ${materialFileName}]` : materialFileUrl}
                    onChange={e => {
                      if (!e.target.value.startsWith('[')) {
                        setMaterialFileUrl(e.target.value);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl p-2.5 text-xs focus:outline-none focus:border-sky-400 shadow-2xs"
                  />
                </div>
              )}

              {/* Tytuł materiału */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tytuł materiału *</label>
                <input
                  type="text"
                  required
                  placeholder="np. Raport wideo: Analiza zagrywki KS Metro Poznań"
                  value={materialTitle}
                  onChange={e => setMaterialTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl p-2.5 text-xs focus:outline-none focus:border-rose-400 shadow-2xs"
                />
              </div>

              {/* Kategoria & Jednostka */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategoria</label>
                  <select
                    value={materialScope}
                    onChange={e => setMaterialScope(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs focus:outline-none focus:border-rose-400 shadow-2xs"
                  >
                    <option value="OGOLNE">Ogólne (baza taktyczna)</option>
                    <option value="MECZ_LIGOWY">Mecz Ligowy LALS</option>
                    <option value="SPARING">Sparing</option>
                    <option value="TURNIEJ">Turniej</option>
                    <option value="TRENING">Trening</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Przypisz do wydarzenia</label>
                  <select
                    value={materialEventId}
                    onChange={e => setMaterialEventId(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs focus:outline-none focus:border-rose-400 shadow-2xs"
                  >
                    <option value="">(Brak - ogólny materiał)</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        [{ev.type}] {new Date(ev.date).toLocaleDateString('pl-PL')} — {ev.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Opis / Wskazówki */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Wskazówki trenera & opis</label>
                <textarea
                  rows={3}
                  placeholder="Krótki opis, na co zawodnicy mają zwrócić uwagę w tym dokumencie..."
                  value={materialDescription}
                  onChange={e => setMaterialDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl p-2.5 text-xs focus:outline-none focus:border-rose-400 shadow-2xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={uploadingMaterial}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-500 hover:bg-rose-400 text-white transition shadow-sm"
                >
                  {uploadingMaterial ? 'Zapisywanie...' : 'Zapisz Materiał'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Szybkie Rysowanie Schematu Boiska dla Meczu */}
      {showQuickDrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-3xl shadow-xl space-y-4 my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900">
                    Rozrysuj Schemat Boiska na Mecz
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {activeTargetEvent?.title || (activeTargetMatch ? `Mecz vs ${activeTargetMatch.opponent}` : 'Mecz')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickDrawModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                    Nazwa schematu taktycznego *
                  </label>
                  <input
                    type="text"
                    required
                    value={quickDrawTitle}
                    onChange={e => setQuickDrawTitle(e.target.value)}
                    placeholder="np. Obrona ciasnego skosu w P1 i asekuracja"
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-sky-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                      Faza
                    </label>
                    <select
                      value={quickDrawPhase}
                      onChange={e => setQuickDrawPhase(e.target.value as any)}
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-bold focus:outline-none text-xs"
                    >
                      <option value="PRZYJECIE">Przyjęcie</option>
                      <option value="OBRONA">Obrona</option>
                      <option value="ATAK">Atak</option>
                      <option value="ZAGRYWKA">Zagrywka</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                      Rotacja
                    </label>
                    <select
                      value={quickDrawRotation}
                      onChange={e => setQuickDrawRotation(e.target.value as any)}
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-bold focus:outline-none text-xs font-mono"
                    >
                      {(['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as RotationCode[]).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Drawing Toolbar */}
              <div className="flex items-center justify-between gap-2.5 flex-wrap pt-2 border-t border-slate-200">
                {/* Wybór widoku boiska: Całe boisko vs Połowa */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleToggleQuickDrawCourtView('FULL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                      quickDrawCourtView === 'FULL'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Volleyball className="w-3.5 h-3.5" />
                    <span>Całe boisko (18×9m)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleQuickDrawCourtView('HALF')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                      quickDrawCourtView === 'HALF'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>Połowa boiska (9×9m)</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Kolor:</span>
                  {['#00e5ff', '#facc15', '#f8fafc', '#ef4444', '#10b981'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setQuickDrawColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        quickDrawColor === c ? 'border-white scale-125 shadow-md ring-2 ring-sky-500' : 'border-transparent hover:scale-110'
                      }`}
                      title={`Zmień kolor: ${c}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleUndoQuickDraw}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1 font-bold transition border border-slate-200"
                    title="Cofnij ostatnią linię"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Cofnij</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearQuickDraw}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200"
                    title="Wyczyść rysunki z boiska"
                  >
                    Wyczyść
                  </button>
                </div>
              </div>

              {/* Interactive Canvas */}
              <div className="relative mx-auto rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 flex justify-center shadow-inner">
                <canvas
                  ref={quickDrawCanvasRef}
                  width={600}
                  height={340}
                  onMouseDown={startQuickDraw}
                  onMouseMove={drawQuickDraw}
                  onMouseUp={stopQuickDraw}
                  onMouseLeave={stopQuickDraw}
                  onTouchStart={startQuickDraw}
                  onTouchMove={drawQuickDraw}
                  onTouchEnd={stopQuickDraw}
                  className="cursor-crosshair max-w-full touch-none"
                />
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                Rysuj trajektorię piłki, ustawienie graczy i strefy. Schemat zostanie trwale zapisany do tego meczu.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuickDrawModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickDrawTactic}
                  disabled={saving || !quickDrawTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Zapisywanie...' : 'Zapisz Schemat do Meczu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pełnoekranowy Podgląd Mediów (Lightbox dla Wideo i Zdjęć) */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 w-full max-w-4xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-white"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-base font-black text-white">{previewMedia.title}</h4>
                {previewMedia.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{previewMedia.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-center min-h-[300px]">
              {previewMedia.type === 'VIDEO' || previewMedia.fileUrl.includes('youtube') || previewMedia.fileUrl.includes('youtu.be') ? (() => {
                const ytId = getYoutubeId(previewMedia.fileUrl);
                if (ytId) {
                  return (
                    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                        title={previewMedia.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  );
                }
                return (
                  <video
                    src={previewMedia.fileUrl}
                    controls
                    autoPlay
                    className="max-h-[70vh] w-auto max-w-full rounded-2xl bg-black"
                  />
                );
              })() : (
                <img
                  src={previewMedia.fileUrl}
                  alt={previewMedia.title}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-lg"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
              <span>Dodano: {new Date(previewMedia.uploadedAt).toLocaleDateString('pl-PL')} przez {previewMedia.uploadedByName}</span>
              <a
                href={previewMedia.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline flex items-center gap-1 font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Otwórz w nowej karcie</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal: PDF Viewer */}
      {selectedPdfViewer && (
        <div
          onClick={() => setSelectedPdfViewer(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl h-[88vh] flex flex-col shadow-xl overflow-hidden text-slate-800"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">{selectedPdfViewer.title}</h3>
                  <span className="text-[10px] text-slate-500">{selectedPdfViewer.fileName || 'Dokument PDF'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedPdfViewer.fileUrl}
                  download={selectedPdfViewer.fileName || `${selectedPdfViewer.title}.pdf`}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-rose-500" />
                  <span>Pobierz PDF</span>
                </a>
                <button
                  onClick={() => setSelectedPdfViewer(null)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200 text-xs shadow-2xs"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 relative">
              <iframe
                src={selectedPdfViewer.fileUrl}
                title={selectedPdfViewer.title}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Image Lightbox for Tactics */}
      {selectedImagePreview && (
        <div
          onClick={() => setSelectedImagePreview(null)}
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-4xl max-h-[92vh] flex flex-col items-center relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-2 right-2 sm:-top-10 sm:right-0 w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 text-xs shadow-md"
            >
              ✕
            </button>
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl max-h-[75vh]">
              <img
                src={selectedImagePreview.fileUrl}
                alt={selectedImagePreview.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
            <div className="mt-3 text-center text-white space-y-1">
              <h3 className="text-base font-black text-white">{selectedImagePreview.title}</h3>
              {selectedImagePreview.description && (
                <p className="text-xs text-slate-200">{selectedImagePreview.description}</p>
              )}
              <div className="pt-1 flex items-center justify-center gap-2">
                <a
                  href={selectedImagePreview.fileUrl}
                  download={selectedImagePreview.fileName || `${selectedImagePreview.title}.png`}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pobierz grafikę</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Tactic / Snapshot Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-xl relative text-slate-800">
            <h3 className="text-lg font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
              <Camera className="w-5 h-5 text-sky-600" />
              Zapisz Zrzut Taktyczny do Meczu
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Aktualne rozrysowanie pisakiem oraz pozycje graczy zostaną zapisane i <strong>automatycznie pojawią się w terminarzu tego meczu</strong>.
            </p>

            <form onSubmit={handleSaveTactic} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Tytuł zrzutu taktycznego *
                </label>
                <input
                  type="text"
                  required
                  value={tacticTitle}
                  onChange={e => setTacticTitle(e.target.value)}
                  placeholder="np. Plan na mecz: Ustawienie obrony przeciwko Trefl II"
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
                  1. Gdzie przypisać ten wariant taktyczny? *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
                  {[
                    { id: 'MECZ_LIGOWY', label: '🏆 Mecz LALS' },
                    { id: 'SPARING', label: '⚔️ Sparing' },
                    { id: 'TRENING', label: '🏐 Trening' },
                    { id: 'OGOLNA', label: '📘 Baza Ogólna' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        const sc = s.id as TacticScope;
                        setTacticScope(sc);
                        if (sc === 'MECZ_LIGOWY') {
                          if (matches.length > 0 && !linkedMatchId) setLinkedMatchId(matches[0].id);
                          setLinkedEventId('');
                        } else if (sc === 'SPARING') {
                          const ev = events.find(e => e.type === 'SPARING' || e.type === 'TURNIEJ');
                          if (ev) setLinkedEventId(ev.id);
                          setLinkedMatchId('');
                        } else if (sc === 'TRENING') {
                          const ev = events.find(e => e.type === 'TRENING');
                          if (ev) setLinkedEventId(ev.id);
                          setLinkedMatchId('');
                        } else {
                          setLinkedMatchId('');
                          setLinkedEventId('');
                        }
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition border text-center ${
                        tacticScope === s.id
                          ? 'bg-sky-600 text-white border-sky-600 font-black shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {tacticScope === 'MECZ_LIGOWY' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Wybierz konkretny mecz ligowy LALS:
                    </label>
                    <select
                      required
                      value={linkedMatchId}
                      onChange={e => {
                        setLinkedMatchId(e.target.value);
                        const m = matches.find(match => match.id === e.target.value);
                        if (m) {
                          setTacticTitle(`Plan vs ${m.opponent} • R${rotation} (${phase})`);
                        }
                      }}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-bold shadow-2xs"
                    >
                      <option value="">Wybierz mecz ligowy z listy...</option>
                      {matches.map(m => (
                        <option key={m.id} value={m.id}>
                          🏆 vs {m.opponent} ({new Date(m.date).toLocaleDateString('pl-PL')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {tacticScope === 'SPARING' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Wybierz sparing z terminarza:
                    </label>
                    <select
                      required
                      value={linkedEventId}
                      onChange={e => {
                        setLinkedEventId(e.target.value);
                        const ev = events.find(event => event.id === e.target.value);
                        if (ev) {
                          setTacticTitle(`Sparing: ${ev.opponent || ev.title} • R${rotation} (${phase})`);
                        }
                      }}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-bold shadow-2xs"
                    >
                      <option value="">Wybierz sparing z listy...</option>
                      {events.filter(e => e.type === 'SPARING' || e.type === 'TURNIEJ').map(e => (
                        <option key={e.id} value={e.id}>
                          ⚔️ {e.title} {e.opponent ? `(vs ${e.opponent})` : ''} ({new Date(e.date).toLocaleDateString('pl-PL')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {tacticScope === 'TRENING' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Wybierz trening z terminarza:
                    </label>
                    <select
                      required
                      value={linkedEventId}
                      onChange={e => {
                        setLinkedEventId(e.target.value);
                        const ev = events.find(event => event.id === e.target.value);
                        if (ev) {
                          setTacticTitle(`Trening: ${ev.title} • R${rotation} (${phase})`);
                        }
                      }}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-bold shadow-2xs"
                    >
                      <option value="">Wybierz trening z listy...</option>
                      {events.filter(e => e.type === 'TRENING').map(e => (
                        <option key={e.id} value={e.id}>
                          🏐 {new Date(e.date).toLocaleDateString('pl-PL')} — {e.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {tacticScope === 'OGOLNA' && (
                  <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 shadow-2xs">
                    📘 Schemat zostanie zapisany w <strong>Ogólnej Bazie Taktycznej</strong> i będzie dostępny jako podręcznikowy wariant dla całego zespołu.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  2. Tytuł wariantu taktycznego *
                </label>
                <input
                  type="text"
                  required
                  value={tacticTitle}
                  onChange={e => setTacticTitle(e.target.value)}
                  placeholder="np. Plan vs Gladiatorzy: Obrona skrzydła i kontra P1"
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-bold shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  3. Wytyczne i komentarz przedmeczowy (opcjonalnie)
                </label>
                <textarea
                  rows={2}
                  value={tacticComment}
                  onChange={e => setTacticComment(e.target.value)}
                  placeholder="np. Skrzydłowi zamykają prostą, libero asekuruje na 6. metrze..."
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-3 text-xs focus:outline-none focus:border-sky-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm"
                >
                  {saving ? 'Zapisywanie...' : 'Zapisz Zrzut do Meczu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal: Dodaj notatkę / wytyczne do meczu */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-xl space-y-4 text-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-black uppercase text-slate-900">
                  Dodaj notatkę / wytyczne do meczu
                </h3>
              </div>
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNotePost} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tytuł notatki (opcjonalnie)
                </label>
                <input
                  type="text"
                  value={notePostTitle}
                  onChange={e => setNotePostTitle(e.target.value)}
                  placeholder={`np. Założenia taktyczne na zagrywkę vs ${activeTargetEvent?.opponent || activeTargetMatch?.opponent || 'Rywal'}`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Treść wytycznych taktycznych *
                </label>
                <textarea
                  required
                  rows={6}
                  value={notePostContent}
                  onChange={e => setNotePostContent(e.target.value)}
                  placeholder="Wpisz wytyczne taktyczne dla drużyny, założenia na blok-obronę, strefy serwisu..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider shadow-sm transition"
                >
                  {savingNote ? 'Zapisuję...' : 'Zapisz post do meczu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function TacticsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500 text-sm">Ładowanie tablicy taktycznej...</div>}>
      <TacticsContent />
    </Suspense>
  );
}
