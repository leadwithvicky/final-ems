"use client";

import React from 'react';
import useSWR from 'swr';
import { employeeAPI } from '@/lib/api';

type Emp = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  manager?: string | { _id: string } | null;
};

type EmpNode = Emp & { children: EmpNode[] };

const EmployeeHierarchy: React.FC = () => {
  const { data } = useSWR(['employees-hierarchy'], async () => {
    const res = await employeeAPI.getAll({ limit: 1000, sort: 'firstName:asc' });
    return (res.data?.items as Emp[]) || [];
  });

  const employees: Emp[] = data || [];
  const idToNode: Record<string, EmpNode> = {};
  employees.forEach(e => { (idToNode[e._id] = { ...e, children: [] }); });

  const roots: EmpNode[] = [];
  employees.forEach(e => {
    const managerId = typeof e.manager === 'object' && e.manager ? (e.manager as any)._id : (e.manager as any);
    if (managerId && idToNode[managerId]) {
      idToNode[managerId].children.push(idToNode[e._id]);
    } else {
      roots.push(idToNode[e._id]);
    }
  });

  const renderNode = (node: EmpNode, depth = 0) => (
    <div key={node._id} className="pl-3 border-l ml-2">
      <div className="py-1">
        <span className="font-medium">{node.firstName} {node.lastName}</span>
        <span className="text-gray-600 text-sm"> • {node.position} ({node.department})</span>
      </div>
      {node.children.length > 0 && (
        <div className="ml-4">
          {node.children.map(child => renderNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Reporting Hierarchy</h3>
      {employees.length === 0 ? (
        <div className="text-sm text-gray-600">No employees to display.</div>
      ) : (
        <div className="space-y-2">
          {roots.map(root => renderNode(root))}
        </div>
      )}
    </div>
  );
};

export default EmployeeHierarchy;


