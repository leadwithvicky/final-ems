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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Clock className="w-5 h-5 text-orange-500" /> Attendance Records
      </h3>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          className="input"
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
          className="input"
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
          className="input"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <button
          className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
          onClick={() => mutate()}
        >
          Filter
        </button>
      </div>
      {/* Attendance Table */}
      <div className="overflow-x-auto card p-3">
        <table className="table min-w-full">
          <thead>
            <tr>
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Clock In</th>
              <th className="px-3 py-2">Clock Out</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-4 text-gray-600 dark:text-gray-400">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className="text-center py-4 text-red-600 dark:text-red-400">Error loading attendance</td></tr>
            ) : attendance.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4 text-gray-600 dark:text-gray-400">No records found</td></tr>
            ) : (
              attendance.map((record: any) => (
                <tr key={record._id} className="border-t border-gray-200 dark:border-gray-800">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={`${record.employeeId?.firstName || ''} ${record.employeeId?.lastName || ''}`} size={20} />
                      <span className="text-gray-900 dark:text-gray-100">{record.employeeId?.firstName} {record.employeeId?.lastName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{record.employeeId?.department}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : '-'}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '-'}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{record.status || 'present'}</td>
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

