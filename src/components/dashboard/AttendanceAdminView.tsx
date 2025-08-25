import React, { useState } from 'react';
import Avatar from '@/components/Avatar';
import useSWR from 'swr';
import { attendanceAPI, employeeAPI } from '@/lib/api';
import { Clock } from 'lucide-react';

const AttendanceAdminView: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState('');

  // Fetch employees for filter dropdown
  const { data: employeesRes } = useSWR('admin-employees', employeeAPI.getAll);
  const employees = employeesRes?.data || [];

  // Fetch attendance with filters
  const { data: attendance = [], isLoading, error, mutate } = useSWR(
    ['admin-attendance', employeeId, department, date],
    () => attendanceAPI.getAll({ employeeId, department, date }).then(res => res.data)
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Clock className="w-5 h-5 text-orange-500" /> Attendance Records
      </h3>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          className="border rounded px-2 py-1"
          value={employeeId}
          onChange={e => setEmployeeId(e.target.value)}
        >
          <option value="">All Employees</option>
          {employees.map((emp: any) => (
            <option key={emp._id} value={emp._id}>
              {emp.firstName} {emp.lastName} ({emp.department})
            </option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1"
          value={department}
          onChange={e => setDepartment(e.target.value)}
        >
          <option value="">All Departments</option>
          <option value="Developers">Development</option>
          <option value="Human Resources">Human Resources</option>
          <option value="Sales">Sales</option>
          <option value="Digital Marketing">Digital Marketing</option>
          <option value="Designers">Designers</option>
          <option value="Trainers">Trainers</option>
        </select>
        <input
          className="border rounded px-2 py-1"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <button
          className="bg-orange-600 text-white px-3 py-1 rounded"
          onClick={() => mutate()}
        >
          Filter
        </button>
      </div>
      {/* Attendance Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="px-3 py-2 border-b">Employee</th>
              <th className="px-3 py-2 border-b">Department</th>
              <th className="px-3 py-2 border-b">Date</th>
              <th className="px-3 py-2 border-b">Clock In</th>
              <th className="px-3 py-2 border-b">Clock Out</th>
              <th className="px-3 py-2 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className="text-center py-4 text-red-600">Error loading attendance</td></tr>
            ) : attendance.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4">No records found</td></tr>
            ) : (
              attendance.map((record: any) => (
                <tr key={record._id}>
                  <td className="px-3 py-2 border-b">
                    <div className="flex items-center gap-2">
                      <Avatar name={`${record.employeeId?.firstName || ''} ${record.employeeId?.lastName || ''}`} size={20} />
                      <span>{record.employeeId?.firstName} {record.employeeId?.lastName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 border-b">{record.employeeId?.department}</td>
                  <td className="px-3 py-2 border-b">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 border-b">{record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : '-'}</td>
                  <td className="px-3 py-2 border-b">{record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '-'}</td>
                  <td className="px-3 py-2 border-b">{record.status || 'present'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceAdminView;

