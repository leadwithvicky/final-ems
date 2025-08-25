"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { attendanceAPI } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import AttendanceAdminView from './AttendanceAdminView';
import Modal from '../Modal';
import { employeeAPI } from '@/lib/api';
import axios from 'axios';
import { Users, Calendar, FileText, TrendingUp, Clock, UserPlus, MessageSquare, Award } from 'lucide-react';
import Avatar from '@/components/Avatar';
import Layout from '../Layout';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserIcon } from 'lucide-react';
import AvatarUploader from '@/components/AvatarUploader';

interface AdminDashboardProps {
  hideHeader?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ hideHeader = false }) => {
  const { user, logout } = useAuth();
  const { addNotification } = useNotification();

  // Admin's own attendance SWR
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  const { data: attendance = [], isLoading: attendanceLoading, mutate: mutateAttendance } = useSWR(token ? ['/api/attendance', token] : null, ([url, t]) => fetch(url, { headers: { Authorization: `Bearer ${t}` } }).then(res => res.json()));
  // Find today's attendance record
  const today = new Date();
  const todayAttendance = Array.isArray(attendance)
    ? attendance.find((record: any) => {
        const recordDate = new Date(record.date);
        return recordDate.toDateString() === today.toDateString();
      })
    : undefined;

  const handleClockIn = async () => {
    try {
      await attendanceAPI.clockIn();
      addNotification({ type: 'success', message: 'Clocked in successfully!' });
      mutateAttendance();
    } catch (error: any) {
      addNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to clock in' });
    }
  };
  const handleClockOut = async () => {
    try {
      await attendanceAPI.clockOut();
      addNotification({ type: 'success', message: 'Clocked out successfully!' });
      mutateAttendance();
    } catch (error: any) {
      addNotification({ type: 'error', message: error?.response?.data?.message || 'Failed to clock out' });
    }
  };
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [addEmployeeLoading, setAddEmployeeLoading] = useState(false);
  const [addEmployeeError, setAddEmployeeError] = useState('');
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    salary: '',
    hireDate: '',
    password: ''
  });
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  const stats = [
    { label: 'Team Members', value: '156', change: '+8', icon: Users, color: 'from-orange-500 to-coral-500' },
    { label: 'Pending Leaves', value: '12', change: '-2', icon: Calendar, color: 'from-teal-500 to-cyan-500' },
    { label: 'This Month Hires', value: '8', change: '+3', icon: UserPlus, color: 'from-lime-500 to-green-500' },
    { label: 'Average Rating', value: '4.7', change: '+0.2', icon: Award, color: 'from-red-500 to-orange-500' }
  ];

  const leaveRequests = [
    { _id: '1', name: 'John Smith', type: 'Annual Leave', duration: '3 days', status: 'pending', dates: 'Mar 15-17' },
    { _id: '2', name: 'Sarah Wilson', type: 'Sick Leave', duration: '1 day', status: 'approved', dates: 'Mar 14' },
    { _id: '3', name: 'Mike Johnson', type: 'Personal Leave', duration: '2 days', status: 'pending', dates: 'Mar 20-21' },
    { _id: '4', name: 'Lisa Brown', type: 'Annual Leave', duration: '5 days', status: 'approved', dates: 'Mar 25-29' }
  ];

  const recentActivities = [
    { action: 'New employee onboarded', person: 'Alex Chen', time: '2 hours ago' },
    { action: 'Performance review completed', person: 'Emma Davis', time: '4 hours ago' },
    { action: 'Leave request approved', person: 'Mark Wilson', time: '6 hours ago' },
    { action: 'Training session scheduled', person: 'Team Development', time: '8 hours ago' }
  ];

  // Approve leave using new API endpoint
  const handleApproveLeave = async (leaveId: string, name: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found. Please login again.');
      await axios.post(
        `/api/leaves/${leaveId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${name}'s leave request has been approved and leave balance updated.`);
      // Optionally, refresh leave data here
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to approve leave');
    }
  };

  const handleRejectLeave = (name: string) => {
    toast.error(`${name}'s leave request has been rejected.`);
  };

  const handleAddEmployee = async () => {
    setAddEmployeeLoading(true);
    setAddEmployeeError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found. Please login again.');
      // Create employee and user in backend
      const res = await employeeAPI.create({
        ...employeeForm,
        salary: Number(employeeForm.salary),
        hireDate: employeeForm.hireDate ? new Date(employeeForm.hireDate) : undefined,
        password: employeeForm.password
      });
      setShowAddEmployeeModal(false);
      setEmployeeForm({ firstName: '', lastName: '', email: '', department: '', position: '', salary: '', hireDate: '', password: '' });
      toast.success('New employee has been added to the system.');
    } catch (err: any) {
      setAddEmployeeError(err?.response?.data?.message || err.message || 'Failed to add employee');
    } finally {
      setAddEmployeeLoading(false);
    }
  };

  const handleViewOnboarding = () => {
    setShowOnboardingModal(false);
    toast.success('Onboarding pipeline opened.');
  };

  const handleBrowseDirectory = () => {
    setShowDirectoryModal(false);
    toast.success('Employee directory opened.');
  };

  const handleViewReports = () => {
    setShowReportsModal(false);
    toast.success('Performance reports generated.');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'employees', label: 'Employee Management', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leave Management', icon: Calendar },
    { id: 'payroll', label: 'Payroll', icon: FileText },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: UserIcon }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return null;
  }

  const dashboardContent = (
    <div className="space-y-6">
      {/* Welcome Section */}
      {!hideHeader && (
        <div className="bg-gradient-to-r from-orange-500 to-coral-500 rounded-2xl text-white p-6">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h2>
          <p className="text-orange-100">Manage your team and oversee operations.</p>
        </div>
      )}

      {/* Stats Grid */}
      {!hideHeader && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change} from last month</p>
                </div>
                <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
            onClick={() => setShowAddEmployeeModal(true)}
            className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-left"
          >
            <UserPlus className="w-8 h-8 text-orange-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Add Employee</h3>
            <p className="text-sm text-gray-600">Onboard new team member</p>
          </button>
        {/* ...existing code... */}
      {/* Add Employee Modal */}
      <Modal isOpen={showAddEmployeeModal} onClose={() => setShowAddEmployeeModal(false)} title="Add New Employee">
        <form
          className="flex flex-col gap-3"
          onSubmit={e => { e.preventDefault(); handleAddEmployee(); }}
        >
          <div className="flex gap-2">
            <input
              className="border rounded px-2 py-1 flex-1"
              placeholder="First Name"
              value={employeeForm.firstName}
              onChange={e => setEmployeeForm(f => ({ ...f, firstName: e.target.value }))}
              required
            />
            <input
              className="border rounded px-2 py-1 flex-1"
              placeholder="Last Name"
              value={employeeForm.lastName}
              onChange={e => setEmployeeForm(f => ({ ...f, lastName: e.target.value }))}
              required
            />
          </div>
          <input
            className="border rounded px-2 py-1"
            placeholder="Email"
            type="email"
            value={employeeForm.email}
            onChange={e => setEmployeeForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <select
            className="border rounded px-2 py-1"
            value={employeeForm.department}
            onChange={e => setEmployeeForm(f => ({ ...f, department: e.target.value }))}
            required
          >
            <option value="">Select Department</option>
            <option value="Developers">Development</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Sales">Sales</option>
            <option value="Digital Marketing">Digital Marketing</option>
            <option value="Designers">Designers</option>
            <option value="Trainers">Trainers</option>
          </select>
          <input
            className="border rounded px-2 py-1"
            placeholder="Position"
            value={employeeForm.position}
            onChange={e => setEmployeeForm(f => ({ ...f, position: e.target.value }))}
            required
          />
          
          <input
            className="border rounded px-2 py-1"
            placeholder="Salary"
            type="number"
            value={employeeForm.salary}
            onChange={e => setEmployeeForm(f => ({ ...f, salary: e.target.value }))}
            required
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="Hire Date"
            type="date"
            value={employeeForm.hireDate}
            onChange={e => setEmployeeForm(f => ({ ...f, hireDate: e.target.value }))}
            required
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="Temporary Password"
            type="text"
            value={employeeForm.password}
            onChange={e => setEmployeeForm(f => ({ ...f, password: e.target.value }))}
            required
          />
          {addEmployeeError && <div className="text-red-600 text-sm">{addEmployeeError}</div>}
          <button
            type="submit"
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition self-end"
            disabled={addEmployeeLoading}
          >
            {addEmployeeLoading ? 'Adding...' : 'Add Employee'}
          </button>
        </form>
      </Modal>

          <button
            onClick={() => setShowOnboardingModal(true)}
            className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-left"
          >
            <Users className="w-8 h-8 text-teal-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Onboarding</h3>
            <p className="text-sm text-gray-600">View onboarding pipeline</p>
          </button>

          <button
            onClick={() => setShowDirectoryModal(true)}
            className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-left"
          >
            <FileText className="w-8 h-8 text-lime-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Directory</h3>
            <p className="text-sm text-gray-600">Browse employee directory</p>
          </button>

          <button
            onClick={() => setShowReportsModal(true)}
            className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-left"
          >
            <TrendingUp className="w-8 h-8 text-red-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Reports</h3>
            <p className="text-sm text-gray-600">Generate performance reports</p>
          </button>
        </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Admin's Own Attendance Section */}
              <div className="bg-gradient-to-r from-orange-500 to-coral-500 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Today's Attendance</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">
                      {todayAttendance ?
                        `Clocked in at ${todayAttendance.clockIn ? new Date(todayAttendance.clockIn).toLocaleTimeString() : ''}` :
                        'Not clocked in yet'}
                    </p>
                    {todayAttendance?.clockOut && (
                      <p className="text-sm opacity-90">
                        Clocked out at {new Date(todayAttendance.clockOut).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    {!todayAttendance ? (
                      <button
                        onClick={handleClockIn}
                        className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
                      >
                        Clock In
                      </button>
                    ) : !todayAttendance.clockOut ? (
                      <button
                        onClick={handleClockOut}
                        className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
                      >
                        Clock Out
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Leave Requests */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Leave Requests</h3>
                <div className="space-y-3">
                  {/* Replace with real leave data from backend */}
                  {Array.isArray(leaveRequests) && leaveRequests.filter(leave => leave.status === 'pending').map((leave, index) => (
                    <div key={leave._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar name={leave.name || 'Employee'} size={24} />
                        <p className="font-medium text-gray-900">{leave.name || 'Employee'}</p>
                        <p className="text-sm text-gray-600">{leave.type} • {leave.dates} • {leave.duration} days</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveLeave(leave._id, leave.name || 'Employee')}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectLeave(leave.name || 'Employee')}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div>
                        <p className="text-sm text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.person} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'employees' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Employee Management</h3>
                <button
                  onClick={() => setShowAddEmployeeModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Add Employee
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* ...existing code for employee cards or update to use real employee data... */}
              </div>
            </div>
          )}


          {selectedTab === 'attendance' && <AttendanceAdminView />}

          {selectedTab === 'leaves' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Leave Management</h3>
              <div className="space-y-3">
                {Array.isArray(leaveRequests) && leaveRequests.map((leave, index) => (
                  <div key={leave._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{leave.employee?.name || leave.name || 'Employee'}</p>
                      <p className="text-sm text-gray-600">{leave.leaveType || leave.type} • {leave.startDate || leave.dates} - {leave.endDate || ''} • {leave.days || leave.duration} days</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                      {leave.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveLeave(leave._id, leave.employee?.name || leave.name || 'Employee')}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectLeave(leave.employee?.name || leave.name || 'Employee')}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'payroll' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Payroll Management</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-600">Payroll features coming soon...</p>
              </div>
            </div>
          )}

          {selectedTab === 'communication' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Team Communication</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-600">Communication features coming soon...</p>
              </div>
            </div>
          )}
          {selectedTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
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
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (hideHeader) {
    return dashboardContent;
  }

  return (
    <Layout title="Admin Dashboard" user={user} onLogout={logout}>
      {dashboardContent}
    </Layout>
  );
};

export default AdminDashboard;
