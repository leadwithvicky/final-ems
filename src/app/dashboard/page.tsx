'use client';

import { useAuth } from '@/contexts/AuthContext';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard'; 
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import SuperadminDashboard from '@/components/dashboard/SuperadminDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'superadmin':
        return <SuperadminDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <EmployeeDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">{renderDashboard()}</div>
  );
}
