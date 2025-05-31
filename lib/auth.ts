'use client';
import { useRouter } from 'next/navigation';

export const logout = async () => {
  // Clear session storage
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userRole');
  sessionStorage.removeItem('userId');
  
  // Clear cookies by expiring them
  document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  
  // Try to use the API to clear cookie
  try {
    const response = await fetch('/api/auth/cookie', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: '' }), // Empty role to clear
    });
    
    if (!response.ok) {
      console.error('Failed to clear cookie via API');
    }
  } catch (error) {
    console.error('Error clearing cookie via API:', error);
  }
  
  // Use client-side navigation
  window.location.href = '/login';
}; 