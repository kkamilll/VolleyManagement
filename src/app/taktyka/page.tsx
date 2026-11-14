'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import { TrainingPlannerContent } from '@/components/TrainingPlanner';
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
  Maximize2
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
  TacticalMaterial
} from '@/lib/types';

// Default initial positions for 5-1 rotations on Full Court (Siatka w połowie: y=50%, Angels ZTP: y=52-95%)
// Domyślne pozycje wyjściowe dla Angels ZTP:
// - Środkowi (Ś1: Maciek Noak #47 i Ś2: Kamil Pujanek #4 / Libero: Bartosz Augustynek #97)
// - Przyjmujący (P1: Tomasz Krupa #1 i P2: Michał Śmigiel #8)
// - Rozgrywający (R: Karol Ordon #28 / Hubert Obara #12) i Atakujący (A: Łukasz Kremer #17)
const ROTATION_DEFAULTS: Record<RotationCode, Record<TacticalPhase, CourtPlayerPosition[]>> = {
  P1: {
    PRZYJECIE: [
      { id: 'p1_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 1, x: 82, y: 84, task: 'Chowa się za P1 (II linia) i po serwisie sprintuje pod siatkę do strefy 2/3' },
      { id: 'p1_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 2, x: 76, y: 68, task: 'Schodzi ze strefy 2 do linii przyjęcia po prawej stronie' },
      { id: 'p1_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 3, x: 50, y: 56, task: 'Stoi przy siatce, atak z 1. tempa (krótka na wprost rozgrywającego)' },
      { id: 'p1_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 4, x: 18, y: 56, task: 'Skrzydłowy lewy, atak ze strefy 4 z I linii' },
      { id: 'p1_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 5, x: 24, y: 78, task: 'Przyjęcie lewego sektora boiska w II linii' },
      { id: 'p1_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 6, x: 50, y: 82, task: 'Dowodzenie przyjęciem w środku (zmienia Ś2 w II linii)' }
    ],
    OBRONA: [
      { id: 'p1_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 1, x: 80, y: 84, task: 'Obrona ataku po prostej' },
      { id: 'p1_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 2, x: 78, y: 56, task: 'Blok prawy (zamyka prostą)' },
      { id: 'p1_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 3, x: 50, y: 56, task: 'Dostawienie bloku do skrzydła' },
      { id: 'p1_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 4, x: 18, y: 56, task: 'Blok lewy skrzydłowy' },
      { id: 'p1_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 5, x: 22, y: 82, task: 'Obrona ciasnego skosu' },
      { id: 'p1_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 6, x: 50, y: 86, task: 'Obrona ataku po głębokim skosie' }
    ],
    ATAK: [
      { id: 'p1_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 1, x: 65, y: 57, task: 'Wystawa z wyskoku ze strefy 2/3' },
      { id: 'p1_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 2, x: 80, y: 57, task: 'Atak z prawego skrzydła' },
      { id: 'p1_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 3, x: 50, y: 56, task: 'Szybkie tempo na środku' },
      { id: 'p1_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 4, x: 16, y: 57, task: 'Atak po skosie ze strefy 4' },
      { id: 'p1_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 5, x: 45, y: 74, task: 'Najście na pajpa z 6. metra' },
      { id: 'p1_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 6, x: 50, y: 82, task: 'Asekuracja atakującego' }
    ],
    ZAGRYWKA: [
      { id: 'p1_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 1, x: 80, y: 94, task: 'Zagrywka taktyczna w strefę 1 lub 5' },
      { id: 'p1_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 2, x: 78, y: 56, task: 'Blok prawy' },
      { id: 'p1_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 3, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p1_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 4, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p1_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 5, x: 24, y: 82, task: 'Obrona skosu' },
      { id: 'p1_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 6, x: 50, y: 82, task: 'Obrona środka' }
    ]
  },
  P2: {
    PRZYJECIE: [
      { id: 'p2_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 1, x: 76, y: 80, task: 'Przyjmuje prawy sektor (zmienia Ś1 w II linii; naprzeciwko Ś2 w strefie 4)' },
      { id: 'p2_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 2, x: 74, y: 56, task: 'Rozgrywający w I linii w strefie 2, wystawia bezpośrednio z siatki' },
      { id: 'p2_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 3, x: 32, y: 68, task: 'Schodzi ze strefy 3 do przyjęcia po lewej i przygotowuje atak' },
      { id: 'p2_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 4, x: 20, y: 56, task: 'Środkowy 2 w I linii przy siatce (naprzeciwko Libero w strefie 1)' },
      { id: 'p2_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 5, x: 22, y: 82, task: 'Atakujący w II linii, gotowy do ataku z lewej strony lub pipe' },
      { id: 'p2_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 80, task: 'Przyjęcie środka boiska w II linii' }
    ],
    OBRONA: [
      { id: 'p2_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 1, x: 80, y: 84, task: 'Obrona prostej' },
      { id: 'p2_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 2, x: 78, y: 56, task: 'Blok prawy (zamyka prostą)' },
      { id: 'p2_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 3, x: 18, y: 56, task: 'Przejście na lewe skrzydło do bloku' },
      { id: 'p2_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 4, x: 50, y: 56, task: 'Przejście na środek do bloku' },
      { id: 'p2_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 5, x: 22, y: 82, task: 'Obrona ciasnego skosu' },
      { id: 'p2_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 86, task: 'Obrona środka' }
    ],
    ATAK: [
      { id: 'p2_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 2, x: 68, y: 57, task: 'Wystawa i opcja kiwki w 2. kontakcie' },
      { id: 'p2_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 4, x: 50, y: 56, task: 'Krótka z 1. tempa na środku' },
      { id: 'p2_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 3, x: 16, y: 57, task: 'Atak z lewego skrzydła (strefa 4)' },
      { id: 'p2_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 5, x: 22, y: 78, task: 'Atak z lewej strony z II linii' },
      { id: 'p2_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 74, task: 'Wejście na pipe' },
      { id: 'p2_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 1, x: 75, y: 82, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p2_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 1, x: 80, y: 94, task: 'Środkowy 1 na zagrywce (po akcji zmiana na Libero)' },
      { id: 'p2_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 2, x: 78, y: 56, task: 'Blok prawy' },
      { id: 'p2_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 4, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p2_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 3, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p2_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 5, x: 24, y: 82, task: 'Obrona skosu' },
      { id: 'p2_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 82, task: 'Obrona środka' }
    ]
  },
  P3: {
    PRZYJECIE: [
      { id: 'p3_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 1, x: 76, y: 80, task: 'Przyjęcie prawego sektora boiska w II linii' },
      { id: 'p3_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 2, x: 80, y: 56, task: 'Środkowy 2 w strefie 2 (I linia), gotowy na obejście za plecy R' },
      { id: 'p3_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 3, x: 62, y: 56, task: 'Rozgrywający w I linii w strefie 3' },
      { id: 'p3_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 4, x: 22, y: 68, task: 'Schodzi ze strefy 4 do przyjęcia po lewej i przygotowuje atak' },
      { id: 'p3_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 5, x: 38, y: 80, task: 'Zmienia Ś1 w II linii (naprzeciwko Ś2 w strefie 2), przyjmuje środek' },
      { id: 'p3_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 6, x: 58, y: 84, task: 'Chowa się za R w środku, gotowy do ataku z prawej II linii' }
    ],
    OBRONA: [
      { id: 'p3_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 1, x: 80, y: 84, task: 'Obrona po prostej' },
      { id: 'p3_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 2, x: 50, y: 56, task: 'Przejście na środek do bloku' },
      { id: 'p3_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 3, x: 78, y: 56, task: 'Przejście na prawe skrzydło do bloku' },
      { id: 'p3_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 4, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p3_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 5, x: 22, y: 84, task: 'Obrona skosu' },
      { id: 'p3_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 6, x: 50, y: 86, task: 'Obrona środka' }
    ],
    ATAK: [
      { id: 'p3_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 3, x: 65, y: 57, task: 'Wystawa piłki ze strefy 2/3' },
      { id: 'p3_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 4, x: 16, y: 57, task: 'Atak ze skrzydła lewego' },
      { id: 'p3_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 2, x: 50, y: 56, task: 'Krótka na środku lub obejście za głowę' },
      { id: 'p3_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 6, x: 82, y: 78, task: 'Atak z prawej strony II linii' },
      { id: 'p3_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 1, x: 45, y: 74, task: 'Wejście na pipe' },
      { id: 'p3_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 5, x: 50, y: 82, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p3_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 1, x: 80, y: 94, task: 'Mocna zagrywka kierunkowa' },
      { id: 'p3_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 2, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p3_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 3, x: 78, y: 56, task: 'Blok prawy' },
      { id: 'p3_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 4, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p3_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 5, x: 24, y: 82, task: 'Obrona skosu' },
      { id: 'p3_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 6, x: 50, y: 82, task: 'Obrona środka' }
    ]
  },
  P4: {
    PRZYJECIE: [
      { id: 'p4_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 1, x: 80, y: 84, task: 'Atakujący w II linii, gotowy do ataku z prawej strony' },
      { id: 'p4_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 2, x: 76, y: 68, task: 'Schodzi ze strefy 2 do przyjęcia po prawej stronie' },
      { id: 'p4_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 3, x: 50, y: 56, task: 'Środkowy 2 w strefie 3 (naprzeciwko Libero w strefie 6)' },
      { id: 'p4_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 4, x: 24, y: 56, task: 'Rozgrywający w I linii w strefie 4, przesuwa się na pozycję rozegrania' },
      { id: 'p4_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 5, x: 26, y: 80, task: 'Przyjęcie lewego sektora boiska' },
      { id: 'p4_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 6, x: 50, y: 82, task: 'Zmienia Ś1 w II linii (naprzeciwko Ś2 w strefie 3), przyjmuje środek' }
    ],
    OBRONA: [
      { id: 'p4_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 1, x: 80, y: 84, task: 'Obrona prostej' },
      { id: 'p4_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 2, x: 18, y: 56, task: 'Przejście na lewe skrzydło do bloku' },
      { id: 'p4_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 3, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p4_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 4, x: 78, y: 56, task: 'Przejście na prawe skrzydło do bloku' },
      { id: 'p4_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 5, x: 22, y: 82, task: 'Obrona skosu' },
      { id: 'p4_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 6, x: 50, y: 86, task: 'Obrona środka' }
    ],
    ATAK: [
      { id: 'p4_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 4, x: 65, y: 57, task: 'Rozegranie pod siatką (opcja kiwki w 2. kontakcie)' },
      { id: 'p4_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 3, x: 50, y: 56, task: 'Krótka ze środka' },
      { id: 'p4_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 2, x: 16, y: 57, task: 'Atak ze strefy 4 (lewe skrzydło)' },
      { id: 'p4_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 1, x: 82, y: 78, task: 'Atak z prawej II linii' },
      { id: 'p4_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 5, x: 45, y: 74, task: 'Pipe ze środka' },
      { id: 'p4_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 6, x: 48, y: 82, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p4_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 1, x: 80, y: 94, task: 'Mocna zagrywka po prostej' },
      { id: 'p4_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 4, x: 78, y: 56, task: 'Blok prawy' },
      { id: 'p4_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 3, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p4_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 2, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p4_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 5, x: 24, y: 82, task: 'Obrona skosu' },
      { id: 'p4_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 6, x: 50, y: 82, task: 'Obrona środka' }
    ]
  },
  P5: {
    PRZYJECIE: [
      { id: 'p5_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 1, x: 78, y: 80, task: 'Zmienia Ś2 w II linii (naprzeciwko Ś1 w strefie 4), przyjmuje prawy sektor' },
      { id: 'p5_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 2, x: 80, y: 56, task: 'Atakujący w I linii w strefie 2, gotowy do ataku ze skrzydła' },
      { id: 'p5_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 3, x: 42, y: 70, task: 'Schodzi ze strefy 3 do linii przyjęcia' },
      { id: 'p5_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 4, x: 20, y: 56, task: 'Środkowy 1 przy siatce po lewej (naprzeciwko Libero w strefie 1)' },
      { id: 'p5_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 5, x: 18, y: 80, task: 'Chowa się za Ś1 w lewym rogu i sprintuje pod siatkę' },
      { id: 'p5_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 6, x: 52, y: 80, task: 'Przyjęcie lewego/środkowego sektora boiska' }
    ],
    OBRONA: [
      { id: 'p5_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 1, x: 80, y: 84, task: 'Obrona po prostej' },
      { id: 'p5_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 2, x: 78, y: 56, task: 'Blok prawy skrzydłowy' },
      { id: 'p5_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 3, x: 18, y: 56, task: 'Przejście na lewe skrzydło do bloku' },
      { id: 'p5_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 4, x: 50, y: 56, task: 'Przejście na środek do bloku' },
      { id: 'p5_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 5, x: 22, y: 82, task: 'Obrona ciasnego skosu' },
      { id: 'p5_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 86, task: 'Obrona środka' }
    ],
    ATAK: [
      { id: 'p5_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 5, x: 65, y: 57, task: 'Wystawa zbiegowa ze strefy 2/3' },
      { id: 'p5_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 2, x: 80, y: 57, task: 'Atak z prawego skrzydła ze strefy 2' },
      { id: 'p5_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 4, x: 50, y: 56, task: 'Krótka na środku' },
      { id: 'p5_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 3, x: 16, y: 57, task: 'Atak ze strefy 4 po przejściu' },
      { id: 'p5_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 6, x: 45, y: 74, task: 'Pipe ze strefy 6' },
      { id: 'p5_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 1, x: 50, y: 82, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p5_s2', name: 'Kamil (Ś2)', number: 4, roleCode: 'Ś2', zone: 1, x: 80, y: 94, task: 'Środkowy 2 na zagrywce' },
      { id: 'p5_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 2, x: 78, y: 56, task: 'Blok prawy' },
      { id: 'p5_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 3, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p5_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 4, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p5_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 5, x: 24, y: 82, task: 'Obrona skosu' },
      { id: 'p5_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 82, task: 'Obrona środka' }
    ]
  },
  P6: {
    PRZYJECIE: [
      { id: 'p6_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 1, x: 78, y: 80, task: 'Przyjęcie prawego sektora boiska w II linii' },
      { id: 'p6_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 2, x: 80, y: 56, task: 'Środkowy 1 w strefie 2 (naprzeciwko Libero w strefie 5)' },
      { id: 'p6_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 3, x: 52, y: 56, task: 'Atakujący w strefie 3, gotowy do nabiegu na prawe skrzydło' },
      { id: 'p6_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 4, x: 24, y: 68, task: 'Schodzi ze strefy 4 do linii przyjęcia' },
      { id: 'p6_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 5, x: 36, y: 80, task: 'Zmienia Ś2 w II linii (naprzeciwko Ś1 w strefie 2), przyjmuje lewy/środek' },
      { id: 'p6_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 6, x: 50, y: 74, task: 'Chowa się za A w środku i po zagrywce biegnie pod siatkę' }
    ],
    OBRONA: [
      { id: 'p6_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 1, x: 80, y: 84, task: 'Obrona po prostej' },
      { id: 'p6_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 3, x: 78, y: 56, task: 'Przejście na prawe skrzydło do bloku' },
      { id: 'p6_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 2, x: 50, y: 56, task: 'Przejście na środek do bloku' },
      { id: 'p6_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 4, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p6_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 5, x: 22, y: 82, task: 'Obrona ciasnego skosu' },
      { id: 'p6_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 6, x: 50, y: 85, task: 'Obrona środka' }
    ],
    ATAK: [
      { id: 'p6_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 6, x: 65, y: 57, task: 'Wystawa ze strefy 2/3 po zbiegu ze środka' },
      { id: 'p6_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 3, x: 80, y: 57, task: 'Atak z prawego skrzydła ze strefy 2' },
      { id: 'p6_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 2, x: 50, y: 56, task: 'Krótka na środku' },
      { id: 'p6_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 4, x: 18, y: 57, task: 'Atak ze strefy 4' },
      { id: 'p6_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 1, x: 75, y: 78, task: 'Wejście z II linii / asekuracja' },
      { id: 'p6_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 5, x: 25, y: 82, task: 'Asekuracja skrzydeł' }
    ],
    ZAGRYWKA: [
      { id: 'p6_p1', name: 'Tomasz (P1)', number: 1, roleCode: 'P1', zone: 1, x: 80, y: 94, task: 'Mocna zagrywka z wyskoku' },
      { id: 'p6_a', name: 'Łukasz (A)', number: 17, roleCode: 'A', zone: 3, x: 78, y: 56, task: 'Blok prawy' },
      { id: 'p6_s1', name: 'Maciek (Ś1)', number: 47, roleCode: 'Ś1', zone: 2, x: 50, y: 56, task: 'Blok środkowy' },
      { id: 'p6_p2', name: 'Michał (P2)', number: 8, roleCode: 'P2', zone: 4, x: 18, y: 56, task: 'Blok lewy' },
      { id: 'p6_l', name: 'Bartosz (L)', number: 97, roleCode: 'L', zone: 5, x: 24, y: 82, task: 'Obrona skosu' },
      { id: 'p6_r', name: 'Karol (R)', number: 28, roleCode: 'R', zone: 6, x: 50, y: 82, task: 'Obrona środka' }
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
  const canEdit = !isArchiveMode && Boolean(user && (user.role === 'TRENER' || user.role === 'KIEROWNIK' || user.isCaptain));

  // Section switcher: 1. Tablica (Brudnopis), 2. Mecze, Sparingi & Turnieje, 3. Treningi
  const [tacticsSection, setTacticsSection] = useState<'board' | 'matches' | 'trainings'>('board');
  const [showLoadTacticModal, setShowLoadTacticModal] = useState(false);
  const [loadTacticSearch, setLoadTacticSearch] = useState('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'training' || tab === 'trening' || tab === 'treningi' || tab === 'trainings') {
      setTacticsSection('trainings');
    } else if (tab === 'matches' || tab === 'mecze' || tab === 'sparingi' || tab === 'turnieje' || tab === 'playbook' || tab === 'debrief' || tab === 'odprawa') {
      setTacticsSection('matches');
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
  const [materialType, setMaterialType] = useState<'PDF' | 'IMAGE'>('PDF');
  const [materialFileUrl, setMaterialFileUrl] = useState('');
  const [materialFileName, setMaterialFileName] = useState('');
  const [materialFileSize, setMaterialFileSize] = useState('');
  const [materialScope, setMaterialScope] = useState<'MECZ_LIGOWY' | 'SPARING' | 'TURNIEJ' | 'TRENING' | 'OGOLNE'>('OGOLNE');
  const [materialEventId, setMaterialEventId] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [materialFilter, setMaterialFilter] = useState<'ALL' | 'PDF' | 'IMAGE'>('ALL');
  const [selectedPdfViewer, setSelectedPdfViewer] = useState<TacticalMaterial | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<TacticalMaterial | null>(null);

  // Save Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tacticTitle, setTacticTitle] = useState('');
  const [tacticScope, setTacticScope] = useState<TacticScope>('OGOLNA');
  const [linkedEventId, setLinkedEventId] = useState<string>('');
  const [linkedMatchId, setLinkedMatchId] = useState<string>('');
  const [tacticComment, setTacticComment] = useState('');
  const [saving, setSaving] = useState(false);

  // Player Suggestions / Discussion Feed State
  const [newPostContent, setNewPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [editingPostModal, setEditingPostModal] = useState<TacticalPost | null>(null);
  const [editCoachFeedback, setEditCoachFeedback] = useState('');

  // Player Read-Only & Sandbox State
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [showRequestEditModal, setShowRequestEditModal] = useState(false);
  const [requestEditType, setRequestEditType] = useState<'UWAGA_ROTACJA' | 'UWAGA_BLOK' | 'PROSBA_DOSTEP' | 'INNE'>('UWAGA_ROTACJA');
  const [requestEditText, setRequestEditText] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Board Orientation: 'vertical' (pionowo) vs 'horizontal' (poziomo)
  const [boardOrientation, setBoardOrientation] = useState<'vertical' | 'horizontal'>('vertical');

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

  // Active target event or match based on unit selector
  const activeTargetEvent = useMemo(() => {
    if (selectedContextKey.startsWith('EVENT_')) {
      const id = selectedContextKey.replace('EVENT_', '');
      return events.find(e => e.id === id) || null;
    }
    return null;
  }, [selectedContextKey, events]);

  const activeTargetMatch = useMemo(() => {
    if (selectedContextKey.startsWith('MATCH_')) {
      const id = selectedContextKey.replace('MATCH_', '');
      return matches.find(m => m.id === id) || null;
    }
    return null;
  }, [selectedContextKey, matches]);

  // Backward compatibility alias for single targetEvent
  const targetEvent = activeTargetEvent;

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
      } else if (activeTargetEvent.type === 'SPARING') {
        setTacticScope('SPARING');
        setUnitDirectives([
          `⚔️ Test szóstki wyjściowej z rywalem: ${activeTargetEvent.opponent || 'Rywal'}`,
          '💥 Atak z II linii (pipe) przy obronie kontrataku',
          '🛑 Podwójny blok zamykający prostą na skrzydłach',
          '🔄 Test wariantów gry zmienników w 2. i 3. secie'
        ]);
      } else if (activeTargetEvent.type === 'TURNIEJ') {
        setTacticScope('TURNIEJ');
        setUnitDirectives([
          '🏆 Optymalizacja sił i rotacja składem w turnieju',
          '🎯 Stabilne przyjęcie i eliminacja serii punktowych rywala',
          '⚡ Szybkie tempo na skrzydłach i zero przestojów'
        ]);
      } else {
        setTacticScope('MECZ_LIGOWY');
        setUnitDirectives([
          `🔵 Odprawa ligowa LALS vs ${activeTargetEvent.opponent || 'Rywal'}`,
          '🎯 Maksymalna agresja zagrywką w strefy 1 i 5',
          '🛡️ Strefowy podwójny blok na skrzydłowego rywali',
          '🏐 Libero czyści pole za blokiem na 6. metrze'
        ]);
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
    } else {
      setLinkedEventId('');
      setLinkedMatchId('');
      setTacticScope('OGOLNA');
      setUnitDirectives([
        'Podstawowe pozycje wyjściowe zespołu',
        'Asekuracja i organizacja rozegrania',
        'Zgranie i komunikacja na boisku'
      ]);
    }
  }, [activeTargetEvent, activeTargetMatch]);

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
    if (activeTool === 'move') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveCanvasState();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      drawArrow(ctx, startPos.current.x, startPos.current.y, x, y, drawColor, lineWidth);
    }
    startPos.current = null;
  };

  // Touch drawing handlers for smartphones and tablets
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool === 'move' || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveCanvasState();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
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
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
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
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
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
            title: selectedTactic.title,
            phase,
            rotation,
            courtPositions: positions,
            directives: positions.map(p => `${p.name}: ${p.task || 'Pozycja w strefie'}`),
            drawingData,
            tacticalNotes: selectedTactic.tacticalNotes
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
            directives: positions.map(p => `${p.name}: ${p.task || 'Pozycja w strefie'}`),
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
          setSelectedTactic(d.tactic);
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
      let desc = '';

      if (activeTargetEvent) {
        eventId = activeTargetEvent.id;
        const dateStr = new Date(activeTargetEvent.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
        if (activeTargetEvent.type === 'TRENING') {
          scope = 'TRENING';
          defaultTitle = `Trening [${dateStr}]: ${activeTargetEvent.title} • Rotacja ${rotation} (${phase})`;
          desc = `Założenia treningowe: ${unitDirectives.join('; ')}`;
        } else if (activeTargetEvent.type === 'SPARING') {
          scope = 'SPARING';
          defaultTitle = `Sparing [${dateStr}] vs ${activeTargetEvent.opponent || 'Rywal'}: Rotacja ${rotation} (${phase})`;
          desc = `Plan sparingowy: ${unitDirectives.join('; ')}`;
        } else if (activeTargetEvent.type === 'TURNIEJ') {
          scope = 'TURNIEJ';
          defaultTitle = `Turniej [${dateStr}] ${activeTargetEvent.title}: Rotacja ${rotation} (${phase})`;
          desc = `Taktyka turniejowa: ${unitDirectives.join('; ')}`;
        } else {
          scope = 'MECZ_LIGOWY';
          defaultTitle = `Mecz LALS [${dateStr}] vs ${activeTargetEvent.opponent || 'Rywal'}: Rotacja ${rotation} (${phase})`;
          desc = `Odprawa meczowa LALS: ${unitDirectives.join('; ')}`;
        }
      } else if (activeTargetMatch) {
        matchId = activeTargetMatch.id;
        scope = 'MECZ_LIGOWY';
        const dateStr = new Date(activeTargetMatch.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
        defaultTitle = `Mecz LALS [${dateStr}] vs ${activeTargetMatch.opponent}: Rotacja ${rotation} (${phase})`;
        desc = `Odprawa na mecz ligowy: ${unitDirectives.join('; ')}`;
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
            directives: unitDirectives.length > 0 ? unitDirectives : positions.map(p => `${p.name}: ${p.task || 'Pozycja'}`),
            drawingData,
            tacticalNotes: desc
          }
        })
      });

      if (res.ok) {
        const d = await res.json();
        await fetchData();
        if (d.tactic) {
          setSelectedTactic(d.tactic);
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

  // Send a player edit request or tactical feedback to the coach
  const handleSendEditRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEditText.trim()) return;
    setSubmittingRequest(true);
    try {
      const typePrefix =
        requestEditType === 'PROSBA_DOSTEP'
          ? '✋ PROŚBA O UPRAWNIENIA EDYCJI: '
          : requestEditType === 'UWAGA_ROTACJA'
          ? '🎯 SUGESTIA DO ROTACJI: '
          : requestEditType === 'UWAGA_BLOK'
          ? '🛡️ SUGESTIA DO BLOKU/ASEKURACJI: '
          : '💬 UWAGA TAKTYCZNA: ';

      const tacticId = selectedTactic ? selectedTactic.id : tactics.length > 0 ? tactics[0].id : undefined;

      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADD_POST',
          tacticId,
          content: `${typePrefix}${requestEditText}`
        })
      });
      const d = await res.json();
      if (res.ok) {
        setShowRequestEditModal(false);
        setRequestEditText('');
        await fetchData();
        if (selectedTactic && d.post) {
          const updatedPosts = [d.post, ...(selectedTactic.posts || [])];
          setSelectedTactic({ ...selectedTactic, posts: updatedPosts });
        }
        alert('Twoja prośba / uwaga została pomyślnie przekazana trenerowi!');
      } else {
        alert(d.error || 'Błąd wysyłania prośby');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingRequest(false);
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
    <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-6 lg:px-10 xl:px-12 pt-4 sm:pt-6 pb-24 md:pb-12 space-y-3 sm:space-y-4">
      {/* Top Header - Unified Taktyka & Trening Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-sm">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-athletic leading-tight">
              Taktyka & Treningi
            </h1>
            <span className="hidden sm:inline-block text-[11px] text-slate-500 font-medium">
              Centrum Taktyczne • Rozpiski Treningowe • Tablica Taktyczna • Wnioski i Odprawa
            </span>
          </div>
        </div>

        {!canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            {isArchiveMode ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold shadow-sm">
                <span>🔒 Archiwum: Tylko do odczytu</span>
              </div>
            ) : (
              <button
                onClick={() => setShowRequestEditModal(true)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                <span>✋ Poproś o edycję / Zgłoś uwagę</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* GŁÓWNY PODZIAŁ MODUŁU TAKTYKI - 3 ZAKŁADKI & KONSOLA AKCJI */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-sm">
        {/* 3 Zakładki */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setTacticsSection('board')}
            className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition border whitespace-nowrap ${
              tacticsSection === 'board'
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-300" />
            <span>🎨 Tablica (Brudnopis)</span>
          </button>

          <button
            type="button"
            onClick={() => setTacticsSection('matches')}
            className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition border whitespace-nowrap ${
              tacticsSection === 'matches'
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>🏆 Mecze, Sparingi & Turnieje</span>
          </button>

          <button
            type="button"
            onClick={() => setTacticsSection('trainings')}
            className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition border whitespace-nowrap ${
              tacticsSection === 'trainings'
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Volleyball className="w-4 h-4 text-emerald-400" />
            <span>🏐 Treningi</span>
          </button>
        </div>

        {/* Prawa strona w trybie Tablicy: Kontekst i szybkie przyciski */}
        {tacticsSection === 'board' && (
          <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap justify-between lg:justify-end w-full lg:w-auto pt-1 lg:pt-0 border-t lg:border-t-0 border-slate-200">
            {/* Wybór kontekstu tablicy */}
            <div className="flex items-center gap-1 flex-1 lg:flex-initial min-w-0">
              <select
                value={selectedContextKey}
                onChange={e => setSelectedContextKey(e.target.value)}
                className="w-full lg:w-auto bg-white border border-slate-300 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-sky-500 shadow-2xs max-w-[240px] truncate"
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
                  className="px-2 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold transition shadow-2xs whitespace-nowrap"
                  title="Powrót do ogólnej tablicy"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Narzędzia tablicy */}
            {canEdit && (
              <div className="flex items-center gap-1.5 shrink-0">
                {tactics.length > 0 && (
                  <button
                    onClick={() => setShowLoadTacticModal(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    title="Wczytaj zapisany schemat z bazy"
                  >
                    <FolderArchive className="w-3.5 h-3.5 text-sky-600" />
                    <span>Wczytaj ({tactics.length})</span>
                  </button>
                )}

                <button
                  onClick={handleResetPositions}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                  title="Przywróć domyślne pozycje"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                <button
                  onClick={handleOpenSaveModal}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm"
                  title="Zapisz ten schemat"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Zapisz</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {tacticsSection === 'board' && (
        <>
          {/* SLIM ACTIVE TACTIC STATUS PILL (Tylko gdy wczytano schemat) */}
          {selectedTactic && (() => {
            const target = getTacticTargetInfo(selectedTactic);
            return (
              <div className="p-3 sm:p-3.5 rounded-2xl bg-sky-50 border border-sky-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center text-sm shrink-0 font-bold shadow-xs">
                    🎯
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900 truncate">
                        {selectedTactic.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-sky-800 border border-sky-200">
                        {target.icon} {target.label}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-amber-800 border border-amber-300">
                        {selectedTactic.rotation} • {selectedTactic.phase}
                      </span>
                    </div>
                    {selectedTactic.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                        {selectedTactic.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canEdit && (
                    <button
                      onClick={handleQuickUpdateCurrentTactic}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                      title="Nadpisz zmiany w tej taktyce"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Zapisywanie...' : 'Zapisz zmiany'}</span>
                    </button>
                  )}
                  <button
                    onClick={handleStartNewDraft}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    title="Wróć do czystego szkicu"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500" />
                    <span>Nowy szkic</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Specialized Unit Command Box (Tylko gdy wybrano konkretny mecz / trening) */}
          {(activeTargetEvent || activeTargetMatch) && (
            <div className={`p-3.5 sm:p-4 rounded-2xl border text-xs space-y-3 animate-fadeIn ${
              activeTargetEvent?.type === 'TRENING'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : activeTargetEvent?.type === 'SPARING'
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : activeTargetEvent?.type === 'TURNIEJ'
                ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                : 'bg-sky-50/70 border-sky-200 text-sky-950'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">
                    {activeTargetEvent?.type === 'TRENING'
                      ? 'Plan Treningowy & Zestawienie Pozycji'
                      : activeTargetEvent?.type === 'SPARING'
                      ? `Założenia Sparingowe vs ${activeTargetEvent.opponent || 'Rywal'}`
                      : activeTargetEvent?.type === 'TURNIEJ'
                      ? 'Taktyka Turniejowa & Zmiany Zmęczeniowe'
                      : `Odprawa Meczowa LALS vs ${activeTargetEvent?.opponent || activeTargetMatch?.opponent || 'Rywal'}`}
                  </span>

                  {activeTargetEvent && (
                    <span className="text-[11px] font-mono text-slate-500">
                      • {new Date(activeTargetEvent.date).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })} • {activeTargetEvent.location}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activeTargetEvent && (
                    <span className="text-[11px] font-mono font-bold text-slate-700 px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">
                      ✓ {(activeTargetEvent.attendees || []).filter(a => a.status === 'BEDE').length} obecnych z ankiety
                    </span>
                  )}

                  {canEdit && (activeTargetEvent || activeTargetMatch) && (
                    <button
                      onClick={handleQuickSaveForUnit}
                      disabled={saving}
                      className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition flex items-center gap-1 shadow-sm"
                      title="Zapisz aktualne rozrysowanie bezpośrednio do tej jednostki"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Zapisywanie...' : 'Zapisz dla tej jednostki'}</span>
                    </button>
                  )}

                  {canEdit && activeTargetEvent && (
                    <button
                      onClick={handlePopulateConfirmedPlayers}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                      title="Automatycznie przypisz potwierdzonych graczy z ankiety do ich nominalnych pozycji (R, P1, P2, Ś1, Ś2, A, L)"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Wstaw obecnych na boisko</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tactical Directives / Action Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                    Wytyczne Taktyczne & Zadania dla Drużyny:
                  </span>
                  {canEdit && (
                    <button
                      onClick={() => setShowDirectiveEditor(!showDirectiveEditor)}
                      className="text-[10px] text-sky-700 hover:text-sky-900 underline font-bold"
                    >
                      {showDirectiveEditor ? 'Zwiń edytor' : '+ Edytuj wytyczne'}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {unitDirectives.map((dir, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-800 font-medium flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{dir}</span>
                      {canEdit && showDirectiveEditor && (
                        <button
                          onClick={() => setUnitDirectives(unitDirectives.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 ml-1 font-bold"
                          title="Usuń wytyczną"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {canEdit && showDirectiveEditor && (
                  <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                    <input
                      type="text"
                      value={newDirectiveInput}
                      onChange={e => setNewDirectiveInput(e.target.value)}
                      placeholder="Wpisz nowe zadanie lub wytyczną..."
                      className="flex-1 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500 shadow-2xs"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newDirectiveInput.trim()) {
                          e.preventDefault();
                          setUnitDirectives([...unitDirectives, newDirectiveInput.trim()]);
                          setNewDirectiveInput('');
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newDirectiveInput.trim()) {
                          setUnitDirectives([...unitDirectives, newDirectiveInput.trim()]);
                          setNewDirectiveInput('');
                        }
                      }}
                      className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                    >
                      Dodaj
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

      {/* SEKCJA 1: TABLICA TAKTYCZNA (BOISKO I KONSOLA ROZGRYWANIA) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-3 sm:p-5 shadow-sm space-y-4">
          
          {/* UNIFIED COMPACT TACTICAL CONSOLE */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-sm space-y-2">
            {/* Row 1: Rotation Selector, Phase Selector & Orientation */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Rotation P1 - P6 */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider hidden xs:inline">
                  Rotacja:
                </span>
                <div className="grid grid-cols-6 gap-1 w-full sm:w-auto">
                  {(['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as RotationCode[]).map(r => (
                    <button
                      key={r}
                      onClick={() => applyPreset(r, phase)}
                      title={
                        r === 'P1' ? 'P1: Rozgrywający w strefie 1 (linia obrony)' :
                        r === 'P2' ? 'P2: Rozgrywający w strefie 2 (linia ataku)' :
                        r === 'P3' ? 'P3: Rozgrywający w strefie 3 (linia ataku)' :
                        r === 'P4' ? 'P4: Rozgrywający w strefie 4 (linia ataku)' :
                        r === 'P5' ? 'P5: Rozgrywający w strefie 5 (linia obrony)' :
                        'P6: Rozgrywający w strefie 6 (linia obrony)'
                      }
                      className={`h-8 px-2 rounded-xl text-xs font-black transition border font-mono flex items-center justify-center ${
                        rotation === r
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase Selector - 4 columns, never truncated */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider hidden xs:inline">
                  Faza:
                </span>
                <div className="grid grid-cols-4 gap-1 w-full sm:w-auto">
                  {[
                    { id: 'PRZYJECIE', label: 'Przyjęcie' },
                    { id: 'OBRONA', label: 'Obrona' },
                    { id: 'ATAK', label: 'Atak' },
                    { id: 'ZAGRYWKA', label: 'Zagrywka' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(rotation, p.id as TacticalPhase)}
                      className={`h-8 px-1.5 xs:px-2 sm:px-2.5 rounded-xl text-[10px] xs:text-[11px] sm:text-xs font-black transition border flex items-center justify-center whitespace-nowrap ${
                        phase === p.id
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation Selector: Pionowo / Poziomo */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider hidden xs:inline">
                  Widok:
                </span>
                <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-300">
                  <button
                    type="button"
                    onClick={() => handleToggleOrientation('vertical')}
                    className={`h-8 px-2 sm:px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      boardOrientation === 'vertical'
                        ? 'bg-sky-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    title="Widok pionowy (od linii końcowej)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Pionowo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleOrientation('horizontal')}
                    className={`h-8 px-2 sm:px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      boardOrientation === 'horizontal'
                        ? 'bg-sky-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    title="Widok poziomy (od linii bocznej)"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Poziomo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Drawing Tools & Palettes OR Player Read-Only Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
              {!canEdit && !isSandboxMode ? (
                <div className="w-full flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Widok Zawodnika (Tylko odczyt)</span>
                    </span>
                    <span className="text-[11px] text-slate-500 hidden lg:inline">
                      Tablica w trybie podglądu założeń trenera. Kliknij zawodnika, aby sprawdzić jego zadania na boisku.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRequestEditModal(true)}
                      className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 transition shadow-sm"
                      title="Wyślij trenerowi sugestię taktyczną lub poproś o uprawnienia edycji"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Poproś o edycję / Zgłoś uwagę</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSandboxMode(true)}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                      title="Włącz brudnopis do lokalnych testów i rysunków bez zmian w taktyce trenera"
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
                      <span>Włącz brudnopis</span>
                    </button>

                    {/* Opponents & Ball Toggles for player exploration */}
                    <button
                      onClick={() => setShowOpponents(!showOpponents)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
                        showOpponents
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                      title="Pokaż/ukryj blok i obronę przeciwnika"
                    >
                      <Users className="w-3 h-3" />
                      <span className="hidden sm:inline">Rywale</span>
                    </button>

                    <button
                      onClick={() => setShowBall(!showBall)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
                        showBall
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                      title="Pokaż/ukryj piłkę"
                    >
                      <Volleyball className="w-3 h-3" />
                      <span className="hidden sm:inline">Piłka</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {!canEdit && isSandboxMode && (
                    <div className="w-full mb-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2 shadow-2xs">
                      <span className="flex items-center gap-1.5 font-bold">
                        <FlaskConical className="w-4 h-4 text-amber-600" />
                        <span>Tryb Brudnopisu: Rysujesz i testujesz lokalnie (Twoje zmiany nie nadpisują założeń trenera)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSandboxMode(false)}
                        className="px-2.5 py-0.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 transition"
                      >
                        ✕ Wyłącz brudnopis
                      </button>
                    </div>
                  )}

                  {/* Tool Modes */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveTool('move')}
                      className={`h-7 px-2.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition border ${
                        activeTool === 'move'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-2xs'
                      }`}
                      title="Przesuwaj: chwyć i przeciągaj zawodników i piłkę"
                    >
                      <Move className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Przesuń</span>
                    </button>

                    <button
                      onClick={() => { setActiveTool('pen'); setLineWidth(3); }}
                      className={`h-7 px-2 rounded-lg text-xs font-bold flex items-center gap-1 transition border ${
                        activeTool === 'pen'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-2xs'
                      }`}
                      title="Pisak: rysowanie linii i notatek"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pisak</span>
                    </button>

                    <button
                      onClick={() => setActiveTool('arrow')}
                      className={`h-7 px-2 rounded-lg text-xs font-bold flex items-center gap-1 transition border ${
                        activeTool === 'arrow'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-2xs'
                      }`}
                      title="Strzałka: trajektoria ataku lub przemieszczenia"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Strzałka</span>
                    </button>

                    <button
                      onClick={() => setActiveTool('eraser')}
                      className={`h-7 px-2 rounded-lg text-xs font-bold flex items-center gap-1 transition border ${
                        activeTool === 'eraser'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-2xs'
                      }`}
                      title="Gumka"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Gumka</span>
                    </button>
                  </div>

                  {/* Colors & Board Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* 4 colors */}
                    <div className="flex items-center gap-1 px-1">
                      {[
                        { hex: '#facc15', label: 'Żółty' },
                        { hex: '#0284c7', label: 'Błękitny' },
                        { hex: '#e11d48', label: 'Czerwony' },
                        { hex: '#0f172a', label: 'Ciemny' }
                      ].map(c => (
                        <button
                          key={c.hex}
                          onClick={() => {
                            setDrawColor(c.hex);
                            if (activeTool === 'move') setActiveTool('pen');
                          }}
                          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full border transition ${
                            drawColor === c.hex ? 'border-sky-500 scale-110 ring-2 ring-sky-300' : 'border-slate-300 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.label}
                        />
                      ))}
                    </div>

                    <div className="h-4 w-px bg-slate-300 mx-0.5" />

                    {/* Undo & Clear */}
                    <button
                      onClick={handleUndo}
                      className="p-1 rounded-lg bg-white text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 shadow-2xs transition"
                      title="Cofnij rysunek"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={handleClearDrawing}
                      className="p-1 rounded-lg bg-white text-rose-600 hover:text-rose-700 border border-slate-300 hover:bg-rose-50 shadow-2xs transition"
                      title="Wyczyść rysunki"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Opponents & Ball Toggles */}
                    <button
                      onClick={() => setShowOpponents(!showOpponents)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
                        showOpponents
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                      title="Pokaż/ukryj blok i obronę przeciwnika"
                    >
                      <Users className="w-3 h-3" />
                      <span className="hidden sm:inline">Rywale</span>
                    </button>

                    <button
                      onClick={() => setShowBall(!showBall)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
                        showBall
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                      title="Pokaż/ukryj piłkę"
                    >
                      <Volleyball className="w-3 h-3" />
                      <span className="hidden sm:inline">Piłka</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Full Volleyball Court Canvas Area */}
          <div
            id="tactical-court-container"
            ref={courtContainerRef}
            className={`relative bg-[#0f172a] rounded-3xl border-2 border-slate-300 shadow-md overflow-hidden mx-auto select-none transition-all duration-300 ${
              boardOrientation === 'horizontal'
                ? 'aspect-[16/10] sm:aspect-[18/11] max-w-5xl'
                : 'aspect-[9/13] sm:aspect-[9/12] max-w-3xl'
            } ${
              activeTool === 'move' ? 'cursor-default' : 'cursor-crosshair'
            }`}
            onClick={handleCourtClick}
          >
            {/* Outer Playing Boundary Line (White 2px) */}
            <div className="absolute inset-3 sm:inset-5 border-2 border-white rounded-sm pointer-events-none z-1 shadow-xs" />

            {boardOrientation === 'vertical' ? (
              <>
                {/* Top Half: Połowa Rywali (0% - 50%) */}
                <div className="absolute top-3 sm:top-5 left-3 sm:left-5 right-3 sm:right-5 bottom-1/2 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] pointer-events-none" />

                {/* Opponent 3m Attack Line (at 33.3%) */}
                <div className="absolute top-[33.3%] left-3 sm:left-5 right-3 sm:right-5 border-b-2 border-dashed border-rose-300/70 pointer-events-none z-5" />

                {/* Subtle Opponent Zone Watermarks */}
                <div className="absolute top-7 left-6 text-xs font-black text-white/20 select-none pointer-events-none">V</div>
                <div className="absolute top-7 left-1/2 -translate-x-1/2 text-xs font-black text-white/20 select-none pointer-events-none">VI</div>
                <div className="absolute top-7 right-6 text-xs font-black text-white/20 select-none pointer-events-none">I</div>
                <div className="absolute top-[42%] left-6 text-xs font-black text-white/20 select-none pointer-events-none">IV</div>
                <div className="absolute top-[42%] left-1/2 -translate-x-1/2 text-xs font-black text-white/20 select-none pointer-events-none">III</div>
                <div className="absolute top-[42%] right-6 text-xs font-black text-white/20 select-none pointer-events-none">II</div>

                {/* Center Net System: Czysta, profesjonalna siatka bez zbędnych napisów */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-20 pointer-events-none flex items-center justify-between">
                  {/* Left Post */}
                  <div className="w-3.5 h-8 bg-slate-400 rounded-r border border-slate-600 shadow-md -translate-x-0.5" />

                  {/* Net: Sleek white volleyball net tape & grid mesh (bez tekstu/badge'y) */}
                  <div className="flex-1 h-2.5 bg-white border-y border-slate-300 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:4px_4px]" />
                  </div>

                  {/* Right Post */}
                  <div className="w-3.5 h-8 bg-slate-400 rounded-l border border-slate-600 shadow-md translate-x-0.5" />
                </div>

                {/* Center Line Under Net */}
                <div className="absolute top-1/2 left-3 sm:left-5 right-3 sm:right-5 h-[2px] bg-white pointer-events-none z-10" />

                {/* Antennas (Czerwono-białe antenki na liniach bocznych) */}
                <div
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 -translate-x-1/2 h-12 w-1.5 bg-[repeating-linear-gradient(to_bottom,#ef4444,#ef4444_6px,#ffffff_6px,#ffffff_12px)] rounded-full shadow-lg z-25 pointer-events-none border border-slate-900"
                  title="Antenka siatkarska lewa"
                />
                <div
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 translate-x-1/2 h-12 w-1.5 bg-[repeating-linear-gradient(to_bottom,#ef4444,#ef4444_6px,#ffffff_6px,#ffffff_12px)] rounded-full shadow-lg z-25 pointer-events-none border border-slate-900"
                  title="Antenka siatkarska prawa"
                />

                {/* Bottom Half: Połowa Angels ZTP (50% - 100%) */}
                <div className="absolute top-1/2 left-3 sm:left-5 right-3 sm:right-5 bottom-3 sm:bottom-5 bg-gradient-to-b from-[#1e40af] to-[#1d4ed8] pointer-events-none" />

                {/* Angels ZTP 3m Attack Line (at 66.7%) */}
                <div className="absolute top-[66.7%] left-3 sm:left-5 right-3 sm:right-5 border-b-2 border-dashed border-sky-200/80 pointer-events-none z-5" />

                {/* Subtle Angels ZTP Zone Watermarks */}
                <div className="absolute top-[55%] left-6 text-xs font-black text-white/20 select-none pointer-events-none">IV</div>
                <div className="absolute top-[55%] left-1/2 -translate-x-1/2 text-xs font-black text-white/20 select-none pointer-events-none">III</div>
                <div className="absolute top-[55%] right-6 text-xs font-black text-white/20 select-none pointer-events-none">II</div>
                <div className="absolute bottom-6 left-6 text-xs font-black text-white/20 select-none pointer-events-none">V</div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-black text-white/20 select-none pointer-events-none">VI</div>
                <div className="absolute bottom-6 right-6 text-xs font-black text-white/20 select-none pointer-events-none">I</div>
              </>
            ) : (
              <>
                {/* Left Half: Połowa Rywali (0% - 50%) */}
                <div className="absolute top-3 sm:top-5 left-3 sm:left-5 right-1/2 bottom-3 sm:bottom-5 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] pointer-events-none" />

                {/* Opponent 3m Attack Line (at 33.3%) */}
                <div className="absolute left-[33.3%] top-3 sm:top-5 bottom-3 sm:bottom-5 border-r-2 border-dashed border-rose-300/70 pointer-events-none z-5" />

                {/* Opponent Zone Watermarks (Horizontal) */}
                <div className="absolute top-6 left-7 text-xs font-black text-white/20 select-none pointer-events-none">V</div>
                <div className="absolute top-1/2 -translate-y-1/2 left-7 text-xs font-black text-white/20 select-none pointer-events-none">VI</div>
                <div className="absolute bottom-6 left-7 text-xs font-black text-white/20 select-none pointer-events-none">I</div>
                <div className="absolute top-6 left-[41%] text-xs font-black text-white/20 select-none pointer-events-none">IV</div>
                <div className="absolute top-1/2 -translate-y-1/2 left-[41%] text-xs font-black text-white/20 select-none pointer-events-none">III</div>
                <div className="absolute bottom-6 left-[41%] text-xs font-black text-white/20 select-none pointer-events-none">II</div>

                {/* Center Net System: Czysta, profesjonalna siatka w pionie */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center justify-between">
                  {/* Top Post */}
                  <div className="h-3.5 w-8 bg-slate-400 rounded-b border border-slate-600 shadow-md -translate-y-0.5" />

                  {/* Net: Sleek white volleyball net tape & grid mesh */}
                  <div className="flex-1 w-2.5 bg-white border-x border-slate-300 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:4px_4px]" />
                  </div>

                  {/* Bottom Post */}
                  <div className="h-3.5 w-8 bg-slate-400 rounded-t border border-slate-600 shadow-md translate-y-0.5" />
                </div>

                {/* Center Line Under Net */}
                <div className="absolute left-1/2 top-3 sm:top-5 bottom-3 sm:bottom-5 w-[2px] bg-white pointer-events-none z-10 -translate-x-1/2" />

                {/* Antennas (Czerwono-białe antenki na liniach bocznych - góra i dół) */}
                <div
                  className="absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1.5 bg-[repeating-linear-gradient(to_right,#ef4444,#ef4444_6px,#ffffff_6px,#ffffff_12px)] rounded-full shadow-lg z-25 pointer-events-none border border-slate-900"
                  title="Antenka siatkarska górna"
                />
                <div
                  className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-1.5 bg-[repeating-linear-gradient(to_right,#ef4444,#ef4444_6px,#ffffff_6px,#ffffff_12px)] rounded-full shadow-lg z-25 pointer-events-none border border-slate-900"
                  title="Antenka siatkarska dolna"
                />

                {/* Right Half: Połowa Angels ZTP (50% - 100%) */}
                <div className="absolute top-3 sm:top-5 left-1/2 right-3 sm:right-5 bottom-3 sm:bottom-5 bg-gradient-to-r from-[#1e40af] to-[#1d4ed8] pointer-events-none" />

                {/* Angels ZTP 3m Attack Line (at 66.7%) */}
                <div className="absolute left-[66.7%] top-3 sm:top-5 bottom-3 sm:bottom-5 border-r-2 border-dashed border-sky-200/80 pointer-events-none z-5" />

                {/* Angels ZTP Zone Watermarks (Horizontal) */}
                <div className="absolute top-6 left-[56%] text-xs font-black text-white/20 select-none pointer-events-none">II</div>
                <div className="absolute top-1/2 -translate-y-1/2 left-[56%] text-xs font-black text-white/20 select-none pointer-events-none">III</div>
                <div className="absolute bottom-6 left-[56%] text-xs font-black text-white/20 select-none pointer-events-none">IV</div>
                <div className="absolute top-6 right-7 text-xs font-black text-white/20 select-none pointer-events-none">I</div>
                <div className="absolute top-1/2 -translate-y-1/2 right-7 text-xs font-black text-white/20 select-none pointer-events-none">VI</div>
                <div className="absolute bottom-6 right-7 text-xs font-black text-white/20 select-none pointer-events-none">V</div>
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
                className={`absolute z-25 flex flex-col items-center select-none transition-transform ${
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
              const cleanOppName = opp.name.replace(/\s*\([^)]*\)/, '');
              return (
                <div
                  key={opp.id}
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
                  className={`absolute z-20 flex flex-col items-center select-none transition-transform ${
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
                  <div className="mt-0.5 px-1 py-0 rounded backdrop-blur-sm border text-[8px] font-bold whitespace-nowrap shadow bg-white border-rose-300 text-rose-700 shadow-sm">
                    {cleanOppName}
                  </div>
                </div>
              );
            })}

            {/* Angels ZTP Draggable Player Markers */}
            {positions.map(player => {
              const isSelected = selectedPlayerId === player.id;
              const isDragging = draggingId === player.id;
              const isLibero = player.roleCode === 'L';
              const cleanPlayerName = player.name.replace(/\s*\([^)]*\)/, '');
              return (
                <div
                  key={player.id}
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
                  className={`absolute z-20 flex flex-col items-center select-none transition-transform ${
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
                    {player.roleCode}
                  </div>
                  <div className="mt-1 px-1.5 py-0.2 rounded-full backdrop-blur-sm border text-[8.5px] font-bold tracking-tight whitespace-nowrap shadow bg-white border-slate-300 text-slate-800 shadow-sm">
                    {cleanPlayerName}
                  </div>
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

        <div className="text-[11px] text-slate-400 text-center select-none pt-1">
          💡 Przeciągaj zawodników i piłkę myszką lub dotykiem • Kliknij gracza na boisku lub na karcie poniżej, aby przypisać zadanie
        </div>
      </div>

      {/* SEKCJA 2: ZADANIA I USTAWIENIE POZYCJI W ROTACJI */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-slate-900 tracking-wide flex items-center gap-2">
                Zadania i Ustawienie Pozycji: Rotacja {rotation} ({phase})
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  {positions.length} graczy
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Szczegółowe zadania taktyczne dla każdego zawodnika w tej fazie akcji.
              </p>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={handleSaveTactic}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 self-start sm:self-auto"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Zapisywanie...' : 'Zapisz ten zrzut'}</span>
            </button>
          )}
        </div>

        {/* If a player is selected, show an inline task editor */}
        {selectedPlayerId && selectedPlayerId !== 'ball' && !selectedPlayerId.startsWith('opp_') && (() => {
          const sel = positions.find(p => p.id === selectedPlayerId);
          if (!sel) return null;
          return (
            <div className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-300 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-sky-600 text-white font-black text-xs">
                    {sel.roleCode}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{sel.name}</span>
                  <span className="text-xs text-sky-700 font-medium">• Strefa nominalna: {sel.zone}</span>
                </div>
                <button
                  onClick={() => setSelectedPlayerId(null)}
                  className="text-xs text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded-lg bg-white border border-slate-300 shadow-2xs"
                >
                  Zamknij edycję
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={sel.task || ''}
                  onChange={e => handleUpdatePlayerTask(sel.id, e.target.value)}
                  placeholder="Wpisz zadanie zawodnika w tej rotacji (np. 'Asekuracja prostej, szybkie przejście do kontry...')"
                  className="flex-1 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 shadow-2xs"
                />
              </div>
            </div>
          );
        })()}

        {/* Responsive Grid of all 7 positions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {positions.map(p => {
            const isSelected = selectedPlayerId === p.id;
            const isLibero = p.roleCode === 'L';

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlayerId(isSelected ? null : p.id)}
                className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-sky-50 border-sky-300 text-slate-900 shadow-md ring-2 ring-sky-200'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] shadow-sm ${
                      isLibero
                        ? 'bg-amber-500 text-slate-950'
                        : p.roleCode === 'R'
                        ? 'bg-emerald-500 text-slate-950'
                        : p.roleCode.startsWith('P')
                        ? 'bg-sky-500 text-slate-950'
                        : p.roleCode.startsWith('S') || p.roleCode.startsWith('Ś')
                        ? 'bg-purple-500 text-white'
                        : 'bg-orange-500 text-slate-950'
                    }`}>
                      {p.roleCode}
                    </span>
                    <span className="font-bold text-slate-900 text-xs truncate max-w-[130px]">
                      {p.name.replace(/\s*\([^)]*\)/, '')}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                    Strefa {p.zone}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-[11.5px] text-slate-600 leading-snug line-clamp-3">
                    {p.task ? (
                      p.task
                    ) : (
                      <span className="text-slate-400 italic">Podstawowa pozycja nominalna (kliknij, by dodać zadanie)</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}

      {/* SEKCJA 2: MECZE, SPARINGI & TURNIEJE Z TERMINARZA */}
      {tacticsSection === 'matches' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <TrainingPlannerContent mode="MATCHES" defaultTab="EXERCISES" hideHeader={true} />
        </div>
      )}

      {/* SEKCJA 3: ROZPISKI TRENINGOWE (ĆWICZENIA ZE ZRZUTAMI BOISKA) */}
      {tacticsSection === 'trainings' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <TrainingPlannerContent mode="TRAININGS" defaultTab="EXERCISES" hideHeader={true} />
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
                  Wczytaj zapisany schemat ({tactics.length})
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
              {/* Wybór pliku */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Wybierz plik z komputera / telefonu (PDF lub Grafika) *
                </label>
                <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50 cursor-pointer transition group mb-2 text-center">
                  <Upload className="w-7 h-7 text-slate-400 group-hover:text-rose-500 transition mb-1" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">
                    {materialFileName
                      ? `✓ ${materialFileName} (${materialType})`
                      : 'Wybierz plik PDF, PNG, JPG lub WEBP'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Playbooki PDF, raporty skautingowe lub zrzuty tablicy
                  </span>
                  <input
                    type="file"
                    accept=".pdf, image/*"
                    className="hidden"
                    onChange={handleMaterialFileUpload}
                  />
                </label>

                <input
                  type="text"
                  placeholder="LUB wklej bezpośredni link URL..."
                  value={materialFileUrl.startsWith('data:') ? `[Wczytano plik: ${materialFileName}]` : materialFileUrl}
                  onChange={e => {
                    if (!e.target.value.startsWith('[')) {
                      setMaterialFileUrl(e.target.value);
                      if (e.target.value.toLowerCase().includes('.pdf')) {
                        setMaterialType('PDF');
                      }
                    }
                  }}
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl p-2.5 text-xs focus:outline-none focus:border-rose-400 shadow-2xs"
                />
              </div>

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

      {/* Modal: Player Request Edit / Tactical Feedback to Coach */}
      {showRequestEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight font-athletic">
                    Zgłoś Uwagę / Poproś o Edycję
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Wyślij informację bezpośrednio do trenera prowadzącego taktykę.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestEditModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendEditRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2">
                  Czego dotyczy Twoja wiadomość?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'UWAGA_ROTACJA', label: '🎯 Sugestia do rotacji' },
                    { id: 'UWAGA_BLOK', label: '🛡️ Sugestia do bloku' },
                    { id: 'PROSBA_DOSTEP', label: '✋ Prośba o edycję' },
                    { id: 'INNE', label: '💬 Inna uwaga' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setRequestEditType(cat.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-left transition ${
                        requestEditType === cat.id
                          ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs font-black'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Treść uwagi lub prośby
                </label>
                <textarea
                  rows={4}
                  required
                  value={requestEditText}
                  onChange={e => setRequestEditText(e.target.value)}
                  placeholder={
                    requestEditType === 'PROSBA_DOSTEP'
                      ? 'np. Trenerze, chciałbym rozpisać wariant asekuracji kiwki za blokiem, czy mogę dostać uprawnienia do edycji tej tablicy?'
                      : requestEditType === 'UWAGA_ROTACJA'
                      ? 'np. W ustawieniu P3 przy rotacji z mocną zagrywką przeciwnika lepiej, gdybym schodził głębiej do linii 7. metra...'
                      : 'Wpisz treść swojej uwagi lub propozycji...'
                  }
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-3 text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 Wiadomość zostanie dodana do oficjalnego panelu dyskusji taktycznej tego spotkania.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRequestEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest || !requestEditText.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm disabled:opacity-50"
                >
                  {submittingRequest ? 'Wysyłanie...' : 'Wyślij do Trenera'}
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
