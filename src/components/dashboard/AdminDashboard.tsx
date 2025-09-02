"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import { attendanceAPI, leaveAPI, payrollAPI, departmentAPI } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import AttendanceAdminView from './AttendanceAdminView';
import Modal from '../Modal';
import { employeeAPI } from '@/lib/api';
import axios from 'axios';
import { Users, Calendar, FileText, TrendingUp, Clock, UserPlus, MessageSquare, Award } from 'lucide-react';
import Link from 'next/link';
import ReportLineChart from './ReportLineChart';
import Avatar from '@/components/Avatar';
import Layout from '../Layout';
import EmployeeList from './EmployeeList';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserIcon } from 'lucide-react';
import AvatarUploader from '@/components/AvatarUploader';
import EmployeeForm from './EmployeeForm';

interface AdminDashboardProps {
  hideHeader?: boolean;
}

// Lightweight admin payroll panel
const PayrollAdminPanel: React.FC = () => {
  const [month, setMonth] = React.useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = React.useState<number>(new Date().getFullYear());
  const [notes, setNotes] = React.useState<string>('');
  const [department, setDepartment] = React.useState<string>('');
  const [processing, setProcessing] = React.useState(false);
  const [recompute, setRecompute] = React.useState(false);
  const [recomputeReason, setRecomputeReason] = React.useState<string>('');
  const [bonus, setBonus] = React.useState<number>(0);
  const [allowHousing, setAllowHousing] = React.useState<number>(0);
  const [allowTransport, setAllowTransport] = React.useState<number>(0);
  const [allowMeal, setAllowMeal] = React.useState<number>(0);
  const [allowOther, setAllowOther] = React.useState<number>(0);
  const [stats, setStats] = React.useState<any>(null);
  const [list, setList] = React.useState<any[]>([]);
  const [blockedRecomputes, setBlockedRecomputes] = React.useState<any[]>([]);
  const [adjusting, setAdjusting] = React.useState<any | null>(null);
  const [adjBonus, setAdjBonus] = React.useState<number>(0);
  const [adjAllow, setAdjAllow] = React.useState<{housing:number;transport:number;meal:number;other:number}>({ housing: 0, transport: 0, meal: 0, other: 0 });
  const [adjDed, setAdjDed] = React.useState<{tax:number;insurance:number;pension:number;other:number}>({ tax: 0, insurance: 0, pension: 0, other: 0 });
  const [adjReason, setAdjReason] = React.useState<string>('');

  // Fetch departments for dropdown
  const { data: departments = [] } = useSWR('/api/departments', () => 
    departmentAPI.getAll().then(res => res.data)
  );

  const load = async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        payrollAPI.stats({ month, year }),
        payrollAPI.getAll({ month, year, department: department || undefined })
      ]);
      setStats(statsRes.data);
      setList(listRes.data || []);
    } catch {}
  };

  React.useEffect(() => { load(); }, [month, year, department]);

  const handleProcess = async () => {
    try {
      setProcessing(true);
      setBlockedRecomputes([]);
      
      const response = await payrollAPI.process({ 
        month, 
        year, 
        notes, 
        recompute,
        recomputeReason: recompute ? recomputeReason : undefined,
        bonus: Number.isFinite(bonus) ? Number(bonus) : 0,
        allowances: {
          housing: Number.isFinite(allowHousing) ? Number(allowHousing) : 0,
          transport: Number.isFinite(allowTransport) ? Number(allowTransport) : 0,
          meal: Number.isFinite(allowMeal) ? Number(allowMeal) : 0,
          other: Number.isFinite(allowOther) ? Number(allowOther) : 0,
        }
      });
      
      // Check for blocked recomputes
      if (response.data.blockedRecomputes) {
        setBlockedRecomputes(response.data.blockedRecomputes);
        toast.error(`${response.data.blockedRecomputes.length} payroll records could not be recomputed due to status restrictions`);
      }
      
      await load();
      toast.success('Payroll processed for selected month.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to process payroll');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Month</label>
          <select className="border rounded px-2 py-1" value={month} onChange={e=>setMonth(parseInt(e.target.value))}>
            {Array.from({length:12},(_,i)=>i+1).map(m=> (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Year</label>
          <input className="border rounded px-2 py-1 w-28" type="number" value={year} onChange={e=>setYear(parseInt(e.target.value)||year)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Department</label>
          <select 
            className="border rounded px-2 py-1 w-48" 
            value={department} 
            onChange={e=>setDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept: string) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-gray-700 mb-1">Notes (optional)</label>
          <input className="border rounded px-2 py-1 w-full" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g., Mid-year bonus included" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Bonus</label>
          <input className="border rounded px-2 py-1 w-full" type="number" min={0} value={bonus} onChange={e=>setBonus(parseInt(e.target.value)||0)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Allow. Housing</label>
          <input className="border rounded px-2 py-1 w-full" type="number" min={0} value={allowHousing} onChange={e=>setAllowHousing(parseInt(e.target.value)||0)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Allow. Transport</label>
          <input className="border rounded px-2 py-1 w-full" type="number" min={0} value={allowTransport} onChange={e=>setAllowTransport(parseInt(e.target.value)||0)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Allow. Meal</label>
          <input className="border rounded px-2 py-1 w-full" type="number" min={0} value={allowMeal} onChange={e=>setAllowMeal(parseInt(e.target.value)||0)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Allow. Other</label>
          <input className="border rounded px-2 py-1 w-full" type="number" min={0} value={allowOther} onChange={e=>setAllowOther(parseInt(e.target.value)||0)} />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <input id="recompute" type="checkbox" checked={recompute} onChange={e=>setRecompute(e.target.checked)} />
          <label htmlFor="recompute" className="text-sm text-gray-700">Recompute existing</label>
        </div>
        {recompute && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-700 mb-1">Recompute Reason (required)</label>
            <input 
              className="border rounded px-2 py-1 w-full" 
              value={recomputeReason} 
              onChange={e=>setRecomputeReason(e.target.value)} 
              placeholder="e.g., Attendance correction, Leave adjustment" 
              required
            />
          </div>
        )}
        <button 
          onClick={handleProcess} 
          disabled={processing || (recompute && !recomputeReason.trim())} 
          className={`px-4 py-2 rounded text-white ${processing? 'bg-orange-400':'bg-orange-600 hover:bg-orange-700'} disabled:opacity-50`}
        >
          {processing? 'Processing...':'Generate Payroll'}
        </button>
        <button
          className="px-4 py-2 rounded border"
          onClick={async ()=>{
            try {
              const blob = await payrollAPI.exportCsv({ month, year, department: department || undefined });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `payroll_${year}_${month}${department?`_${department}`:''}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (e:any) {
              toast.error(e?.response?.data?.message || 'Failed to export CSV');
            }
          }}
        >Export CSV</button>
      </div>

      {stats && (
        <div className="bg-gray-50 rounded p-4 text-sm text-gray-800">
          <div className="flex gap-6">
            <div><span className="font-medium">Employees:</span> {stats.count}</div>
            <div><span className="font-medium">Total Payout:</span> ₹{stats.totalPayout}</div>
            <div className="flex gap-2 items-center">
              <span className="font-medium">Status:</span>
              <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">pending: {stats.statusCounts?.pending||0}</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">processed: {stats.statusCounts?.processed||0}</span>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">finalized: {stats.statusCounts?.finalized||0}</span>
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">paid: {stats.statusCounts?.paid||0}</span>
            </div>
          </div>
        </div>
      )}

      {blockedRecomputes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h4 className="font-medium text-red-800 mb-2">Blocked Recomputes ({blockedRecomputes.length})</h4>
          <div className="space-y-2 text-sm">
            {blockedRecomputes.map((blocked, index) => (
              <div key={index} className="text-red-700">
                <strong>{blocked.employeeName}</strong>: {blocked.reason}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2">Employee</th>
              <th className="py-2">Basic</th>
              <th className="py-2">Overtime</th>
              <th className="py-2">Deductions</th>
              <th className="py-2">Net</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p:any)=> (
              <tr key={p._id} className="border-t">
                <td className="py-2">{(p.employeeId?.firstName && p.employeeId?.lastName) ? `${p.employeeId.firstName} ${p.employeeId.lastName}` : (p.employeeId?.fullName || 'Employee')}</td>
                <td className="py-2">₹{p.basicSalary}</td>
                <td className="py-2">₹{p.overtime}</td>
                <td className="py-2">₹{p.totalDeductions}</td>
                <td className="py-2 font-medium">₹{p.netSalary}</td>
                <td className="py-2 capitalize">{p.status}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    {p.status === 'processed' && (
                      <button 
                        onClick={async ()=>{
                          try {
                            await payrollAPI.finalize(p._id);
                            await load();
                            toast.success('Payroll finalized');
                          } catch (e: any) {
                            toast.error(e?.response?.data?.message || 'Failed to finalize payroll');
                          }
                        }} 
                        className="px-2 py-1 rounded bg-purple-600 text-white text-xs"
                      >
                        Finalize
                      </button>
                    )}
                    <button 
                      onClick={async ()=>{
                        try {
                          await payrollAPI.markPaid(p._id); 
                          await load(); 
                          toast.success('Marked paid');
                        } catch (e: any) {
                          toast.error(e?.response?.data?.message || 'Failed to mark as paid');
                        }
                      }} 
                      className="px-2 py-1 rounded bg-green-600 text-white disabled:opacity-50 text-xs" 
                      disabled={p.status==='paid'}
                    >
                      Mark Paid
                    </button>
                    <button 
                      onClick={async ()=>{
                        try {
                          const res = await payrollAPI.downloadPayslip(p._id);
                          const dataStr = JSON.stringify(res.data, null, 2);
                          const blob = new Blob([dataStr], { type: 'application/json' });
                          const url = window.URL.createObjectURL(blob);
                          window.open(url, '_blank');
                          setTimeout(()=> window.URL.revokeObjectURL(url), 10000);
                        } catch (e:any) {
                          toast.error(e?.response?.data?.message || 'Failed to fetch payslip');
                        }
                      }}
                      className="px-2 py-1 rounded border text-xs"
                    >
                      Payslip
                    </button>
                    <button 
                      onClick={async ()=>{
                        try {
                          const blob = await payrollAPI.downloadPayslipPdf(p._id);
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `payslip_${p.year || ''}_${p.month || ''}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          setTimeout(()=> window.URL.revokeObjectURL(url), 5000);
                        } catch (e:any) {
                          toast.error(e?.response?.data?.message || 'Failed to download PDF');
                        }
                      }}
                      className="px-2 py-1 rounded border text-xs"
                    >
                      PDF
                    </button>
                    {p.status !== 'paid' && (
                      <button
                        onClick={()=>{
                          setAdjusting(p);
                          setAdjBonus(p.bonus || 0);
                          setAdjAllow({
                            housing: p.allowances?.housing || 0,
                            transport: p.allowances?.transport || 0,
                            meal: p.allowances?.meal || 0,
                            other: p.allowances?.other || 0,
                          });
                          setAdjDed({
                            tax: p.deductions?.tax || 0,
                            insurance: p.deductions?.insurance || 0,
                            pension: p.deductions?.pension || 0,
                            other: p.deductions?.other || 0,
                          });
                          setAdjReason('');
                        }}
                        className="px-2 py-1 rounded border text-xs"
                      >
                        Adjust
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Adjust Modal */}
      {adjusting && (
        <Modal isOpen={!!adjusting} onClose={()=>setAdjusting(null)} title={`Adjust Payroll – ${(adjusting.employeeId?.firstName && adjusting.employeeId?.lastName) ? `${adjusting.employeeId.firstName} ${adjusting.employeeId.lastName}` : 'Employee'}`}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Bonus</label>
                <input type="number" min={0} className="border rounded px-2 py-1 w-full" value={adjBonus} onChange={e=>setAdjBonus(parseInt(e.target.value)||0)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Tax</label>
                <input type="number" min={0} className="border rounded px-2 py-1 w-full" value={adjDed.tax} onChange={e=>setAdjDed(d=>({ ...d, tax: parseInt(e.target.value)||0 }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">PF</label>
                <input type="number" min={0} className="border rounded px-2 py-1 w-full" value={adjDed.pension} onChange={e=>setAdjDed(d=>({ ...d, pension: parseInt(e.target.value)||0 }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Insurance</label>
                <input type="number" min={0} className="border rounded px-2 py-1 w-full" value={adjDed.insurance} onChange={e=>setAdjDed(d=>({ ...d, insurance: parseInt(e.target.value)||0 }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Other Deduction</label>
                <input type="number" min={0} className="border rounded px-2 py-1 w-full" value={adjDed.other} onChange={e=>setAdjDed(d=>({ ...d, other: parseInt(e.target.value)||0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Allow. Housing</label>
                <input type="number" min={0} className="border rounded px-2 py-1 w-full" value={adjAllow.housing} onChange={e=>setAdjAllow(a=>({ ...a, housing: parseInt(e.target.value)||0 }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Allow. Transport</label>
                <input type="number" min={0} className="border rounded px-2 py-1 w-full" value={adjAllow.transport} onChange={e=>setAdjAllow(a=>({ ...a, transport: parseInt(e.target.value)||0 }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Allow. Meal</label>
                <input type="number" min={0} className="border rounded px-2 py-1 w-full" value={adjAllow.meal} onChange={e=>setAdjAllow(a=>({ ...a, meal: parseInt(e.target.value)||0 }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Allow. Other</label>
                <input type="number" min={0} className="border rounded px-2 py-1 w-full" value={adjAllow.other} onChange={e=>setAdjAllow(a=>({ ...a, other: parseInt(e.target.value)||0 }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Reason (required)</label>
              <input className="border rounded px-2 py-1 w-full" value={adjReason} onChange={e=>setAdjReason(e.target.value)} placeholder="Explain why this adjustment is needed" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setAdjusting(null)} className="px-3 py-1 border rounded">Cancel</button>
              <button
                onClick={async ()=>{
                  try {
                    if (!adjReason.trim()) { toast.error('Reason is required'); return; }
                    await payrollAPI.adjust(adjusting._id, {
                      bonus: adjBonus,
                      allowances: adjAllow,
                      deductions: adjDed,
                      reason: adjReason
                    });
                    toast.success('Payroll adjusted');
                    setAdjusting(null);
                    await load();
                  } catch (e:any) {
                    toast.error(e?.response?.data?.message || 'Failed to adjust payroll');
                  }
                }}
                className="px-3 py-1 bg-orange-600 text-white rounded disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Onboarding wizard removed per product decision to keep only Add Employee

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
  
  
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showEmployeeDirectoryModal, setShowEmployeeDirectoryModal] = useState(false);

  // Real-time overview stats
  const { data: employeesMeta } = useSWR(['/api/employees', 'count'], async () => {
    const res = await employeeAPI.getAll({ page: 1, limit: 1 });
    return res.data as { items: any[]; total: number; page: number; limit: number };
  });
  const employeesTotal = employeesMeta?.total || 0;

  const { data: employeesForHires } = useSWR(['/api/employees', 'hires'], async () => {
    const res = await employeeAPI.getAll({ page: 1, limit: 1000, sort: 'hireDate:desc' });
    return (res.data?.items as any[]) || [];
  });
  const now = new Date();
  const hiresThisMonth = (employeesForHires || []).filter((e: any) => {
    if (!e.hireDate) return false;
    const d = new Date(e.hireDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { label: 'Team Members', value: String(employeesTotal), change: '', icon: Users, color: 'from-orange-500 to-coral-500' },
    // { label: 'Pending Leaves', value: '0', change: '', icon: Calendar, color: 'from-teal-500 to-cyan-500' },
    { label: 'This Month Hires', value: String(hiresThisMonth), change: '', icon: UserPlus, color: 'from-lime-500 to-green-500' },
    { label: 'Average Rating', value: '4.7', change: '+0.2', icon: Award, color: 'from-red-500 to-orange-500' }
  ];

  // SWR for leaves
  const { data: leaves = [], isLoading: leavesLoading, mutate: mutateLeaves } = useSWR(token ? ['/api/leaves', token] : null, ([url, t]) => fetch(url, { headers: { Authorization: `Bearer ${t}` } }).then(res => res.json()));
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [actionComments, setActionComments] = useState('');

  // Compute pending leaves after leaves is available (kept for internal use)
  const pendingLeavesCount = Array.isArray(leaves) ? leaves.filter((l: any) => l.status === 'pending').length : 0;

  // Build recent leaves snapshot from live data (no UI change)
  const leaveRequests = Array.isArray(leaves)
    ? leaves.slice(0, 4).map((l: any) => ({
        _id: l._id,
        name: (l.employee?.firstName && l.employee?.lastName) ? `${l.employee.firstName} ${l.employee.lastName}` : 'Employee',
        type: l.leaveType,
        duration: `${l.days || 0} days`,
        status: l.status,
        dates: `${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()}`
      }))
    : [];

  // Derive simple recent activities from latest leaves and hires
  const recentActivities = [
    ... (Array.isArray(leaves) ? leaves.slice(0, 2).map((l: any) => ({
      action: `Leave ${l.status}`,
      person: (l.employee?.firstName && l.employee?.lastName) ? `${l.employee.firstName} ${l.employee.lastName}` : 'Employee',
      time: new Date(l.createdAt || l.startDate).toLocaleString()
    })) : []),
    ... (Array.isArray(employeesForHires) ? employeesForHires.slice(0, 2).map((e: any) => ({
      action: 'New employee onboarded',
      person: (e.firstName && e.lastName) ? `${e.firstName} ${e.lastName}` : 'Employee',
      time: e.hireDate ? new Date(e.hireDate).toLocaleDateString() : ''
    })) : [])
  ];

  // Approve leave using API endpoint
  const handleApproveLeave = async (leaveId: string, name: string) => {
    try {
      await leaveAPI.approve(leaveId, actionComments || undefined);
      toast.success(`${name}'s leave request has been approved and leave balance updated.`);
      mutateLeaves();
      setSelectedLeave(null);
      setActionComments('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to approve leave');
    }
  };

  const handleRejectLeave = async (leaveId: string, name: string) => {
    try {
      await leaveAPI.reject(leaveId, actionComments || undefined);
      toast.success(`${name}'s leave request has been rejected.`);
      mutateLeaves();
      setSelectedLeave(null);
      setActionComments('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to reject leave');
    }
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
    // { id: 'communication', label: 'Communication', icon: MessageSquare },
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
        {/* Onboarding Modal mount */}
      {/* Add Employee Modal */}
      <Modal isOpen={showAddEmployeeModal} onClose={() => setShowAddEmployeeModal(false)} title="Add New Employee">
        <EmployeeForm
          mode="create"
          showPassword
          submitLabel={addEmployeeLoading ? 'Adding...' : 'Add Employee'}
          onCancel={() => setShowAddEmployeeModal(false)}
          onSubmit={async (vals) => {
            setAddEmployeeLoading(true);
            setAddEmployeeError('');
            try {
              await employeeAPI.create({
                firstName: vals.firstName,
                lastName: vals.lastName,
                email: vals.email,
                department: vals.department,
                position: vals.position,
                salary: Number(vals.salary),
                hireDate: vals.hireDate ? new Date(vals.hireDate) : undefined,
                password: vals.password,
              });
              setShowAddEmployeeModal(false);
              toast.success('New employee has been added to the system.');
            } catch (e: any) {
              setAddEmployeeError(e?.response?.data?.message || e.message || 'Failed to add employee');
            } finally {
              setAddEmployeeLoading(false);
            }
          }}
        />
        {addEmployeeError && <div className="text-red-600 text-sm mt-2">{addEmployeeError}</div>}
      </Modal>

      {/* Keep UI unchanged: open Employee Directory in modal when Directory quick action is clicked */}

          

          

          <Link
            href="/dashboard/reports"
            className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-left"
          >
            <TrendingUp className="w-8 h-8 text-red-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Reports</h3>
            <p className="text-sm text-gray-600">Open analytics & exports</p>
          </Link>
        </div>

      

      {/* Reports Modal */}
      <Modal isOpen={showReportsModal} onClose={() => setShowReportsModal(false)} title="Reports">
        <ReportsContent month={now.getMonth() + 1} year={now.getFullYear()} />
      </Modal>

      

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
              {/* Tip: Personal clock-in is in employee portal */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-800">Personal clock-in/out</h4>
                  <p className="text-sm text-blue-700">Admins and Super Admins should record their own attendance using an Employee login. Please log out and sign in with your employee account to clock in/out. This keeps one source of truth and avoids duplicates in reports.</p>
                </div>
                {/* Link removed intentionally to avoid confusion */}
              </div>

              {/* Leave Requests */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Leave Requests</h3>
                <div className="space-y-3">
                  {Array.isArray(leaves) && leaves.filter((l: any) => l.status === 'pending').map((leave: any) => (
                    <div key={leave._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar name={(leave.employee?.firstName && leave.employee?.lastName) ? `${leave.employee.firstName} ${leave.employee.lastName}` : 'Employee'} size={24} />
                        <p className="font-medium text-gray-900">{(leave.employee?.firstName && leave.employee?.lastName) ? `${leave.employee.firstName} ${leave.employee.lastName}` : 'Employee'}</p>
                        <p className="text-sm text-gray-600">{leave.leaveType} • {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()} • {leave.days} days</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedLeave(leave)}
                          className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-gray-100"
                        >
                          View
                        </button>
                        <button
                          onClick={() => { setSelectedLeave(leave); }}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => { setSelectedLeave(leave); }}
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
              <EmployeeList />
            </div>
          )}


          {selectedTab === 'attendance' && <AttendanceAdminView />}

          {selectedTab === 'leaves' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Leave Management</h3>
              <div className="space-y-3">
                {Array.isArray(leaves) && leaves.map((leave: any) => (
                  <div key={leave._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{(leave.employee?.firstName && leave.employee?.lastName) ? `${leave.employee.firstName} ${leave.employee.lastName}` : 'Employee'}</p>
                      <p className="text-sm text-gray-600">{leave.leaveType} • {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()} • {leave.days} days</p>
                      {leave.reason && <p className="text-xs text-gray-500">Reason: {leave.reason}</p>}
                      {leave.comments && <p className="text-xs text-gray-500">Admin Comments: {leave.comments}</p>}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                      {leave.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button onClick={() => setSelectedLeave(leave)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Approve</button>
                          <button onClick={() => setSelectedLeave(leave)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leave Details Modal */}
          {selectedLeave && (
            <Modal isOpen={!!selectedLeave} onClose={() => { setSelectedLeave(null); setActionComments(''); }} title="Leave Request Details">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Employee:</span> {(selectedLeave.employee?.firstName && selectedLeave.employee?.lastName) ? `${selectedLeave.employee.firstName} ${selectedLeave.employee.lastName}` : 'Employee'}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Type:</span> {selectedLeave.leaveType}</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Dates:</span> {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()} ({selectedLeave.days} days)</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Reason:</span> {selectedLeave.reason}</p>
                  {selectedLeave.comments && <p className="text-sm text-gray-700"><span className="font-semibold">Existing Comments:</span> {selectedLeave.comments}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comments (optional)</label>
                  <textarea
                    className="border rounded px-2 py-1 w-full"
                    rows={3}
                    value={actionComments}
                    onChange={e => setActionComments(e.target.value)}
                    placeholder="Add a note for the employee"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => handleRejectLeave(selectedLeave._id, (selectedLeave.employee?.firstName && selectedLeave.employee?.lastName) ? `${selectedLeave.employee.firstName} ${selectedLeave.employee.lastName}` : 'Employee')} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
                  <button onClick={() => handleApproveLeave(selectedLeave._id, (selectedLeave.employee?.firstName && selectedLeave.employee?.lastName) ? `${selectedLeave.employee.firstName} ${selectedLeave.employee.lastName}` : 'Employee')} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                </div>
              </div>
            </Modal>
          )}

          {selectedTab === 'payroll' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Payroll Management</h3>
              <PayrollAdminPanel />
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

function ReportsContent({ month, year }: { month: number; year: number }) {
  const { data: payrollStats } = useSWR(['/api/payroll/stats', month, year], () => payrollAPI.stats({ month, year }).then(r=>r.data));
  const { data: attendanceData } = useSWR(['/api/attendance', 'stats'], () => attendanceAPI.getAll().then(r=>r.data));
  const labels = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleString('en-US', { month: 'short' }));
  const values = labels.map(()=> 0);
  // If you later store monthly totals in stats, map into values here

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded">
        <h4 className="font-semibold mb-2">Payroll Overview</h4>
        <div className="text-sm text-gray-700">
          <div>Employees: {payrollStats?.count ?? 0}</div>
          <div>Total Payout: ₹{payrollStats?.totalPayout ?? 0}</div>
        </div>
      </div>
      <div className="bg-white p-2 rounded border">
        <ReportLineChart data={{ labels, values }} />
      </div>
      <div className="flex justify-end">
        <button
          className="px-3 py-2 border rounded"
          onClick={async()=>{
            try {
              const blob = await payrollAPI.exportCsv({ month, year });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `payroll_${year}_${month}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch(e:any) {
              toast.error(e?.response?.data?.message || 'Export failed');
            }
          }}
        >Export CSV</button>
      </div>
    </div>
  );
}

export default AdminDashboard;
