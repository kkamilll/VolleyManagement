'use client';

import React, { useState } from 'react';

export function normalizeTeamName(name?: string): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isAngelsTeam(name?: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return n.includes('angels') || n.includes('ztp');
}

export function getTeamCrestUrl(teamName?: string, crestsMap?: Record<string, string>): string | null {
  if (!teamName) return null;
  if (isAngelsTeam(teamName)) return '/logo.jpg';
  if (!crestsMap) return null;

  // 1. Direct match
  if (crestsMap[teamName]) return crestsMap[teamName];

  // 2. Normalized match
  const norm = normalizeTeamName(teamName);
  for (const [key, val] of Object.entries(crestsMap)) {
    if (normalizeTeamName(key) === norm) {
      return val;
    }
  }

  return null;
}

// Generate consistent initials (np. "Coco Jumbo" -> "CJ", "Gladiatorzy BUD-WENT" -> "GB")
export function getTeamInitials(teamName?: string): string {
  if (!teamName) return '?';
  const parts = teamName.trim().split(/[\s-]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return teamName.slice(0, 2).toUpperCase();
}

// Consistent athletic team gradient based on team name
export function getTeamColorGradient(teamName?: string): string {
  if (!teamName) return 'from-slate-700 to-slate-900 text-white';
  if (isAngelsTeam(teamName)) return 'from-sky-600 to-blue-700 text-white';
  
  const colors = [
    'from-amber-500 to-orange-600 text-slate-950',
    'from-emerald-600 to-teal-800 text-white',
    'from-rose-600 to-red-800 text-white',
    'from-indigo-600 to-violet-800 text-white',
    'from-cyan-600 to-blue-800 text-white',
    'from-yellow-500 to-amber-700 text-slate-950',
    'from-purple-600 to-pink-700 text-white',
    'from-slate-800 to-slate-950 text-white'
  ];

  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

interface TeamCrestBadgeProps {
  teamName: string;
  logoUrl?: string | null;
  crestsMap?: Record<string, string>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: 'rounded-xl' | 'rounded-2xl' | 'rounded-full';
}

export function TeamCrestBadge({
  teamName,
  logoUrl,
  crestsMap,
  size = 'md',
  className = '',
  rounded = 'rounded-2xl'
}: TeamCrestBadgeProps) {
  const [imgError, setImgError] = useState(false);
  
  const effectiveLogo = logoUrl || getTeamCrestUrl(teamName, crestsMap);
  const initials = getTeamInitials(teamName);
  const gradient = getTeamColorGradient(teamName);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 sm:w-11 sm:h-11 text-xs sm:text-sm',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 text-sm sm:text-base',
    xl: 'w-16 h-16 sm:w-20 sm:h-20 text-base sm:text-xl'
  }[size];

  if (effectiveLogo && !imgError) {
    return (
      <div className={`relative shrink-0 overflow-hidden bg-white border border-slate-200/90 shadow-2xs ${sizeClasses} ${rounded} ${className} flex items-center justify-center`}>
        <img
          src={effectiveLogo}
          alt={`Herb ${teamName}`}
          className="w-full h-full object-contain p-0.5"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br ${gradient} border border-slate-300/40 shadow-xs ${sizeClasses} ${rounded} ${className} flex items-center justify-center font-black font-athletic select-none tracking-wider`}
      title={teamName}
    >
      <span>{initials}</span>
    </div>
  );
}
