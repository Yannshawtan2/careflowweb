'use client';
import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  phone?: string;
  stripeCustomerId?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setError(null);
        } else if (response.status === 401) {
          setUser(null);
          setError('Not authenticated');
        } else {
          setUser(null);
          setError('Authentication check failed');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setUser(null);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include',
      });
      
      // Clear any remaining session storage
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
      
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
      window.location.href = '/login';
    }
  };

  return { user, loading, error, logout };
}
