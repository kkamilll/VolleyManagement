'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
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
  Lock,
  Unlock,
  FlaskConical
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
// Oficjalny system 5-1 PZPS/FIVB dla Angels ZTP:
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
  const [showOverlappingInfo, setShowOverlappingInfo] = useState(false);
  const [showDiagonalsHint, setShowDiagonalsHint] = useState(false);

  // Player Read-Only & Sandbox State
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [showRequestEditModal, setShowRequestEditModal] = useState(false);
  const [requestEditType, setRequestEditType] = useState<'UWAGA_ROTACJA' | 'UWAGA_BLOK' | 'PROSBA_DOSTEP' | 'INNE'>('UWAGA_ROTACJA');
  const [requestEditText, setRequestEditText] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

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
        'Podstawowe pozycje wyjściowe w systemie 5-1 PZPS/FIVB',
        'Przekątne: Ś1 ↔ Ś2/L, P1 ↔ P2, R ↔ A',
        'Przestrzeganie linii pionowych i poziomych w fazie przyjęcia'
      ]);
    }
  }, [activeTargetEvent, activeTargetMatch]);

  // Rotation Overlapping Validator according to FIVB / PZPS rules
  const overlappingValidation = useMemo(() => {
    if (phase !== 'PRZYJECIE') {
      return { isValid: true, errors: [], faultPlayerIds: [] };
    }

    const byZone = new Map<number, CourtPlayerPosition>();
    positions.forEach(p => byZone.set(p.zone, p));

    const p1 = byZone.get(1);
    const p2 = byZone.get(2);
    const p3 = byZone.get(3);
    const p4 = byZone.get(4);
    const p5 = byZone.get(5);
    const p6 = byZone.get(6);

    const errors: string[] = [];
    const faultPlayerIds = new Set<string>();

    // 1. Front row vs Back row (Y coordinate: 0 is net, so front row must have smaller Y)
    if (p4 && p5 && p4.y >= p5.y) {
      errors.push(`Strefa 4 (${p4.name}) stoi głębiej niż Strefa 5 (${p5.name}) — błąd przód/tył`);
      faultPlayerIds.add(p4.id);
      faultPlayerIds.add(p5.id);
    }
    if (p3 && p6 && p3.y >= p6.y) {
      errors.push(`Strefa 3 (${p3.name}) stoi głębiej niż Strefa 6 (${p6.name}) — błąd przód/tył`);
      faultPlayerIds.add(p3.id);
      faultPlayerIds.add(p6.id);
    }
    if (p2 && p1 && p2.y >= p1.y) {
      errors.push(`Strefa 2 (${p2.name}) stoi głębiej niż Strefa 1 (${p1.name}) — błąd przód/tył`);
      faultPlayerIds.add(p2.id);
      faultPlayerIds.add(p1.id);
    }

    // 2. Left vs Center vs Right (X coordinate: 0 is left, 100 is right)
    if (p4 && p3 && p4.x >= p3.x) {
      errors.push(`Strefa 4 (${p4.name}) stoi na prawo od Strefy 3 (${p3.name}) — błąd lewo/prawo`);
      faultPlayerIds.add(p4.id);
      faultPlayerIds.add(p3.id);
    }
    if (p3 && p2 && p3.x >= p2.x) {
      errors.push(`Strefa 3 (${p3.name}) stoi na prawo od Strefy 2 (${p2.name}) — błąd lewo/prawo`);
      faultPlayerIds.add(p3.id);
      faultPlayerIds.add(p2.id);
    }
    if (p5 && p6 && p5.x >= p6.x) {
      errors.push(`Strefa 5 (${p5.name}) stoi na prawo od Strefy 6 (${p6.name}) — błąd lewo/prawo`);
      faultPlayerIds.add(p5.id);
      faultPlayerIds.add(p6.id);
    }
    if (p6 && p1 && p6.x >= p1.x) {
      errors.push(`Strefa 6 (${p6.name}) stoi na prawo od Strefy 1 (${p1.name}) — błąd lewo/prawo`);
      faultPlayerIds.add(p6.id);
      faultPlayerIds.add(p1.id);
    }

    return {
      isValid: errors.length === 0,
      errors,
      faultPlayerIds: Array.from(faultPlayerIds)
    };
  }, [positions, phase]);

  const handleAutoFixOverlapping = () => {
    applyPreset(rotation, phase);
  };

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
          } else if (tacs.length > 0 && !selectedTactic) {
            setSelectedTactic(tacs[0]);
          }
        } else if (queryEventId) {
          const eventTacs = tacs.filter((t: TacticalPlay) => t.eventId === queryEventId);
          if (eventTacs.length > 0) {
            loadSavedTactic(eventTacs[0]);
          }
        } else if (!selectedTactic && tacs.length > 0) {
          setSelectedTactic(tacs[0]);
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
      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;
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
  }, [draggingId]);

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
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

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

  const filteredTactics = useMemo(() => {
    if (isLockedToUnit) {
      return unitTactics;
    }
    if (scopeFilter === 'WSZYSTKIE') return tactics;
    return tactics.filter(t => t.scope === scopeFilter);
  }, [isLockedToUnit, unitTactics, tactics, scopeFilter]);

  return (
    <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-6 lg:px-10 xl:px-12 pt-4 sm:pt-6 pb-24 md:pb-12 space-y-3 sm:space-y-4">
      {/* Top Header - Ultra-compact, elegant and responsive Pro Cyber Athletic */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-sky-500/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-sky-500/10 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0 shadow-lg shadow-sky-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-2xl font-black text-white uppercase tracking-tight font-athletic leading-tight">
              Tablica <span className="text-gradient-cyan">Taktyczna</span>
            </h1>
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium">
              System 5-1 • Pełne boisko siatkarskie • Rysowanie & Przepisy FIVB
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canEdit ? (
            <>
              <button
                onClick={handleResetPositions}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Przywróć domyślne pozycje 5-1 dla tej rotacji i fazy"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={handleOpenSaveModal}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Zapisz Zrzut</span>
              </button>
            </>
          ) : isArchiveMode ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs font-bold shadow-sm">
              <span>🔒 Archiwum: Tylko do odczytu</span>
            </div>
          ) : (
            <button
              onClick={() => setShowRequestEditModal(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
            >
              <span>✋ Poproś o edycję / Zgłoś uwagę</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation tabs: Tablica Taktyczna vs Playbook & Scouting */}
      <div className="flex items-center gap-2 border-b border-steel-800/80 pb-2">
        <Link
          href="/taktyka"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
        >
          <Compass className="w-4 h-4 text-sky-400" />
          <span>Tablica Taktyczna & Rysowanie</span>
        </Link>
        <Link
          href="/coach"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-steel-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition"
        >
          <Target className="w-4 h-4 text-amber-400" />
          <span>Playbook Trenerski & Scouting</span>
        </Link>
      </div>

      {/* Dedicated Tactical Context Switcher Bar */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-[#0b0e14] border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
              activeTargetEvent?.type === 'TRENING'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : activeTargetEvent?.type === 'SPARING'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : activeTargetEvent?.type === 'TURNIEJ'
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                : (activeTargetEvent || activeTargetMatch)
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}>
              {activeTargetEvent?.type === 'TRENING' ? (
                <Target className="w-5 h-5" />
              ) : activeTargetEvent?.type === 'SPARING' ? (
                <Swords className="w-5 h-5" />
              ) : activeTargetEvent?.type === 'TURNIEJ' ? (
                <Trophy className="w-5 h-5" />
              ) : (activeTargetEvent || activeTargetMatch) ? (
                <img src="/lals_logo.png" alt="LALS" className="w-5 h-5 rounded-full object-contain" />
              ) : (
                <Compass className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>Kontekst Taktyczny:</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase border ${
                  activeTargetEvent?.type === 'TRENING'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : activeTargetEvent?.type === 'SPARING'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : activeTargetEvent?.type === 'TURNIEJ'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : (activeTargetEvent || activeTargetMatch)
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {activeTargetEvent?.type || (activeTargetMatch ? 'MECZ LALS' : 'OGÓLNA TABLICA')}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white truncate flex items-center gap-2">
                <span>
                  {activeTargetEvent
                    ? activeTargetEvent.title
                    : activeTargetMatch
                    ? `Mecz Ligowy LALS vs ${activeTargetMatch.opponent}`
                    : 'Ogólna Baza Taktyczna Zespołu (FIVB 5-1)'}
                </span>
              </h2>
            </div>
          </div>

          {/* Unit selector dropdown / Locked indicator */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isLockedToUnit ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Zablokowano dla tego wydarzenia</span>
                </div>

                {/* Quick 1-Click Save for this Unit */}
                {canEdit && (activeTargetEvent || activeTargetMatch) && (
                  <button
                    onClick={handleQuickSaveForUnit}
                    disabled={saving}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    title="Zapisz aktualne rozrysowanie bezpośrednio do tej jednostki"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Zapisywanie...' : 'Zapisz dla tej jednostki'}</span>
                  </button>
                )}

                <Link
                  href="/events"
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition flex items-center gap-1.5"
                  title="Wróć do terminarza"
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>Terminarz</span>
                </Link>

                <Link
                  href="/taktyka"
                  className="px-2.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 text-[11px] font-medium transition flex items-center gap-1"
                  title="Odblokuj ogólną bazę taktyczną drużyny"
                >
                  <Unlock className="w-3 h-3 text-slate-400" />
                  <span>Odblokuj bazę</span>
                </Link>
              </div>
            ) : (
              <>
                <select
                  value={selectedContextKey}
                  onChange={e => setSelectedContextKey(e.target.value)}
                  className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400 max-w-full sm:max-w-xs"
                >
                  <option value="GENERAL">🌐 Ogólna Tablica Drużyny (Uniwersalna)</option>

                  {/* Treningi */}
                  {events.some(e => e.type === 'TRENING') && (
                    <optgroup label="🏐 Najbliższe Treningi">
                      {events.filter(e => e.type === 'TRENING').map(e => (
                        <option key={e.id} value={`EVENT_${e.id}`}>
                          Trening: {new Date(e.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} — {e.title}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* Sparingi */}
                  {events.some(e => e.type === 'SPARING') && (
                    <optgroup label="⚔️ Sparingi">
                      {events.filter(e => e.type === 'SPARING').map(e => (
                        <option key={e.id} value={`EVENT_${e.id}`}>
                          Sparing: {new Date(e.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} vs {e.opponent || 'Rywal'}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* Mecze ligowe LALS */}
                  {(events.some(e => e.type === 'MECZ' || e.title.toLowerCase().includes('lals') || e.title.toLowerCase().includes('mecz')) || matches.length > 0) && (
                    <optgroup label="🏆 Mecze Ligowe LALS">
                      {events.filter(e => e.type === 'MECZ' || e.title.toLowerCase().includes('lals') || e.title.toLowerCase().includes('mecz')).map(e => (
                        <option key={e.id} value={`EVENT_${e.id}`}>
                          Mecz LALS: {new Date(e.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} vs {e.opponent || 'Rywal'}
                        </option>
                      ))}
                      {matches.map(m => (
                        <option key={m.id} value={`MATCH_${m.id}`}>
                          LALS Wyniki: {new Date(m.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} vs {m.opponent}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* Turnieje */}
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

                {/* Quick 1-Click Save for this Unit */}
                {canEdit && (activeTargetEvent || activeTargetMatch) && (
                  <button
                    onClick={handleQuickSaveForUnit}
                    disabled={saving}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    title="Zapisz aktualne rozrysowanie i wytyczne bezpośrednio do tej jednostki"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Zapisywanie...' : 'Zapisz dla tej jednostki'}</span>
                  </button>
                )}

                {selectedContextKey !== 'GENERAL' && (
                  <button
                    onClick={() => setSelectedContextKey('GENERAL')}
                    className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition"
                    title="Powrót do ogólnej tablicy"
                  >
                    Resetuj kontekst
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Specialized Unit Command Box */}
        {(activeTargetEvent || activeTargetMatch) && (
          <div className={`p-3.5 sm:p-4 rounded-2xl border text-xs space-y-3 animate-fadeIn ${
            activeTargetEvent?.type === 'TRENING'
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : activeTargetEvent?.type === 'SPARING'
              ? 'bg-amber-950/30 border-amber-500/40'
              : activeTargetEvent?.type === 'TURNIEJ'
              ? 'bg-purple-950/30 border-purple-500/40'
              : 'bg-sky-950/40 border-sky-500/40'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-white text-xs">
                  {activeTargetEvent?.type === 'TRENING'
                    ? 'Plan Treningowy & Zestawienie Pozycji'
                    : activeTargetEvent?.type === 'SPARING'
                    ? `Założenia Sparingowe vs ${activeTargetEvent.opponent || 'Rywal'}`
                    : activeTargetEvent?.type === 'TURNIEJ'
                    ? 'Taktyka Turniejowa & Zmiany Zmęczeniowe'
                    : `Odprawa Meczowa LALS vs ${activeTargetEvent?.opponent || activeTargetMatch?.opponent || 'Rywal'}`}
                </span>

                {activeTargetEvent && (
                  <span className="text-[11px] font-mono text-slate-400">
                    • {new Date(activeTargetEvent.date).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })} • {activeTargetEvent.location}
                  </span>
                )}
              </div>

              {/* Roster & Auto-populate action */}
              {activeTargetEvent && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-slate-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    ✓ {(activeTargetEvent.attendees || []).filter(a => a.status === 'BEDE').length} obecnych z ankiety
                  </span>

                  {canEdit && (
                    <button
                      onClick={handlePopulateConfirmedPlayers}
                      className="px-2.5 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-black transition flex items-center gap-1 shadow-sm"
                      title="Automatycznie przypisz potwierdzonych graczy z ankiety do ich nominalnych pozycji (R, P1, P2, Ś1, Ś2, A, L)"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Wstaw obecnych na boisko</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Tactical Directives / Action Points */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Wytyczne Taktyczne & Zadania dla Drużyny:
                </span>
                {canEdit && (
                  <button
                    onClick={() => setShowDirectiveEditor(!showDirectiveEditor)}
                    className="text-[10px] text-slate-400 hover:text-white underline font-bold"
                  >
                    {showDirectiveEditor ? 'Zwiń edytor' : '+ Edytuj wytyczne'}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {unitDirectives.map((dir, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-200 font-medium flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{dir}</span>
                    {canEdit && showDirectiveEditor && (
                      <button
                        onClick={() => setUnitDirectives(unitDirectives.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 ml-1 font-bold"
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
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
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
      </div>

      {/* SEKCJA 1: TABLICA TAKTYCZNA (BOISKO I KONSOLA ROZGRYWANIA) */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl space-y-4">
          
          {/* UNIFIED COMPACT TACTICAL CONSOLE */}
          <div className="bg-[#0b0e14] border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 shadow-xl space-y-2">
            {/* Row 1: Rotation Selector & Phase Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
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
                          ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Drawing Tools & Palettes OR Player Read-Only Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/70">
              {!canEdit && !isSandboxMode ? (
                <div className="w-full flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Widok Zawodnika (Tylko odczyt)</span>
                    </span>
                    <span className="text-[11px] text-slate-400 hidden lg:inline">
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
                      className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
                      title="Włącz brudnopis do lokalnych testów i rysunków bez zmian w taktyce trenera"
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                      <span>Włącz brudnopis</span>
                    </button>

                    {/* Opponents & Ball Toggles for player exploration */}
                    <button
                      onClick={() => setShowOpponents(!showOpponents)}
                      className={`px-1.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
                        showOpponents
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                      title="Pokaż/ukryj blok i obronę przeciwnika"
                    >
                      <Users className="w-3 h-3" />
                      <span className="hidden sm:inline">Rywale</span>
                    </button>

                    <button
                      onClick={() => setShowBall(!showBall)}
                      className={`px-1.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
                        showBall
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
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
                    <div className="w-full mb-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2 shadow-sm">
                      <span className="flex items-center gap-1.5 font-bold">
                        <FlaskConical className="w-4 h-4 text-amber-400" />
                        <span>Tryb Brudnopisu: Rysujesz i testujesz lokalnie (Twoje zmiany nie nadpisują założeń trenera)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSandboxMode(false)}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 transition"
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
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 border-amber-300 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
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
                          ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
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
                          ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
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
                          ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
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
                        { hex: '#38bdf8', label: 'Błękitny' },
                        { hex: '#f43f5e', label: 'Czerwony' },
                        { hex: '#ffffff', label: 'Biały' }
                      ].map(c => (
                        <button
                          key={c.hex}
                          onClick={() => {
                            setDrawColor(c.hex);
                            if (activeTool === 'move') setActiveTool('pen');
                          }}
                          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full border transition ${
                            drawColor === c.hex ? 'border-white scale-110 ring-2 ring-white/30' : 'border-slate-700 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.label}
                        />
                      ))}
                    </div>

                    <div className="h-4 w-px bg-slate-800 mx-0.5" />

                    {/* Undo & Clear */}
                    <button
                      onClick={handleUndo}
                      className="p-1 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition"
                      title="Cofnij rysunek"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={handleClearDrawing}
                      className="p-1 rounded-lg bg-slate-900 text-rose-400 hover:text-rose-300 border border-slate-800 transition"
                      title="Wyczyść rysunki"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Opponents & Ball Toggles */}
                    <button
                      onClick={() => setShowOpponents(!showOpponents)}
                      className={`px-1.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
                        showOpponents
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                      title="Pokaż/ukryj blok i obronę przeciwnika"
                    >
                      <Users className="w-3 h-3" />
                      <span className="hidden sm:inline">Rywale</span>
                    </button>

                    <button
                      onClick={() => setShowBall(!showBall)}
                      className={`px-1.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
                        showBall
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                      title="Pokaż/ukryj piłkę"
                    >
                      <Volleyball className="w-3 h-3" />
                      <span className="hidden sm:inline">Piłka</span>
                    </button>

                    {/* 5-1 diagonals info button */}
                    <button
                      onClick={() => setShowDiagonalsHint(!showDiagonalsHint)}
                      className={`px-1.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
                        showDiagonalsHint
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                      title="Pokaż przekątne systemu 5-1"
                    >
                      <span>ℹ️ 5-1</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Collapsible 5-1 Diagonals Banner */}
            {showDiagonalsHint && (
              <div className="flex flex-wrap items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80 gap-1.5 animate-fadeIn">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-amber-400 font-black uppercase text-[10px]">Przekątne 5-1:</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                    Środkowi: <strong className="text-amber-300">Ś1 ↔ Ś2/Libero</strong>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                    Przyjmujący: <strong className="text-sky-300">P1 ↔ P2</strong>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                    Skrzydło: <strong className="text-emerald-300">R ↔ A</strong>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {rotation === 'P1' || rotation === 'P6' || rotation === 'P5' ? 'Rozgrywający w II linii' : 'Rozgrywający w I linii'}
                </span>
              </div>
            )}

            {/* Slim FIVB Overlapping Validator Banner */}
            {phase === 'PRZYJECIE' && (
              <div className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${
                overlappingValidation.isValid
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  {overlappingValidation.isValid ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
                  )}
                  <span className="font-bold text-[11px] truncate">
                    {overlappingValidation.isValid
                      ? `✓ Zgodne z FIVB (Brak błędów w rotacji ${rotation})`
                      : `⚠️ Błąd rotacji (${overlappingValidation.errors.length} kolizje)`}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!overlappingValidation.isValid && (
                    <button
                      onClick={handleAutoFixOverlapping}
                      className="px-2 py-0.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-black text-[10px] transition"
                    >
                      Skoryguj
                    </button>
                  )}
                  <button
                    onClick={() => setShowOverlappingInfo(!showOverlappingInfo)}
                    className="text-[10px] text-slate-400 hover:text-white underline font-bold"
                  >
                    {showOverlappingInfo ? 'Zwiń' : 'Zasady'}
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible Rules Explanation */}
            {showOverlappingInfo && (
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1 animate-fadeIn">
                <p>• <strong>Pion (przód/tył):</strong> Gracze I linii (4, 3, 2) muszą stać bliżej siatki niż gracze II linii (5, 6, 1).</p>
                <p>• <strong>Poziom (lewo/prawo):</strong> Gracze strefy 4 i 5 muszą stać bardziej na lewo niż strefa 3 i 6; strefa 2 i 1 bardziej na prawo niż strefa 3 i 6.</p>
              </div>
            )}
          </div>

          {/* Full Volleyball Court Canvas Area */}
          <div
            id="tactical-court-container"
            ref={courtContainerRef}
            className={`relative bg-[#0b1222] rounded-3xl border-2 border-slate-700 shadow-2xl overflow-hidden aspect-[9/13] sm:aspect-[9/12] max-w-3xl mx-auto select-none ${
              activeTool === 'move' ? 'cursor-default' : 'cursor-crosshair'
            }`}
            onClick={handleCourtClick}
          >
            {/* Outer Playing Boundary Line (White 2px) */}
            <div className="absolute inset-3 sm:inset-5 border-2 border-white/85 rounded-sm pointer-events-none z-1" />

            {/* Top Half: Połowa Rywali (0% - 50%) */}
            <div className="absolute top-3 sm:top-5 left-3 sm:left-5 right-3 sm:right-5 bottom-1/2 bg-gradient-to-b from-[#0f1b34] to-[#132345] pointer-events-none" />

            {/* Opponent 3m Attack Line (at 33.3%) */}
            <div className="absolute top-[33.3%] left-3 sm:left-5 right-3 sm:right-5 border-b-2 border-dashed border-rose-400/35 pointer-events-none z-5" />

            {/* Subtle Opponent Zone Watermarks */}
            <div className="absolute top-7 left-6 text-xs font-black text-rose-400/10 select-none pointer-events-none">V</div>
            <div className="absolute top-7 left-1/2 -translate-x-1/2 text-xs font-black text-rose-400/10 select-none pointer-events-none">VI</div>
            <div className="absolute top-7 right-6 text-xs font-black text-rose-400/10 select-none pointer-events-none">I</div>
            <div className="absolute top-[42%] left-6 text-xs font-black text-rose-400/10 select-none pointer-events-none">IV</div>
            <div className="absolute top-[42%] left-1/2 -translate-x-1/2 text-xs font-black text-rose-400/10 select-none pointer-events-none">III</div>
            <div className="absolute top-[42%] right-6 text-xs font-black text-rose-400/10 select-none pointer-events-none">II</div>

            {/* Center Net System: Czysta, profesjonalna siatka bez zbędnych napisów */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-20 pointer-events-none flex items-center justify-between">
              {/* Left Post */}
              <div className="w-3.5 h-8 bg-slate-500 rounded-r border border-slate-700 shadow-xl -translate-x-0.5" />

              {/* Net: Sleek white volleyball net tape & grid mesh (bez tekstu/badge'y) */}
              <div className="flex-1 h-2.5 bg-slate-100 border-y border-slate-400 shadow-md relative overflow-hidden">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:4px_4px]" />
              </div>

              {/* Right Post */}
              <div className="w-3.5 h-8 bg-slate-500 rounded-l border border-slate-700 shadow-xl translate-x-0.5" />
            </div>

            {/* Center Line Under Net */}
            <div className="absolute top-1/2 left-3 sm:left-5 right-3 sm:right-5 h-[2px] bg-white/70 pointer-events-none z-10" />

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
            <div className="absolute top-1/2 left-3 sm:left-5 right-3 sm:right-5 bottom-3 sm:bottom-5 bg-gradient-to-b from-[#132345] to-[#0f1b34] pointer-events-none" />

            {/* Angels ZTP 3m Attack Line (at 66.7%) */}
            <div className="absolute top-[66.7%] left-3 sm:left-5 right-3 sm:right-5 border-b-2 border-dashed border-sky-400/40 pointer-events-none z-5" />

            {/* Subtle Angels ZTP Zone Watermarks */}
            <div className="absolute top-[55%] left-6 text-xs font-black text-sky-400/10 select-none pointer-events-none">IV</div>
            <div className="absolute top-[55%] left-1/2 -translate-x-1/2 text-xs font-black text-sky-400/10 select-none pointer-events-none">III</div>
            <div className="absolute top-[55%] right-6 text-xs font-black text-sky-400/10 select-none pointer-events-none">II</div>
            <div className="absolute bottom-6 left-6 text-xs font-black text-sky-400/10 select-none pointer-events-none">V</div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-black text-sky-400/10 select-none pointer-events-none">VI</div>
            <div className="absolute bottom-6 right-6 text-xs font-black text-sky-400/10 select-none pointer-events-none">I</div>

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
                  left: `${ballPos.x}%`,
                  top: `${ballPos.y}%`,
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
                    left: `${opp.x}%`,
                    top: `${opp.y}%`,
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
                        : 'bg-rose-950 text-rose-200 border-rose-500'
                    }`}
                  >
                    {opp.roleCode}
                  </div>
                  <div className="mt-0.5 px-1 py-0 rounded backdrop-blur-sm border text-[8px] font-bold whitespace-nowrap shadow bg-slate-950/85 border-slate-700 text-rose-200">
                    {cleanOppName}
                  </div>
                </div>
              );
            })}

            {/* SVG Visual Diagonals Overlay (Przekątne 5-1: Środkowi naprzeciwko siebie) */}
            {showDiagonalsHint && (() => {
              const middle1 = positions.find(p => p.roleCode === 'Ś1' || p.roleCode === 'Ś2');
              const middle2 = positions.find(p => p !== middle1 && (p.roleCode === 'Ś1' || p.roleCode === 'Ś2' || p.roleCode === 'L'));
              const setter = positions.find(p => p.roleCode === 'R');
              const opposite = positions.find(p => p.roleCode === 'A');
              const p1 = positions.find(p => p.roleCode === 'P1');
              const p2 = positions.find(p => p.roleCode === 'P2');

              return (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-18">
                  {/* Środkowi naprzeciwko siebie (Ś1 ↔ Ś2/L) */}
                  {middle1 && middle2 && (
                    <g>
                      <line
                        x1={`${middle1.x}%`}
                        y1={`${middle1.y}%`}
                        x2={`${middle2.x}%`}
                        y2={`${middle2.y}%`}
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                        opacity="0.95"
                      />
                      <circle
                        cx={`${(middle1.x + middle2.x) / 2}%`}
                        cy={`${(middle1.y + middle2.y) / 2}%`}
                        r="16"
                        fill="#0b1222"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />
                      <text
                        x={`${(middle1.x + middle2.x) / 2}%`}
                        y={`${(middle1.y + middle2.y) / 2}%`}
                        fill="#fcd34d"
                        fontSize="8.5"
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        Ś1 ↔ Ś2
                      </text>
                    </g>
                  )}

                  {/* Rozgrywający ↔ Atakujący (R ↔ A) */}
                  {setter && opposite && (
                    <line
                      x1={`${setter.x}%`}
                      y1={`${setter.y}%`}
                      x2={`${opposite.x}%`}
                      y2={`${opposite.y}%`}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      opacity="0.75"
                    />
                  )}

                  {/* Przyjmujący ↔ Przyjmujący (P1 ↔ P2) */}
                  {p1 && p2 && (
                    <line
                      x1={`${p1.x}%`}
                      y1={`${p1.y}%`}
                      x2={`${p2.x}%`}
                      y2={`${p2.y}%`}
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      opacity="0.75"
                    />
                  )}
                </svg>
              );
            })()}

            {/* Angels ZTP Draggable Player Markers */}
            {positions.map(player => {
              const isSelected = selectedPlayerId === player.id;
              const isDragging = draggingId === player.id;
              const isLibero = player.roleCode === 'L';
              const isFault = overlappingValidation.faultPlayerIds.includes(player.id);
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
                    left: `${player.x}%`,
                    top: `${player.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-20 flex flex-col items-center select-none transition-transform ${
                    activeTool === 'move' && isEffectiveEditor ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  } ${isDragging ? 'scale-120 z-30 opacity-90' : isSelected ? 'scale-110 z-25' : 'hover:scale-105'}`}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs shadow-lg border-2 transition ${
                      isFault
                        ? 'ring-4 ring-rose-500 bg-rose-600 text-white border-white animate-pulse shadow-rose-500/50'
                        : isLibero
                        ? 'bg-amber-500 text-slate-950 border-white'
                        : isSelected
                        ? 'bg-sky-400 text-slate-950 border-white animate-pulse ring-2 ring-sky-300'
                        : 'bg-slate-900 text-white border-sky-400'
                    }`}
                  >
                    {player.roleCode}
                  </div>
                  <div className={`-mt-1 px-1.5 py-0.2 rounded-full backdrop-blur-sm border text-[8.5px] font-bold tracking-tight whitespace-nowrap shadow ${
                    isFault ? 'bg-rose-950/90 border-rose-500 text-rose-200' : 'bg-slate-950/90 border-slate-700/80 text-slate-200'
                  }`}>
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
      <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-white tracking-wide flex items-center gap-2">
                Zadania i Ustawienie Pozycji: Rotacja {rotation} ({phase})
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {positions.length} graczy
                </span>
              </h3>
              <p className="text-xs text-slate-400">
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
            <div className="p-4 rounded-2xl bg-sky-500/10 border-2 border-sky-500/40 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-sky-500 text-slate-950 font-black text-xs">
                    {sel.roleCode}
                  </span>
                  <span className="text-sm font-bold text-white">{sel.name}</span>
                  <span className="text-xs text-sky-300 font-medium">• Strefa nominalna: {sel.zone}</span>
                </div>
                <button
                  onClick={() => setSelectedPlayerId(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800"
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
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
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
            const isFault = overlappingValidation.faultPlayerIds.includes(p.id);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlayerId(isSelected ? null : p.id)}
                className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-400 text-white shadow-xl ring-2 ring-sky-400/30'
                    : isFault
                    ? 'bg-rose-950/20 border-rose-500/50 text-slate-200 hover:border-rose-400'
                    : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
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
                    <span className="font-bold text-white text-xs truncate max-w-[130px]">
                      {p.name.replace(/\s*\([^)]*\)/, '')}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    Strefa {p.zone}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-[11.5px] text-slate-300 leading-snug line-clamp-3">
                    {p.task ? (
                      p.task
                    ) : (
                      <span className="text-slate-500 italic">Podstawowa pozycja nominalna (kliknij, by dodać zadanie)</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEKCJA 3: BAZA ZAPISANYCH ZRZUTÓW TAKTYCZNYCH (PLAYBOOK) */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-white tracking-wide flex items-center gap-2">
                {isLockedToUnit ? 'Zrzuty Dedykowane dla Tego Wydarzenia' : 'Baza Zapisanych Zrzutów i Schematów Taktycznych'}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {filteredTactics.length} schematów
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isLockedToUnit
                  ? activeTargetEvent?.title || (activeTargetMatch ? `Mecz vs ${activeTargetMatch.opponent}` : 'Zablokowana sesja meczowa')
                  : 'Biblioteka zrzutów taktycznych, wariantów rozegrania i schematów przyjęcia dla Angels ZTP.'}
              </p>
            </div>
          </div>

          {!isLockedToUnit && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {(['WSZYSTKIE', 'TRENING', 'OGOLNA', 'SPARING', 'MECZ_LIGOWY', 'TURNIEJ'] as const).map(sc => (
                <button
                  key={sc}
                  onClick={() => setScopeFilter(sc)}
                  className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition border ${
                    scopeFilter === sc
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {sc === 'WSZYSTKIE'
                    ? 'Wszystkie'
                    : sc === 'TRENING'
                    ? '🏐 Treningi'
                    : sc === 'OGOLNA'
                    ? '🌐 Ogólne'
                    : sc === 'SPARING'
                    ? '⚔️ Sparingi'
                    : sc === 'MECZ_LIGOWY'
                    ? '🏆 Liga LALS'
                    : '🥇 Turnieje'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tactic Cards Responsive Grid */}
        {filteredTactics.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-2">
            <Target className="w-8 h-8 text-amber-400/60 mx-auto" />
            <p className="text-xs font-bold text-slate-300">
              {isLockedToUnit ? 'Brak dedykowanych zrzutów dla tego wydarzenia' : 'Brak zapisanych taktyk w tej kategorii'}
            </p>
            <p className="text-[11px] text-slate-500">
              Rozrysuj tablicę i kliknij "Zapisz ten zrzut" powyżej, aby zapisać wariant taktyczny.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredTactics.map(tac => {
              const isSelected = selectedTactic?.id === tac.id;
              return (
                <div
                  key={tac.id}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 text-white shadow-xl ring-2 ring-amber-400/30'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-black text-sm tracking-wide ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                        {tac.title}
                      </h4>
                      <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-800 text-amber-300 border border-slate-700">
                        {tac.rotation} • {tac.phase}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10.5px] text-slate-400 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 font-bold border border-sky-500/20">
                        {tac.scope === 'OGOLNA'
                          ? 'Ogólna'
                          : tac.scope === 'TRENING'
                          ? 'Trening'
                          : tac.scope === 'SPARING'
                          ? 'Sparing'
                          : tac.scope === 'MECZ_LIGOWY'
                          ? 'Mecz LALS'
                          : 'Turniej'}
                      </span>
                      <span>{new Date(tac.createdAt).toLocaleDateString('pl-PL')}</span>
                    </div>

                    {tac.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 pt-1">
                        {tac.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => loadSavedTactic(tac)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Załadowana na tablicę' : 'Załaduj na tablicę'}</span>
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => handleDeleteTactic(tac.id)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                        title="Usuń ten zrzut"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEKCJA 4: SUGESTIE & DYSKUSJA TAKTYCZNA ZESPOŁU */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-white tracking-wide flex items-center gap-2">
                Sugestie i Dyskusja Taktyczna Zespołu
                {selectedTactic?.posts && selectedTactic.posts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedTactic.posts.length} uwag
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Zawodnicy mogą zgłaszać uwagi i poprawki do ustawienia, a Trener decyduje o ich wdrożeniu do planu meczowego.
              </p>
            </div>
          </div>
        </div>

        {/* Form to submit suggestion post */}
        {user ? (
          <form onSubmit={handleAddPost} className="space-y-3">
            <div className="relative">
              <textarea
                rows={2}
                required
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                placeholder="Napisz swoją uwagę / sugestię do tego ustawienia (np. 'W tym ustawieniu przy zagrywce po skosie lepiej żebym cofnął się o metr do środka...')"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-sky-400 placeholder:text-slate-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingPost}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-sky-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingPost ? 'Wysyłanie...' : 'Wyślij Sugestię do Trenera'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-slate-500 italic">Zaloguj się, aby dodać sugestię do taktyki.</p>
        )}

        {/* Posts Feed */}
        <div className="space-y-3 pt-2">
          {(!selectedTactic?.posts || selectedTactic.posts.length === 0) ? (
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
              Brak uwag zawodników do tej taktyki. Bądź pierwszy i dodaj swoją sugestię powyżej!
            </div>
          ) : (
            selectedTactic.posts.map(post => {
              const isAccepted = post.status === 'ZAAKCEPTOWANY';
              const isRejected = post.status === 'ODRZUCONY';
              const isPending = post.status === 'OCZEKUJE';

              return (
                <div
                  key={post.id}
                  className={`p-4 rounded-2xl border transition space-y-2.5 ${
                    isAccepted
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : isRejected
                      ? 'bg-rose-950/20 border-rose-500/30 opacity-75'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-sky-400 font-bold flex items-center justify-center text-[10px]">
                        {post.authorName.charAt(0)}
                      </div>
                      <span className="font-bold text-white">{post.authorName}</span>
                      <span className="text-[10px] text-slate-500">
                        • {new Date(post.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {isAccepted && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Zaakceptowano
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-amber-400" />
                          Oczekuje na decyzję
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <X className="w-3 h-3 text-rose-400" />
                          Odrzucono
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-xs text-slate-300 leading-relaxed pl-2 border-l-2 border-slate-700">
                    {post.content}
                  </p>

                  {/* Coach Comment / Feedback if available */}
                  {post.coachComment && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 flex items-start gap-2">
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black text-[10px] uppercase text-amber-400 block">
                          Odpowiedź Trenera:
                        </span>
                        <span className="text-slate-200">{post.coachComment}</span>
                      </div>
                    </div>
                  )}

                  {/* Coach Action Controls */}
                  {canEdit && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60 text-xs">
                      {post.status !== 'ZAAKCEPTOWANY' && (
                        <button
                          onClick={() => {
                            const comment = prompt('Dodaj komentarz trenera do zatwierdzenia (opcjonalnie):', 'Zaakceptowano do planu meczowego');
                            if (comment !== null) {
                              handleUpdatePostStatus(post.id, 'ZAAKCEPTOWANY', comment);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1 text-[11px]"
                        >
                          <Check className="w-3 h-3" /> Przyjmij uwagę
                        </button>
                      )}
                      {post.status !== 'ODRZUCONY' && (
                        <button
                          onClick={() => {
                            const comment = prompt('Powód odrzucenia uwagi (opcjonalnie):', 'W tym wariancie trzymamy się pierwotnego planu');
                            if (comment !== null) {
                              handleUpdatePostStatus(post.id, 'ODRZUCONY', comment);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition flex items-center gap-1 text-[11px]"
                        >
                          <X className="w-3 h-3" /> Odrzuć
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DEDYKOWANA SEKCJA: MATERIAŁY TAKTYCZNE, PDF & GRAFIKI ROZSZERZONE */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wide flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-400" />
              Materiały Taktyczne, Playbooki PDF & Grafiki Rozszerzone
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Odprawy meczowe w formacie PDF, analizy wideo rywali, rozpiski przyjęcia i zdjęcia z tablicy taktycznej.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <button
                onClick={() => setMaterialFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  materialFilter === 'ALL'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Wszystkie ({materials.length})
              </button>
              <button
                onClick={() => setMaterialFilter('PDF')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                  materialFilter === 'PDF'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-rose-300" />
                <span>PDF ({materials.filter(m => m.type === 'PDF').length})</span>
              </button>
              <button
                onClick={() => setMaterialFilter('IMAGE')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                  materialFilter === 'IMAGE'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Grafiki ({materials.filter(m => m.type === 'IMAGE').length})</span>
              </button>
            </div>

            {canEdit && (
              <button
                onClick={() => {
                  if (activeTargetEvent) {
                    setMaterialScope(activeTargetEvent.type === 'SPARING' ? 'SPARING' : activeTargetEvent.type === 'TURNIEJ' ? 'TURNIEJ' : activeTargetEvent.type === 'TRENING' ? 'TRENING' : 'MECZ_LIGOWY');
                    setMaterialEventId(activeTargetEvent.id);
                  }
                  setShowAddMaterialModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-rose-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Dodaj Materiał (PDF / Grafika)</span>
              </button>
            )}
          </div>
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">Brak wgranych materiałów taktycznych</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Możesz wgrać pliki PDF (np. scouting rywali z VolleyStation, playbook zagrywek) lub grafiki (np. zdjęcie rozrysowanej tablicy w szatni).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map(mat => {
              const isPdf = mat.type === 'PDF';
              const isLinkedToCurrent = activeTargetEvent && mat.eventId === activeTargetEvent.id;

              return (
                <div
                  key={mat.id}
                  className={`p-4 rounded-2xl bg-slate-900/70 border transition flex flex-col justify-between space-y-3 ${
                    isLinkedToCurrent
                      ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border flex items-center gap-1 ${
                          isPdf
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {isPdf ? <FileText className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                          <span>{mat.type}</span>
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          mat.scope === 'MECZ_LIGOWY'
                            ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                            : mat.scope === 'SPARING'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : mat.scope === 'TURNIEJ'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : mat.scope === 'TRENING'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {mat.scope}
                        </span>
                      </div>

                      {mat.fileSize && (
                        <span className="text-[10px] font-mono text-slate-500">
                          {mat.fileSize}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white line-clamp-1">{mat.title}</h4>
                      {mat.fileName && (
                        <span className="text-[10px] text-slate-500 font-mono block truncate mt-0.5">
                          📄 {mat.fileName}
                        </span>
                      )}
                    </div>

                    {mat.description && (
                      <p className="text-xs text-slate-300 leading-snug line-clamp-2">
                        {mat.description}
                      </p>
                    )}

                    {/* Image Thumbnail Preview if Graphic */}
                    {!isPdf && (
                      <div
                        onClick={() => setSelectedImagePreview(mat)}
                        className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black cursor-pointer group"
                      >
                        <img
                          src={mat.fileUrl}
                          alt={mat.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                          <Eye className="w-4 h-4 text-sky-400" />
                          <span>Powiększ grafikę</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                      {mat.uploadedByName} • {new Date(mat.uploadedAt).toLocaleDateString('pl-PL')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isPdf ? (
                        <>
                          <button
                            onClick={() => setSelectedPdfViewer(mat)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1"
                            title="Otwórz podgląd PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Podgląd</span>
                          </button>
                          <a
                            href={mat.fileUrl}
                            download={mat.fileName || `${mat.title}.pdf`}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Pobierz PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setSelectedImagePreview(mat)}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition flex items-center gap-1"
                            title="Powiększ grafikę"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Zobacz</span>
                          </button>
                          <a
                            href={mat.fileUrl}
                            download={mat.fileName || `${mat.title}.png`}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Pobierz grafikę"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}

                      {canEdit && (
                        <button
                          onClick={() => handleDeleteMaterial(mat.id)}
                          className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
                          title="Usuń materiał"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Dodaj Materiał Taktyczny (PDF / Grafika) */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-black uppercase text-white">
                  Dodaj Materiał Taktyczny
                </h3>
              </div>
              <button onClick={() => setShowAddMaterialModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4">
              {/* Wybór pliku */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Wybierz plik z komputera / telefonu (PDF lub Grafika) *
                </label>
                <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-rose-400 bg-slate-900/60 cursor-pointer transition group mb-2 text-center">
                  <Upload className="w-7 h-7 text-slate-400 group-hover:text-rose-400 transition mb-1" />
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white">
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              {/* Tytuł materiału */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tytuł materiału *</label>
                <input
                  type="text"
                  required
                  placeholder="np. Raport wideo: Analiza zagrywki KS Metro Poznań"
                  value={materialTitle}
                  onChange={e => setMaterialTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Kategoria & Jednostka */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kategoria</label>
                  <select
                    value={materialScope}
                    onChange={e => setMaterialScope(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
                  >
                    <option value="OGOLNE">Ogólne (baza taktyczna)</option>
                    <option value="MECZ_LIGOWY">Mecz Ligowy LALS</option>
                    <option value="SPARING">Sparing</option>
                    <option value="TURNIEJ">Turniej</option>
                    <option value="TRENING">Trening</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Przypisz do wydarzenia</label>
                  <select
                    value={materialEventId}
                    onChange={e => setMaterialEventId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
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
                <label className="block text-xs font-bold text-slate-300 mb-1">Wskazówki trenera & opis</label>
                <textarea
                  rows={3}
                  placeholder="Krótki opis, na co zawodnicy mają zwrócić uwagę w tym dokumencie..."
                  value={materialDescription}
                  onChange={e => setMaterialDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={uploadingMaterial}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-500 hover:bg-rose-400 text-white transition shadow-lg shadow-rose-500/20"
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
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#0b0e14] border border-slate-800 rounded-3xl w-full max-w-4xl h-[88vh] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-sm font-black text-white">{selectedPdfViewer.title}</h3>
                  <span className="text-[10px] text-slate-400">{selectedPdfViewer.fileName || 'Dokument PDF'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedPdfViewer.fileUrl}
                  download={selectedPdfViewer.fileName || `${selectedPdfViewer.title}.pdf`}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-rose-400" />
                  <span>Pobierz PDF</span>
                </a>
                <button
                  onClick={() => setSelectedPdfViewer(null)}
                  className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-900 relative">
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
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-4xl max-h-[92vh] flex flex-col items-center relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-2 right-2 sm:-top-10 sm:right-0 w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 text-xs"
            >
              ✕
            </button>
            <div className="rounded-3xl overflow-hidden border border-slate-800 bg-black max-h-[75vh]">
              <img
                src={selectedImagePreview.fileUrl}
                alt={selectedImagePreview.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
            <div className="mt-3 text-center text-white space-y-1">
              <h3 className="text-base font-black">{selectedImagePreview.title}</h3>
              {selectedImagePreview.description && (
                <p className="text-xs text-slate-400">{selectedImagePreview.description}</p>
              )}
              <div className="pt-1 flex items-center justify-center gap-2">
                <a
                  href={selectedImagePreview.fileUrl}
                  download={selectedImagePreview.fileName || `${selectedImagePreview.title}.png`}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pobierz grafikę</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Tactic / Snapshot Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Camera className="w-5 h-5 text-sky-400" />
              Zapisz Zrzut Taktyczny do Meczu
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Aktualne rozrysowanie pisakiem oraz pozycje graczy zostaną zapisane i <strong>automatycznie pojawią się w terminarzu tego meczu</strong>.
            </p>

            <form onSubmit={handleSaveTactic} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-300 mb-1">
                  Tytuł zrzutu taktycznego *
                </label>
                <input
                  type="text"
                  required
                  value={tacticTitle}
                  onChange={e => setTacticTitle(e.target.value)}
                  placeholder="np. Plan na mecz: Ustawienie obrony przeciwko Trefl II"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-300 mb-1">
                    Przypisz do rozgrywek
                  </label>
                  <select
                    value={tacticScope}
                    onChange={e => setTacticScope(e.target.value as TacticScope)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-400"
                  >
                    <option value="TRENING">Do konkretnego treningu</option>
                    <option value="SPARING">Do konkretnego sparingu</option>
                    <option value="MECZ_LIGOWY">Do meczu ligowego LALS</option>
                    <option value="TURNIEJ">Do turnieju</option>
                    <option value="OGOLNA">Taktyka ogólna</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-300 mb-1">
                    Wybierz jednostkę *
                  </label>
                  {tacticScope === 'TRENING' ? (
                    <select
                      required
                      value={linkedEventId}
                      onChange={e => setLinkedEventId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-400"
                    >
                      <option value="">Wybierz trening z listy...</option>
                      {events
                        .filter(e => e.type === 'TRENING')
                        .map(e => (
                          <option key={e.id} value={e.id}>
                            {new Date(e.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} — {e.title}
                          </option>
                        ))}
                    </select>
                  ) : tacticScope === 'SPARING' ? (
                    <select
                      required
                      value={linkedEventId}
                      onChange={e => setLinkedEventId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-400"
                    >
                      <option value="">Wybierz sparing z listy...</option>
                      {events
                        .filter(e => e.type === 'SPARING')
                        .map(e => (
                          <option key={e.id} value={e.id}>
                            {e.title} ({e.opponent || 'Sparing'})
                          </option>
                        ))}
                    </select>
                  ) : tacticScope === 'MECZ_LIGOWY' ? (
                    <select
                      required
                      value={linkedMatchId}
                      onChange={e => setLinkedMatchId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-400"
                    >
                      <option value="">Wybierz mecz ligowy...</option>
                      {matches.map(m => (
                        <option key={m.id} value={m.id}>
                          vs {m.opponent} ({new Date(m.date).toLocaleDateString('pl-PL')})
                        </option>
                      ))}
                    </select>
                  ) : tacticScope === 'TURNIEJ' ? (
                    <select
                      required
                      value={linkedEventId}
                      onChange={e => setLinkedEventId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-400"
                    >
                      <option value="">Wybierz turniej...</option>
                      {events
                        .filter(e => e.type === 'TURNIEJ')
                        .map(e => (
                          <option key={e.id} value={e.id}>
                            {e.title}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      disabled
                      value="Taktyka ogólna (baza)"
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-slate-500 text-xs"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-300 mb-1">
                  Komentarz trenera & instrukcje przedmeczowe
                </label>
                <textarea
                  rows={3}
                  value={tacticComment}
                  onChange={e => setTacticComment(e.target.value)}
                  placeholder="np. Skrzydłowi zamykają prostą, libero gra na 6. metrze, atakujący schodzi do bloku opcjonalnie..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-slate-950 transition shadow-lg shadow-sky-500/20"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight font-athletic">
                    Zgłoś Uwagę / Poproś o Edycję
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Wyślij informację bezpośrednio do trenera prowadzącego taktykę.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendEditRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-300 mb-2">
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
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-300 mb-1">
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 Wiadomość zostanie dodana do oficjalnego panelu dyskusji taktycznej tego spotkania.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRequestEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest || !requestEditText.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
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
