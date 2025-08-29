"use client";

import React from 'react';
import useSWR from 'swr';
import { departmentAPI } from '@/lib/api';

const DepartmentManagement: React.FC = () => {
  const { data: departments, mutate } = useSWR('departments-full', async () => {
    const res = await departmentAPI.getFull();
    return res.data as any[];
  });

  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError('');
      if (!name.trim()) throw new Error('Name required');
      await departmentAPI.create({ name: name.trim(), code: code.trim() || undefined, description: description.trim() || undefined });
      setName(''); setCode(''); setDescription('');
      mutate();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await departmentAPI.deactivate(id);
      mutate();
    } catch {}
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Department Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
        <input className="border rounded px-2 py-1" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border rounded px-2 py-1" placeholder="Code (optional)" value={code} onChange={e=>setCode(e.target.value)} />
        <input className="border rounded px-2 py-1 md:col-span-2" placeholder="Description (optional)" value={description} onChange={e=>setDescription(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleCreate} disabled={loading} className="px-3 py-2 bg-orange-600 text-white rounded">{loading? 'Creating...' : 'Create Department'}</button>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2">Name</th>
              <th className="py-2">Code</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(departments || []).map((d: any) => (
              <tr key={d._id} className="border-t">
                <td className="py-2">{d.name}</td>
                <td className="py-2">{d.code || '-'}</td>
                <td className="py-2">{d.isActive ? 'Active' : 'Inactive'}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    {d.isActive && (
                      <button className="text-rose-600 hover:underline" onClick={()=>handleDeactivate(d._id)}>Deactivate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentManagement;


