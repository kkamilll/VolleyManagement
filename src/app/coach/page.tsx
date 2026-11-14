'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CoachRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/taktyka');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-sky-400 font-semibold text-sm">
        <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></span>
        Przekierowywanie do Warsztatu Taktycznego Trenera...
      </div>
    </div>
  );
}
