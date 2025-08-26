'use client';

import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function EmployeePortalPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-100">
      <EmployeeDashboard />
    </div>
  );
}


