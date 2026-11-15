'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_ROUTES = ['/login', '/register'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.some(p => pathname?.startsWith(p));

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicRoute) {
        router.replace('/login');
      } else if (user && isPublicRoute) {
        router.replace('/');
      }
    }
  }, [user, loading, isPublicRoute, router]);

  // When loading authentication status on a protected route, show a branded loading screen
  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
        <div className="relative w-20 h-20 mb-4 animate-pulse">
          <img
            src="/logo.jpg"
            alt="Angels ZTP"
            className="w-full h-full object-contain rounded-2xl shadow-2xl border border-sky-500/30"
          />
        </div>
        <div className="flex items-center gap-2.5 text-xs font-mono text-sky-400">
          <span className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></span>
          <span>Weryfikacja dostępu do systemu Angels ZTP...</span>
        </div>
      </div>
    );
  }

  // If not logged in and on a protected route, do not flash protected content
  if (!user && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
