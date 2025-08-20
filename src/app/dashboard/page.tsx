'use client';

import { useAuth } from '@/contexts/AuthContext';
import EmployeeDashboard from '@/components/Dashboard/EmployeeDashboard'; 
import AdminDashboard from '@/components/Dashboard/AdminDashboard';
import SuperadminDashboard from '@/components/Dashboard/SuperadminDashboard';
import GlobalChat from '@/components/GlobalChat';

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
    <div className="min-h-screen bg-gray-100">
      {renderDashboard()}
      <GlobalChat />
    </div>
  );
}
