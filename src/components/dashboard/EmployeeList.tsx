"use client";

import React from 'react';
import useSWR from 'swr';
import { employeeAPI, departmentAPI } from '@/lib/api';
import Modal from '../Modal';
import EmployeeForm, { EmployeeFormValues } from './EmployeeForm';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'probation', label: 'On probation' },
  { value: 'resigned', label: 'Resigned' },
];

const employmentTypeOptions = [
  { value: '', label: 'All types' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'intern', label: 'Intern' },
  { value: 'contract', label: 'Contract' },
];

const sortOptions = [
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'createdAt:asc', label: 'Oldest' },
  { value: 'firstName:asc', label: 'Name A-Z' },
  { value: 'firstName:desc', label: 'Name Z-A' },
  { value: 'department:asc', label: 'Department A-Z' },
  { value: 'department:desc', label: 'Department Z-A' },
];

const EmployeeList: React.FC = () => {
  const [q, setQ] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [employmentType, setEmploymentType] = React.useState('');
  const [sort, setSort] = React.useState('createdAt:desc');
  const [page, setPage] = React.useState(1);

  const params = { q, department, status, employmentType, sort, page, limit: PAGE_SIZE };

  const { data: listData, isLoading, mutate } = useSWR(['employees', params], async () => {
    const res = await employeeAPI.getAll(params);
    return res.data as { items: any[]; total: number; page: number; limit: number };
  });

  const { data: departments } = useSWR('departments', async () => {
    const res = await departmentAPI.getAll();
    return (res.data as string[]) || [];
  });

  const items = listData?.items || [];
  const total = listData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [editing, setEditing] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [transferring, setTransferring] = React.useState<any | null>(null);
  const [toDepartment, setToDepartment] = React.useState('');
  const [transferReason, setTransferReason] = React.useState('');

  const mutateKey: any = ['employees', params];

  const handleEdit = (emp: any) => {
    setEditing(emp);
    setError('');
  };

  const handleUpdate = async (vals: EmployeeFormValues) => {
    if (!editing) return;
    try {
      setSaving(true);
      const payload: any = {
        firstName: vals.firstName,
        lastName: vals.lastName,
        email: vals.email,
        gender: vals.gender || undefined,
        dateOfBirth: vals.dateOfBirth ? new Date(vals.dateOfBirth) : undefined,
        phone: vals.phone || undefined,
        department: vals.department,
        position: vals.position,
        salary: Number(vals.salary),
        hireDate: vals.hireDate ? new Date(vals.hireDate) : undefined,
        employmentType: vals.employmentType || undefined,
        status: vals.status || undefined,
        manager: vals.manager || undefined,
        address: vals.address || undefined,
        emergencyContact: vals.emergencyContact || undefined,
        bankDetails: vals.bankDetails || undefined,
        workLocation: vals.workLocation || undefined,
        shift: vals.shift || undefined,
        contractEndDate: vals.contractEndDate ? new Date(vals.contractEndDate) : undefined,
      };
      await employeeAPI.update(editing._id, payload);
      setEditing(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (emp: any) => {
    if (emp.status === 'inactive' || emp.isActive === false) {
      toast('Employee already inactive');
      return;
    }
    const ok = window.confirm(`Deactivate ${emp.firstName} ${emp.lastName}?`);
    if (!ok) return;
    try {
      await employeeAPI.delete(emp._id);
      const undo = toast((t) => (
        <span>
          Employee deactivated. <button className="underline" onClick={async ()=>{ try { await employeeAPI.reactivate(emp._id); toast.dismiss(t.id); toast.success('Employee reactivated'); mutate(); } catch (e:any) { toast.error(e?.response?.data?.message || 'Failed to reactivate'); } }}>Undo</button>
        </span>
      ), { duration: 7000 });
      mutate();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to deactivate';
      toast.error(msg);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-4">
        <input
          className="input w-full md:w-64"
          placeholder="Search name, email, position..."
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }}
        />
        <select className="input" value={department} onChange={e => { setDepartment(e.target.value); setPage(1); }}>
          <option value="">All departments</option>
          {(departments || []).map((d: string) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select className="input" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select className="input" value={employmentType} onChange={e => { setEmploymentType(e.target.value); setPage(1); }}>
          {employmentTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select className="input" value={sort} onChange={e => setSort(e.target.value)}>
          {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="table min-w-full">
          <thead>
            <tr className="text-left">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Department</th>
              <th className="py-2">Position</th>
              <th className="py-2">Status</th>
              <th className="py-2">Type</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="py-4 text-gray-600 dark:text-gray-400" colSpan={7}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="py-4 text-gray-600 dark:text-gray-400" colSpan={7}>No employees found.</td></tr>
            ) : items.map((emp: any) => (
              <tr key={emp._id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="py-2 font-medium text-gray-900 dark:text-gray-100">{emp.firstName} {emp.lastName}</td>
                <td className="py-2 text-gray-700 dark:text-gray-300">{emp.email}</td>
                <td className="py-2 text-gray-700 dark:text-gray-300">{emp.department}</td>
                <td className="py-2 text-gray-700 dark:text-gray-300">{emp.position}</td>
                <td className="py-2 capitalize text-gray-700 dark:text-gray-300">{emp.status || (emp.isActive ? 'active' : 'inactive')}</td>
                <td className="py-2 capitalize text-gray-700 dark:text-gray-300">{(emp.employmentType || '').replace('_',' ')}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <button className="text-blue-600 dark:text-blue-400 hover:underline" onClick={()=>handleEdit(emp)}>Edit</button>
                    {/* Transfer temporarily disabled */}
                    <button className="text-teal-600 dark:text-teal-400 hover:underline">Docs</button>
                    <button className="text-rose-600 dark:text-rose-400 hover:underline" onClick={()=>handleDeactivate(emp)}>Deactivate</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border dark:border-gray-700 rounded disabled:opacity-50 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >Previous</button>
          <button
            className="px-3 py-1 border dark:border-gray-700 rounded disabled:opacity-50 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >Next</button>
        </div>
      </div>

      {editing && (
        <Modal isOpen={!!editing} onClose={()=>setEditing(null)} title={`Edit Employee – ${editing.firstName} ${editing.lastName}`}>
          <div className="space-y-3">
            {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
            <EmployeeForm
              mode="edit"
              submitLabel={saving? 'Saving...' : 'Save'}
              onCancel={()=>setEditing(null)}
              onSubmit={handleUpdate}
              initialValues={{
                firstName: editing.firstName,
                lastName: editing.lastName,
                email: editing.email,
                gender: editing.gender,
                dateOfBirth: editing.dateOfBirth ? new Date(editing.dateOfBirth).toISOString().slice(0,10) : '',
                phone: editing.phone,
                department: editing.department,
                position: editing.position,
                salary: editing.salary,
                hireDate: editing.hireDate ? new Date(editing.hireDate).toISOString().slice(0,10) : '',
                employmentType: editing.employmentType,
                status: editing.status,
                manager: editing.manager?._id || editing.manager || '',
                address: editing.address,
                emergencyContact: editing.emergencyContact,
                bankDetails: editing.bankDetails,
                workLocation: editing.workLocation,
                shift: editing.shift,
                contractEndDate: editing.contractEndDate ? new Date(editing.contractEndDate).toISOString().slice(0,10) : '',
              }}
            />
          </div>
        </Modal>
      )}

      {false && transferring && (
        <Modal isOpen={!!transferring} onClose={()=>setTransferring(null)} title={`Transfer – ${transferring.firstName} ${transferring.lastName}`}>
          <div className="space-y-3">
            <div className="text-sm text-gray-700">Current: {transferring.department}</div>
            <div className="flex flex-col gap-2">
              <select className="border rounded px-3 py-2" value={toDepartment} onChange={e=>setToDepartment(e.target.value)}>
                <option value="">Select target department</option>
                {(departments || []).map((d: string) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input className="border rounded px-3 py-2" placeholder="Reason (optional)" value={transferReason} onChange={e=>setTransferReason(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 border rounded" onClick={()=>setTransferring(null)}>Cancel</button>
              <button className="px-3 py-2 bg-orange-600 text-white rounded disabled:opacity-50" disabled={!toDepartment}
                onClick={async ()=>{
                  try {
                    await employeeAPI.transfer(transferring._id, toDepartment, transferReason || undefined);
                    toast.success('Employee transferred');
                    setTransferring(null);
                    mutate();
                  } catch (e:any) {
                    toast.error(e?.response?.data?.message || 'Failed to transfer');
                  }
                }}
              >Transfer</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeList;


