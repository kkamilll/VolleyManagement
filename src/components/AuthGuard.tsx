'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_ROUTES = ['/portal', '/login', '/register'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.some(p => pathname?.startsWith(p));
  const isAuthOnlyRoute = pathname?.startsWith('/login') || pathname?.startsWith('/register');
  const isSuperAdminAccount = Boolean((user as any)?.isSuperAdmin || user?.id === 'platform_superadmin');
  const isSuperAdminAllowedRoute =
    pathname?.startsWith('/superadmin') ||
    pathname?.startsWith('/create-club') ||
    pathname?.startsWith('/portal');

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicRoute) {
        router.replace('/portal');
      } else if (user && isSuperAdminAccount && !isSuperAdminAllowedRoute) {
        router.replace('/superadmin');
      } else if (user && !isSuperAdminAccount && isAuthOnlyRoute) {
        router.replace('/');
      }
    }
  }, [user, loading, isPublicRoute, isAuthOnlyRoute, isSuperAdminAccount, isSuperAdminAllowedRoute, router]);

  // Only show a loading placeholder when we do not yet have a cached user and auth state is still resolving
  if (loading && !user && !isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f8fb] text-slate-800 p-4">
        <div className="relative w-16 h-16 mb-4 animate-pulse">
          <img
            src="/logo.jpg"
            alt="Angels ZTP"
            className="w-full h-full object-contain rounded-2xl shadow-md border border-slate-200"
          />
        </div>
        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
          <span className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></span>
          <span>Wczytywanie aplikacji...</span>
        </div>
      </div>
    );
  }

  // If not logged in and on a protected route and finished loading, do not flash protected content
  if (!user && !loading && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
