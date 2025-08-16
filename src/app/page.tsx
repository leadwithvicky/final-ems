'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Login from '@/components/Login';
import Register from '@/components/Register';
import SuperadminDashboard from '@/components/Dashboard/SuperadminDashboard';
import AdminDashboard from '@/components/Dashboard/AdminDashboard';
import EmployeeDashboard from '@/components/Dashboard/EmployeeDashboard';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-coral-400 to-red-400 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  switch (user.role) {
    case 'superadmin':
      return <SuperadminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'employee':
    default:
      return <EmployeeDashboard />;
  }
}
