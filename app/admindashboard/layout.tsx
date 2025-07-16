'use client';
import { useAuth } from '@/lib/hooks/useAuth';
import { AdminSidebar } from '@/components/admin-sidebar';
import { useEffect } from 'react';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, error, logout } = useAuth();

  useEffect(() => {
    // Clear any old session storage data
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('redirectAttempt');
      sessionStorage.removeItem('redirectTimestamp');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="mb-4">
            {error === 'Not authenticated' 
              ? 'You need to log in to access this page.' 
              : 'Authentication error. Please try logging in again.'}
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="mb-4">You don&apos;t have permission to access the admin dashboard.</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                const redirectUrl = user.role === 'staff' ? '/staffdashboard' : '/guardian-dashboard';
                window.location.href = redirectUrl;
              }}
              className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              Go to Your Dashboard
            </button>
            <button
              onClick={logout}
              className="block w-full text-center bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[#FFFDF6]">
      <AdminSidebar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {children}
      </div>
    </div>
  );
}
