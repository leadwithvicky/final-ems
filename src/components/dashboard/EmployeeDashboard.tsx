'use client';

import React, { useState } from 'react';
import { Calendar, User, Users, FileText, Award, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import Layout from '../Layout';
import AvatarUploader from '@/components/AvatarUploader';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import useSWR from 'swr';
import { attendanceAPI, leaveAPI, pollsAPI, payrollAPI } from '@/lib/api';
import api from '@/lib/api';
import Modal from '../Modal';
import toast from 'react-hot-toast';

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const EmployeeDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { addNotification } = useNotification();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showRequestLeaveModal, setShowRequestLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'annual', startDate: '', endDate: '', reason: '' });
  const [requestingLeave, setRequestingLeave] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '', phone: '', department: '', position: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Get token from localStorage (client only)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  // SWR hooks for each API
  const { data: attendance = [], error: attendanceError, isLoading: attendanceLoading, mutate: mutateAttendance } = useSWR(token ? ['/api/attendance', token] : null, ([url, t]) => fetcher(url, t));
  const { data: tasks = [], error: tasksError, isLoading: tasksLoading, mutate: mutateTasks } = useSWR(token ? ['/api/tasks', token] : null, ([url, t]) => fetcher(url, t));
  const { data: payroll = [], error: payrollError, isLoading: payrollLoading } = useSWR(token ? ['/api/payroll', token] : null, ([url, t]) => fetcher(url, t));
  const { data: leaves = [], error: leavesError, isLoading: leavesLoading, mutate: mutateLeaves } = useSWR(token ? ['/api/leaves/my-leaves', token] : null, ([url, t]) => fetcher(url, t));
  const { data: myProfile, isLoading: profileLoading } = useSWR(token ? ['/api/employees/user/me', token] : null, ([url, t]) => fetcher(url, t));
  const { data: activePolls = [], mutate: mutateActivePolls } = useSWR(token ? ['/api/polls?status=active', token] : null, ([url, t]) => fetcher(url, t));

  const openEdit = async () => {
    try {
      const res = await api.get('/employees/user/me');
      const { employee } = res.data;
      setProfileForm({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        position: employee.position || ''
      });
      setIsEditOpen(true);
    } catch (e: any) {
      // fallback to current user email/name
      const nameParts = (user?.name || '').split(' ');
      setProfileForm({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user?.email || '',
        phone: '',
        department: '',
        position: ''
      });
      setIsEditOpen(true);
    }
  };

  const saveProfile = async () => {
    setSaveError('');
    if (!profileForm.firstName || !profileForm.lastName || !profileForm.email || !profileForm.department || !profileForm.position) {
      setSaveError('Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/employees/user/me', profileForm);
      // update local auth name/email
      const updatedUser = { ...(user as any), name: `${profileForm.firstName} ${profileForm.lastName}`, email: profileForm.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
    } catch (e: any) {
      setSaveError(e?.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // Calculate stats from real data
  const attendanceRate = attendance.length > 0 ?
    Math.round((attendance.filter((a: any) => a.status === 'present').length / attendance.length) * 100) : 0;

  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Find today's attendance record
  const today = new Date();
  const todayAttendance = attendance.find((record: any) => {
    const recordDate = new Date(record.date);
    return recordDate.toDateString() === today.toDateString();
  });

  const remainingLeaves = (() => {
    const emp = (myProfile as any)?.employee;
    if (!emp) return undefined;
    const total = Number(emp.totalLeaves || 0);
    const used = Number(emp.usedLeaves || 0);
    return Math.max(total - used, 0);
  })();

  const stats = [
    { label: 'Leave Balance', value: `${remainingLeaves ?? 0} days`, icon: Calendar, color: 'from-teal-500 to-cyan-500' },
    { label: 'Attendance', value: `${attendanceRate}%`, icon: Clock, color: 'from-orange-500 to-coral-500' },
    { label: 'Task Completion', value: `${taskCompletionRate}%`, icon: Award, color: 'from-lime-500 to-green-500' },
    { label: 'Department', value: user?.department || 'Engineering', icon: Users, color: 'from-red-500 to-orange-500' }
  ];

  // Example leave requests
  const leaveRequests = [
    { type: 'Annual Leave', duration: '3 days', status: 'pending', dates: 'Aug 20-22' },
    { type: 'Sick Leave', duration: '1 day', status: 'approved', dates: 'Jul 15' },
    { type: 'Personal Leave', duration: '2 days', status: 'rejected', dates: 'Jun 10-11' }
  ];

  // Example activities
  const recentActivities = [
    { action: 'Leave request submitted', time: '2 days ago' },
    { action: 'Performance review available', time: '1 week ago' },
    { action: 'Profile updated', time: '2 weeks ago' }
  ];

  // Example directory
  const directory = [
    { name: 'Emma Davis', role: 'Software Developer', dept: 'Engineering', status: 'Active' },
    { name: 'John Smith', role: 'Sales Manager', dept: 'Sales', status: 'Active' },
    { name: 'Sarah Wilson', role: 'Marketing Lead', dept: 'Marketing', status: 'On Leave' }
  ];

  const handleClockIn = async () => {
    try {
      await attendanceAPI.clockIn();
      addNotification({
        type: 'success',
        message: 'Clocked in successfully!'
      });
      // Refresh attendance data instantly
      mutateAttendance();
    } catch (error: any) {
      addNotification({
        type: 'error',
        message: error?.response?.data?.message || 'Failed to clock in'
      });
    }
  };

  const handleClockOut = async () => {
    try {
      await attendanceAPI.clockOut();
      addNotification({
        type: 'success',
        message: 'Clocked out successfully!'
      });
      mutateAttendance();
    } catch (error: any) {
      addNotification({
        type: 'error',
        message: error?.response?.data?.message || 'Failed to clock out'
      });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'tasks', label: 'Tasks', icon: Award },
    { id: 'leaves', label: 'Leaves', icon: Calendar },
    { id: 'payroll', label: 'Payroll', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User }
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

  if (attendanceLoading || tasksLoading || payrollLoading || leavesLoading || profileLoading) {
    return (
      <Layout title="Employee Dashboard" user={user} onLogout={logout}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Employee Dashboard" user={user} onLogout={logout}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl text-white p-6">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h2>
          <p className="text-teal-100">Here's your dashboard overview for today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
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
                      ? 'border-teal-500 text-teal-600'
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
                {/* Clock In/Out Section */}
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-4">Today's Attendance</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">
                        {todayAttendance ? 
                          `Clocked in at ${new Date(todayAttendance.clockIn).toLocaleTimeString()}` : 
                          'Not clocked in yet'
                        }
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
                          className="bg-white text-teal-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
                        >
                          Clock In
                        </button>
                      ) : !todayAttendance.clockOut ? (
                        <button
                          onClick={handleClockOut}
                          className="bg-white text-teal-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
                        >
                          Clock Out
                        </button>
                      ) : (
                        <span className="bg-white text-teal-600 px-4 py-2 rounded-lg font-medium">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Tasks */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task: any, index: number) => (
                      <div key={task._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-600">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                          <span className="text-sm text-gray-600">{task.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Polls */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Polls</h3>
                  <div className="space-y-3">
                    {activePolls.slice(0, 2).map((poll: any) => (
                      <div key={poll._id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-900 mb-2">{poll.question}</div>
                        <div className="text-xs text-gray-600 mb-2 capitalize">Type: {poll.type}</div>
                        {poll.hasVoted ? (
                          <div className="text-sm text-green-700">Already voted</div>
                        ) : (
                          poll.type === 'mcq' || poll.type === 'yesno' ? (
                            <div className="flex flex-wrap gap-2">
                              {(poll.options || []).map((opt: string) => (
                                <button
                                  key={opt}
                                  className="px-3 py-1 border rounded text-sm hover:bg-white"
                                  onClick={async()=>{
                                    try {
                                      await pollsAPI.vote(poll._id, { answer: opt });
                                      toast.success('Vote submitted');
                                      mutateActivePolls();
                                    } catch (e:any) {
                                      toast.error(e?.response?.data?.message || 'Failed to vote');
                                    }
                                  }}
                                >{opt}</button>
                              ))}
                            </div>
                          ) : poll.type === 'rating' ? (
                            <div className="flex items-center gap-2">
                              {[1,2,3,4,5].map(r => (
                                <button
                                  key={r}
                                  className="px-2 py-1 border rounded text-sm"
                                  onClick={async()=>{
                                    try {
                                      await pollsAPI.vote(poll._id, { answer: r });
                                      toast.success('Rating submitted');
                                      mutateActivePolls();
                                    } catch (e:any) {
                                      toast.error(e?.response?.data?.message || 'Failed to submit rating');
                                    }
                                  }}
                                >{r}★</button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input className="border rounded px-2 py-1 flex-1" placeholder="Your feedback" id={`emp-poll-${poll._id}`} />
                              <button
                                className="px-3 py-1 border rounded text-sm hover:bg-white"
                                onClick={async()=>{
                                  const el = document.getElementById(`emp-poll-${poll._id}`) as HTMLInputElement | null;
                                  const val = el?.value || '';
                                  if (!val.trim()) return;
                                  try {
                                    await pollsAPI.vote(poll._id, { answer: val });
                                    toast.success('Feedback submitted');
                                    if (el) el.value = '';
                                    mutateActivePolls();
                                  } catch (e:any) {
                                    toast.error(e?.response?.data?.message || 'Failed to submit');
                                  }
                                }}
                              >Submit</button>
                            </div>
                          )
                        )}
                      </div>
                    ))}
                    {activePolls.length === 0 && (
                      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">No active polls right now.</div>
                    )}
                  </div>
                </div>

                {/* Recent Leave Requests */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Leave Requests</h3>
                  <div className="space-y-3">
                    {leaves.slice(0, 3).map((leave: any, index: number) => (
                      <div key={leave._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{leave.leaveType}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </p>
                          {leave.reason && (
                            <p className="text-sm text-gray-600">Reason: {leave.reason}</p>
                          )}
                          {leave.comments && (
                            <p className="text-sm text-gray-600">Admin Note: {leave.comments}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'attendance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Attendance History</h3>
                <div className="space-y-3">
                  {attendance.slice(0, 10).map((record: any, index: number) => (
                    <div key={record._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{new Date(record.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">
                          {record.clockIn && `In: ${new Date(record.clockIn).toLocaleTimeString()}`}
                          {record.clockOut && ` • Out: ${new Date(record.clockOut).toLocaleTimeString()}`}
                        </p>
                        {record.totalHours && (
                          <p className="text-sm text-gray-600">Total: {record.totalHours} hours</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'tasks' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">My Tasks</h3>
                <div className="space-y-3">
                  {tasks.map((task: any, index: number) => (
                    <div key={task._id || index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          <span className="text-sm text-gray-600">
                            Progress: {task.progress}%
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'leaves' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Leave Management</h3>
                  <button onClick={() => setShowRequestLeaveModal(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                    Request Leave
                  </button>
                </div>
                <div className="space-y-3">
                  {leaves.map((leave: any, index: number) => (
                    <div key={leave._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                                                 <p className="font-medium text-gray-900">{leave.leaveType}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                        {leave.reason && (
                          <p className="text-sm text-gray-600">Reason: {leave.reason}</p>
                        )}
                        {leave.comments && (
                          <p className="text-sm text-gray-600">Admin Note: {leave.comments}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </div>
                  ))}
                </div>
                <Modal isOpen={showRequestLeaveModal} onClose={() => setShowRequestLeaveModal(false)} title="Request Leave">
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={async e => {
                      e.preventDefault();
                      setRequestingLeave(true);
                      try {
                        if (!leaveForm.type || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
                          toast.error('Please fill all required fields.');
                          setRequestingLeave(false);
                          return;
                        }
                        await leaveAPI.create({
                          type: leaveForm.type,
                          startDate: new Date(leaveForm.startDate),
                          endDate: new Date(leaveForm.endDate),
                          reason: leaveForm.reason,
                        });
                        toast.success('Leave request submitted.');
                        setShowRequestLeaveModal(false);
                        setLeaveForm({ type: 'annual', startDate: '', endDate: '', reason: '' });
                        mutateLeaves();
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || 'Failed to submit leave request');
                      } finally {
                        setRequestingLeave(false);
                      }
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Leave Type</label>
                        <select
                          className="border rounded px-2 py-1 w-full"
                          value={leaveForm.type}
                          onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value }))}
                          required
                        >
                          <option value="annual">Annual</option>
                          <option value="sick">Sick</option>
                          <option value="personal">Personal</option>
                          <option value="maternity">Maternity</option>
                          <option value="paternity">Paternity</option>
                          <option value="emergency">Emergency</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          className="border rounded px-2 py-1 w-full"
                          value={leaveForm.startDate}
                          onChange={e => setLeaveForm(f => ({ ...f, startDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          className="border rounded px-2 py-1 w-full"
                          value={leaveForm.endDate}
                          onChange={e => setLeaveForm(f => ({ ...f, endDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-700 mb-1">Reason</label>
                        <textarea
                          className="border rounded px-2 py-1 w-full"
                          rows={4}
                          placeholder="Provide sufficient details for approval"
                          value={leaveForm.reason}
                          onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
                          required
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">Max 500 characters.</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button type="button" onClick={() => setShowRequestLeaveModal(false)} className="px-3 py-1 rounded border">Cancel</button>
                      <button type="submit" disabled={requestingLeave} className={`px-3 py-1 rounded text-white ${requestingLeave ? 'bg-teal-400' : 'bg-teal-600 hover:bg-teal-700'}`}>{requestingLeave ? 'Submitting...' : 'Submit Request'}</button>
                    </div>
                  </form>
                </Modal>
              </div>
            )}

            {selectedTab === 'payroll' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Payroll History</h3>
                <div className="space-y-3">
                  {payroll.map((record: any, index: number) => (
                    <div key={record._id || index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {record.month}/{record.year}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.status === 'paid' ? 'bg-green-100 text-green-800' :
                          record.status === 'processed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Basic Salary: ${record.basicSalary}</p>
                          <p className="text-gray-600">Allowances: ${record.totalEarnings - record.basicSalary}</p>
                          <p className="text-gray-600">Deductions: ${record.totalDeductions}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">Net Salary: ${record.netSalary}</p>
                          {record.paymentDate && (
                            <p className="text-gray-600">
                              Paid: {new Date(record.paymentDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          className="px-3 py-1 border rounded text-sm"
                          onClick={async()=>{
                            try {
                              const blob = await payrollAPI.downloadPayslipPdf(record._id);
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `payslip_${record.year}_${record.month}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              setTimeout(()=> window.URL.revokeObjectURL(url), 5000);
                            } catch (e:any) {
                              toast.error(e?.response?.data?.message || 'Failed to download payslip');
                            }
                          }}
                        >Download PDF</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <p className="mt-1 text-sm text-gray-900">Engineering</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Position</label>
                      <p className="mt-1 text-sm text-gray-900">Software Developer</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                      <p className="mt-1 text-sm text-gray-900">{(user as any).employeeId || 'EMP123456'}</p>
                    </div>
                  </div>
                </div>
                <button onClick={openEdit} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                  Edit Profile
                </button>

                {isEditOpen && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                      <h4 className="text-lg font-semibold mb-4">Edit Profile</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <input className="border rounded px-2 py-1" placeholder="First Name" value={profileForm.firstName} onChange={e=>setProfileForm(f=>({...f, firstName:e.target.value}))} />
                        <input className="border rounded px-2 py-1" placeholder="Last Name" value={profileForm.lastName} onChange={e=>setProfileForm(f=>({...f, lastName:e.target.value}))} />
                        <input className="border rounded px-2 py-1 col-span-2" placeholder="Email" type="email" value={profileForm.email} onChange={e=>setProfileForm(f=>({...f, email:e.target.value}))} />
                        <input className="border rounded px-2 py-1 col-span-2" placeholder="Phone (optional)" value={profileForm.phone} onChange={e=>setProfileForm(f=>({...f, phone:e.target.value}))} />
                        <input className="border rounded px-2 py-1" placeholder="Department" value={profileForm.department} onChange={e=>setProfileForm(f=>({...f, department:e.target.value}))} />
                        <input className="border rounded px-2 py-1" placeholder="Position" value={profileForm.position} onChange={e=>setProfileForm(f=>({...f, position:e.target.value}))} />
                      </div>
                      {saveError && <div className="text-red-600 text-sm mt-2">{saveError}</div>}
                      <div className="mt-4 flex justify-end gap-2">
                        <button onClick={()=>setIsEditOpen(false)} className="px-3 py-1 rounded border">Cancel</button>
                        <button onClick={saveProfile} disabled={saving} className={`px-3 py-1 rounded text-white ${saving? 'bg-teal-400':'bg-teal-600 hover:bg-teal-700'}`}>{saving? 'Saving...':'Save'}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'directory' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Employee Directory</h3>
                <div className="space-y-3">
                  {directory.map((person, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar name={person.name} size={24} />
                        <div>
                          <p className="font-medium text-gray-900">{person.name}</p>
                          <p className="text-sm text-gray-600">{person.role} • {person.dept}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        person.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {person.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;
