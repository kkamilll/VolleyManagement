import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { ACTIVE_CLUB_COOKIE_NAME } from '@/lib/club-types';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Wylogowano' });
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete(ACTIVE_CLUB_COOKIE_NAME);
  return response;
}

