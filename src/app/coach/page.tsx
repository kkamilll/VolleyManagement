'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import {
  Target,
  Shield,
  Zap,
  Users,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Move,
  Info,
  RotateCw,
  Flame,
  Volleyball,
  ArrowUpDown,
  RefreshCw,
  Compass,
  Edit3,
  Sliders,
  Check,
  Calendar,
  Trophy,
  ExternalLink,
  ArrowLeft,
  Filter,
  ChevronDown
} from 'lucide-react';
import {
  TacticalPlay,
  ScoutingReport,
  RotationCode,
  TacticalPhase,
  CourtPlayerPosition,
  PlayerRoleCode,
  TacticScope,
  MatchResult,
  EventItem
} from '@/lib/types';

// Preset default 5-1 system positions for rotations P1 to P6
const ROTATION_PRESETS: Record<
  RotationCode,
  Record<TacticalPhase, CourtPlayerPosition[]>
> = {
  P1: {
    PRZYJECIE: [
      { id: 'p1_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 1, x: 80, y: 72, task: 'Zbieg pod siatkę między strefę 2 i 3 po kontakcie zagrywki' },
      { id: 'p1_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 2, x: 74, y: 52, task: 'Przyjęcie skrótu i pasa bocznego strefy 1/2' },
      { id: 'p1_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 3, x: 48, y: 22, task: 'Atak z 1. tempa (krótka A na wprost R)' },
      { id: 'p1_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 4, x: 18, y: 24, task: 'Atak ze skrzydła lewego (wysoka piłka na pojedynczy blok)' },
      { id: 'p1_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 26, y: 68, task: 'Dowodzenie linią przyjęcia, asekuracja strefy 5 i środka' },
      { id: 'p1_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 72, task: 'Główny pas przyjęcia strefy 6 oraz opcja pajpa' }
    ],
    OBRONA: [
      { id: 'p1_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 2, x: 78, y: 16, task: 'Blok prawy (zamyka prostą)' },
      { id: 'p1_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 3, x: 52, y: 16, task: 'Dostawienie bloku do skrzydła' },
      { id: 'p1_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 4, x: 18, y: 22, task: 'Asekuracja kiwki i kontratak' },
      { id: 'p1_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 1, x: 80, y: 75, task: 'Obrona mocnego ataku po prostej' },
      { id: 'p1_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 78, task: 'Obrona ataku po głębokim skosie' },
      { id: 'p1_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 5, x: 22, y: 70, task: 'Obrona ciasnego skosu i asekuracja bloku' }
    ],
    ATAK: [
      { id: 'p1_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 2, x: 65, y: 18, task: 'Wystawa z wyskoku' },
      { id: 'p1_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 3, x: 50, y: 16, task: 'Szybkie tempo na środku' },
      { id: 'p1_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 4, x: 16, y: 18, task: 'Atak po skosie ze strefy 4' },
      { id: 'p1_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 55, task: 'Najście na pajpa z 6. metra' },
      { id: 'p1_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 1, x: 82, y: 65, task: 'Atak z prawej strony II linii' },
      { id: 'p1_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 25, y: 70, task: 'Asekuracja bloku' }
    ],
    ZAGRYWKA: [
      { id: 'p1_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 1, x: 80, y: 92, task: 'Zagrywka taktyczna w strefę 1 lub 5' },
      { id: 'p1_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 2, x: 78, y: 18, task: 'Blok prawy' },
      { id: 'p1_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 3, x: 50, y: 18, task: 'Blok środkowy' },
      { id: 'p1_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 4, x: 18, y: 18, task: 'Blok lewy' },
      { id: 'p1_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 24, y: 70, task: 'Obrona skosu' },
      { id: 'p1_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 72, task: 'Obrona środka' }
    ]
  },
  P2: {
    PRZYJECIE: [
      { id: 'p2_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 6, x: 50, y: 60, task: 'Zbieg ze środka pod siatkę' },
      { id: 'p2_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 1, x: 80, y: 70, task: 'Przyjęcie prawe skrzydło' },
      { id: 'p2_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 2, x: 78, y: 22, task: 'Przesunięcie na środek do ataku' },
      { id: 'p2_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 3, x: 22, y: 22, task: 'Atak ze strefy 4' },
      { id: 'p2_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 24, y: 68, task: 'Przyjęcie lewego pasa' },
      { id: 'p2_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 4, x: 50, y: 72, task: 'Przyjęcie i wejście na pajp' }
    ],
    OBRONA: [
      { id: 'p2_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 6, x: 50, y: 78, task: 'Obrona środka' },
      { id: 'p2_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 1, x: 80, y: 75, task: 'Obrona po prostej' },
      { id: 'p2_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 3, x: 50, y: 16, task: 'Blok środkowy' },
      { id: 'p2_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 2, x: 78, y: 16, task: 'Blok prawy' },
      { id: 'p2_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 22, y: 72, task: 'Obrona skosu' },
      { id: 'p2_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 4, x: 18, y: 16, task: 'Blok lewy' }
    ],
    ATAK: [
      { id: 'p2_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 2, x: 66, y: 18, task: 'Rozegranie' },
      { id: 'p2_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 3, x: 50, y: 16, task: 'Krótka ze środka' },
      { id: 'p2_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 4, x: 18, y: 18, task: 'Atak ze skrzydła' },
      { id: 'p2_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 55, task: 'Pajp' },
      { id: 'p2_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 1, x: 82, y: 65, task: 'Atak II linia' },
      { id: 'p2_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 22, y: 72, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p2_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 1, x: 80, y: 92, task: 'Mocna zagrywka z wyskoku' },
      { id: 'p2_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 2, x: 78, y: 18, task: 'Blok' },
      { id: 'p2_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 3, x: 50, y: 18, task: 'Blok' },
      { id: 'p2_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 4, x: 18, y: 18, task: 'Blok' },
      { id: 'p2_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 6, x: 50, y: 75, task: 'Obrona' },
      { id: 'p2_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 22, y: 72, task: 'Obrona' }
    ]
  },
  P3: {
    PRZYJECIE: [
      { id: 'p3_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 5, x: 20, y: 56, task: 'Zbieg ze strefy 5' },
      { id: 'p3_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 70, task: 'Przyjęcie' },
      { id: 'p3_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 1, x: 80, y: 72, task: 'Asekuracja' },
      { id: 'p3_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 2, x: 80, y: 22, task: 'Atak ze strefy 2' },
      { id: 'p3_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 3, x: 18, y: 22, task: 'Atak ze strefy 4' },
      { id: 'p3_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 4, x: 24, y: 68, task: 'Przyjęcie lewe' }
    ],
    OBRONA: [
      { id: 'p3_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 5, x: 22, y: 72, task: 'Obrona skosu' },
      { id: 'p3_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 78, task: 'Obrona' },
      { id: 'p3_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 3, x: 50, y: 16, task: 'Blok' },
      { id: 'p3_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 2, x: 78, y: 16, task: 'Blok prawy' },
      { id: 'p3_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 4, x: 18, y: 16, task: 'Blok lewy' },
      { id: 'p3_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 1, x: 80, y: 75, task: 'Obrona po prostej' }
    ],
    ATAK: [
      { id: 'p3_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 2, x: 66, y: 18, task: 'Rozegranie' },
      { id: 'p3_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 3, x: 50, y: 16, task: 'Krótka' },
      { id: 'p3_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 2, x: 82, y: 20, task: 'Atak ze strefy 2' },
      { id: 'p3_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 4, x: 18, y: 20, task: 'Atak ze strefy 4' },
      { id: 'p3_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 55, task: 'Pajp' },
      { id: 'p3_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 24, y: 70, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p3_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 1, x: 80, y: 92, task: 'Zagrywka float' },
      { id: 'p3_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 2, x: 78, y: 18, task: 'Blok prawy' },
      { id: 'p3_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 3, x: 50, y: 18, task: 'Blok środkowy' },
      { id: 'p3_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 4, x: 18, y: 18, task: 'Blok lewy' },
      { id: 'p3_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 75, task: 'Obrona' },
      { id: 'p3_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 22, y: 72, task: 'Obrona' }
    ]
  },
  P4: {
    PRZYJECIE: [
      { id: 'p4_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 4, x: 24, y: 18, task: 'Rozgrywający na siatce (strefa 4)' },
      { id: 'p4_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 3, x: 50, y: 20, task: 'Krótka przesunięta B' },
      { id: 'p4_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 2, x: 80, y: 22, task: 'Szybkie prawe skrzydło' },
      { id: 'p4_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 1, x: 80, y: 68, task: 'Atak z II linii ze strefy 1' },
      { id: 'p4_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 24, y: 68, task: 'Przyjęcie lewa' },
      { id: 'p4_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 72, task: 'Przyjęcie i pajp' }
    ],
    OBRONA: [
      { id: 'p4_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 4, x: 18, y: 16, task: 'Blok lewy' },
      { id: 'p4_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 3, x: 50, y: 16, task: 'Blok środkowy' },
      { id: 'p4_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 2, x: 78, y: 16, task: 'Blok prawy' },
      { id: 'p4_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 1, x: 80, y: 75, task: 'Obrona prosta' },
      { id: 'p4_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 22, y: 72, task: 'Obrona skos' },
      { id: 'p4_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 78, task: 'Obrona środek' }
    ],
    ATAK: [
      { id: 'p4_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 4, x: 28, y: 18, task: 'Rozegranie pod siatką' },
      { id: 'p4_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 3, x: 50, y: 16, task: 'Krótka B' },
      { id: 'p4_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 2, x: 82, y: 20, task: 'Atak strefa 2' },
      { id: 'p4_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 1, x: 82, y: 62, task: 'Atak II linia strefa 1' },
      { id: 'p4_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 55, task: 'Pajp' },
      { id: 'p4_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 24, y: 70, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p4_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 1, x: 80, y: 92, task: 'Mocna zagrywka w strefę 5' },
      { id: 'p4_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 2, x: 78, y: 18, task: 'Blok prawy' },
      { id: 'p4_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 3, x: 50, y: 18, task: 'Blok środkowy' },
      { id: 'p4_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 4, x: 18, y: 18, task: 'Blok lewy' },
      { id: 'p4_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 6, x: 50, y: 75, task: 'Obrona' },
      { id: 'p4_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 22, y: 72, task: 'Obrona' }
    ]
  },
  P5: {
    PRZYJECIE: [
      { id: 'p5_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 3, x: 48, y: 20, task: 'Rozgrywający na środku siatki' },
      { id: 'p5_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 4, x: 18, y: 22, task: 'Atak skrzydło lub obieg' },
      { id: 'p5_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 1, x: 80, y: 70, task: 'Przyjęcie prawe' },
      { id: 'p5_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 6, x: 82, y: 62, task: 'Atak z II linii' },
      { id: 'p5_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 24, y: 70, task: 'Przyjęcie lewe' },
      { id: 'p5_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 2, x: 50, y: 72, task: 'Przyjęcie i atak' }
    ],
    OBRONA: [
      { id: 'p5_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 3, x: 50, y: 16, task: 'Blok środkowy' },
      { id: 'p5_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 4, x: 18, y: 16, task: 'Blok lewy' },
      { id: 'p5_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 2, x: 78, y: 16, task: 'Blok prawy' },
      { id: 'p5_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 6, x: 50, y: 78, task: 'Obrona środek' },
      { id: 'p5_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 22, y: 72, task: 'Obrona skos' },
      { id: 'p5_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 1, x: 80, y: 75, task: 'Obrona prosta' }
    ],
    ATAK: [
      { id: 'p5_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 3, x: 50, y: 18, task: 'Rozegranie' },
      { id: 'p5_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 2, x: 80, y: 20, task: 'Atak prawy' },
      { id: 'p5_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 4, x: 18, y: 20, task: 'Atak lewy' },
      { id: 'p5_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 1, x: 82, y: 62, task: 'Atak II linia' },
      { id: 'p5_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 55, task: 'Pajp' },
      { id: 'p5_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 24, y: 70, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p5_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 1, x: 80, y: 92, task: 'Zagrywka w strefę 1' },
      { id: 'p5_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 2, x: 78, y: 18, task: 'Blok prawy' },
      { id: 'p5_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 3, x: 50, y: 18, task: 'Blok środkowy' },
      { id: 'p5_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 4, x: 18, y: 18, task: 'Blok lewy' },
      { id: 'p5_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 6, x: 50, y: 75, task: 'Obrona' },
      { id: 'p5_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 22, y: 72, task: 'Obrona' }
    ]
  },
  P6: {
    PRZYJECIE: [
      { id: 'p6_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 2, x: 75, y: 20, task: 'Rozgrywający w strefie 2' },
      { id: 'p6_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 1, x: 80, y: 70, task: 'Asekuracja' },
      { id: 'p6_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 72, task: 'Przyjęcie środek' },
      { id: 'p6_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 5, x: 82, y: 62, task: 'Atak z II linii' },
      { id: 'p6_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 4, x: 24, y: 70, task: 'Przyjęcie lewe' },
      { id: 'p6_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 3, x: 18, y: 22, task: 'Atak ze strefy 4' }
    ],
    OBRONA: [
      { id: 'p6_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 2, x: 78, y: 16, task: 'Blok prawy' },
      { id: 'p6_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 3, x: 50, y: 16, task: 'Blok środkowy' },
      { id: 'p6_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 4, x: 18, y: 16, task: 'Blok lewy' },
      { id: 'p6_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 78, task: 'Obrona środek' },
      { id: 'p6_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 22, y: 72, task: 'Obrona skos' },
      { id: 'p6_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 1, x: 80, y: 75, task: 'Obrona prosta' }
    ],
    ATAK: [
      { id: 'p6_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 2, x: 70, y: 18, task: 'Rozegranie' },
      { id: 'p6_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 3, x: 50, y: 16, task: 'Krótka A' },
      { id: 'p6_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 4, x: 18, y: 20, task: 'Atak strefa 4' },
      { id: 'p6_a', name: 'Łukasz Kremer', number: 17, roleCode: 'A', zone: 1, x: 82, y: 62, task: 'Atak II linia' },
      { id: 'p6_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 55, task: 'Pajp' },
      { id: 'p6_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 24, y: 70, task: 'Asekuracja' }
    ],
    ZAGRYWKA: [
      { id: 'p6_s2', name: 'Kamil Pujanek', number: 4, roleCode: 'Ś2', zone: 1, x: 80, y: 92, task: 'Zagrywka taktyczna' },
      { id: 'p6_r', name: 'Karol Ordon', number: 28, roleCode: 'R', zone: 2, x: 78, y: 18, task: 'Blok prawy' },
      { id: 'p6_p2', name: 'Michał Śmigiel', number: 8, roleCode: 'P2', zone: 3, x: 50, y: 18, task: 'Blok środkowy' },
      { id: 'p6_s1', name: 'Maciek Noak', number: 47, roleCode: 'Ś1', zone: 4, x: 18, y: 18, task: 'Blok lewy' },
      { id: 'p6_p1', name: 'Tomasz Krupa', number: 1, roleCode: 'P1', zone: 6, x: 50, y: 75, task: 'Obrona' },
      { id: 'p6_l', name: 'Bartosz Augustynek', number: 97, roleCode: 'L', zone: 5, x: 22, y: 72, task: 'Obrona' }
    ]
  }
};

function CoachTacticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL query params
  const initialScope = (searchParams.get('scope') as (TacticScope | 'ALL')) || 'ALL';
  const initialMatchId = searchParams.get('matchId') || null;
  const initialEventId = searchParams.get('eventId') || null;
  const initialOpponent = searchParams.get('opponent') || searchParams.get('title') || null;

  const [activeTab, setActiveTab] = useState<'BOARD' | 'PLAYBOOK' | 'SCOUTING' | 'SUBSTITUTIONS'>('BOARD');
  const [rotation, setRotation] = useState<RotationCode>('P1');
  const [phase, setPhase] = useState<TacticalPhase>('PRZYJECIE');
  const [positions, setPositions] = useState<CourtPlayerPosition[]>(ROTATION_PRESETS.P1.PRZYJECIE);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Match / Event context selection
  const [showContextRibbon, setShowContextRibbon] = useState(false);
  const [showPlaybookFilters, setShowPlaybookFilters] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(initialMatchId);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId);
  const [scopeFilter, setScopeFilter] = useState<'ALL' | TacticScope>(initialScope as any);

  // Ball position and trajectory options
  const [showBall, setShowBall] = useState(true);
  const [ballPos, setBallPos] = useState({ x: 62, y: 18 });
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showZoneNumbers, setShowZoneNumbers] = useState(true);

  // Dragging state
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);

  // Data from backend
  const [tactics, setTactics] = useState<TacticalPlay[]>([]);
  const [scoutingReports, setScoutingReports] = useState<ScoutingReport[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddTacticModal, setShowAddTacticModal] = useState(false);
  const [newTacticTitle, setNewTacticTitle] = useState('');
  const [newTacticScope, setNewTacticScope] = useState<TacticScope>(
    initialScope !== 'ALL' ? (initialScope as TacticScope) : 'MECZ_LIGOWY'
  );
  const [newTacticOpponent, setNewTacticOpponent] = useState(initialOpponent || '');
  const [newTacticMatchId, setNewTacticMatchId] = useState(initialMatchId || '');
  const [newTacticEventId, setNewTacticEventId] = useState(initialEventId || '');
  const [newTacticDesc, setNewTacticDesc] = useState('');
  const [newDirectives, setNewDirectives] = useState<string[]>(['']);

  const [showAddScoutingModal, setShowAddScoutingModal] = useState(false);
  const [newScoutOpponent, setNewScoutOpponent] = useState(initialOpponent || '');
  const [newScoutThreat, setNewScoutThreat] = useState<'WYSOKI' | 'SREDNI' | 'NISKI'>('WYSOKI');
  const [newScoutDate, setNewScoutDate] = useState('');
  const [newScoutNotes, setNewScoutNotes] = useState('');
  const [newScoutBlocking, setNewScoutBlocking] = useState('');
  const [newScoutTargetZones, setNewScoutTargetZones] = useState<number[]>([1, 5]);

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const { isArchiveMode } = useSeasonArchive();
  const isCoachOrManager = !isArchiveMode && Boolean(user?.role === 'KIEROWNIK' || user?.role === 'TRENER' || user?.isCaptain || user?.permissions?.canManageTactics);

  const fetchTacticsData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tactics');
      if (res.ok) {
        const data = await res.json();
        setTactics(data.tactics || []);
        setScoutingReports(data.scoutingReports || []);
        setRoster(data.players || []);
        setMatches(data.matches || []);
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTacticsData();
  }, []);

  // Update positions when rotation or phase changes
  const handleSelectPreset = (newRot: RotationCode, newPhase: TacticalPhase) => {
    setRotation(newRot);
    setPhase(newPhase);
    setPositions(ROTATION_PRESETS[newRot][newPhase]);
    setSelectedPlayerId(null);
  };

  // Reset to default positions of current preset
  const handleResetToPreset = () => {
    setPositions(ROTATION_PRESETS[rotation][phase]);
    setBallPos({ x: 62, y: 18 });
    setSaveSuccess(`Zresetowano ustawienie do wzorca ${rotation} (${phase})`);
    setTimeout(() => setSaveSuccess(null), 2500);
  };

  // --- Pointer Drag & Drop for smooth dragging ---
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setDraggingTokenId(id);
    setSelectedPlayerId(id === 'ball' ? null : id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingTokenId || !courtRef.current) return;
    const rect = courtRef.current.getBoundingClientRect();
    const x = Math.round(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(8, Math.min(92, ((e.clientY - rect.top) / rect.height) * 100)));

    if (draggingTokenId === 'ball') {
      setBallPos({ x, y });
    } else {
      setPositions(prev => prev.map(p => p.id === draggingTokenId ? { ...p, x, y } : p));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingTokenId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setDraggingTokenId(null);
    }
  };

  // Click on court to move selected player
  const handleCourtClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedPlayerId || !courtRef.current) return;
    const rect = courtRef.current.getBoundingClientRect();
    const clickX = Math.round(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
    const clickY = Math.round(Math.max(8, Math.min(92, ((e.clientY - rect.top) / rect.height) * 100)));

    setPositions(prev =>
      prev.map(p => (p.id === selectedPlayerId ? { ...p, x: clickX, y: clickY } : p))
    );
  };

  // Nudge player position with directional buttons
  const handleNudgePlayer = (dx: number, dy: number) => {
    if (!selectedPlayerId) return;
    setPositions(prev =>
      prev.map(p => {
        if (p.id === selectedPlayerId) {
          return {
            ...p,
            x: Math.max(5, Math.min(95, p.x + dx)),
            y: Math.max(8, Math.min(92, p.y + dy))
          };
        }
        return p;
      })
    );
  };

  // Swap position of selected player with another player on court
  const handleSwapPlayerPositions = (targetPlayerId: string) => {
    if (!selectedPlayerId || selectedPlayerId === targetPlayerId) return;
    const playerA = positions.find(p => p.id === selectedPlayerId);
    const playerB = positions.find(p => p.id === targetPlayerId);
    if (!playerA || !playerB) return;

    setPositions(prev =>
      prev.map(p => {
        if (p.id === playerA.id) return { ...p, x: playerB.x, y: playerB.y };
        if (p.id === playerB.id) return { ...p, x: playerA.x, y: playerA.y };
        return p;
      })
    );
    setSaveSuccess(`Zamieniono miejscami: #${playerA.number} ${playerA.name} 🔁 #${playerB.number} ${playerB.name}`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // Update selected player's details (name, number, role, task)
  const handleUpdatePlayerDetails = (updates: Partial<CourtPlayerPosition>) => {
    if (!selectedPlayerId) return;
    setPositions(prev =>
      prev.map(p => (p.id === selectedPlayerId ? { ...p, ...updates } : p))
    );
  };

  // Load a saved tactic onto the court
  const handleLoadTacticToBoard = (tac: TacticalPlay) => {
    setRotation(tac.rotation);
    setPhase(tac.phase);
    if (tac.courtPositions && tac.courtPositions.length > 0) {
      setPositions(tac.courtPositions);
    } else {
      setPositions(ROTATION_PRESETS[tac.rotation][tac.phase]);
    }
    setActiveTab('BOARD');
    setSaveSuccess(`Załadowano taktykę: ${tac.title}`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // Determine current context name
  const currentMatch = matches.find(m => m.id === selectedMatchId);
  const currentEvent = events.find(e => e.id === selectedEventId);

  // Save current board layout as a new tactic
  const handleSaveCurrentBoardAsTactic = async () => {
    let scope: TacticScope = 'OGOLNA';
    let targetOpponent = undefined;
    let matchId = undefined;
    let eventId = undefined;

    if (currentMatch) {
      scope = 'MECZ_LIGOWY';
      targetOpponent = currentMatch.opponent;
      matchId = currentMatch.id;
    } else if (currentEvent) {
      scope = currentEvent.type === 'TURNIEJ' ? 'TURNIEJ' : 'SPARING';
      targetOpponent = currentEvent.title;
      eventId = currentEvent.id;
    }

    const defaultTitle = `${rotation} - ${phase}: ${
      currentMatch ? `vs ${currentMatch.opponent}` : currentEvent ? currentEvent.title : 'Taktyka Angels ZTP'
    }`;

    try {
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
            targetOpponent,
            matchId,
            eventId,
            description: `Ustawienie z tablicy trenera dla rotacji ${rotation} w fazie ${phase}.`,
            courtPositions: positions,
            directives: [
              `Dyscyplina taktyczna w strefie rozegrania dla rotacji ${rotation}.`,
              'Asekuracja skrzydeł i strefy 6.'
            ]
          }
        })
      });
      if (res.ok) {
        setSaveSuccess('Pomyślnie zapisano taktykę do bazy drużyny!');
        setTimeout(() => setSaveSuccess(null), 3500);
        await fetchTacticsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add new custom tactic from modal
  const handleCreateCustomTactic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTacticTitle) return;

    try {
      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TACTIC',
          tactic: {
            title: newTacticTitle,
            phase,
            rotation,
            scope: newTacticScope,
            targetOpponent: newTacticOpponent || undefined,
            matchId: newTacticMatchId || undefined,
            eventId: newTacticEventId || undefined,
            description: newTacticDesc,
            courtPositions: positions,
            directives: newDirectives.filter(Boolean)
          }
        })
      });

      if (res.ok) {
        setShowAddTacticModal(false);
        setNewTacticTitle('');
        setNewTacticOpponent('');
        setNewTacticDesc('');
        setNewDirectives(['']);
        setSaveSuccess('Dodano nową taktykę do Playbooka!');
        setTimeout(() => setSaveSuccess(null), 3500);
        await fetchTacticsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add new scouting report
  const handleCreateScouting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScoutOpponent) return;

    try {
      const res = await fetch('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SCOUTING',
          report: {
            opponentTeam: newScoutOpponent,
            matchDate: newScoutDate,
            threatLevel: newScoutThreat,
            serveTargetZones: newScoutTargetZones,
            blockingDirective: newScoutBlocking,
            coachNotes: newScoutNotes,
            keyPlayers: [
              {
                name: 'Lider Punktowy Rywala',
                position: 'Przyjmujący/Atakujący',
                threatNote: 'Główna opcja w ataku rywala przy piłkach sytuacyjnych',
                targetDirective: 'Podwójny blok zacieśniony do prostej'
              }
            ]
          }
        })
      });

      if (res.ok) {
        setShowAddScoutingModal(false);
        setNewScoutOpponent('');
        setNewScoutNotes('');
        setNewScoutBlocking('');
        setSaveSuccess('Opublikowano raport scoutingu przeciwnika!');
        setTimeout(() => setSaveSuccess(null), 3500);
        await fetchTacticsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTactic = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę taktykę?')) return;
    try {
      const res = await fetch(`/api/tactics?id=${id}&type=TACTIC`, { method: 'DELETE' });
      if (res.ok) {
        await fetchTacticsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleBadgeColor = (role: PlayerRoleCode) => {
    switch (role) {
      case 'R':
        return 'bg-sky-500/25 text-sky-300 border-sky-400';
      case 'A':
        return 'bg-amber-500/25 text-amber-300 border-amber-400';
      case 'P1':
      case 'P2':
        return 'bg-indigo-500/25 text-indigo-300 border-indigo-400';
      case 'Ś1':
      case 'Ś2':
        return 'bg-emerald-500/25 text-emerald-300 border-emerald-400';
      case 'L':
        return 'bg-rose-500/25 text-rose-300 border-rose-400';
    }
  };

  const getScopeBadge = (scope?: TacticScope) => {
    switch (scope) {
      case 'MECZ_LIGOWY':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-athletic uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
            <Volleyball className="w-3 h-3 text-sky-400" /> Mecz Ligowy
          </span>
        );
      case 'TURNIEJ':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-athletic uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-purple-400" /> Turniej
          </span>
        );
      case 'SPARING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-athletic uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-400" /> Sparing
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-athletic uppercase bg-steel-800 text-steel-300 border border-steel-700">
            Wzorzec 5-1
          </span>
        );
    }
  };

  // Filter tactics by scope
  const filteredTactics = tactics.filter(t => {
    if (scopeFilter === 'ALL') return true;
    return t.scope === scopeFilter;
  });

  const selectedPlayer = positions.find(p => p.id === selectedPlayerId);
  const setterPlayer = positions.find(p => p.roleCode === 'R');

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-6 pb-24 md:pb-16">
      {/* Top Breadcrumb & Quick Cross-Navigation */}
      <div className="flex items-center justify-between gap-3 mb-4 text-xs">
        <div className="flex items-center gap-2 text-steel-400">
          <a href="/rozgrywki" className="hover:text-white transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Rozgrywki
          </a>
          <span>/</span>
          <span className="text-bone-100 font-athletic uppercase">Panel Trenera</span>
        </div>

        <div className="flex items-center gap-2">
          {currentMatch && (
            <a
              href="/rozgrywki?tab=liga"
              className="px-3 py-1 rounded-xl bg-sky-950/70 border border-sky-500/40 text-sky-300 hover:text-white font-athletic text-[11px] flex items-center gap-1.5 transition shadow"
            >
              <Volleyball className="w-3 h-3 text-sky-400" />
              <span>Protokół: vs {currentMatch.opponent}</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}
          {currentEvent && (
            <a
              href={`/rozgrywki?tab=${currentEvent.type === 'TURNIEJ' ? 'turnieje' : 'sparingi'}`}
              className="px-3 py-1 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-300 hover:text-white font-athletic text-[11px] flex items-center gap-1.5 transition shadow"
            >
              <span>Terminarz: {currentEvent.title}</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-steel-800/80 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-athletic text-bone-100 tracking-wider uppercase">
            Panel Trenera & Taktyki
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddTacticModal(true)}
            className="px-3.5 py-2 rounded-xl bg-steel-700 hover:bg-steel-600 border border-steel-500/40 text-bone-100 text-xs font-athletic flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            Nowa Taktyka
          </button>
          <button
            onClick={() => setShowAddScoutingModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-athletic flex items-center gap-1.5 transition shadow"
          >
            <Target className="w-3.5 h-3.5" />
            Scouting Rywala
          </button>
        </div>
      </div>

      {/* Sub-navigation tabs: Tablica Taktyczna vs Playbook & Scouting */}
      <div className="flex items-center gap-2 border-b border-steel-800/80 pb-2 mb-4">
        <a
          href="/taktyka"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-steel-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition"
        >
          <Compass className="w-4 h-4 text-sky-400" />
          <span>Tablica Taktyczna & Rysowanie</span>
        </a>
        <a
          href="/coach"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
        >
          <Target className="w-4 h-4 text-amber-400" />
          <span>Playbook Trenerski & Scouting</span>
        </a>
      </div>

      {/* Collapsible Match / Event Context Selection Ribbon */}
      <div className="angel-card rounded-2xl p-3 mb-6 border border-steel-800 bg-dark-950/90 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowContextRibbon(!showContextRibbon)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                showContextRibbon || selectedMatchId || selectedEventId
                  ? 'bg-sky-500/10 text-sky-300 border-sky-500/40'
                  : 'bg-dark-900 text-steel-300 border-steel-800 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-sky-400" />
              <span>Kontekst Spotkania</span>
              <ChevronDown className={`w-3.5 h-3.5 text-steel-400 transition-transform duration-200 ${showContextRibbon ? 'rotate-180' : ''}`} />
            </button>

            {(selectedMatchId || selectedEventId) && (
              <button
                onClick={() => {
                  setSelectedMatchId(null);
                  setSelectedEventId(null);
                  setScopeFilter('ALL');
                }}
                className="text-[11px] font-bold text-steel-400 hover:text-rose-400 transition underline underline-offset-2 ml-1"
              >
                Resetuj kontekst
              </button>
            )}
          </div>

          {/* Status Pill of current context */}
          <div className="flex items-center gap-2 text-xs">
            {currentMatch ? (
              <span className="text-sky-300 font-bold bg-sky-950/80 border border-sky-500/40 px-3 py-1 rounded-xl">
                🎯 vs <strong className="text-white">{currentMatch.opponent}</strong>
              </span>
            ) : currentEvent ? (
              <span className="text-amber-300 font-bold bg-amber-950/80 border border-amber-500/40 px-3 py-1 rounded-xl">
                🎯 {currentEvent.type === 'TURNIEJ' ? 'Turniej' : 'Sparing'}: <strong className="text-white">{currentEvent.title}</strong>
              </span>
            ) : (
              <span className="text-steel-400 font-mono text-[11px]">
                Ogólny plan (Wszystkie)
              </span>
            )}
          </div>
        </div>

        {showContextRibbon && (
          <div className="pt-3 mt-3 border-t border-steel-800 flex items-center gap-2">
            <span className="text-xs text-steel-400 font-bold shrink-0">Wybierz mecz:</span>
            <select
              value={selectedMatchId ? `m_${selectedMatchId}` : selectedEventId ? `e_${selectedEventId}` : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setSelectedMatchId(null);
                  setSelectedEventId(null);
                  setScopeFilter('ALL');
                } else if (val.startsWith('m_')) {
                  const mId = val.replace('m_', '');
                  setSelectedMatchId(mId);
                  setSelectedEventId(null);
                  setScopeFilter('MECZ_LIGOWY');
                } else if (val.startsWith('e_')) {
                  const eId = val.replace('e_', '');
                  setSelectedEventId(eId);
                  setSelectedMatchId(null);
                  const ev = events.find(x => x.id === eId);
                  setScopeFilter(ev?.type === 'TURNIEJ' ? 'TURNIEJ' : 'SPARING');
                }
              }}
              className="flex-1 max-w-md bg-dark-900 border border-steel-700/80 rounded-xl px-3 py-1.5 text-xs text-bone-100 focus:outline-none focus:border-sky-400"
            >
              <option value="">-- Ogólny plan taktyczny (Wszystkie) --</option>
              <optgroup label="🏐 Mecze Ligowe">
                {matches.map(m => (
                  <option key={m.id} value={`m_${m.id}`}>
                    Mecz ligowy vs {m.opponent} ({new Date(m.date).toLocaleDateString()})
                  </option>
                ))}
              </optgroup>
              <optgroup label="🏆 Turnieje">
                {events.filter(e => e.type === 'TURNIEJ').map(t => (
                  <option key={t.id} value={`e_${t.id}`}>
                    Turniej: {t.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="⚔️ Sparingi">
                {events.filter(e => e.type === 'SPARING').map(s => (
                  <option key={s.id} value={`e_${s.id}`}>
                    Sparing: {s.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex border-b border-steel-800 mb-6 overflow-x-auto scrollbar-none gap-2 pb-1">
        <button
          onClick={() => setActiveTab('BOARD')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-athletic text-xs sm:text-sm tracking-wider uppercase transition whitespace-nowrap ${
            activeTab === 'BOARD'
              ? 'bg-steel-700/80 text-bone-100 border border-steel-500 shadow-lg'
              : 'text-steel-400 hover:text-white hover:bg-dark-900/60'
          }`}
        >
          <RotateCw className="w-4 h-4 text-sky-400" />
          Tablica Boiskowa (P1-P6)
        </button>

        <button
          onClick={() => setActiveTab('PLAYBOOK')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-athletic text-xs sm:text-sm tracking-wider uppercase transition whitespace-nowrap ${
            activeTab === 'PLAYBOOK'
              ? 'bg-steel-700/80 text-bone-100 border border-steel-500 shadow-lg'
              : 'text-steel-400 hover:text-white hover:bg-dark-900/60'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          Playbook Taktyk ({tactics.length})
        </button>

        <button
          onClick={() => setActiveTab('SCOUTING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-athletic text-xs sm:text-sm tracking-wider uppercase transition whitespace-nowrap ${
            activeTab === 'SCOUTING'
              ? 'bg-steel-700/80 text-bone-100 border border-steel-500 shadow-lg'
              : 'text-steel-400 hover:text-white hover:bg-dark-900/60'
          }`}
        >
          <Target className="w-4 h-4 text-rose-400" />
          Scouting & Odprawa ({scoutingReports.length})
        </button>

        <button
          onClick={() => setActiveTab('SUBSTITUTIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-athletic text-xs sm:text-sm tracking-wider uppercase transition whitespace-nowrap ${
            activeTab === 'SUBSTITUTIONS'
              ? 'bg-steel-700/80 text-bone-100 border border-steel-500 shadow-lg'
              : 'text-steel-400 hover:text-white hover:bg-dark-900/60'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          Zmiany Zadaniowe & Skład
        </button>
      </div>

      {/* TAB 1: INTERACTIVE VOLLEYBALL COURT BOARD */}
      {activeTab === 'BOARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Rotation Switcher */}
            <div className="angel-card rounded-2xl p-4 border border-steel-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-athletic uppercase tracking-wider text-steel-400">
                  1. Wybierz Rotację (System 5-1):
                </span>
                <button
                  onClick={handleResetToPreset}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 transition"
                  title="Przywróć domyślne pozycje dla tej rotacji"
                >
                  <RefreshCw className="w-3 h-3" />
                  Resetuj
                </button>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {(['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as RotationCode[]).map(r => (
                  <button
                    key={r}
                    onClick={() => handleSelectPreset(r, phase)}
                    className={`py-2 rounded-xl font-athletic text-xs transition border ${
                      rotation === r
                        ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-md shadow-sky-500/20'
                        : 'bg-dark-900 border-steel-800 text-steel-300 hover:text-white hover:bg-steel-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Tactical Phase Switcher */}
            <div className="angel-card rounded-2xl p-4 border border-steel-800/80">
              <span className="text-[10px] font-athletic uppercase tracking-wider text-steel-400 block mb-2">
                2. Faza Akcji na Boisku:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'PRZYJECIE', label: 'Przyjęcie (K1)' },
                  { key: 'OBRONA', label: 'Obrona & Blok (K2)' },
                  { key: 'ATAK', label: 'Kontratak & Pajp' },
                  { key: 'ZAGRYWKA', label: 'Własny Serwis' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleSelectPreset(rotation, item.key as TacticalPhase)}
                    className={`py-2 px-2.5 rounded-xl font-athletic text-xs transition border flex items-center justify-between ${
                      phase === item.key
                        ? 'bg-steel-700 text-bone-100 border-steel-500 shadow'
                        : 'bg-dark-900 border-steel-800 text-steel-400 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`w-2 h-2 rounded-full ${phase === item.key ? 'bg-white' : 'bg-steel-700'}`}></span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Options Toggles */}
            <div className="angel-card rounded-2xl p-3 border border-steel-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                onClick={() => setShowTrajectories(!showTrajectories)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-athletic flex items-center gap-1.5 transition ${
                  showTrajectories
                    ? 'bg-sky-950/60 text-sky-300 border-sky-500/50'
                    : 'bg-dark-950 text-steel-500 border-steel-800 hover:text-steel-300'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Trajektorie: {showTrajectories ? 'WŁ' : 'WYŁ'}</span>
              </button>

              <button
                onClick={() => setShowBall(!showBall)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-athletic flex items-center gap-1.5 transition ${
                  showBall
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                    : 'bg-dark-950 text-steel-500 border-steel-800 hover:text-steel-300'
                }`}
              >
                <Volleyball className="w-3.5 h-3.5" />
                <span>Piłka 🏐: {showBall ? 'WŁ' : 'WYŁ'}</span>
              </button>

              <button
                onClick={() => setShowZoneNumbers(!showZoneNumbers)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-athletic flex items-center gap-1.5 transition ${
                  showZoneNumbers
                    ? 'bg-steel-800 text-steel-200 border-steel-600'
                    : 'bg-dark-950 text-steel-500 border-steel-800 hover:text-steel-300'
                }`}
              >
                <span>Strefy 1-6: {showZoneNumbers ? 'WŁ' : 'WYŁ'}</span>
              </button>
            </div>

            {/* Selected Player Editor & Inspector */}
            {selectedPlayer ? (
              <div className="angel-card rounded-2xl p-4 border border-sky-500/60 bg-dark-900 shadow-xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-steel-800">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${getRoleBadgeColor(selectedPlayer.roleCode)}`}>
                      {selectedPlayer.roleCode}
                    </span>
                    <strong className="text-sm font-athletic text-white">
                      #{selectedPlayer.number} {selectedPlayer.name}
                    </strong>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                    X: {selectedPlayer.x}% | Y: {selectedPlayer.y}%
                  </span>
                </div>

                {/* Swap with real team roster player */}
                <div>
                  <label className="block text-[10px] font-bold text-steel-400 mb-1">
                    Zmień zawodnika (z kadry Angels ZTP):
                  </label>
                  <select
                    value={selectedPlayer.name}
                    onChange={(e) => {
                      const chosen = roster.find(u => u.name === e.target.value);
                      if (chosen) {
                        handleUpdatePlayerDetails({
                          name: chosen.name,
                          number: chosen.number || selectedPlayer.number
                        });
                      }
                    }}
                    className="w-full bg-dark-950 border border-steel-700 rounded-xl px-2.5 py-1.5 text-xs text-bone-100 focus:outline-none focus:border-sky-400"
                  >
                    <option value={selectedPlayer.name}>-- Wybierz gracza z kadry --</option>
                    {roster.map(p => (
                      <option key={p.id} value={p.name}>
                        #{p.number} {p.name} ({p.position})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Change Role Badge */}
                <div>
                  <label className="block text-[10px] font-bold text-steel-400 mb-1">
                    Zmień rolę taktyczną:
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {(['R', 'A', 'P1', 'P2', 'Ś1', 'Ś2', 'L'] as PlayerRoleCode[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleUpdatePlayerDetails({ roleCode: r })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                          selectedPlayer.roleCode === r
                            ? 'bg-sky-500 text-slate-950 border-white'
                            : 'bg-dark-950 text-steel-400 border-steel-800 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tactical Task / Note Input */}
                <div>
                  <label className="block text-[10px] font-bold text-steel-400 mb-1">
                    Zadanie / Wytyczna boiskowa:
                  </label>
                  <input
                    type="text"
                    value={selectedPlayer.task || ''}
                    onChange={(e) => handleUpdatePlayerDetails({ task: e.target.value })}
                    placeholder="np. Zbieg ze strefy 1, atak z pajpa, blok do prostej..."
                    className="w-full bg-dark-950 border border-steel-700 rounded-xl px-2.5 py-1.5 text-xs text-bone-100 focus:outline-none focus:border-sky-400"
                  />
                </div>

                {/* Swap with another player on court */}
                <div>
                  <label className="block text-[10px] font-bold text-steel-400 mb-1">
                    Zamień pozycjami na boisku z:
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="swapSelect"
                      className="flex-1 bg-dark-950 border border-steel-700 rounded-xl px-2.5 py-1 text-xs text-bone-100 focus:outline-none"
                    >
                      {positions
                        .filter(p => p.id !== selectedPlayer.id)
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            #{p.number} {p.name} ({p.roleCode})
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const sel = document.getElementById('swapSelect') as HTMLSelectElement;
                        if (sel && sel.value) handleSwapPlayerPositions(sel.value);
                      }}
                      className="px-3 py-1 rounded-xl bg-steel-700 hover:bg-steel-600 text-bone-100 text-xs font-athletic flex items-center gap-1 transition"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-sky-400" />
                      Zamień
                    </button>
                  </div>
                </div>

                {/* Nudge arrows */}
                <div className="pt-2 border-t border-steel-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-steel-500">Precyzyjne przesunięcie:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleNudgePlayer(-3, 0)}
                      className="w-7 h-7 rounded bg-dark-950 border border-steel-800 text-steel-300 hover:text-white"
                      title="W lewo"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => handleNudgePlayer(0, -3)}
                      className="w-7 h-7 rounded bg-dark-950 border border-steel-800 text-steel-300 hover:text-white"
                      title="W górę"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleNudgePlayer(0, 3)}
                      className="w-7 h-7 rounded bg-dark-950 border border-steel-800 text-steel-300 hover:text-white"
                      title="W dół"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleNudgePlayer(3, 0)}
                      className="w-7 h-7 rounded bg-dark-950 border border-steel-800 text-steel-300 hover:text-white"
                      title="W prawo"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Hint when no player is selected */
              <div className="angel-card rounded-2xl p-4 border border-steel-800/80 bg-dark-950/60 text-center text-xs text-steel-400">
                <Move className="w-5 h-5 mx-auto mb-1.5 text-sky-400/70" />
                <p className="font-athletic text-bone-100 uppercase text-xs mb-0.5">
                  Przeciągaj zawodników myszką lub palcem
                </p>
                <p className="text-[11px] text-steel-500">
                  Kliknij dowolnego gracza na parkiecie, aby edytować jego rolę, nazwisko lub zamienić go miejscami.
                </p>
              </div>
            )}

            {/* Save Board as Tactic Button */}
            <button
              onClick={handleSaveCurrentBoardAsTactic}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-steel-700 via-steel-600 to-steel-500 hover:from-steel-600 hover:to-steel-400 text-white font-athletic text-xs flex items-center justify-center gap-2 transition shadow-lg"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              Zapisz ten układ jako Taktykę {currentMatch ? `(vs ${currentMatch.opponent})` : ''}
            </button>
          </div>

          {/* Court Board Column */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* Visual Court Container */}
            <div className="w-full max-w-xl angel-card rounded-3xl p-4 sm:p-5 border border-steel-700/80 shadow-2xl relative overflow-hidden bg-dark-950">
              {/* Court Header */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <Volleyball className="w-4 h-4 text-sky-400" />
                  <span className="font-athletic text-bone-100 uppercase tracking-wider">
                    Siatka Meczowa · Połowa Angels ZTP
                  </span>
                </div>
                <div className="text-[10px] font-mono text-steel-400">
                  Rotacja: <strong className="text-white">{rotation}</strong> | Faza: <strong className="text-sky-300">{phase}</strong>
                </div>
              </div>

              {/* Court Surface with Pointer Dragging */}
              <div
                ref={courtRef}
                onClick={handleCourtClick}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative w-full aspect-[9/10] bg-gradient-to-b from-[#182338] via-[#0f172a] to-[#0a0e1a] rounded-2xl border-4 border-steel-400/90 shadow-2xl overflow-hidden select-none cursor-default touch-none"
              >
                {/* Net (Top Bar) */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-slate-200 border-b-2 border-slate-400 flex items-center justify-between px-3 z-20 shadow-md">
                  <span className="w-2 h-6 bg-red-600 rounded-sm -top-1 relative border border-white" title="Antenka lewa"></span>
                  <span className="text-[9px] font-athletic text-slate-900 tracking-widest font-black uppercase">
                    SIATKA (WYS. 2.43M)
                  </span>
                  <span className="w-2 h-6 bg-red-600 rounded-sm -top-1 relative border border-white" title="Antenka prawa"></span>
                </div>

                {/* 3-meter Attack Line */}
                <div className="absolute top-[33.3%] left-0 right-0 h-1.5 bg-steel-400/80 border-b border-white/20 z-10 flex items-center justify-end pr-3">
                  <span className="text-[9px] font-mono text-steel-400/80 uppercase tracking-widest">Linia 3. metra</span>
                </div>

                {/* Zone Markers Watermark */}
                {showZoneNumbers && (
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 pointer-events-none opacity-20">
                    <div className="border-r border-b border-steel-400 flex items-center justify-center font-athletic text-3xl text-bone-100">4</div>
                    <div className="border-r border-b border-steel-400 flex items-center justify-center font-athletic text-3xl text-bone-100">3</div>
                    <div className="border-b border-steel-400 flex items-center justify-center font-athletic text-3xl text-bone-100">2</div>
                    <div className="border-r border-steel-400 flex items-center justify-center font-athletic text-3xl text-bone-100">5</div>
                    <div className="border-r border-steel-400 flex items-center justify-center font-athletic text-3xl text-bone-100">6</div>
                    <div className="flex items-center justify-center font-athletic text-3xl text-bone-100">1</div>
                  </div>
                )}

                {/* Dynamic Tactical Trajectories & Attack Vectors */}
                {showTrajectories && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                      </marker>
                      <marker id="arrow-amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
                      </marker>
                      <marker id="arrow-rose" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                      </marker>
                    </defs>

                    {/* Setter Run to Setting Target (if Reception phase) */}
                    {phase === 'PRZYJECIE' && setterPlayer && (
                      <>
                        <line
                          x1={`${setterPlayer.x}%`}
                          y1={`${setterPlayer.y}%`}
                          x2={`${ballPos.x}%`}
                          y2={`${ballPos.y}%`}
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                          markerEnd="url(#arrow)"
                          className="animate-pulse"
                        />
                        <circle cx={`${ballPos.x}%`} cy={`${ballPos.y}%`} r="8" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />
                      </>
                    )}

                    {/* Attack Lines (if Attack phase) */}
                    {phase === 'ATAK' && (
                      <>
                        {/* Setter to Wing Left */}
                        <line x1={`${ballPos.x}%`} y1={`${ballPos.y}%`} x2="16%" y2="18%" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow)" />
                        {/* Setter to Center Quick */}
                        <line x1={`${ballPos.x}%`} y1={`${ballPos.y}%`} x2="50%" y2="16%" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-amber)" />
                        {/* Setter to Pipe */}
                        <line x1={`${ballPos.x}%`} y1={`${ballPos.y}%`} x2="50%" y2="52%" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-rose)" />
                        {/* Setter to Wing Right */}
                        <line x1={`${ballPos.x}%`} y1={`${ballPos.y}%`} x2="82%" y2="20%" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow)" />
                      </>
                    )}
                  </svg>
                )}

                {/* Movable Volleyball 🏐 Token */}
                {showBall && (
                  <div
                    onPointerDown={(e) => handlePointerDown('ball', e)}
                    style={{
                      left: `${ballPos.x}%`,
                      top: `${ballPos.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    className={`absolute z-40 cursor-grab active:cursor-grabbing select-none transition-transform ${
                      draggingTokenId === 'ball' ? 'scale-125 z-50' : 'hover:scale-110'
                    }`}
                    title="Przeciągaj piłkę, aby wskazać cel wystawy lub zagrywki"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-xl flex items-center justify-center text-sm drop-shadow-lg ring-2 ring-amber-400/50 animate-bounce">
                      🏐
                    </div>
                  </div>
                )}

                {/* Player Tokens */}
                {positions.map(p => {
                  const isSelected = selectedPlayerId === p.id;
                  const isDragging = draggingTokenId === p.id;

                  return (
                    <div
                      key={p.id}
                      onPointerDown={(e) => handlePointerDown(p.id, e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlayerId(p.id);
                      }}
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      className={`absolute z-30 select-none cursor-grab active:cursor-grabbing transition-shadow ${
                        isSelected || isDragging ? 'z-50 scale-110' : 'hover:scale-105'
                      }`}
                    >
                      {/* Player Circle Token */}
                      <div
                        className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full border-2 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition-all ${
                          isSelected || isDragging
                            ? 'bg-sky-500 border-white text-slate-950 shadow-sky-500/50 ring-4 ring-sky-400/40'
                            : 'bg-dark-900/95 border-steel-400 text-bone-100 hover:border-sky-400 shadow-black'
                        }`}
                      >
                        <span className="text-[11px] sm:text-xs font-mono font-black leading-none">
                          #{p.number}
                        </span>
                        <span
                          className={`text-[9px] sm:text-[10px] font-athletic font-bold tracking-wider leading-none mt-0.5 ${
                            isSelected || isDragging ? 'text-slate-950 font-black' : 'text-sky-300'
                          }`}
                        >
                          {p.roleCode}
                        </span>
                      </div>

                      {/* Name Tag Pill */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap bg-dark-950/95 border border-steel-700 rounded px-1.5 py-0.5 text-[9px] font-athletic text-bone-100 shadow pointer-events-none">
                        {p.name.split(' ')[1] || p.name}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Court Legend & Controls */}
              <div className="mt-3.5 pt-3 border-t border-steel-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-steel-400">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Rozgrywający (R)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Atakujący (A)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Libero (L)
                  </span>
                </div>
                <div className="text-sky-400 font-bold">
                  🖐️ Chwyć i przeciągaj zawodników w czasie rzeczywistym
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLAYBOOK TAKTYK */}
      {activeTab === 'PLAYBOOK' && (
        <div className="space-y-6">
          {/* Sub-Filter Scope Tabs */}
          <div className="bg-dark-950/80 p-3 rounded-2xl border border-steel-800">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setShowPlaybookFilters(!showPlaybookFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  showPlaybookFilters || scopeFilter !== 'ALL'
                    ? 'bg-sky-500/10 text-sky-300 border-sky-500/40'
                    : 'bg-dark-900 text-steel-400 border-steel-800 hover:text-white'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-sky-400" />
                <span>Kategoria Taktyk</span>
                {scopeFilter !== 'ALL' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-steel-400 transition-transform duration-200 ${showPlaybookFilters ? 'rotate-180' : ''}`} />
              </button>

              <span className="text-[11px] text-steel-500 font-mono">
                Znaleziono: {filteredTactics.length}
              </span>
            </div>

            {showPlaybookFilters && (
              <div className="pt-3 mt-3 border-t border-steel-800 flex flex-wrap gap-1.5">
                {[
                  { key: 'ALL', label: 'Wszystkie Taktyki', icon: Zap },
                  { key: 'MECZ_LIGOWY', label: 'Mecze Ligowe', icon: Volleyball },
                  { key: 'TURNIEJ', label: 'Turnieje', icon: Trophy },
                  { key: 'SPARING', label: 'Sparingi', icon: Calendar },
                  { key: 'OGOLNA', label: 'Wzorce 5-1', icon: RotateCw }
                ].map(f => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setScopeFilter(f.key as any)}
                      className={`px-3 py-1.5 rounded-xl font-athletic text-xs transition flex items-center gap-1.5 border ${
                        scopeFilter === f.key
                          ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow'
                          : 'bg-dark-900 text-steel-400 border-steel-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTactics.length === 0 ? (
              <div className="col-span-full angel-card rounded-2xl p-10 text-center text-steel-400">
                Brak zapisanych taktyk w tej kategorii.
              </div>
            ) : (
              filteredTactics.map(tac => (
                <div
                  key={tac.id}
                  className="angel-card rounded-2xl p-5 border border-steel-800 hover:border-steel-700 transition shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 font-mono text-xs font-bold border border-sky-500/40">
                          {tac.rotation}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-steel-800 text-steel-300 font-athletic text-[10px] uppercase border border-steel-700">
                          {tac.phase}
                        </span>
                        {getScopeBadge(tac.scope)}
                      </div>

                      {isCoachOrManager && (
                        <button
                          onClick={() => handleDeleteTactic(tac.id)}
                          className="text-steel-500 hover:text-rose-400 p-1"
                          title="Usuń taktykę"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="text-sm font-athletic text-bone-100 uppercase tracking-wide mb-1">
                      {tac.title}
                    </h3>

                    {tac.targetOpponent && (
                      <div className="text-[10px] text-amber-300 font-semibold mb-2">
                        Celowane pod rywala: {tac.targetOpponent}
                      </div>
                    )}

                    <p className="text-xs text-steel-400 line-clamp-3 mb-3 leading-relaxed">
                      {tac.description}
                    </p>

                    {tac.directives && tac.directives.length > 0 && (
                      <div className="bg-dark-950/80 rounded-xl p-3 border border-steel-800/80 space-y-1 mb-3">
                        <span className="text-[10px] font-athletic text-sky-400 uppercase tracking-wider block">
                          Kluczowe Założenia:
                        </span>
                        {tac.directives.map((d, i) => (
                          <div key={i} className="text-[11px] text-steel-300 flex items-start gap-1.5">
                            <span className="text-sky-400">•</span>
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-steel-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-steel-500">
                      Autor: {tac.createdByName}
                    </span>
                    <button
                      onClick={() => handleLoadTacticToBoard(tac)}
                      className="px-3 py-1.5 rounded-xl bg-steel-700 hover:bg-steel-600 text-bone-100 font-athletic text-xs flex items-center gap-1 transition"
                    >
                      <span>Załaduj na tablicę</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SCOUTING & ANALIZA RYWALi */}
      {activeTab === 'SCOUTING' && (
        <div className="space-y-6">
          {scoutingReports.map(scout => (
            <div
              key={scout.id}
              className="angel-card rounded-3xl p-6 border border-steel-800/80 shadow-2xl relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-steel-800">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-500/40 text-[10px] font-athletic tracking-widest uppercase mb-1">
                    Raport Przedmeczowy · Rywal Ligowy
                  </div>
                  <h2 className="text-xl font-athletic text-bone-100 tracking-wider uppercase">
                    {scout.opponentTeam}
                  </h2>
                  {scout.matchDate && (
                    <span className="text-xs text-steel-400 font-mono">
                      Data spotkania: {scout.matchDate}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-athletic uppercase border ${
                      scout.threatLevel === 'WYSOKI'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : scout.threatLevel === 'SREDNI'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    }`}
                  >
                    Zagrożenie: {scout.threatLevel}
                  </span>
                </div>
              </div>

              {/* Opponent Key Directives Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
                {/* Serve Target Zones */}
                <div className="bg-dark-950/80 rounded-2xl p-4 border border-steel-800/80">
                  <span className="text-[10px] font-athletic uppercase tracking-wider text-amber-400 block mb-2">
                    🎯 Celowanie Zagrywką (Strefy Rywala):
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      {scout.serveTargetZones.map(z => (
                        <div
                          key={z}
                          className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 flex items-center justify-center font-athletic text-base font-bold shadow"
                        >
                          {z}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-steel-300">
                      Bezwzględny nacisk serwisem na strefy{' '}
                      <strong>{scout.serveTargetZones.join(' i ')}</strong>. Unikać serwisu w bezpieczny środek.
                    </p>
                  </div>
                </div>

                {/* Blocking Directive */}
                <div className="bg-dark-950/80 rounded-2xl p-4 border border-steel-800/80">
                  <span className="text-[10px] font-athletic uppercase tracking-wider text-sky-400 block mb-2">
                    🛡️ Schemat Pracy Bloku:
                  </span>
                  <p className="text-xs text-steel-300 leading-relaxed">
                    {scout.blockingDirective}
                  </p>
                </div>
              </div>

              {/* Key Dangerous Players Box */}
              <div>
                <span className="text-xs font-athletic uppercase tracking-wider text-bone-100 block mb-3">
                  Kluczowi Gracze Rywala do Neutralizacji:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {scout.keyPlayers.map((kp, idx) => (
                    <div
                      key={idx}
                      className="bg-dark-900 rounded-2xl p-3.5 border border-steel-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-steel-800">
                          <strong className="text-xs text-white">
                            {kp.number ? `#${kp.number} ` : ''}{kp.name}
                          </strong>
                          <span className="text-[9px] font-mono text-steel-400">{kp.position}</span>
                        </div>
                        <p className="text-[11px] text-rose-300/90 mb-2">
                          <strong>Groźba:</strong> {kp.threatNote}
                        </p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-steel-800/70 text-[11px] text-sky-300 font-medium">
                        <strong>Zadanie:</strong> {kp.targetDirective}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coach Summary */}
              {scout.coachNotes && (
                <div className="mt-5 p-4 rounded-2xl bg-steel-900/40 border border-steel-700/60 text-xs text-steel-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-bone-100 uppercase tracking-wider block font-athletic mb-0.5">
                      Podsumowanie Odprawy Trenera:
                    </strong>
                    <span>{scout.coachNotes}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: ZMIANY ZADANIOWE & SKŁAD */}
      {activeTab === 'SUBSTITUTIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sub Plan 1: Double Sub */}
          <div className="angel-card rounded-3xl p-5 border border-steel-800 shadow-xl">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-steel-800">
              <RotateCw className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-athletic text-bone-100 uppercase">
                Podwójna Zmiana (R-A)
              </h3>
            </div>
            <p className="text-xs text-steel-400 mb-3">
              Wprowadzana w rotacji P4 lub P5, gdy rozgrywający przechodzi do linii ataku, aby utrzymać 3 atakujących na siatce.
            </p>
            <div className="space-y-2 bg-dark-950/80 p-3 rounded-2xl border border-steel-800 text-xs">
              <div className="flex items-center justify-between text-steel-300">
                <span>Wejście:</span>
                <strong className="text-sky-300 font-mono">Rezerwowy R + Główny A</strong>
              </div>
              <div className="flex items-center justify-between text-steel-300">
                <span>Zejście:</span>
                <span className="text-steel-400 font-mono">Główny R + Rezerwowy A</span>
              </div>
              <div className="pt-2 border-t border-steel-800/80 text-[10px] text-amber-300">
                Optymalny moment: wynik 18:18 w końcówce seta.
              </div>
            </div>
          </div>

          {/* Sub Plan 2: Tactical Serve */}
          <div className="angel-card rounded-3xl p-5 border border-steel-800 shadow-xl">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-steel-800">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-athletic text-bone-100 uppercase">
                Zagrywka Zadaniowa
              </h3>
            </div>
            <p className="text-xs text-steel-400 mb-3">
              Wpuszczenie specjalisty od agresywnej zagrywki z wyskoku lub trudnego floatu przed linię 3m.
            </p>
            <div className="space-y-2 bg-dark-950/80 p-3 rounded-2xl border border-steel-800 text-xs">
              <div className="flex items-center justify-between text-steel-300">
                <span>Za kogo:</span>
                <strong className="text-amber-300 font-mono">Środkowy po przejściu</strong>
              </div>
              <div className="flex items-center justify-between text-steel-300">
                <span>Cel:</span>
                <span className="text-steel-300">Bezpośredni as lub odrzucenie rywala</span>
              </div>
              <div className="pt-2 border-t border-steel-800/80 text-[10px] text-emerald-400">
                Po zepsutej lub obronionej akcji natychmiastowy powrót Libero.
              </div>
            </div>
          </div>

          {/* Sub Plan 3: Defense Sub */}
          <div className="angel-card rounded-3xl p-5 border border-steel-800 shadow-xl">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-steel-800">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-athletic text-bone-100 uppercase">
                Wzmocnienie Defensywy
              </h3>
            </div>
            <p className="text-xs text-steel-400 mb-3">
              Wejście defensywnego przyjmującego na II linię do asekuracji trudnych piłek sytuacyjnych.
            </p>
            <div className="space-y-2 bg-dark-950/80 p-3 rounded-2xl border border-steel-800 text-xs">
              <div className="flex items-center justify-between text-steel-300">
                <span>Za kogo:</span>
                <strong className="text-emerald-300 font-mono">Zmęczony skrzydłowy</strong>
              </div>
              <div className="flex items-center justify-between text-steel-300">
                <span>Strefa:</span>
                <span className="text-steel-300">Strefa 5 lub 6</span>
              </div>
              <div className="pt-2 border-t border-steel-800/80 text-[10px] text-sky-400">
                Zabezpiecza przyjęcie floatów przy serii zagrywek rywala.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DODAJ NOWĄ TAKTYKĘ */}
      {showAddTacticModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="angel-card rounded-3xl w-full max-w-lg p-6 shadow-2xl relative my-8 border border-steel-700/80 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-steel-800 mb-4">
              <h3 className="text-base font-athletic text-bone-100 uppercase">
                Nowa Taktyka w Playbooku
              </h3>
              <button onClick={() => setShowAddTacticModal(false)} className="text-steel-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleCreateCustomTactic} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-steel-300 mb-1">Tytuł taktyki *</label>
                <input
                  type="text"
                  required
                  placeholder="np. Szybki pajp z II linii przy bloku na skrzydle"
                  value={newTacticTitle}
                  onChange={(e) => setNewTacticTitle(e.target.value)}
                  className="w-full bg-dark-950 border border-steel-700/80 rounded-xl px-3 py-2 text-xs text-bone-100 focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Scope Selection */}
              <div>
                <label className="block text-[11px] font-bold text-steel-300 mb-1">Kategoria Taktyki *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { key: 'MECZ_LIGOWY', label: 'Mecz Ligowy' },
                    { key: 'TURNIEJ', label: 'Turniej' },
                    { key: 'SPARING', label: 'Sparing' },
                    { key: 'OGOLNA', label: 'Ogólna' }
                  ].map(s => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setNewTacticScope(s.key as TacticScope)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-athletic border transition ${
                        newTacticScope === s.key
                          ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow'
                          : 'bg-dark-950 text-steel-400 border-steel-800 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Match/Event Link */}
              {newTacticScope === 'MECZ_LIGOWY' && (
                <div>
                  <label className="block text-[11px] font-bold text-steel-300 mb-1">
                    Wybierz mecz ligowy (opcjonalnie):
                  </label>
                  <select
                    value={newTacticMatchId}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setNewTacticMatchId(mId);
                      const m = matches.find(x => x.id === mId);
                      if (m) setNewTacticOpponent(m.opponent);
                    }}
                    className="w-full bg-dark-950 border border-steel-700/80 rounded-xl px-2.5 py-1.5 text-xs text-bone-100 focus:outline-none"
                  >
                    <option value="">-- Dowolny mecz ligowy --</option>
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>
                        vs {m.opponent} ({new Date(m.date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(newTacticScope === 'TURNIEJ' || newTacticScope === 'SPARING') && (
                <div>
                  <label className="block text-[11px] font-bold text-steel-300 mb-1">
                    Wybierz wydarzenie (opcjonalnie):
                  </label>
                  <select
                    value={newTacticEventId}
                    onChange={(e) => {
                      const eId = e.target.value;
                      setNewTacticEventId(eId);
                      const ev = events.find(x => x.id === eId);
                      if (ev) setNewTacticOpponent(ev.title);
                    }}
                    className="w-full bg-dark-950 border border-steel-700/80 rounded-xl px-2.5 py-1.5 text-xs text-bone-100 focus:outline-none"
                  >
                    <option value="">-- Dowolne wydarzenie --</option>
                    {events
                      .filter(ev => newTacticScope === 'TURNIEJ' ? ev.type === 'TURNIEJ' : ev.type === 'SPARING')
                      .map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title} ({new Date(ev.date).toLocaleDateString()})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-steel-300 mb-1">Rotacja</label>
                  <select
                    value={rotation}
                    onChange={(e) => setRotation(e.target.value as RotationCode)}
                    className="w-full bg-dark-950 border border-steel-700/80 rounded-xl px-2.5 py-2 text-xs text-bone-100 focus:outline-none"
                  >
                    {['P1', 'P2', 'P3', 'P4', 'P5', 'P6'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-steel-300 mb-1">Faza</label>
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value as TacticalPhase)}
                    className="w-full bg-dark-950 border border-steel-700/80 rounded-xl px-2.5 py-2 text-xs text-bone-100 focus:outline-none"
                  >
                    <option value="PRZYJECIE">Przyjęcie (K1)</option>
                    <option value="OBRONA">Obrona & Blok (K2)</option>
                    <option value="ATAK">Kontratak & Pajp</option>
                    <option value="ZAGRYWKA">Własny Serwis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-steel-300 mb-1">Rywal / Tytuł dedykowany:</label>
                <input
                  type="text"
                  placeholder="np. Gladiatorzy BUD-WENT"
                  value={newTacticOpponent}
                  onChange={(e) => setNewTacticOpponent(e.target.value)}
                  className="w-full bg-dark-950 border border-steel-700/80 rounded-xl px-3 py-2 text-xs text-bone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-steel-300 mb-1">Opis i założenia:</label>
                <textarea
                  rows={3}
                  value={newTacticDesc}
                  onChange={(e) => setNewTacticDesc(e.target.value)}
                  placeholder="Krótki opis przebiegu akcji..."
                  className="w-full bg-dark-950 border border-steel-700/80 rounded-xl px-3 py-2 text-xs text-bone-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-steel-800">
                <button
                  type="button"
                  onClick={() => setShowAddTacticModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-steel-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-athletic bg-sky-600 hover:bg-sky-500 text-white shadow"
                >
                  Zapisz Taktykę
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DODAJ RAPORT SCOUTINGU */}
      {showAddScoutingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="angel-card rounded-3xl w-full max-w-lg p-6 shadow-2xl relative my-8 border border-steel-700/80 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-steel-800 mb-4">
              <h3 className="text-base font-athletic text-bone-100 uppercase">
                Nowy Raport Scoutingu Rywala
              </h3>
              <button onClick={() => setShowAddScoutingModal(false)} className="text-steel-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleCreateScouting} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-steel-300 mb-1">Nazwa rywala *</label>
                <input
                  type="text"
                  required
                  placeholder="np. Gladiatorzy BUD-WENT"
                  value={newScoutOpponent}
                  onChange={(e) => setNewScoutOpponent(e.target.value)}
                  className="w-full bg-dark-950 border border-steel-700/80 rounded-xl px-3 py-2 text-xs text-bone-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-steel-300 mb-1">Poziom zagrożenia</label>
                  <select
                    value={newScoutThreat}
                    onChange={(e) => setNewScoutThreat(e.target.value as any)}
                    className="w-full bg-dark-950 border border-steel-700/80 rounded-xl px-2.5 py-2 text-xs text-bone-100 focus:outline-none"
                  >
                    <option value="WYSOKI">Wysoki</option>
                    <option value="SREDNI">Średni</option>
                    <option value="NISKI">Niski</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-steel-300 mb-1">Data meczu</label>
                  <input
                    type="date"
                    value={newScoutDate}
                    onChange={(e) => setNewScoutDate(e.target.value)}
                    className="w-full bg-dark-950 border border-steel-700/80 rounded-xl px-2.5 py-2 text-xs text-bone-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-steel-300 mb-1">Dyrektywa bloku i obrony:</label>
                <input
                  type="text"
                  placeholder="np. Podwójny blok zacieśniony do środka, odcinamy skos"
                  value={newScoutBlocking}
                  onChange={(e) => setNewScoutBlocking(e.target.value)}
                  className="w-full bg-dark-950 border border-steel-700/80 rounded-xl px-3 py-2 text-xs text-bone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-steel-300 mb-1">Kluczowe notatki trenera:</label>
                <textarea
                  rows={3}
                  value={newScoutNotes}
                  onChange={(e) => setNewScoutNotes(e.target.value)}
                  placeholder="Wskazówki przedmeczowe, słabe punkty rywala..."
                  className="w-full bg-dark-950 border border-steel-700/80 rounded-xl px-3 py-2 text-xs text-bone-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-steel-800">
                <button
                  type="button"
                  onClick={() => setShowAddScoutingModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-steel-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-athletic bg-amber-500 text-slate-950 font-bold shadow"
                >
                  Opublikuj Raport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoachTacticsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-steel-400 font-athletic">Ładowanie panelu trenera...</div>}>
      <CoachTacticsContent />
    </Suspense>
  );
}
