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
import { getCookie, setCookie } from '@/lib/cookies';
import logo from '@/images/logo.png';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for existing cookies and redirect if found
  useEffect(() => {
    const userRole = getCookie('userRole');
    if (userRole) {
      redirectBasedOnRole(userRole);
    }
  }, []);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case 'admin':
        router.push('/admindashboard');
        break;
      case 'staff':
        router.push('/staffdashboard');
        break;
      case 'guardian':
        if (isMobileDevice()) {
          router.push('/guardian-dashboard');
        } else {
          setError('Guardians can only access through the mobile app');
        }
        break;
      default:
        setError('Invalid user role');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential) {
        throw new Error('Incorrect username or password');
      }

      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();

      if (!userData) {
        throw new Error('User data not found');
      }

      // Set cookies
      setCookie('userRole', userData.role);
      setCookie('userId', userCredential.user.uid);
      
      // Redirect based on role
      redirectBasedOnRole(userData.role);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Incorrect username or password');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if user is on a mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {error && (
          <div className="mb-4 rounded border-l-4 border-red-500 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="mb-4">
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
      </div>
    </div>
  );
};

export default LoginPage;