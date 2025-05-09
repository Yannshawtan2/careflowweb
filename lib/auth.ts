'use client';
import { deleteCookie } from '@/lib/cookies';
import { useRouter } from 'next/navigation';

export const logout = () => {
  deleteCookie('userRole');
  deleteCookie('userId');
  
  // Use client-side navigation
  window.location.href = '/login';
}; 