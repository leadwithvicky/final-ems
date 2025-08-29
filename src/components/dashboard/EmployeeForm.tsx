"use client";

import React from 'react';
import { departmentAPI, employeeAPI } from '@/lib/api';
import useSWR from 'swr';

export interface EmployeeFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  gender?: 'male' | 'female' | 'other' | '';
  dateOfBirth?: string;
  phone?: string;
  department: string;
  position: string;
  salary: string | number;
  hireDate: string;
  employmentType?: 'full_time' | 'part_time' | 'intern' | 'contract' | '';
  status?: 'active' | 'inactive' | 'probation' | 'resigned' | '';
  manager?: string;
  address?: { street?: string; city?: string; state?: string; zipCode?: string; country?: string };
  emergencyContact?: { name?: string; relationship?: string; phone?: string };
  bankDetails?: { accountNumber?: string; bankName?: string; ifscCode?: string };
  workLocation?: 'onsite' | 'remote' | 'hybrid' | '';
  shift?: { name?: string; startTime?: string; endTime?: string };
  contractEndDate?: string;
}

interface EmployeeFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<EmployeeFormValues>;
  onSubmit: (values: EmployeeFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  showPassword?: boolean;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ mode, initialValues, onSubmit, onCancel, submitLabel, showPassword }) => {
  const [values, setValues] = React.useState<EmployeeFormValues>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    department: '',
    position: '',
    salary: '',
    hireDate: '',
    employmentType: '',
    status: '',
    manager: '',
    address: { country: 'India' },
    emergencyContact: {},
    bankDetails: {},
    workLocation: '',
    shift: {},
    contractEndDate: ''
  });

  React.useEffect(() => {
    if (initialValues) {
      setValues(v => ({
        ...v,
        ...initialValues,
        address: { country: 'India', ...(initialValues.address || {}) },
        emergencyContact: { ...(initialValues.emergencyContact || {}) },
        bankDetails: { ...(initialValues.bankDetails || {}) },
        shift: { ...(initialValues.shift || {}) }
      }));
    }
  }, [initialValues]);

  const { data: departments } = useSWR('departments', async () => {
    const res = await departmentAPI.getAll();
    return (res.data as string[]) || [];
  });

  const { data: employeesForManager } = useSWR(['employees', { limit: 1000 }], async () => {
    const res = await employeeAPI.getAll({ limit: 1000 });
    return (res.data?.items as any[]) || [];
  });

  const handleChange = (field: keyof EmployeeFormValues, value: any) => {
    setValues(v => ({ ...v, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2 col-span-1 md:col-span-2">
        <input className="border rounded px-2 py-1" placeholder="First Name" value={values.firstName}
          onChange={e => handleChange('firstName', e.target.value)} required />
        <input className="border rounded px-2 py-1" placeholder="Last Name" value={values.lastName}
          onChange={e => handleChange('lastName', e.target.value)} required />
      </div>
      <input className="border rounded px-2 py-1" placeholder="Email" type="email" value={values.email}
        onChange={e => handleChange('email', e.target.value)} required />
      {showPassword && (
        <input className="border rounded px-2 py-1" placeholder="Temporary Password" type="password" value={values.password}
          onChange={e => handleChange('password', e.target.value)} required />
      )}
      <select className="border rounded px-2 py-1" value={values.gender || ''} onChange={e => handleChange('gender', e.target.value as any)}>
        <option value="">Gender (optional)</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <input className="border rounded px-2 py-1" placeholder="Date of Birth" type="date" value={values.dateOfBirth || ''}
        onChange={e => handleChange('dateOfBirth', e.target.value)} />
      <input className="border rounded px-2 py-1" placeholder="Phone" value={values.phone || ''}
        onChange={e => handleChange('phone', e.target.value)} />
      <select className="border rounded px-2 py-1" value={values.department}
        onChange={e => handleChange('department', e.target.value)} required>
        <option value="">Select Department</option>
        {(departments || []).map((d: string) => (<option key={d} value={d}>{d}</option>))}
      </select>
      <input className="border rounded px-2 py-1" placeholder="Position" value={values.position}
        onChange={e => handleChange('position', e.target.value)} required />
      <input className="border rounded px-2 py-1" placeholder="Salary" type="number" min="0" value={values.salary}
        onChange={e => handleChange('salary', e.target.value)} required />
      <input className="border rounded px-2 py-1" placeholder="Hire Date" type="date" value={values.hireDate}
        onChange={e => handleChange('hireDate', e.target.value)} required />
      <select className="border rounded px-2 py-1" value={values.employmentType || ''}
        onChange={e => handleChange('employmentType', e.target.value as any)}>
        <option value="">Employment Type</option>
        <option value="full_time">Full-time</option>
        <option value="part_time">Part-time</option>
        <option value="intern">Intern</option>
        <option value="contract">Contract</option>
      </select>
      <select className="border rounded px-2 py-1" value={values.status || ''}
        onChange={e => handleChange('status', e.target.value as any)}>
        <option value="">Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="probation">On probation</option>
        <option value="resigned">Resigned</option>
      </select>
      <select className="border rounded px-2 py-1" value={values.manager || ''}
        onChange={e => handleChange('manager', e.target.value)}>
        <option value="">Manager (optional)</option>
        {(employeesForManager || []).map((e: any) => (
          <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>
        ))}
      </select>
      <select className="border rounded px-2 py-1" value={values.workLocation || ''}
        onChange={e => handleChange('workLocation', e.target.value as any)}>
        <option value="">Work Location</option>
        <option value="onsite">Onsite</option>
        <option value="remote">Remote</option>
        <option value="hybrid">Hybrid</option>
      </select>

      <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2">
        <input className="border rounded px-2 py-1" placeholder="Shift Name" value={values.shift?.name || ''}
          onChange={e => setValues(v => ({ ...v, shift: { ...v.shift, name: e.target.value } }))} />
        <input className="border rounded px-2 py-1" placeholder="Shift Start (HH:mm)" value={values.shift?.startTime || ''}
          onChange={e => setValues(v => ({ ...v, shift: { ...v.shift, startTime: e.target.value } }))} />
        <input className="border rounded px-2 py-1" placeholder="Shift End (HH:mm)" value={values.shift?.endTime || ''}
          onChange={e => setValues(v => ({ ...v, shift: { ...v.shift, endTime: e.target.value } }))} />
      </div>

      <input className="border rounded px-2 py-1" placeholder="Contract End Date" type="date" value={values.contractEndDate || ''}
        onChange={e => handleChange('contractEndDate', e.target.value)} />

      <div className="col-span-1 md:col-span-2">
        <h4 className="font-medium mb-1">Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Street" value={values.address?.street || ''}
            onChange={e => setValues(v => ({ ...v, address: { ...v.address, street: e.target.value } }))} />
          <input className="border rounded px-2 py-1" placeholder="City" value={values.address?.city || ''}
            onChange={e => setValues(v => ({ ...v, address: { ...v.address, city: e.target.value } }))} />
          <input className="border rounded px-2 py-1" placeholder="State" value={values.address?.state || ''}
            onChange={e => setValues(v => ({ ...v, address: { ...v.address, state: e.target.value } }))} />
          <input className="border rounded px-2 py-1" placeholder="Zip Code" value={values.address?.zipCode || ''}
            onChange={e => setValues(v => ({ ...v, address: { ...v.address, zipCode: e.target.value } }))} />
          <input className="border rounded px-2 py-1" placeholder="Country" value={values.address?.country || 'India'}
            onChange={e => setValues(v => ({ ...v, address: { ...v.address, country: e.target.value } }))} />
        </div>
      </div>

      <div className="col-span-1 md:col-span-2">
        <h4 className="font-medium mb-1">Emergency Contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Name" value={values.emergencyContact?.name || ''}
            onChange={e => setValues(v => ({ ...v, emergencyContact: { ...v.emergencyContact, name: e.target.value } }))} />
          <input className="border rounded px-2 py-1" placeholder="Relationship" value={values.emergencyContact?.relationship || ''}
            onChange={e => setValues(v => ({ ...v, emergencyContact: { ...v.emergencyContact, relationship: e.target.value } }))} />
          <input className="border rounded px-2 py-1" placeholder="Phone" value={values.emergencyContact?.phone || ''}
            onChange={e => setValues(v => ({ ...v, emergencyContact: { ...v.emergencyContact, phone: e.target.value } }))} />
        </div>
      </div>

      <div className="col-span-1 md:col-span-2">
        <h4 className="font-medium mb-1">Bank Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Account Number" value={values.bankDetails?.accountNumber || ''}
            onChange={e => setValues(v => ({ ...v, bankDetails: { ...v.bankDetails, accountNumber: e.target.value } }))} />
          <input className="border rounded px-2 py-1" placeholder="Bank Name" value={values.bankDetails?.bankName || ''}
            onChange={e => setValues(v => ({ ...v, bankDetails: { ...v.bankDetails, bankName: e.target.value } }))} />
          <input className="border rounded px-2 py-1" placeholder="IFSC Code" value={values.bankDetails?.ifscCode || ''}
            onChange={e => setValues(v => ({ ...v, bankDetails: { ...v.bankDetails, ifscCode: e.target.value } }))} />
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 flex gap-2 justify-end mt-2">
        <button type="button" className="px-3 py-2 border rounded" onClick={onCancel}>Cancel</button>
        <button type="submit" className="px-3 py-2 bg-orange-600 text-white rounded">{submitLabel || (mode === 'create' ? 'Create' : 'Save')}</button>
      </div>
    </form>
  );
};

export default EmployeeForm;


