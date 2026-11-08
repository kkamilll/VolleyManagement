'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MatchesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/rozgrywki?tab=liga');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-rose-300 font-semibold text-sm">
        <span className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
        Przekierowywanie do modułu Rozgrywek: Mecze Ligowe...
      </div>
    </div>
  );
}
