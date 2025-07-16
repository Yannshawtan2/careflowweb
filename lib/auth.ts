'use client';

export const logout = async () => {
  try {
    // Clear server-side session
    await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error clearing server session:', error);
  }
  
  // Clear any remaining client-side storage
  if (typeof window !== 'undefined') {
    sessionStorage.clear();
    localStorage.clear();
  }
  
  // Redirect to login
  window.location.href = '/login';
}; 