import React, { useEffect, useState } from 'react';
import Modal from '../Modal';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
  address?: any;
  emergencyContact?: any;
  bankDetails?: any;
  isActive: boolean;
  totalLeaves: number;
  usedLeaves: number;
  fullName?: string;
  remainingLeaves?: number;
}

interface DepartmentEmployeesModalProps {
  department: string;
  open: boolean;
  onClose: () => void;
}

const DepartmentEmployeesModal: React.FC<DepartmentEmployeesModalProps> = ({ department, open, onClose }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && department) {
      setLoading(true);
      fetch(`/api/departments/${encodeURIComponent(department)}/employees`)
        .then(res => res.json())
        .then(data => {
          setEmployees(data);
          setLoading(false);
        });
    }
  }, [open, department]);

  return (
  <Modal isOpen={open} onClose={onClose} title={`Employees in ${department}`}> 
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-8">No employees found in this department.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Email</th>
                <th className="px-2 py-1">Position</th>
                <th className="px-2 py-1">Phone</th>
                <th className="px-2 py-1">Salary</th>
                <th className="px-2 py-1">Hire Date</th>
                <th className="px-2 py-1">Active</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp._id} className="border-b">
                  <td className="px-2 py-1">{emp.firstName} {emp.lastName}</td>
                  <td className="px-2 py-1">{emp.email}</td>
                  <td className="px-2 py-1">{emp.position}</td>
                  <td className="px-2 py-1">{emp.phone || '-'}</td>
                  <td className="px-2 py-1">₹{emp.salary.toLocaleString()}</td>
                  <td className="px-2 py-1">{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : '-'}</td>
                  <td className="px-2 py-1">{emp.isActive ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};

export default DepartmentEmployeesModal;
