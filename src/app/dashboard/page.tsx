'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Calendar, BarChart3, LogOut, User } from 'lucide-react';
import toast from 'react-hot-toast';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import SuperadminDashboard from '@/components/dashboard/SuperadminDashboard';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  switch (user.role) {
    case 'superadmin':
      return <SuperadminDashboard user={user} onLogout={handleLogout} />;
    case 'admin':
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    case 'employee':
    default:
      return <EmployeeDashboard user={user} onLogout={handleLogout} />;
  }
}
