'use client';

import React, { useState, useEffect } from 'react';
import DepartmentEmployeesModal from '../dashboard/DepartmentEmployeesModal';
import ReportLineChart from './ReportLineChart';
import { Users, TrendingUp, DollarSign, Building, BarChart3, Shield, Settings, FileText, Calendar, UserPlus, Award, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

import Layout from '../Layout';
import Modal from '../Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { employeeAPI, leaveAPI } from '@/lib/api';
import AdminDashboard from './AdminDashboard';
import AvatarUploader from '@/components/AvatarUploader';

const SuperadminDashboard: React.FC = () => {

  const { user, logout } = useAuth();
  const { addNotification } = useNotification();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportChartData, setReportChartData] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueChartData, setRevenueChartData] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [showApprovalsModal, setShowApprovalsModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  // Real-time data states
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDepartmentsModal, setShowDepartmentsModal] = useState(false);
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  // Fetch departments list when modal is opened
  useEffect(() => {
    if (showDepartmentsModal) {
      fetch('/api/departments')
        .then(res => res.json())
        .then(data => setDepartmentsList(data));
    }
  }, [showDepartmentsModal]);
  // Admin mode toggle
  const [adminMode, setAdminMode] = useState(false);

  // Superadmin-settable targets
  const [targetRevenue, setTargetRevenue] = useState(250000); // default value, can be changed by superadmin
  const [targetNumStudents, setTargetNumStudents] = useState(100); // default value, can be changed by superadmin
  const [showTargetModal, setShowTargetModal] = useState(false);

  // Placeholder values for DB-fetched data (replace with real data fetching later)
  const monthlyRevenue = 240000; // Example: fetched from DB
  const averageStudentRating = 4.5; // Example: fetched from DB
  const numNewStudentsJoined = 90; // Example: fetched from DB

  // Performance Score Calculation
  const performanceScore = (
    (monthlyRevenue && targetRevenue ? (monthlyRevenue / targetRevenue) * 40 : 0) +
    (averageStudentRating ? (averageStudentRating / 5) * 30 : 0) +
    (numNewStudentsJoined && targetNumStudents ? (numNewStudentsJoined / targetNumStudents) * 30 : 0)
  ).toFixed(1);

  const stats = [
    { label: 'Total Employees', value: employees.length.toString(), change: '+12%', icon: Users, color: 'from-orange-500 to-coral-500' },
    { label: 'Monthly Revenue', value: `$${(monthlyRevenue/1000).toFixed(1)}K`, change: '+8%', icon: DollarSign, color: 'from-teal-500 to-cyan-500' },
    { label: 'Performance Score', value: `${performanceScore}%`, change: '+3.1%', icon: TrendingUp, color: 'from-red-500 to-orange-500', onClick: () => setShowTargetModal(true) }
  ];

  // Admin stats (copied from AdminDashboard)
  const hiresThisMonth = Array.isArray(employees)
    ? employees.filter((e: any) => e?.hireDate && (new Date(e.hireDate)).getMonth() === new Date().getMonth() && (new Date(e.hireDate)).getFullYear() === new Date().getFullYear()).length
    : 0;

  const adminStats = [
    // { label: 'Team Members', value: String(Array.isArray(employees) ? employees.length : 0), change: '', icon: Users, color: 'from-orange-500 to-coral-500' },
    // { label: 'Pending Leaves', value: String(Array.isArray(leaves) ? leaves.filter((l: any)=> l.status==='pending').length : 0), change: '', icon: Calendar, color: 'from-teal-500 to-cyan-500' },
    { label: 'This Month Hires', value: String(hiresThisMonth), change: '', icon: UserPlus, color: 'from-lime-500 to-green-500' },
    { label: 'Average Rating', value: '4.7', change: '+0.2', icon: Award, color: 'from-red-500 to-orange-500' }
  ];

  const departmentAggregates = React.useMemo(() => {
    const map: Record<string, { name: string; employees: number }> = {};
    (employees as any[]).forEach((e) => {
      const dept = (e?.department || 'Unknown') as string;
      if (!map[dept]) map[dept] = { name: dept, employees: 0 };
      map[dept].employees += 1;
    });
    return Object.values(map).sort((a, b) => b.employees - a.employees);
  }, [employees]);

  // Fetch real-time data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesRes, leavesRes] = await Promise.all([
          employeeAPI.getAll(),
          leaveAPI.getAll()
        ]);
        const employeePayload: any = employeesRes.data;
        const employeeItems = Array.isArray(employeePayload) ? employeePayload : (employeePayload?.items || []);
        setEmployees(employeeItems);
        setLeaves(leavesRes.data);
      } catch (error) {
        addNotification({
          type: 'error',
          message: 'Failed to fetch data'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // No interval: fetch only on mount
  }, [addNotification]);

  const handleGenerateReport = () => {
    // Placeholder: In future, fetch real data from DB
    setReportChartData({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      values: [120, 135, 150, 140, 160, 170, 165, 180]
    });
    setShowReportModal(true);
  };

  const handleShowRevenue = () => {
    // Placeholder: In future, fetch real revenue data from DB
    setRevenueChartData({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      values: [200000, 220000, 210000, 250000, 240000, 260000, 255000, 270000]
    });
    setShowRevenueModal(true);
  };

  const handleApproveAll = () => {
    setShowApprovalsModal(false);
    addNotification({
      type: 'success',
      message: 'All pending approvals have been processed.'
    });
  };

  const handleScheduleMeeting = () => {
    setShowMeetingModal(false);
    addNotification({
      type: 'success',
      message: 'All-hands meeting scheduled for next Friday at 2 PM.'
    });
  };

  const handleStartHireProcess = () => {
    setShowHireModal(false);
    addNotification({
      type: 'success',
      message: 'New employee onboarding process initiated.'
    });
  };

  const handleConfigureRoles = () => {
    setShowRolesModal(false);
    addNotification({
      type: 'success',
      message: 'Role permissions updated successfully.'
    });
  };

  const handleScheduleReview = () => {
    setShowPerformanceModal(false);
    addNotification({
      type: 'success',
      message: 'Performance review cycle scheduled for Q2.'
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'employees', label: 'Employee Management', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'security', label: 'Security & Compliance', icon: Shield },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: UserIcon }
  ];

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Layout title="CEO Dashboard" user={user} onLogout={logout}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="CEO Dashboard" user={user} onLogout={logout}>
      <div className="space-y-6">
        {/* Superadmin Features */}
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-orange-500 to-coral-500 rounded-2xl text-white p-6">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h2>
          <p className="text-orange-100">Here's what's happening with your company today.</p>
        </div>

        {/* Superadmin Target Modal */}
        <Modal isOpen={showTargetModal} onClose={() => setShowTargetModal(false)} title="Set Performance Targets">
          <div className="flex flex-col gap-4 p-2">
            <div className="flex flex-col">
              <label className="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-1">Target Revenue (monthly)</label>
              <input
                type="number"
                className="input"
                value={targetRevenue}
                onChange={e => setTargetRevenue(Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-1">Target Number of Students</label>
              <input
                type="number"
                className="input"
                value={targetNumStudents}
                onChange={e => setTargetNumStudents(Number(e.target.value))}
                min={0}
              />
            </div>
            <button
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition self-end"
              onClick={() => setShowTargetModal(false)}
            >
              Save
            </button>
          </div>
        </Modal>

        {/* Stats Grid (Superadmin) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            if (stat.label === 'Total Employees') {
              return (
                <button
                  key={index}
                  className="card p-6 hover:shadow-xl transition-shadow duration-300 w-full text-left focus:outline-none"
                  onClick={() => setShowDepartmentsModal(true)}
                  title="View by department"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stat.value}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">{stat.change} from last month</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </button>
              );
            } else if (stat.label === 'Monthly Revenue') {
              return (
                <button
                  key={index}
                  className="card p-6 hover:shadow-xl transition-shadow duration-300 w-full text-left focus:outline-none"
                  onClick={handleShowRevenue}
                  title="View monthly revenue chart"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stat.value}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">{stat.change} from last month</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </button>
              );
            } else if (stat.label === 'Performance Score') {
              return (
                <button
                  key={index}
                  className="card p-6 hover:shadow-xl transition-shadow duration-300 w-full text-left focus:outline-none"
                  onClick={stat.onClick}
                  title="Set targets for performance score"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stat.value}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">{stat.change} from last month</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </button>
              );
            } else {
              return (
                <div key={index} className="card p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stat.value}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">{stat.change} from last month</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
        {/* Monthly Revenue Modal with Line Chart */}
        {showRevenueModal && revenueChartData && (
          <Modal isOpen={showRevenueModal} onClose={() => setShowRevenueModal(false)} title="Monthly Revenue Insights">
            <div className="w-full max-w-2xl mx-auto">
              <ReportLineChart data={revenueChartData} />
            </div>
          </Modal>
        )}

        {/* Departments Modal */}
        {showDepartmentsModal && (
          <Modal isOpen={showDepartmentsModal} onClose={() => setShowDepartmentsModal(false)} title="Departments">
            <div className="space-y-2">
              {departmentsList.length === 0 ? (
                <div className="text-center py-4 text-gray-600 dark:text-gray-400">No departments found.</div>
              ) : (
                departmentsList.map(dep => (
                  <button
                    key={dep}
                    className="block w-full text-left px-4 py-2 rounded hover:bg-orange-100 dark:hover:bg-orange-900/20 text-gray-900 dark:text-gray-100"
                    onClick={() => {
                      setSelectedDepartment(dep);
                      setShowDepartmentsModal(false);
                    }}
                  >
                    {dep}
                  </button>
                ))
              )}
            </div>
          </Modal>
        )}

        {/* Department Employees Modal */}
        {selectedDepartment && (
          <DepartmentEmployeesModal
            department={selectedDepartment}
            open={!!selectedDepartment}
            onClose={() => setSelectedDepartment(null)}
          />
        )}

        {selectedTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <AvatarUploader
                  userId={user.id}
                  name={user.name}
                  avatarUrl={user.avatarUrl as any}
                  avatarUpdatedAt={user.avatarUpdatedAt as any}
                  onUploaded={() => {}}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{user.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        )}

  {/* Admin Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          {adminStats.map((stat, index) => (
            <div key={index} className="card p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stat.value}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{stat.change} from last month</p>
                </div>
                <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Report Modal with Line Chart */}
        {showReportModal && reportChartData && (
          <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Monthly Report Insights">
            <div className="w-full max-w-2xl mx-auto">
              <ReportLineChart data={reportChartData} />
            </div>
          </Modal>
        )}

        {/* Divider */}
        <div className="my-8 border-t-2 border-dashed border-white"></div>

        {/* Admin Features Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-orange-700 dark:text-orange-400">Admin Features</h2>
          <div>
            {/* Pass handleGenerateReport to AdminDashboard if needed, or add a Monthly Report button here */}
            <Link href="/dashboard/reports" className="mb-4 inline-block px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition">
              Open Reports
            </Link>
            <AdminDashboard hideHeader={true} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SuperadminDashboard;
