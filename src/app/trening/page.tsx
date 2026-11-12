'use client';

import React, { Suspense } from 'react';
import { TrainingPlannerContent } from '@/components/TrainingPlanner';

export default function TrainingPlannerPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-white">Ładowanie warsztatu trenera...</div>}>
      <TrainingPlannerContent />
    </Suspense>
  );
}
