'use client';
import Image from "next/image";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { generateToken } from '@/lib/jwt';
import logo from '@/images/logo.png';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectBlocked, setRedirectBlocked] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');

  // Check for existing session and redirect if found
  useEffect(() => {
    const checkSession = () => {
      console.log('Checking session state...');
      
      // Check if we're in a redirect loop
      const redirectAttempt = sessionStorage.getItem('redirectAttempt');
      const redirectTimestamp = sessionStorage.getItem('redirectTimestamp');
      const now = Date.now();
      
      if (redirectAttempt && redirectTimestamp) {
        const redirectTime = parseInt(redirectTimestamp, 10);
        const timeDiff = now - redirectTime;
        
        // If we've tried to redirect in the last 2 seconds, block additional redirects
        if (timeDiff < 2000) {
          console.log('Redirect loop detected. Blocking automatic redirects.');
          setRedirectBlocked(true);
          return;
        }
      }
      
      const token = sessionStorage.getItem('token');
      const userRole = sessionStorage.getItem('userRole');
      console.log('Current session:', { hasToken: !!token, role: userRole });
      
      if (token && userRole && !redirectBlocked) {
        const path = getRedirectPath(userRole);
        if (path) {
          console.log('Has valid session, preparing manual redirect to:', path);
          setRedirectPath(path);
          setLoginSuccess(true);
          setRedirectBlocked(true);
        }
      }
    };

    checkSession();
  }, []);

  const getRedirectPath = (role: string): string | null => {
    console.log('Getting redirect path for role:', role);
    let path = null;
    switch (role) {
      case 'admin':
        path = '/admindashboard';
        break;
      case 'staff':
        path = '/staffdashboard';
        break;
      case 'guardian':
        path = isMobileDevice() ? '/guardian-dashboard' : null;
        break;
      default:
        path = null;
    }
    console.log('Redirect path determined:', path);
    return path;
  };

  const handleRedirect = async () => {
    console.log('Manual redirect initiated to:', redirectPath);
    
    try {
      // Set cookie for middleware authentication
      const userRole = sessionStorage.getItem('userRole');
      
      // Use the API endpoint to set the cookie
      const response = await fetch('/api/auth/cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: userRole }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set cookie');
      }
      
      console.log('Cookie set with role:', userRole);
      
      // Navigate to the dashboard
      window.location.href = redirectPath;
    } catch (error) {
      console.error('Error setting cookie:', error);
      // Continue with redirect anyway
      window.location.href = redirectPath;
    }
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Login attempt started');
    setError('');
    setLoading(true);

    try {
      // Clear any existing session data first
      sessionStorage.clear();
      console.log('Session storage cleared');

      console.log('Attempting Firebase authentication...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential) {
        console.error('No user credential returned from Firebase');
        throw new Error('Incorrect username or password');
      }

      console.log('Firebase authentication successful, fetching user data...');
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();

      if (!userData) {
        console.error('No user data found in Firestore');
        throw new Error('User data not found');
      }

      console.log('User data retrieved:', { role: userData.role, email: userCredential.user.email });

      // Generate JWT token
      console.log('Generating JWT token...');
      const token = generateToken({
        userId: userCredential.user.uid,
        role: userData.role,
        email: userCredential.user.email || ''
      });

      // Store token and role in session storage
      console.log('Storing session data...');
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('userRole', userData.role);
      sessionStorage.setItem('userId', userCredential.user.uid);
      
      // Set a cookie with the role using the API
      try {
        const cookieResponse = await fetch('/api/auth/cookie', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: userData.role }),
        });
        
        if (!cookieResponse.ok) {
          console.error('Failed to set cookie via API');
        } else {
          console.log('Cookie set via API with role:', userData.role);
        }
      } catch (error) {
        console.error('Error setting cookie via API:', error);
      }
      
      // Verify session storage was set
      const storedToken = sessionStorage.getItem('token');
      const storedRole = sessionStorage.getItem('userRole');
      console.log('Session storage verification:', {
        tokenSet: !!storedToken,
        roleSet: storedRole === userData.role
      });

      // Get redirect path
      const path = getRedirectPath(userData.role);
      if (!path) {
        throw new Error('Invalid user role or access denied');
      }

      // Set up for manual redirect
      setRedirectPath(path);
      setLoginSuccess(true);
      setRedirectBlocked(true);
      
    } catch (err) {
      console.error('Login error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Incorrect username or password');
      // Clear session on error
      sessionStorage.clear();
    } finally {
      setLoading(false);
      console.log('Login attempt completed');
    }
  };

  // Helper function to check if user is on a mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {loginSuccess ? (
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Authentication Successful!</h2>
            <p className="mb-6">You have successfully logged in as {sessionStorage.getItem('userRole')}.</p>
            <button
              onClick={handleRedirect}
              className="w-full rounded-md bg-green-600 py-2 px-4 font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded border-l-4 border-red-500 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            <form 
              onSubmit={(e) => {
                console.log('Form submitted');
                handleEmailAuth(e);
              }} 
              className="mb-4"
            >
              <div className="mb-6 flex justify-center">
                <Image src={logo} alt="Logo" className="h-55 w-55" />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none text-gray-700"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none text-gray-700"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-blue-600 py-2 px-4 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;